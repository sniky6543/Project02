import os
import re
import math
import logging
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Set, Optional
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.unified_policy import UnifiedPolicy
from app.models.notification import NotificationLog

logger = logging.getLogger(__name__)

ONTONG_API_URL = "https://www.youthcenter.go.kr/go/ythip/getPlcy"
DEFAULT_ONTONG_KEY = "f49789af-2614-4bc8-9af5-ceba34fbaf00"

def extract_dates(text: Optional[str]) -> List[str]:
    """문자열에서 8자리 YYYYMMDD 날짜 추출"""
    if not text:
        return []
    dates = []
    pattern_delim = r"(\d{4})[\.\-\/]\s*(\d{1,2})[\.\-\/]\s*(\d{1,2})"
    for y, m, d in re.findall(pattern_delim, text):
        dates.append(f"{y}{int(m):02d}{int(d):02d}")
    pattern_raw = r"(?<!\d)(20\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01]))(?!\d)"
    for d in re.findall(pattern_raw, text):
        if d not in dates:
            dates.append(d)
    return sorted(dates)

async def fetch_ontong_policies_from_api(
    api_key: Optional[str] = None,
    max_pages: int = 10,
    page_size: int = 50
) -> List[Dict[str, Any]]:
    """
    온통청년 청년정책 오픈 API를 비동기 호출하여 최신 정책 목록을 가져옵니다.
    """
    key = api_key or os.getenv("ONTONG_API_KEY") or DEFAULT_ONTONG_KEY
    collected: List[Dict[str, Any]] = []
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
    }

    async with httpx.AsyncClient(headers=headers, timeout=20.0) as client:
        page = 1
        total_pages = 1
        
        while page <= total_pages and page <= max_pages:
            params = {
                "apiKeyNm": key,
                "pageNum": str(page),
                "pageSize": str(page_size),
                "pageType": "1",
                "rtnType": "json"
            }
            
            success = False
            for attempt in range(1, 4):
                try:
                    response = await client.get(ONTONG_API_URL, params=params)
                    if response.status_code == 200:
                        data = response.json()
                        result = data.get("result", {})
                        
                        if page == 1:
                            pagging = result.get("pagging", {})
                            tot_count = pagging.get("totCount") or 0
                            if tot_count > 0:
                                total_pages = min(math.ceil(tot_count / page_size), max_pages)
                        
                        items = result.get("youthPolicyList", [])
                        if not items:
                            break
                            
                        for item in items:
                            plcy_no = item.get("plcyNo")
                            if not plcy_no:
                                continue
                            
                            policy_id = f"ONTONG_{plcy_no}"
                            title = item.get("plcyNm") or "제목 없음"
                            lclsf = item.get("lclsfNm") or ""
                            mclsf = item.get("mclsfNm") or ""
                            category = f"{lclsf} > {mclsf}".strip(" >") or "기타"
                            organization = item.get("sprvsnInstCdNm") or item.get("operInstCdNm") or "기관 미정"
                            summary = (item.get("plcyExplnCn") or "").strip()
                            support_content = (item.get("plcySprtCn") or item.get("plcyExplnCn") or "").strip()
                            
                            min_age = item.get("sprtTrgtMinAge") or ""
                            max_age = item.get("sprtTrgtMaxAge") or ""
                            target_age = f"{min_age}~{max_age}세" if min_age and max_age else "만 19세~34세 청년"
                            
                            target_condition = (item.get("ptcpPrpTrgtCn") or item.get("addAplyQlfcCndCn") or "해당 연령 청년 대상").strip()
                            apply_method = (item.get("plcyAplyMthdCn") or "온라인/방문 신청").strip()
                            apply_url = (item.get("aplyUrlAddr") or item.get("refUrlAddr1") or "https://www.youthcenter.go.kr").strip()
                            
                            period_sdate = (item.get("bizPrdBgngYmd") or "").strip()
                            period_edate = (item.get("bizPrdEndYmd") or "").strip()
                            
                            collected.append({
                                "id": policy_id,
                                "source": "온통청년 (youthcenter.go.kr)",
                                "title": title,
                                "category": category,
                                "organization": organization,
                                "summary": summary,
                                "support_content": support_content,
                                "target_age": target_age,
                                "target_condition": target_condition,
                                "apply_method": apply_method,
                                "apply_url": apply_url,
                                "period_sdate": period_sdate,
                                "period_edate": period_edate
                            })
                            
                        success = True
                        break
                    else:
                        logger.warning(f"온통청년 API 응답 상태 오류 ({response.status_code}): {response.text[:100]}")
                        await asyncio.sleep(1)
                except Exception as e:
                    logger.warning(f"온통청년 API 호출 시도 {attempt}/3 실패: {e}")
                    await asyncio.sleep(1)
            
            if not success:
                logger.error(f"온통청년 API {page}페이지 수집 실패")
                break
                
            page += 1
            await asyncio.sleep(0.1)

    logger.info(f"온통청년 API에서 총 {len(collected)}건의 정책 데이터 수집 완료")
    return collected

from app.core.supabase import get_supabase_client

async def sync_policies_with_id_check(session: Optional[AsyncSession] = None) -> Dict[str, Any]:
    """
    1. 외부 온통청년 API를 호출하여 최신 정책 데이터를 수집합니다.
    2. DB에 존재하는 기존 정책들을 조회합니다.
    3. [규칙 1] DB에 없는 신규 공고번호(ID)는 중복 없이 신규 저장(INSERT)합니다.
    4. [규칙 2] DB에 이미 존재하는 공고번호(ID)는 필드 변경사항을 확인하여, 변경이 있을 때만 DB를 수정(UPDATE)합니다.
    5. 실행 결과를 요약하여 반환하고 notification_logs에 발송 기록을 보관합니다.
    """
    start_time = datetime.now()
    close_session = False
    
    if session is None:
        session = AsyncSessionLocal()
        close_session = True

    try:
        # 1. API 호출하여 최신 정책 수집
        fetched_items = await fetch_ontong_policies_from_api()
        total_fetched = len(fetched_items)
        
        if total_fetched == 0:
            # API 장애 시 로컬 백업 JSON 파일 확인 및 fallback
            candidate_paths = [
                os.path.join(os.getcwd(), "db", "[2026.09.22 17시16분].json"),
                os.path.join(os.path.dirname(__file__), "..", "..", "..", "db", "[2026.09.22 17시16분].json"),
                os.path.join(os.path.dirname(__file__), "..", "..", "db", "[2026.09.22 17시16분].json"),
            ]
            for path in candidate_paths:
                if os.path.exists(path):
                    import json
                    with open(path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            fetched_items = data
                            total_fetched = len(fetched_items)
                            logger.info(f"Fallback JSON 백업 파일에서 {total_fetched}건 로드")
                            break

        # 2. DB에 존재하는 기존 전체 정책 객체 조회 (ID -> 객체 매핑)
        result = await session.execute(select(UnifiedPolicy))
        existing_policy_map: Dict[str, UnifiedPolicy] = {
            p.id: p for p in result.scalars().all()
        }
        logger.info(f"현재 DB에 존재하는 기존 정책 개수: {len(existing_policy_map)}건")

        # 3. 신규 추가 목록 및 변경 수정 목록 분류
        new_objects: List[UnifiedPolicy] = []
        updated_objects: List[UnifiedPolicy] = []
        updated_details: List[Dict[str, Any]] = []
        unchanged_count = 0
        seen_in_batch: Set[str] = set()

        for item in fetched_items:
            policy_id = item.get("id")
            if not policy_id:
                continue

            # 동일 배치 내 중복 등장 방지
            if policy_id in seen_in_batch:
                continue
            seen_in_batch.add(policy_id)

            # -------------------------------------------------------------
            # [규칙 1] DB에 없는 공고번호: 신규 등록 (INSERT)
            # -------------------------------------------------------------
            if policy_id not in existing_policy_map:
                new_obj = UnifiedPolicy(
                    id=policy_id,
                    source=item.get("source", "온통청년"),
                    title=item.get("title", "제목 없음"),
                    category=item.get("category", "기타"),
                    organization=item.get("organization", "기관 미정"),
                    summary=item.get("summary", ""),
                    support_content=item.get("support_content", ""),
                    target_age=item.get("target_age", ""),
                    target_condition=item.get("target_condition", ""),
                    apply_method=item.get("apply_method", ""),
                    apply_url=item.get("apply_url", ""),
                    period_sdate=item.get("period_sdate", ""),
                    period_edate=item.get("period_edate", "")
                )
                new_objects.append(new_obj)
                existing_policy_map[policy_id] = new_obj
                continue

            # -------------------------------------------------------------
            # [규칙 2] DB에 이미 존재하는 공고번호: 데이터 변경 확인 및 수정 (UPDATE)
            # -------------------------------------------------------------
            existing_obj = existing_policy_map[policy_id]
            diff_fields: List[str] = []

            # 1. 제목 비교
            new_title = (item.get("title") or "제목 없음").strip()
            if (existing_obj.title or "").strip() != new_title:
                diff_fields.append(f"title ('{existing_obj.title}' -> '{new_title}')")
                existing_obj.title = new_title

            # 2. 카테고리 비교
            new_category = (item.get("category") or "기타").strip()
            if (existing_obj.category or "").strip() != new_category:
                diff_fields.append(f"category ('{existing_obj.category}' -> '{new_category}')")
                existing_obj.category = new_category

            # 3. 주관기관 비교
            new_org = (item.get("organization") or "기관 미정").strip()
            if (existing_obj.organization or "").strip() != new_org:
                diff_fields.append(f"organization ('{existing_obj.organization}' -> '{new_org}')")
                existing_obj.organization = new_org

            # 4. 요약 내용 비교
            new_summary = (item.get("summary") or "").strip()
            if (existing_obj.summary or "").strip() != new_summary:
                diff_fields.append("summary")
                existing_obj.summary = new_summary

            # 5. 지원 혜택 상세 비교
            new_support = (item.get("support_content") or "").strip()
            if (existing_obj.support_content or "").strip() != new_support:
                diff_fields.append("support_content")
                existing_obj.support_content = new_support

            # 6. 대상 연령 비교
            new_age = (item.get("target_age") or "").strip()
            if (existing_obj.target_age or "").strip() != new_age:
                diff_fields.append(f"target_age ('{existing_obj.target_age}' -> '{new_age}')")
                existing_obj.target_age = new_age

            # 7. 자격 요건 비교
            new_cond = (item.get("target_condition") or "").strip()
            if (existing_obj.target_condition or "").strip() != new_cond:
                diff_fields.append("target_condition")
                existing_obj.target_condition = new_cond

            # 8. 신청 방법 비교
            new_method = (item.get("apply_method") or "").strip()
            if (existing_obj.apply_method or "").strip() != new_method:
                diff_fields.append("apply_method")
                existing_obj.apply_method = new_method

            # 9. 신청 URL 비교
            new_url = (item.get("apply_url") or "").strip()
            if (existing_obj.apply_url or "").strip() != new_url:
                diff_fields.append("apply_url")
                existing_obj.apply_url = new_url

            # 10. 시작일 / 마감일 비교
            new_sdate = (item.get("period_sdate") or "").strip()
            if (existing_obj.period_sdate or "").strip() != new_sdate:
                diff_fields.append(f"period_sdate ('{existing_obj.period_sdate}' -> '{new_sdate}')")
                existing_obj.period_sdate = new_sdate

            new_edate = (item.get("period_edate") or "").strip()
            if (existing_obj.period_edate or "").strip() != new_edate:
                diff_fields.append(f"period_edate ('{existing_obj.period_edate}' -> '{new_edate}')")
                existing_obj.period_edate = new_edate

            # 변경 사항이 있는 경우에만 수정 목록에 추가
            if diff_fields:
                updated_objects.append(existing_obj)
                updated_details.append({
                    "id": policy_id,
                    "title": existing_obj.title,
                    "changed_fields": diff_fields
                })
                logger.info(f"🔄 [공고 데이터 변경 감지 & DB 수정] ID: {policy_id} | 변경 필드: {', '.join(diff_fields)}")
            else:
                unchanged_count += 1

        # 4. DB 일괄 커밋 (신규 INSERT 및 변경 UPDATE 반영)
        newly_inserted = len(new_objects)
        updated_count = len(updated_objects)

        if newly_inserted > 0:
            session.add_all(new_objects)

        await session.commit()
        logger.info(f"✅ DB 동기화 완료 | 신규 등록: {newly_inserted}건 | 변경 수정: {updated_count}건 | 기존 유지: {unchanged_count}건")

        # 5. Supabase 클라이언트 연동 시 Supabase 테이블 동시 동기화
        supabase = get_supabase_client()
        if supabase:
            try:
                # 5-1. 신규 항목 Supabase 저장
                if new_objects:
                    new_dicts = [{
                        "id": o.id,
                        "source": o.source,
                        "title": o.title,
                        "category": o.category,
                        "organization": o.organization,
                        "summary": o.summary,
                        "support_content": o.support_content,
                        "target_age": o.target_age,
                        "target_condition": o.target_condition,
                        "apply_method": o.apply_method,
                        "apply_url": o.apply_url,
                        "period_sdate": o.period_sdate,
                        "period_edate": o.period_edate
                    } for o in new_objects]
                    supabase.table("unified_policies").upsert(new_dicts).execute()

                # 5-2. 수정된 항목 Supabase 갱신
                for u in updated_objects:
                    supabase.table("unified_policies").update({
                        "title": u.title,
                        "category": u.category,
                        "organization": u.organization,
                        "summary": u.summary,
                        "support_content": u.support_content,
                        "target_age": u.target_age,
                        "target_condition": u.target_condition,
                        "apply_method": u.apply_method,
                        "apply_url": u.apply_url,
                        "period_sdate": u.period_sdate,
                        "period_edate": u.period_edate
                    }).eq("id", u.id).execute()

                logger.info("✅ Supabase 클라우드 DB에도 신규/수정 공고 동기화 완료")
            except Exception as se:
                logger.warning(f"⚠️ Supabase 클라우드 DB 동기화 중 경고 (로컬 DB는 정상 반영됨): {se}")

        # 6. 실행 결과 요약 알림 로그 기록 (NotificationLog)
        elapsed_sec = (datetime.now() - start_time).total_seconds()
        log_content = (
            f"[정기 정책 API 수집 & 동기화 완료]\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📥 총 API 수집: {total_fetched}건\n"
            f"✨ 신규 DB 등록: {newly_inserted}건\n"
            f"🔄 변경 데이터 수정: {updated_count}건\n"
            f"⏸️ 변경 없음 유지: {unchanged_count}건\n"
            f"⏱️ 소요 시간: {elapsed_sec:.2f}초"
        )
        
        notification_log = NotificationLog(
            send_method="system",
            recipient_id="policy_sync_manager",
            content=log_content,
            sent_at=datetime.utcnow(),
            status="SUCCESS"
        )
        session.add(notification_log)
        await session.commit()

        return {
            "success": True,
            "message": f"정책 API 동기화 완료: 신규 등록 {newly_inserted}건, 변경 수정 {updated_count}건, 변경 없음 {unchanged_count}건",
            "total_fetched": total_fetched,
            "newly_inserted": newly_inserted,
            "updated_count": updated_count,
            "unchanged_count": unchanged_count,
            "updated_details": updated_details[:20],  # 상위 20건 상세 샘플
            "elapsed_seconds": elapsed_sec,
            "executed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

    except Exception as e:
        await session.rollback()
        logger.error(f"❌ 정책 API 동기화 중 오류 발생: {e}", exc_info=True)
        return {
            "success": False,
            "message": f"정책 API 동기화 실패: {str(e)}",
            "executed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    finally:
        if close_session:
            await session.close()

