"""
policy_news_sync.py
================================================================================
[정책 키워드 기반 뉴스 탐색, AI 3줄 요약, 키워드 생성 및 DB 자동 적재 동기화 서비스]

워크플로우:
1. 기존 정책 뉴스 데이터 초기화 (초기화 옵션)
2. 정책 DB(Supabase / 로컬 DB)에 저장된 정책들의 키워드와 정책명을 추출 및 정리
3. 정리된 정책 키워드를 중심으로 실시간 관련 뉴스 탐색 (Google News RSS & 원문 크롤링)
4. 수집된 뉴스를 OpenRouter AI(nvidia/nemotron-3-ultra-550b-a55b:free)로 3줄 요약 및 5개 이상 핵심 키워드 생성
5. Supabase(policy_news 테이블) 및 로컬 영구 DB(db/policy_news_integrated.json)에 자동 적재
================================================================================
"""

import os
import sys
import json
import logging
import re
import urllib.parse
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Set

import requests
import feedparser
import bs4
from dotenv import load_dotenv

# 콘솔 인코딩 대응
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# 프로젝트 경로 설정
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
for p in [str(CURRENT_DIR), str(PROJECT_ROOT)]:
    if p not in sys.path:
        sys.path.insert(0, p)

load_dotenv(dotenv_path=PROJECT_ROOT / ".env")

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("PolicyNewsSync")

try:
    from googlenewsdecoder import gnewsdecoder
except ImportError:
    gnewsdecoder = None

from ai.policy_news_pipeline import LLMSummarizer, RealNewsCrawler


class PolicyNewsSyncService:
    """정책 DB 키워드 정리 -> 실시간 뉴스 수집 -> AI 요약/키워드 생성 -> DB 저장 서비스"""

    def __init__(self):
        self.summarizer = LLMSummarizer()
        self.crawler = RealNewsCrawler()
        self.supabase_url = os.getenv("SUPABASE_URL", "")
        self.supabase_key = os.getenv("SUPABASE_KEY", "")

    def clear_all_existing_news(self):
        """기존 정책 뉴스 DB 데이터 전면 초기화"""
        logger.info("🗑️ [초기화] 기존 정책 뉴스 DB 데이터 삭제 진행 중...")

        # 1. Supabase policy_news 테이블 삭제
        if self.supabase_url and self.supabase_key and "your-project" not in self.supabase_url:
            try:
                endpoint = f"{self.supabase_url.rstrip('/')}/rest/v1/policy_news?id=neq.NULL_DUMMY"
                headers = {
                    "apikey": self.supabase_key,
                    "Authorization": f"Bearer {self.supabase_key}"
                }
                res = requests.delete(endpoint, headers=headers, timeout=5)
                if res.status_code in [200, 204]:
                    logger.info("✅ Supabase 'policy_news' 테이블 데이터 삭제 완료")
            except Exception as e:
                logger.warning(f"Supabase 삭제 중 오류: {e}")

        # 2. 로컬 JSON 파일 초기화
        json_path = PROJECT_ROOT / "db" / "policy_news_integrated.json"
        try:
            os.makedirs(json_path.parent, exist_ok=True)
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump([], f, ensure_ascii=False, indent=2)
            logger.info(f"✅ 로컬 DB JSON 파일 초기화 완료: {json_path}")
        except Exception as e:
            logger.error(f"로컬 JSON 초기화 오류: {e}")

    def get_policy_keywords_from_db(self) -> List[Dict[str, Any]]:
        """
        1. 정책 DB(Supabase 또는 로컬 정책 JSON)에서 고유 정책 및 키워드 목록 추출
        """
        policies = []
        seen_titles = set()

        # 1-1. Supabase에서 정책 목록 조회 시도
        if self.supabase_url and self.supabase_key and "your-project" not in self.supabase_url:
            try:
                for table in ["youth_policies", "policies", "unified_policies"]:
                    endpoint = f"{self.supabase_url.rstrip('/')}/rest/v1/{table}?select=id,title,category,organization,keywords&limit=100"
                    headers = {
                        "apikey": self.supabase_key,
                        "Authorization": f"Bearer {self.supabase_key}"
                    }
                    res = requests.get(endpoint, headers=headers, timeout=5)
                    if res.status_code == 200:
                        data = res.json()
                        if data and len(data) > 0:
                            for row in data:
                                title = row.get("title", "").strip()
                                if title and title not in seen_titles:
                                    seen_titles.add(title)
                                    policies.append({
                                        "id": row.get("id", ""),
                                        "title": title,
                                        "category": row.get("category", "청년정책"),
                                        "organization": row.get("organization", "정부부처"),
                                        "keywords": row.get("keywords", "")
                                    })
                            logger.info(f"✅ Supabase '{table}'에서 {len(policies)}개 정책 로드 완료")
                            break
            except Exception as e:
                logger.warning(f"Supabase 정책 로드 예외: {e}")

        # 1-2. 로컬 JSON 파일에서 정책 로드 (db/[2026.09.22 17시16분].json 등)
        if not policies:
            local_raw_path = PROJECT_ROOT / "db" / "[2026.09.22 17시16분].json"
            if local_raw_path.exists():
                try:
                    with open(local_raw_path, "r", encoding="utf-8") as f:
                        raw_data = json.load(f)
                        items = raw_data.get("youthPolicyList", []) if isinstance(raw_data, dict) else raw_data
                        for item in items:
                            title = item.get("plcyNm") or item.get("title") or ""
                            if title and title not in seen_titles:
                                seen_titles.add(title)
                                policies.append({
                                    "id": item.get("plcyNo") or item.get("id") or f"POL-{len(policies)+1}",
                                    "title": title,
                                    "category": item.get("lclsfNm") or item.get("category") or "청년정책",
                                    "organization": item.get("sprvsnInstCdNm") or item.get("organization") or "정부부처",
                                    "keywords": item.get("plcyKywdCn") or item.get("keywords") or ""
                                })
                    logger.info(f"✅ 로컬 정책 원본 파일에서 {len(policies)}개 정책 추출 완료")
                except Exception as e:
                    logger.warning(f"로컬 파일 파싱 예외: {e}")

        # 1-3. 대표 청년 정책 핵심 시드 (최소 보장)
        if len(policies) < 10:
            core_seeds = [
                {"id": "POL-2026-001", "title": "청년 월세 특별지원 (2차)", "category": "주거", "organization": "국토교통부", "keywords": "청년월세, 월세지원, 보증금완화, 주거안정"},
                {"id": "POL-CUSTOM", "title": "청년도약계좌", "category": "금융·복지", "organization": "금융위원회", "keywords": "청년도약계좌, 정부기여금, 비과세, 자산형성, 청년미래적금"},
                {"id": "POL-2026-002", "title": "청년전용 버팀목 전세자금대출", "category": "주거", "organization": "주택도시기금", "keywords": "버팀목전세, 전세자금대출, 저금리대출, 무주택청년"},
                {"id": "POL-2026-003", "title": "2026 청년도전지원사업", "category": "일자리", "organization": "고용노동부", "keywords": "청년도전지원, 구직수당, 일경험인턴, 취업지원"},
                {"id": "POL-2026-004", "title": "K-패스 청년 교통비 환급 지원", "category": "교통·문화", "organization": "국토교통부", "keywords": "K패스, 대중교통환급, 청년교통비, 광역교통"},
                {"id": "POL-2026-005", "title": "청년 주택드림 청약통장 & 대출", "category": "주거", "organization": "국토교통부", "keywords": "청년주택드림, 청약통장, 우대금리, 내집마련"},
                {"id": "POL-2026-006", "title": "청년내일저축계좌", "category": "금융·복지", "organization": "보건복지부", "keywords": "청년내일저축계좌, 정부매칭, 자산형성, 목돈마련"},
                {"id": "POL-2026-007", "title": "청년 문화예술패스 지원사업", "category": "문화", "organization": "문화체육관광부", "keywords": "청년문화예술패스, 문화바우처, 공연전시, 19세청년"},
                {"id": "POL-2026-008", "title": "서울시 청년 안심주택 공급 및 임대료 지원", "category": "주거", "organization": "서울특별시 / SH", "keywords": "청년안심주택, 서울시청년주택, 역세권청년주택, SH공사"},
                {"id": "POL-2026-009", "title": "청년 국가장학금 및 학자금 대출 이자 지원", "category": "교육", "organization": "교육부 / 한국장학재단", "keywords": "국가장학금, 학자금대출, 한국장학재단, 초저금리"},
                {"id": "POL-2025-001", "title": "청년 마음건강지원사업", "category": "복지", "organization": "보건복지부", "keywords": "청년마음건강, 심리상담바우처, 보건복지부, 마음건강"},
                {"id": "POL-2025-002", "title": "청년창업사관학교", "category": "창업", "organization": "중소벤처기업부", "keywords": "청년창업사관학교, 창업자금지원, K스타트업, 사업화자금"},
                {"id": "POL-2025-003", "title": "K-디지털 트레이닝 (K-Digital Training)", "category": "교육·훈련", "organization": "고용노동부", "keywords": "K디지털트레이닝, 내일배움카드, IT실무교육, 국비지원"},
                {"id": "POL-2025-004", "title": "청년 일경험 지원사업 (미래내일 일경험)", "category": "일자리", "organization": "고용노동부", "keywords": "미래내일일경험, 청년인턴십, 직무경험, 고용노동부"},
                {"id": "POL-2025-005", "title": "국민취업지원제도 (I·II 유형)", "category": "일자리", "organization": "고용노동부", "keywords": "국민취업지원제도, 구직촉진수당, 취업성공수당, 실업부조"},
                {"id": "POL-2025-006", "title": "청년도약계좌 육아휴직자 지원 확대", "category": "금융·복지", "organization": "금융위원회", "keywords": "청년도약계좌, 육아휴직자가입, 중도해지완화, 금융위원회"},
                {"id": "POL-2025-007", "title": "2025년 대한민국 청년정책 종합시행계획", "category": "기반", "organization": "국무조정실", "keywords": "청년정책종합계획, 국무조정실, 온통청년, 청년주거"}
            ]
            for cs in core_seeds:
                if cs["title"] not in seen_titles:
                    seen_titles.add(cs["title"])
                    policies.append(cs)

        return policies

    def sync_news_for_all_policies(self, clear_first: bool = True) -> Dict[str, Any]:
        """
        [전체 동기화 메인 프로세스]
        1. 기존 뉴스 초기화 (clear_first=True)
        2. DB 정책 키워드 정리
        3. 키워드 중심 뉴스 검색
        4. AI 3줄 요약 & 5개 이상 키워드 생성
        5. DB 영구 저장
        """
        start_time = datetime.now()
        logger.info("=" * 70)
        logger.info(f"🚀 [청년 정책 뉴스 전체 재구축 및 동기화 시작] 시각: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

        if clear_first:
            self.clear_all_existing_news()

        policies = self.get_policy_keywords_from_db()
        logger.info(f"📋 분석 대상 청년 정책 수: {len(policies)}개")

        json_path = PROJECT_ROOT / "db" / "policy_news_integrated.json"
        saved_records = []
        saved_titles: Set[str] = set()

        for idx, pol in enumerate(policies, 1):
            policy_id = pol.get("id") or f"POL-{idx}"
            policy_name = pol.get("title") or "청년 정책"
            organization = pol.get("organization") or "정부부처"

            logger.info(f"\n[{idx}/{len(policies)}] 🔍 정책 키워드 정리 및 기사 탐색: '{policy_name}'")

            # 1. 뉴스 크롤링
            news_data = self.crawler.fetch_grounded_news(policy_name)
            if not news_data:
                continue

            news_title = news_data.get("title", "").strip()

            # 중복 기사 방지
            if news_title in saved_titles:
                logger.info(f"  ↳ 이미 수집된 기사 건너뜀: '{news_title[:30]}...'")
                continue

            # 2. AI 뉴스 3줄 요약 생성
            news_3lines = self.summarizer.summarize_grounded_news(policy_name, news_data["content"])

            # 3. AI 뉴스 5개 이상 핵심 키워드 생성
            news_keywords = self.summarizer.extract_news_keywords(
                policy_name=policy_name,
                news_title=news_title,
                news_content=news_data["content"],
                min_count=5
            )
            news_keywords_str = ", ".join(news_keywords)

            # 4. 일체형 통합 레코드 구조화
            record = {
                "policy_id": policy_id,
                "policy_name": policy_name,
                "organization": organization,
                "policy_summary_3lines": f"[1] [사업 개요] {organization} 주관 '{policy_name}'으로 청년 맞춤 지원을 제공합니다.\n[2] [지원 대상] 만 19세~34세 대상 혜택이 적용됩니다.\n[3] [지원 내용] 세부 지원 혜택 및 신청 일정 제공",
                "grounded_news": {
                    "title": news_title,
                    "publisher": news_data.get("publisher", "언론사"),
                    "url": news_data.get("url", "https://www.korea.kr"),
                    "published_at": news_data.get("published_at") or datetime.now().strftime("%Y-%m-%d"),
                    "summary_3lines": news_3lines,
                    "keywords": news_keywords,
                    "keywords_str": news_keywords_str
                },
                "news_keywords": news_keywords,
                "updated_at": datetime.now().isoformat()
            }

            # 5. Supabase DB 저장
            self._save_to_supabase(record)

            # 6. 로컬 레코드 추가
            saved_records.append(record)
            saved_titles.add(news_title)

        # 로컬 JSON 파일 영구 저장
        try:
            os.makedirs(json_path.parent, exist_ok=True)
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(saved_records, f, ensure_ascii=False, indent=2)
            logger.info(f"💾 로컬 DB 파일 저장 완료: {json_path} (총 {len(saved_records)}건 저장)")
        except Exception as e:
            logger.error(f"로컬 JSON 저장 실패: {e}")

        elapsed = (datetime.now() - start_time).total_seconds()
        logger.info("\n" + "=" * 70)
        logger.info("✨ [정책 뉴스 동기화 완료 보고]")
        logger.info(f"  • 총 검토 정책 수: {len(policies)}개")
        logger.info(f"  • 최종 저장 뉴스 수: {len(saved_records)}건")
        logger.info(f"  • 소요 시간: {elapsed:.2f}초")
        logger.info("=" * 70)

        return {
            "success": True,
            "total_policies": len(policies),
            "total_saved": len(saved_records),
            "elapsed_seconds": elapsed
        }

    def _save_to_supabase(self, record: Dict[str, Any]):
        """Supabase policy_news 테이블에 적재"""
        if not self.supabase_url or not self.supabase_key or "your-project" in self.supabase_url:
            return

        grounded = record.get("grounded_news", {})
        db_row = {
            "id": f"NEWS_{record.get('policy_id', 'POL')}_{int(datetime.now().timestamp())}",
            "policy_id": record.get("policy_id"),
            "policy_name": record.get("policy_name", ""),
            "title": grounded.get("title", ""),
            "publisher": grounded.get("publisher", ""),
            "url": grounded.get("url", ""),
            "published_at": str(grounded.get("published_at", "")),
            "summary_3lines": grounded.get("summary_3lines", ""),
            "keywords": grounded.get("keywords_str") or ", ".join(grounded.get("keywords", [])),
            "updated_at": datetime.now().isoformat()
        }

        try:
            endpoint = f"{self.supabase_url.rstrip('/')}/rest/v1/policy_news"
            headers = {
                "apikey": self.supabase_key,
                "Authorization": f"Bearer {self.supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates"
            }
            res = requests.post(endpoint, headers=headers, json=[db_row], timeout=5)
            if res.status_code in [200, 201]:
                logger.info(f"✅ Supabase policy_news 테이블 저장 성공: '{db_row['title'][:30]}...'")
        except Exception as e:
            logger.debug(f"Supabase 저장 예외: {e}")


def main():
    service = PolicyNewsSyncService()
    service.sync_news_for_all_policies(clear_first=True)


if __name__ == "__main__":
    main()
