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

async def sync_policies_with_id_check(session: Optional[AsyncSession] = None) -> Dict[str, Any]:
    """
    1. 외부 API를 호출하여 최신 정책 데이터를 가져옵니다.
    2. DB에 존재하는 모든 'ID'를 조회합니다.
    3. DB에 없는 'ID'만 필터링하여 DB에 신규 저장합니다.
    4. 결과를 요약하여 반환하고 로그 및 알림 기록에 저장합니다.
    """
    start_time = datetime.now()
    close_session = False
    
    if session is None:
        session = AsyncSessionLocal()
        close_session = True

    try:
        # 1. API 호출하여 정책 수집
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

        # 2. DB에 존재하는 기존 ID 목록 조회
        result = await session.execute(select(UnifiedPolicy.id))
        existing_ids: Set[str] = set(result.scalars().all())
        logger.info(f"현재 DB에 존재하는 정책 ID 개수: {len(existing_ids)}건")

        # 3. 없는 "ID"만 필터링하여 신규 객체 생성
        new_objects: List[UnifiedPolicy] = []
        duplicate_count = 0

        for item in fetched_items:
            policy_id = item.get("id")
            if not policy_id:
                continue

            # DB에 이미 존재하는 ID는 건너뜀
            if policy_id in existing_ids:
                duplicate_count += 1
                continue

            # DB에 없는 ID만 추가
            obj = UnifiedPolicy(
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
            new_objects.append(obj)
            existing_ids.add(policy_id)  # 중복 추가 방지용 메모리 갱신

        # 4. 신규 정책 데이터 DB 일괄 저장 (Bulk Insert)
        newly_inserted = len(new_objects)
        if newly_inserted > 0:
            session.add_all(new_objects)
            await session.commit()
            logger.info(f"✅ DB에 신규 정책 {newly_inserted}건 저장 완료! (기존 중복 제외: {duplicate_count}건)")
        else:
            logger.info(f"✅ 새로 추가할 정책이 없습니다. (모든 수집 데이터 {duplicate_count}건이 이미 DB에 존재함)")

        # 5. 발송/배치 내역에 실행 결과 기록 (NotificationLog)
        elapsed_sec = (datetime.now() - start_time).total_seconds()
        log_content = (
            f"[정기 정책 API 수집 완료] 수집: {total_fetched}건 | "
            f"신규 DB저장: {newly_inserted}건 | "
            f"기존 중복제외: {duplicate_count}건 | "
            f"소요시간: {elapsed_sec:.2f}초"
        )
        
        notification_log = NotificationLog(
            send_method="system",
            recipient_id="policy_scheduler",
            content=log_content,
            sent_at=datetime.utcnow(),
            status="SUCCESS"
        )
        session.add(notification_log)
        await session.commit()

        return {
            "success": True,
            "message": "정기 정책 API 동기화 완료",
            "total_fetched": total_fetched,
            "newly_inserted": newly_inserted,
            "skipped_duplicates": duplicate_count,
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
