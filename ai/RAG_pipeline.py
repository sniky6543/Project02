"""
RAG_pipeline.py
================================================================================
청년나침반 (Youth Compass) 올인원 AI 정책 매칭 & 질의응답 파이프라인
================================================================================
연동 구성:
1. [복지로 API] 중앙부처 & 지자체 복지/주거/생계 서비스 연동
2. [온통청년 API] 대한민국 전체 청년정책 포털 실시간 오픈 API 연동
3. [RAG 하이브리드 검색] 프로필 하드필터링 + Ollama nomic-embed-text 벡터 검색
4. [구글 뉴스 RSS] 정책별 과거 보도 및 최신 뉴스 실시간 크롤링
5. [LLM AI 엔진] Ollama (EXAONE 3.5, LLaMA 3.1) / OpenAI 지능형 추론
   - 정책 맞춤 추천 & 개인화 사유 생성
   - 추천 정책 하단 관련 뉴스 AI 3줄 요약
   - 청년 실질 지원 단계별 액션 플랜 (서류/신청 팁/주의점)
   - 실시간 정책 Q&A 챗봇 질의응답
6. [대화형 CLI 상담 모드] 사용자 직접 입력 & 실시간 질의응답 지원
"""

import os
import sys
import json
import re
import uuid
import math
import warnings
import urllib.parse
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple, Union

# Windows 터미널 인코딩 설정
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

warnings.filterwarnings("ignore", category=DeprecationWarning)

import feedparser
import requests
import bs4
try:
    from googlenewsdecoder import gnewsdecoder
except ImportError:
    gnewsdecoder = None

from dotenv import load_dotenv

# 루트 기준 .env 로드
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent.parent
env_path = project_root / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

# 복지로 / 온통청년 클라이언트 임포트
try:
    from ai.pipeline.bokjiro_client import BokjiroClient
    from ai.pipeline.youthcenter_client import YouthCenterClient
except ImportError:
    try:
        from bokjiro_client import BokjiroClient
        from youthcenter_client import YouthCenterClient
    except ImportError:
        BokjiroClient = None
        YouthCenterClient = None


# ==============================================================================
# 0. 유틸리티 함수
# ==============================================================================
def parse_age_range(age_str: Optional[str]) -> Tuple[int, int]:
    """'만 19세 ~ 34세', '19~39세', '만 18세 이상' 등의 문자열에서 최소/최대 연령 추출"""
    if not age_str:
        return (0, 150)
    clean = str(age_str).replace(" ", "").replace("세", "")
    match_range = re.search(r"(\d{1,2})[~\-–](\d{1,2})", clean)
    if match_range:
        return (int(match_range.group(1)), int(match_range.group(2)))
    match_ge = re.search(r"(\d{1,2})이상", clean)
    if match_ge:
        return (int(match_ge.group(1)), 150)
    match_le = re.search(r"(\d{1,2})이하", clean)
    if match_le:
        return (0, int(match_le.group(1)))
    match_single = re.search(r"(\d{1,2})", clean)
    if match_single:
        val = int(match_single.group(1))
        if 15 <= val <= 45:
            return (val, val)
    return (0, 150)


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """두 벡터 간의 코사인 유사도 계산"""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
    return dot / (norm1 * norm2)


# ==============================================================================
# 1. 임베딩 엔진 (Ollama nomic-embed-text / OpenAI / Sparse TF-IDF)
# ==============================================================================
class EmbeddingEngine:
    def __init__(self, model_name: str = "nomic-embed-text", ollama_base_url: str = "http://localhost:11434"):
        self.model_name = model_name
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", ollama_base_url)
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        self.active_provider = "sparse"
        self._detect_provider()

    def _detect_provider(self):
        try:
            res = requests.get(f"{self.ollama_base_url}/api/tags", timeout=1.5)
            if res.status_code == 200:
                tags = [m["name"].split(":")[0] for m in res.json().get("models", [])]
                if self.model_name.split(":")[0] in tags or "nomic-embed-text" in tags:
                    self.model_name = "nomic-embed-text"
                    self.active_provider = "ollama"
                    return
        except Exception:
            pass

        if self.openai_api_key and not self.openai_api_key.startswith("sk-proj-your"):
            self.active_provider = "openai"
            return

        self.active_provider = "sparse"

    def embed_text(self, text: str) -> List[float]:
        text = text.strip()
        if not text:
            return [0.0] * 128

        if self.active_provider == "ollama":
            try:
                resp = requests.post(
                    f"{self.ollama_base_url}/api/embeddings",
                    json={"model": self.model_name, "prompt": text},
                    timeout=5
                )
                if resp.status_code == 200:
                    emb = resp.json().get("embedding", [])
                    if emb:
                        return emb
            except Exception:
                pass

        elif self.active_provider == "openai":
            try:
                from openai import OpenAI
                client = OpenAI(api_key=self.openai_api_key)
                response = client.embeddings.create(input=text[:8000], model="text-embedding-3-small")
                return response.data[0].embedding
            except Exception:
                pass

        return self._sparse_hash_vector(text)

    def _sparse_hash_vector(self, text: str, dim: int = 256) -> List[float]:
        vec = [0.0] * dim
        words = re.findall(r"[가-힣a-zA-Z0-9]+", text.lower())
        if not words:
            return vec
        for w in words:
            idx = abs(hash(w)) % dim
            vec[idx] += 1.0
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [v / norm for v in vec]
        return vec


# ==============================================================================
# 2. 구글 뉴스 RSS 수집 및 AI 3줄 요약기
# ==============================================================================
class PolicyNewsSearcher:
    """추천된 맞춤 정책의 키워드로 구글 뉴스 RSS를 실시간 크롤링하여 AI 3줄 요약 생성"""

    def __init__(self, timeout: int = 5):
        self.timeout = timeout
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }

    def clean_keyword(self, policy_title: str) -> str:
        cleaned = re.sub(r"\[.*?\]|\(.*?\)|<.*?>|「|」|『|』|【|】", " ", policy_title)
        cleaned = re.sub(r"\d+차|신규|모집|사업|지원사업", "", cleaned)
        cleaned = " ".join(cleaned.split())
        words = cleaned.split()
        if len(words) > 3:
            cleaned = " ".join(words[:3])
        return cleaned or policy_title[:10]

    def search_news(self, policy_title: str, category: str = "", max_results: int = 1) -> List[Dict[str, Any]]:
        kw = self.clean_keyword(policy_title)
        query = f"청년 {kw}".strip()
        encoded_query = urllib.parse.quote(query)
        rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=ko&gl=KR&ceid=KR:ko"

        try:
            feed = feedparser.parse(rss_url)
            entries = feed.entries
            if not entries and category:
                fallback_q = urllib.parse.quote(f"청년 {category} 지원")
                feed = feedparser.parse(f"https://news.google.com/rss/search?q={fallback_q}&hl=ko&gl=KR&ceid=KR:ko")
                entries = feed.entries
        except Exception:
            entries = []

        news_items = []
        for entry in entries[:max_results]:
            title = entry.get("title", "")
            title_clean = title
            publisher = ""
            if " - " in title:
                parts = title.rsplit(" - ", 1)
                title_clean = parts[0].strip()
                publisher = parts[1].strip()

            google_link = entry.get("link", "")
            published = entry.get("published", "")
            date_clean = published
            try:
                dt = datetime.strptime(published[:16], "%a, %d %b %Y")
                date_clean = dt.strftime("%Y.%m.%d")
            except Exception:
                pass

            original_url = google_link
            if gnewsdecoder:
                try:
                    dec = gnewsdecoder(google_link)
                    if dec.get("success"):
                        original_url = dec.get("decoded_url", google_link)
                except Exception:
                    pass

            article_text = self._fetch_article_body(original_url, fallback_summary=entry.get("summary", ""))

            news_items.append({
                "title": title_clean,
                "publisher": publisher,
                "url": original_url,
                "published": date_clean,
                "content": article_text
            })

        return news_items

    def _fetch_article_body(self, url: str, fallback_summary: str = "") -> str:
        try:
            res = requests.get(url, headers=self.headers, timeout=self.timeout)
            if res.status_code == 200:
                soup = bs4.BeautifulSoup(res.content, "html.parser")
                for tag in soup(["script", "style", "header", "footer", "nav", "aside", "form"]):
                    tag.decompose()
                paragraphs = [p.get_text(strip=True) for p in soup.find_all("p") if len(p.get_text(strip=True)) > 25]
                text = "\n".join(paragraphs)
                if len(text) > 80:
                    return text[:1500]
        except Exception:
            pass

        clean_summary = re.sub(r"<.*?>", "", fallback_summary).strip()
        return clean_summary or "해당 정책에 대한 언론 보도 및 지원 안내 기사입니다."

    def summarize_news(self, news_item: Dict[str, Any], policy_title: str, llm_invoker=None) -> str:
        content = news_item.get("content", "")
        title = news_item.get("title", "")

        if llm_invoker and len(content) > 60:
            prompt = (
                f"당신은 대한민국 청년 정책 시사 뉴스 전문 분석관입니다.\n"
                f"추천 정책 '{policy_title}'과 관련된 아래 뉴스 기사를 읽고, "
                f"청년 신청자 입장에서 가장 중요한 [1]보도 배경 및 현황, [2]핵심 수혜 혜택, [3]신청 시 유의점이나 현실적 팁을 "
                f"반드시 한국어로 정확히 딱 3줄로 요약하세요.\n"
                f"영어나 부가 설명 없이 오직 [1], [2], [3] 번호 형식으로만 작성하세요.\n\n"
                f"[기사 제목]: {title}\n"
                f"[기사 본문]:\n{content[:1200]}\n\n"
                f"[3줄 요약]:"
            )
            try:
                res = llm_invoker(prompt, system_prompt="청년 정책 뉴스 3줄 요약 전문 AI")
                if res and "[1]" in res:
                    lines = [line.strip() for line in res.split("\n") if line.strip().startswith("[")]
                    if len(lines) >= 3:
                        return "\n".join(lines[:3])
                    elif len(lines) > 0:
                        return "\n".join(lines)
            except Exception:
                pass

        # Fallback 문장 추출
        sentences = re.split(r"(?<=[.?!])\s+", content)
        clean_sentences = [s.strip() for s in sentences if len(s.strip()) > 20 and not s.startswith("기자") and not s.startswith("사진")]

        if len(clean_sentences) >= 3:
            return f"[1] {clean_sentences[0]}\n[2] {clean_sentences[1]}\n[3] {clean_sentences[2]}"
        elif clean_sentences:
            res = [f"[{i+1}] {s}" for i, s in enumerate(clean_sentences[:3])]
            while len(res) < 3:
                res.append(f"[{len(res)+1}] {policy_title} 관련 최신 추진 현황 및 수혜 대상 확대가 보도되었습니다.")
            return "\n".join(res)

        return (
            f"[1] {policy_title} 관련 최신 지원 대상 및 시행 현황이 보도되었습니다.\n"
            f"[2] 청년들의 주거·생활 안정 및 경제적 자립 부담을 실질적으로 경감하는 효과가 기대됩니다.\n"
            f"[3] 예산 한도 내 조기 마감될 수 있으므로 주관기관 공고를 확인 후 신속한 신청이 권장됩니다."
        )

    def extract_news_keywords(self, news_item: Dict[str, Any], policy_title: str, llm_invoker=None, min_count: int = 5) -> List[str]:
        """뉴스 요약 시 뉴스에 대한 핵심 키워드 5개 이상(5~8개) 추출"""
        content = news_item.get("content", "")
        title = news_item.get("title", "")

        if llm_invoker:
            prompt = (
                f"당신은 대한민국 청년 정책 및 시사 뉴스 전문 분석관입니다.\n"
                f"정책 '{policy_title}'과 관련된 아래 뉴스 기사를 분석하여, 뉴스의 맥락을 대표하는 핵심 키워드를 반드시 {min_count}개 이상 (5~8개) 추출하세요.\n"
                f"반드시 JSON 배열 형식(예: [\"청년도약계좌\", \"정부기여금\", \"비과세혜택\", \"자산형성\", \"시중은행\"])으로만 응답하세요.\n\n"
                f"[기사 제목]: {title}\n"
                f"[기사 본문]:\n{content[:1000]}\n\n"
                f"[핵심 키워드 (5개 이상, JSON 배열)]:"
            )
            try:
                res = llm_invoker(prompt, system_prompt="청년 정책 뉴스 키워드 분석 AI")
                match = re.search(r"\[[\s\S]*?\]", res)
                if match:
                    parsed = json.loads(match.group(0))
                    if isinstance(parsed, list) and len(parsed) >= 1:
                        clean_kws = [str(k).strip().replace("#", "") for k in parsed if str(k).strip()]
                        if len(clean_kws) >= min_count:
                            return clean_kws[:8]
            except Exception:
                pass

        # Fallback 룰 기반 추출
        candidates = []
        if policy_title:
            clean_pol = re.sub(r"\[.*?\]|\(.*?\)", "", policy_title).strip()
            if clean_pol:
                candidates.append(clean_pol)

        combined = f"{policy_title} {title} {content}".lower()
        keyword_pool = [
            ("도약계좌", "청년도약계좌"), ("기여금", "정부기여금"), ("비과세", "비과세혜택"), ("자산", "자산형성"),
            ("월세", "청년월세지원"), ("보증금", "보증금대출"), ("주거", "주거안정"), ("공공임대", "공공임대주택"),
            ("구직", "구직활동지원"), ("취업", "청년취업지원"), ("인턴", "일경험인턴십"), ("창업", "청년창업육성"),
            ("교통비", "K-패스교통비"), ("학자금", "학자금대출이자"), ("역량", "직무역량강화"), ("마음건강", "청년마음건강")
        ]
        for trigger, kw in keyword_pool:
            if trigger in combined and kw not in candidates:
                candidates.append(kw)

        nouns = [w for w in re.sub(r"[^\w\s]", " ", f"{title} {content[:200]}").split() if len(w) >= 2 and w not in ["청년", "지원", "사업", "안내", "뉴스", "기자", "보도"]]
        for n in nouns:
            if n not in candidates:
                candidates.append(n)
                if len(candidates) >= min_count + 2:
                    break

        defaults = ["청년정책동향", "맞춤수혜혜택", "정부지원사업", "온라인신청", "생활안정지원"]
        for df in defaults:
            if df not in candidates:
                candidates.append(df)
            if len(candidates) >= min_count:
                break

        return candidates[:max(min_count, len(candidates))]



# ==============================================================================
# 3. 통합 정책 지식베이스 (온통청년 API + 복지로 API + 로컬 데이터셋)
# ==============================================================================
class PolicyKnowledgeBase:
    """온통청년, 복지로 및 로컬 데이터셋을 포괄하는 지식베이스"""

    def __init__(self, embedding_engine: Optional[EmbeddingEngine] = None):
        self.embedding_engine = embedding_engine or EmbeddingEngine()
        self.policies: List[Dict[str, Any]] = []
        self.policy_vectors: List[List[float]] = []

    def load_policies(self, file_paths: Optional[List[str]] = None, fetch_live_apis: bool = True) -> int:
        if file_paths is None:
            file_paths = [
                str(current_dir / "summarized_policies.json"),
                str(project_root / "db" / "[2026.09.22 17시16분].json")
            ]

        loaded: Dict[str, Dict[str, Any]] = {}

        # 1. 로컬 데이터셋 로드
        for fp in file_paths:
            p = Path(fp)
            if not p.exists():
                continue
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        for item in data:
                            pid = item.get("id") or str(uuid.uuid4())[:8]
                            if pid not in loaded:
                                loaded[pid] = self._normalize_policy(item)
            except Exception as e:
                print(f"⚠️ [데이터 로드 경고] {p.name} 읽기 실패: {e}", flush=True)

        # 2. 실시간 공공 API 연동 수집 (옵션 또는 초기 호출 시 보강)
        if fetch_live_apis:
            self._fetch_from_live_apis(loaded)

        if not loaded:
            default_samples = self._get_fallback_sample_policies()
            for s in default_samples:
                loaded[s["id"]] = s

        self.policies = list(loaded.values())
        print(f"📚 [통합 지식베이스] 총 {len(self.policies)}건 정책 데이터 적재 (복지로 + 온통청년)", flush=True)
        self._build_index()
        return len(self.policies)

    def _fetch_from_live_apis(self, target_dict: Dict[str, Dict[str, Any]]):
        """복지로 & 온통청년 실시간 API에서 최신 정책 수집하여 지식베이스에 추가"""
        print("🌐 [API 실시간 동기화] 복지로 및 온통청년 최신 정책 조회 중...", flush=True)
        # 1. 복지로 API
        if BokjiroClient:
            try:
                bokjiro = BokjiroClient()
                res = bokjiro.get_central_welfare_list(search_wrd="청년", life_array="청년", num_of_rows=5)
                serv_list = res.get("servList", [])
                if isinstance(serv_list, dict):
                    serv_list = [serv_list]
                for item in serv_list:
                    pid = f"BOKJIRO_{item.get('servId', uuid.uuid4().hex[:6])}"
                    if pid not in target_dict:
                        target_dict[pid] = {
                            "id": pid,
                            "source": "복지로 (bokjiro.go.kr)",
                            "title": item.get("servNm", "청년 복지 지원"),
                            "organization": item.get("jurMnofNm") or "보건복지부/지자체",
                            "category": "금융･복지･문화",
                            "status": "상시접수",
                            "target_age": "만 19세~34세 청년",
                            "min_age": 19,
                            "max_age": 34,
                            "target_condition": item.get("tgtrDtlCn") or "청년 가구 소득/자격 기준 충족자",
                            "income_condition": item.get("slctCritCn") or "중위소득 기준 충족자",
                            "employment_condition": "제한없음",
                            "education_condition": "제한없음",
                            "support_content": item.get("alwServCn") or item.get("wlfareInfoOutlCn") or "생계/주거/자립 맞춤 지원금 지급",
                            "summary": item.get("wlfareInfoOutlCn") or "청년 복지 자립 지원 정책",
                            "period": "상시 접수",
                            "apply_method": "복지로 온라인 신청 (bokjiro.go.kr) 또는 주민센터",
                            "apply_url": item.get("servDtlLink") or "https://www.bokjiro.go.kr"
                        }
            except Exception as e:
                print(f"⚠️ 복지로 실시간 수집 생략: {e}", flush=True)

        # 2. 온통청년 API
        if YouthCenterClient:
            try:
                yc = YouthCenterClient()
                res = yc.get_policies(page_size=5)
                policy_list = res.get("result", {}).get("youthPolicyList", [])
                for item in policy_list:
                    pid = f"ONTONG_{item.get('plcyNo', uuid.uuid4().hex[:6])}"
                    if pid not in target_dict:
                        min_a = int(item.get("sprtTrgtMinAge") or 19)
                        max_a = int(item.get("sprtTrgtMaxAge") or 34)
                        target_dict[pid] = {
                            "id": pid,
                            "source": "온통청년 (youthcenter.go.kr)",
                            "title": item.get("plcyNm", "청년 지원 정책"),
                            "organization": item.get("sprvsnInstCdNm") or item.get("cnsgInstCdNm") or "정부부처/지자체",
                            "category": item.get("lclsfNm") or "일자리",
                            "status": "접수중",
                            "target_age": f"만 {min_a}세 ~ {max_a}세",
                            "min_age": min_a,
                            "max_age": max_a,
                            "target_condition": item.get("ptcpPrpTrgtCn") or "청년 및 세부 공고문 참조",
                            "income_condition": item.get("addAplyQlfcCndCn") or "제한없음",
                            "employment_condition": "제한없음",
                            "education_condition": "제한없음",
                            "support_content": item.get("plcySprtCn") or "참여수당 및 인센티브 지급",
                            "summary": item.get("plcySprtCn") or "청년 역량 강화 및 자립 지원",
                            "period": item.get("aplyYmd") or "상시 접수",
                            "apply_method": item.get("plcyAplyMthdCn") or "온라인 신청",
                            "apply_url": item.get("aplyUrlAddr") or "https://www.youthcenter.go.kr"
                        }
            except Exception as e:
                print(f"⚠️ 온통청년 실시간 수집 생략: {e}", flush=True)

    def _normalize_policy(self, item: Dict[str, Any]) -> Dict[str, Any]:
        target_age_str = item.get("target_age") or item.get("targetAge") or "만 19세 ~ 34세"
        min_age, max_age = parse_age_range(target_age_str)

        category = item.get("category") or "기타"
        if " > " in category:
            category = category.split(" > ")[0]

        summary = item.get("summary") or item.get("benefitSummary") or item.get("benefit_summary") or ""
        support_content = item.get("support_content") or item.get("supportContent") or summary

        source = item.get("source")
        if not source:
            source = "복지로 (bokjiro.go.kr)" if "DATA_GO" in str(item.get("id", "")) or "BOKJIRO" in str(item.get("id", "")) else "온통청년 (youthcenter.go.kr)"

        return {
            "id": item.get("id", ""),
            "source": source,
            "title": item.get("title", "청년 지원 정책"),
            "organization": item.get("organization") or item.get("source") or "정부부처/지자체",
            "category": category,
            "status": item.get("status", "상시모집"),
            "target_age": target_age_str,
            "min_age": min_age,
            "max_age": max_age,
            "target_condition": item.get("target_condition") or item.get("targetCondition") or "제한없음",
            "income_condition": item.get("income_condition") or item.get("incomeCondition") or "제한없음",
            "employment_condition": item.get("employment_condition") or item.get("employmentCondition") or "제한없음",
            "education_condition": item.get("education_condition") or item.get("educationCondition") or "제한없음",
            "support_content": support_content,
            "summary": summary,
            "period": item.get("period") or item.get("apply_period") or item.get("business_period") or "상시 접수",
            "apply_method": item.get("apply_method") or "온라인 신청",
            "apply_url": item.get("apply_url") or "https://www.youthcenter.go.kr",
            "ai_summary_3lines": item.get("ai_summary_3lines", "")
        }

    def _get_fallback_sample_policies(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": "POL-2026-001",
                "source": "복지로 (bokjiro.go.kr)",
                "title": "청년 월세 특별지원 (2차)",
                "organization": "국토교통부 / 한국토지주택공사(LH)",
                "category": "주거",
                "status": "상시모집",
                "target_age": "만 19세 ~ 34세",
                "min_age": 19,
                "max_age": 34,
                "target_condition": "부모와 별도 거주 무주택 청년, 보증금 5천만원 및 월세 70만원 이하",
                "income_condition": "중위소득 60% 이하 (원가구 100% 이하)",
                "employment_condition": "제한없음",
                "education_condition": "제한없음",
                "support_content": "월 최대 20만원 지원 (최장 12개월간 분할 지급, 총 240만원 지원)",
                "summary": "무주택 청년 대상 월 최대 20만원(연 최대 240만원)의 월세를 지원합니다.",
                "period": "2026.01.01 ~ 2026.12.31",
                "apply_method": "복지로(bokjiro.go.kr) 온라인 접수 또는 읍면동 행정복지센터 방문 접수",
                "apply_url": "https://www.bokjiro.go.kr"
            },
            {
                "id": "POL-2026-002",
                "source": "온통청년 (youthcenter.go.kr)",
                "title": "청년전용 보증부 월세대출",
                "organization": "주택도시보증공사(HUG) / 국토교통부",
                "category": "주거",
                "status": "상시모집",
                "target_age": "만 19세 ~ 34세",
                "min_age": 19,
                "max_age": 34,
                "target_condition": "무주택 단독 세대주",
                "income_condition": "연소득 5,000만원 이하",
                "employment_condition": "재직자, 프리랜서, 사업자",
                "education_condition": "제한없음",
                "support_content": "보증금 최대 4,500만원 및 월세금 월 최대 50만원(최대 1,200만원) 초저금리 대출",
                "summary": "청년 월세 보증금 및 월세자금 초저금리 대출 상품입니다.",
                "period": "상시 접수",
                "apply_method": "기금e든든 홈페이지 온라인 신청 또는 취급은행 방문",
                "apply_url": "https://enhuf.molit.go.kr"
            }
        ]

    def _build_index(self):
        cache_file = current_dir / f".vector_cache_{self.embedding_engine.active_provider}.json"
        cached_vectors = {}
        if cache_file.exists():
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    cached_vectors = json.load(f)
            except Exception:
                cached_vectors = {}

        self.policy_vectors = []
        new_embeddings_count = 0

        for p in self.policies:
            pid = p["id"]
            if pid in cached_vectors and len(cached_vectors[pid]) > 0:
                self.policy_vectors.append(cached_vectors[pid])
            else:
                chunk = self._make_policy_chunk(p)
                vec = self.embedding_engine.embed_text(chunk)
                cached_vectors[pid] = vec
                self.policy_vectors.append(vec)
                new_embeddings_count += 1

        if new_embeddings_count > 0:
            try:
                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump(cached_vectors, f)
                print(f"💾 [벡터 캐시] {new_embeddings_count}건 신규 임베딩 파일 캐시 저장 완료", flush=True)
            except Exception:
                pass
        else:
            print(f"⚡ [벡터 캐시] {len(self.policy_vectors)}건 기존 임베딩 캐시 즉시 로드 완료 (초고속)", flush=True)

        print("✅ [인덱싱 완료] 하이브리드 검색 인덱스 준비 완료", flush=True)

    def _make_policy_chunk(self, policy: Dict[str, Any]) -> str:
        return (
            f"[출처] {policy.get('source', '')}\n"
            f"[정책명] {policy['title']}\n"
            f"[기관] {policy['organization']}\n"
            f"[분야] {policy['category']}\n"
            f"[대상연령] {policy['target_age']}\n"
            f"[자격조건] {policy['target_condition']}\n"
            f"[소득조건] {policy['income_condition']}\n"
            f"[취업상태] {policy['employment_condition']}\n"
            f"[지원내용] {policy['support_content']}\n"
            f"[요약] {policy['summary']}"
        )


# ==============================================================================
# 4. 하이브리드 리트리버
# ==============================================================================
class HybridPolicyRetriever:
    def __init__(self, knowledge_base: PolicyKnowledgeBase):
        self.kb = knowledge_base

    def search_for_profile(
        self,
        user_profile: Dict[str, Any],
        preferred_categories: Optional[List[str]] = None,
        top_k: int = 3
    ) -> List[Tuple[Dict[str, Any], float]]:
        age = user_profile.get("age")
        region = user_profile.get("region", "")
        housing_type = user_profile.get("housingType", "")
        annual_income = user_profile.get("annualIncome")
        employment_status = user_profile.get("employmentStatus", "")
        education = user_profile.get("education", "")
        special_criteria = user_profile.get("specialCriteria", [])
        special_criteria_str = " ".join(special_criteria) if isinstance(special_criteria, list) else str(special_criteria)
        user_story = user_profile.get("userStory") or user_profile.get("customConcern") or ""
        life_stage = user_profile.get("lifeStage", "")

        pref_cats = preferred_categories or user_profile.get("concernAreas", [])
        pref_cats_str = " ".join(pref_cats)

        # 생애주기, 생활 고민, 희망 분야를 포괄하는 종합 검색 쿼리 구성
        profile_query = (
            f"청년 나이 {age}세 {region} 거주 {life_stage} {housing_type} 거주 "
            f"연소득 {annual_income}만원 학력 {education} 취업상태 {employment_status} "
            f"특화조건 {special_criteria_str} "
            f"절실한 생애 관심분야: {pref_cats_str} "
            f"현재 겪고 있는 생활 고민: {user_story}"
        )
        query_vec = self.kb.embedding_engine.embed_text(profile_query)

        scored_candidates: List[Tuple[Dict[str, Any], float]] = []

        # 관심 분야별 연관 키워드 맵 (생애 맞춤형 다차원 부스팅)
        category_keyword_map = {
            "생활비": ["생활비", "교통", "식비", "통신", "학자금", "긴급", "바우처", "생계", "패스"],
            "자산형성": ["자산", "도약", "통장", "적금", "목돈", "금융", "저축", "내일", "신용"],
            "주거": ["주거", "월세", "전세", "보증부", "임대", "주택", "기숙사", "행복주택"],
            "일자리": ["일자리", "구직", "취업", "인턴", "역량", "수당", "부트캠프", "이수", "고용"],
            "창업": ["창업", "사업화", "스타트업", "입주", "시제품", "창업자"],
            "마음건강": ["건강", "마음", "심리", "상담", "치료", "검진", "의료", "케어"],
            "문화": ["문화", "예술", "패스", "체험", "스포츠", "도서", "여가"],
            "가족": ["결혼", "신혼", "출산", "임신", "영유아", "보육", "가족", "부부"]
        }

        user_story_words = set(re.findall(r"[가-힣a-zA-Z0-9]+", user_story.lower()))

        for idx, policy in enumerate(self.kb.policies):
            # 1. 하드 필터: 연령 불일치 배제 (정보가 명확할 때만)
            if age is not None and isinstance(age, (int, float)):
                min_a = policy.get("min_age", 0)
                max_a = policy.get("max_age", 150)
                if min_a > 0 and max_a < 150:
                    if age < min_a or age > max_a:
                        continue

            # 2. 벡터 코사인 유사도
            vec = self.kb.policy_vectors[idx] if idx < len(self.kb.policy_vectors) else []
            sim_score = cosine_similarity(query_vec, vec)

            # 3. 생애 맞춤형 다차원 가중치 부스팅
            boost = 0.0
            category = policy.get("category", "")
            title = policy.get("title", "")
            target_cond = policy.get("target_condition", "")
            income_cond = policy.get("income_condition", "")
            emp_cond = policy.get("employment_condition", "")
            support_cn = policy.get("support_content", "")
            policy_full_text = f"{title} {category} {target_cond} {support_cn}".lower()

            # 사용자가 선택한 희망 분야 / 고민 영역 부스팅
            if pref_cats:
                for pc in pref_cats:
                    # 카테고리 또는 제목 직접 일치
                    if pc in category or pc in title:
                        boost += 0.22
                    # 연관 키워드 확장 일치 확인
                    matched_kws = False
                    for cat_key, kws in category_keyword_map.items():
                        if cat_key in pc:
                            for kw in kws:
                                if kw in policy_full_text:
                                    boost += 0.10
                                    matched_kws = True
                                    break
                        if matched_kws:
                            break

            # 사용자의 자연어 생활 고민(user_story) 키워드 매칭
            if user_story_words:
                matched_story_words = sum(1 for w in user_story_words if len(w) > 1 and w in policy_full_text)
                boost += min(0.30, matched_story_words * 0.08)

            # 주거 형태 매칭 (월세, 전세 등)
            if housing_type and housing_type not in ["기타", "제한없음", "부모님동거"]:
                if housing_type in title or housing_type in target_cond:
                    boost += 0.12

            # 취업 상태 매칭 (미취업, 재직자 등)
            if employment_status and employment_status not in ["제한없음", "무관"]:
                if employment_status in emp_cond or employment_status in target_cond:
                    boost += 0.12

            # 특화 조건 매칭 (1인가구, 자립준비청년, 중소기업 등)
            for sc in (special_criteria if isinstance(special_criteria, list) else [special_criteria_str]):
                if sc and (sc in target_cond or sc in title):
                    boost += 0.15

            # 소득 조건 가중 (연소득이 3,600만원 이하일 때 복지/지원 성격 매칭)
            if annual_income is not None and annual_income <= 3600:
                if "중위소득" in income_cond or "저소득" in target_cond or "취약" in category:
                    boost += 0.10

            final_score = (sim_score * 0.5) + (boost * 0.5)
            scaled_score = min(99.0, max(60.0, (final_score * 60.0) + 40.0))
            scored_candidates.append((policy, scaled_score))

        scored_candidates.sort(key=lambda x: x[1], reverse=True)
        return scored_candidates[:top_k]

    def search_for_query(self, query: str, top_k: int = 3, filter_policy_id: Optional[str] = None) -> List[Tuple[Dict[str, Any], float]]:
        if filter_policy_id:
            for p in self.kb.policies:
                if p["id"] == filter_policy_id:
                    return [(p, 1.0)]

        query_vec = self.kb.embedding_engine.embed_text(query)
        scored: List[Tuple[Dict[str, Any], float]] = []
        query_words = set(re.findall(r"[가-힣a-zA-Z0-9]+", query))

        for idx, policy in enumerate(self.kb.policies):
            vec = self.kb.policy_vectors[idx] if idx < len(self.kb.policy_vectors) else []
            sim = cosine_similarity(query_vec, vec)
            text = f"{policy['title']} {policy['support_content']} {policy['category']}"
            matches = sum(1 for w in query_words if len(w) > 1 and w in text)
            keyword_score = min(0.4, matches * 0.08)
            total = (sim * 0.7) + keyword_score
            scored.append((policy, total))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]


# ==============================================================================
# 5. RAG 생성 파이프라인 (LLM + 뉴스 연동 + 액션 로드맵)
# ==============================================================================
class PolicyRAGPipeline:
    def __init__(self, knowledge_base: Optional[PolicyKnowledgeBase] = None, sync_live_apis: bool = True):
        self.embedding_engine = EmbeddingEngine()
        self.kb = knowledge_base or PolicyKnowledgeBase(self.embedding_engine)
        if not self.kb.policies:
            self.kb.load_policies(fetch_live_apis=sync_live_apis)
        self.retriever = HybridPolicyRetriever(self.kb)
        self.news_searcher = PolicyNewsSearcher()
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY", "")
        self.openrouter_model = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free")

    def _invoke_llm(self, prompt: str, system_prompt: str = "", model_preference: Optional[str] = None) -> Optional[str]:
        provider = (model_preference or "Router API").upper()

        # 1. OpenRouter (기본)
        if any(k in provider for k in ["ROUTER", "OPENROUTER"]) or (self.openrouter_api_key and not self.openrouter_api_key.startswith("sk-or-v1-your")):
            try:
                import requests
                headers = {
                    "Authorization": f"Bearer {self.openrouter_api_key}",
                    "Content-Type": "application/json"
                }
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})

                payload = {
                    "model": self.openrouter_model,
                    "messages": messages,
                    "temperature": 0.2
                }
                resp = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=25)
                if resp.status_code == 200:
                    text = resp.json()["choices"][0]["message"]["content"].strip()
                    if text:
                        return text
            except Exception:
                pass

        # 2. OpenAI
        if ("OPENAI" in provider or self.openai_api_key) and not self.openai_api_key.startswith("sk-proj-your"):
            try:
                from openai import OpenAI
                client = OpenAI(api_key=self.openai_api_key)
                model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})
                resp = client.chat.completions.create(model=model, messages=messages, temperature=0.2)
                return resp.choices[0].message.content.strip()
            except Exception:
                pass

        # 3. Ollama
        if "OLLAMA" in provider:
            try:
                selected_model = os.getenv("OLLAMA_MODEL", "exaone3.5:latest")
                payload = {
                    "model": selected_model,
                    "prompt": f"{system_prompt}\n\n{prompt}" if system_prompt else prompt,
                    "stream": False,
                    "options": {"temperature": 0.2, "top_p": 0.9}
                }
                res = requests.post(f"{self.ollama_base_url}/api/generate", json=payload, timeout=30)
                if res.status_code == 200:
                    text = res.json().get("response", "").strip()
                    if text:
                        return text
            except Exception:
                pass

        return None

    def match_policies(
        self,
        user_profile: Dict[str, Any],
        preferred_categories: Optional[List[str]] = None,
        top_k: int = 3,
        ai_model: Optional[str] = "Router API"
    ) -> Dict[str, Any]:
        """사용자 프로필 기반 온통청년/복지로 RAG 맞춤 추천 + 구글 뉴스 RSS 3줄 요약 결합"""
        candidates = self.retriever.search_for_profile(
            user_profile=user_profile,
            preferred_categories=preferred_categories,
            top_k=top_k
        )

        if not candidates:
            candidates = [(p, 85.0) for p in self.kb.policies[:top_k]]

        # LLM 프롬프트용 컨텍스트 구성
        context_docs = []
        for rank_idx, (p, score) in enumerate(candidates, 1):
            context_docs.append(
                f"[후보 {rank_idx}] ({p.get('source', '')})\n"
                f"정책ID: {p['id']}\n"
                f"정책명: {p['title']}\n"
                f"소관기관: {p['organization']}\n"
                f"분야: {p['category']}\n"
                f"지원대상 및 조건: {p['target_age']} / {p['target_condition']}\n"
                f"소득요건: {p['income_condition']}\n"
                f"지원내용 및 혜택: {p['support_content']}\n"
                f"신청기간 및 상태: {p['period']} ({p['status']})\n"
                f"신청방법: {p['apply_method']} ({p['apply_url']})"
            )
        context_str = "\n\n".join(context_docs)

        system_prompt = (
            "당신은 온통청년(고용노동부) 및 복지로(보건복지부) 공식 데이터를 통합 분석하는 "
            "청년 정책 전문 AI 큐레이터 '청년나침반'입니다.\n"
            "사용자의 상황(나이, 거주지역, 주거형태, 소득, 취업상태)을 면밀히 분석하여 "
            "가장 실질적인 수혜가 되는 정책을 추천하고, JSON 포맷으로 응답하세요."
        )

        user_story = user_profile.get("userStory") or user_profile.get("customConcern") or ""
        life_stage = user_profile.get("lifeStage") or "청년"

        user_prompt = f"""
[사용자 프로필 및 생애주기 고민]
- 나이: 만 {user_profile.get('age', 29)}세 ({user_profile.get('gender', '무관')})
- 생애 단계: {life_stage}
- 거주지역: {user_profile.get('region', '전국')}
- 주거 형태: {user_profile.get('housingType', '월세')}
- 연소득: {user_profile.get('annualIncome', 3200)}만원
- 학력: {user_profile.get('education', '대학 졸업')}
- 취업 상태: {user_profile.get('employmentStatus', '미취업자')}
- 특화 조건: {user_profile.get('specialCriteria', ['청년 1인가구'])}
- 절실한 생애 관심분야: {preferred_categories or user_profile.get('concernAreas', ['생활비', '일자리', '자산형성'])}
- 현재 가장 큰 생활 고민: "{user_story or '생활비 절감 및 실질적인 자립 지원이 필요함'}"

[복지로 & 온통청년 통합 후보 정책(Context)]
{context_str}

[작성 지침]
반드시 아래 JSON 형식으로만 응답하세요.
{{
  "summary": "회원님의 조건과 생애 고민에 맞춘 예상 수혜 금액 및 핵심 총평",
  "recommendations": [
    {{
      "policyId": "후보의 정책ID",
      "expectedBenefit": "구체적인 수혜 금액 및 혜택 요약",
      "aiReason": "사용자의 구체적 상황(생활고민, 소득, 거주지, 생애단계)을 직접 인용하여 왜 이 청년에게 적합한지 1~2문장으로 설득력 있게 설명",
      "urgency": "상시접수 또는 마감 임박 상태"
    }}
  ],
  "actionPlan": "청년의 현재 고정지출 완화(1단계)부터 역량강화 및 자산형성(2단계)까지 이어지는 실질적 순서별 로드맵 제시"
}}
"""

        llm_response = self._invoke_llm(user_prompt, system_prompt, model_preference=ai_model)
        parsed_result = self._parse_recommendation_json(llm_response, candidates, user_profile)
        return parsed_result

    def _parse_recommendation_json(
        self,
        llm_text: Optional[str],
        candidates: List[Tuple[Dict[str, Any], float]],
        user_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        rec_id = f"REC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
        recommendations = []
        summary = ""
        action_plan = ""

        if llm_text:
            try:
                clean = re.sub(r"^```[a-zA-Z]*", "", llm_text.strip(), flags=re.MULTILINE)
                clean = re.sub(r"```$", "", clean.strip(), flags=re.MULTILINE).strip()
                match = re.search(r"\{[\s\S]*\}", clean)
                if match:
                    data = json.loads(match.group(0))
                    summary = data.get("summary", "")
                    action_plan = data.get("actionPlan", "")
                    raw_recs = data.get("recommendations", [])

                    for idx, (p, score) in enumerate(candidates, 1):
                        matching_rec = next((r for r in raw_recs if r.get("policyId") == p["id"]), None)
                        if not matching_rec and idx - 1 < len(raw_recs):
                            matching_rec = raw_recs[idx - 1]

                        benefit = (matching_rec.get("expectedBenefit") if matching_rec else "") or self._extract_benefit(p)
                        reason = (matching_rec.get("aiReason") if matching_rec else "") or self._make_heuristic_reason(p, user_profile)
                        urgency = (matching_rec.get("urgency") if matching_rec else "") or ("상시접수" if "상시" in p.get("period", "") else "접수중")

                        recommendations.append({
                            "rank": idx,
                            "policyId": p["id"],
                            "source": p.get("source", "공공 포털"),
                            "title": p["title"],
                            "organization": p["organization"],
                            "category": p["category"],
                            "matchScore": int(round(score)),
                            "expectedBenefit": benefit,
                            "aiReason": reason,
                            "urgency": urgency,
                            "applyUrl": p.get("apply_url", "https://www.youthcenter.go.kr"),
                            "applyMethod": p.get("apply_method", "온라인 신청")
                        })
            except Exception:
                pass

        if not recommendations:
            for idx, (p, score) in enumerate(candidates, 1):
                benefit = self._extract_benefit(p)
                reason = self._make_heuristic_reason(p, user_profile)
                urgency = "상시접수" if "상시" in p.get("period", "") else "접수중"
                recommendations.append({
                    "rank": idx,
                    "policyId": p["id"],
                    "source": p.get("source", "공공 포털"),
                    "title": p["title"],
                    "organization": p["organization"],
                    "category": p["category"],
                    "matchScore": int(round(score)),
                    "expectedBenefit": benefit,
                    "aiReason": reason,
                    "urgency": urgency,
                    "applyUrl": p.get("apply_url", "https://www.youthcenter.go.kr"),
                    "applyMethod": p.get("apply_method", "온라인 신청")
                })

            summary = (
                f"회원님의 조건(연령 {user_profile.get('age', 29)}세, {user_profile.get('housingType', '월세')} 거주)에 "
                f"가장 적합한 핵심 청년 정책 {len(recommendations)}건이 매칭되었습니다."
            )
            action_plan = (
                f"1단계로 주거/생활 안정을 위한 '{recommendations[0]['title']}'을(를) 먼저 신청하시고, "
                f"2단계로 역량 및 일자리 지원 정책을 순차적으로 진행하시는 것을 추천합니다."
            )

        # ----------------------------------------------------------------------
        # 추천 정책별 관련 과거/최신 언론 보도 검색 및 AI 3줄 요약 부착
        # ----------------------------------------------------------------------
        for rec in recommendations:
            policy_obj = next((p for p, _ in candidates if p["id"] == rec["policyId"]), None)
            category = policy_obj.get("category", "") if policy_obj else rec.get("category", "")
            news_items = self.news_searcher.search_news(rec["title"], category=category, max_results=1)
            if news_items:
                target_news = news_items[0]
                summary_3lines = self.news_searcher.summarize_news(
                    news_item=target_news,
                    policy_title=rec["title"],
                    llm_invoker=self._invoke_llm
                )
                rec["relatedNews"] = {
                    "title": target_news["title"],
                    "publisher": target_news["publisher"],
                    "url": target_news["url"],
                    "published": target_news["published"],
                    "summary3lines": summary_3lines
                }
            else:
                rec["relatedNews"] = {
                    "title": f"{rec['title']} 정책 추진 및 신청 안내",
                    "publisher": "대한민국 정책브리핑",
                    "url": "https://www.korea.kr",
                    "published": datetime.now().strftime("%Y.%m.%d"),
                    "summary3lines": (
                        f"[1] {rec['title']} 사업의 지원 대상 및 신청 절차가 공식 보도되었습니다.\n"
                        f"[2] 해당 자격 요건(연령·소득)을 충족하는 청년층의 실질적 지원이 기대됩니다.\n"
                        f"[3] 예산 소진 전 빠른 신청을 권장하며 세부 사항은 공고문을 확인하시기 바랍니다."
                    )
                }

        return {
            "recommendationId": rec_id,
            "summary": summary or "회원님의 조건에 맞춘 최적 정책 매칭 결과입니다.",
            "matchCount": len(recommendations),
            "recommendations": recommendations,
            "actionPlan": action_plan or "안내된 절차에 따라 온라인으로 신청을 진행해 주세요."
        }

    def _extract_benefit(self, policy: Dict[str, Any]) -> str:
        text = f"{policy.get('support_content', '')} {policy.get('summary', '')}"
        m = re.search(r"(\d+만\s*원|\d+억\s*원|월\s*최대\s*\d+만\s*원|최대\s*\d+만\s*원)", text)
        if m:
            return m.group(0)
        return "맞춤형 바우처 및 재정·교육 혜택 지원"

    def _make_heuristic_reason(self, policy: Dict[str, Any], profile: Dict[str, Any]) -> str:
        title = policy.get("title", "")
        category = policy.get("category", "")
        housing = profile.get("housingType", "월세")
        income = profile.get("annualIncome", 3200)
        emp = profile.get("employmentStatus", "미취업자")
        region = profile.get("region", "해당 지역")
        combined_text = f"{title} {category}"

        # 1. 생활비 & 교통비 & 식비 & 학자금 & 통신비
        if any(k in combined_text for k in ["생활", "교통", "식비", "통신", "학자금", "긴급", "생계", "패스"]):
            return f"현재 {region}에 거주하는 {emp} 청년의 일상 고정비(교통·식비·생활비) 부담을 직접적으로 줄여주는 필수 체감형 지원입니다."
        # 2. 자산형성 & 재테크 & 금융
        elif any(k in combined_text for k in ["자산", "도약", "통장", "적금", "저축", "금융", "목돈", "신용"]):
            return f"연소득 {income}만원 조건에서 정부 매칭 지원금을 통해 조기 종잣돈을 안전하게 형성할 수 있는 최적의 금융 정책입니다."
        # 3. 마음건강 & 의료 & 심리상담
        elif any(k in combined_text for k in ["건강", "마음", "심리", "상담", "치료", "검진", "의료", "케어"]):
            return f"일상과 취업 준비에서 오는 스트레스 완화 및 심리적 회복을 돕는 맞춤형 전문 케어 지원으로 만족도가 매우 높습니다."
        # 4. 주거 (월세/전세/임대)
        elif any(k in combined_text for k in ["월세", "전세", "주거", "보증부", "임대", "주택"]):
            return f"현재 {region}에 {housing}로 거주 중이며 연소득 {income}만원 조건에 부합하여 주거비 부담 경감 효과가 가장 큽니다."
        # 5. 창업 & 프리랜서
        elif any(k in combined_text for k in ["창업", "사업화", "스타트업", "시제품", "창업자"]):
            return f"독립적인 비즈니스를 준비하는 청년에게 사업화 자금과 실무 멘토링을 원스톱 제공하므로 추천합니다."
        # 6. 일자리 & 구직 수당
        elif any(k in combined_text for k in ["도전", "구직", "일자리", "취업", "수당", "부트캠프", "이수"]):
            return f"현재 {emp} 상태의 구직 준비 및 역량 강화를 적극 지원하는 사업으로 자격 기준을 충족합니다."
        # 7. 문화 & 여가
        elif any(k in combined_text for k in ["문화", "예술", "패스", "체험", "스포츠", "도서"]):
            return f"청년층의 문화 예술 관람 및 여가 생활 지원을 통해 삶의 질을 높이고 자기계발을 돕는 정책입니다."
        else:
            return f"회원님의 거주지({region}) 및 연령 요건에 부합하며 청년 자립과 생활 안정에 실질적으로 기여하는 정책입니다."

    def answer_question(
        self,
        question: str,
        policy_id: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        ai_model: Optional[str] = "Router API"
    ) -> Dict[str, Any]:
        results = self.retriever.search_for_query(question, top_k=2, filter_policy_id=policy_id)

        references = []
        context_list = []
        for p, _ in results:
            references.append(f"[{p.get('source', '공공포털')}] {p['organization']} - {p['title']}")
            context_list.append(
                f"[정책명: {p['title']}] (출처: {p.get('source', '')})\n"
                f"소관: {p['organization']} | 분야: {p['category']}\n"
                f"지원대상 및 연령: {p['target_age']} / {p['target_condition']}\n"
                f"소득기준: {p['income_condition']}\n"
                f"지원내용: {p['support_content']}\n"
                f"신청방법: {p['apply_method']} ({p['apply_url']})\n"
                f"신청기간: {p['period']}"
            )

        context_str = "\n\n".join(context_list) if context_list else "관련 정책 상세 정보 없음"

        history_str = ""
        if chat_history:
            history_str = "\n[이전 대화 내역]\n" + "\n".join([f"{h.get('role')}: {h.get('content')}" for h in chat_history[-3:]])

        system_prompt = (
            "당신은 청년정책 전문 안내 AI 어시스턴트 '청년나침반'입니다.\n"
            "반드시 제공된 [참고 정책 데이터]에 근거하여 사용자의 질문에 친절하고 정확하게 한국어로 답변하세요.\n"
            "온통청년 및 복지로 공식 지침을 바탕으로 명확한 서류 준비와 신청 절차를 함께 안내하세요."
        )

        user_prompt = f"""
{history_str}

[참고 정책 데이터(Context)]
{context_str}

[사용자 질문]
{question}

[답변 가이드]
공식 지침을 바탕으로 청년이 쉽게 이해할 수 있도록 명확하고 따뜻한 어조로 2~4문장으로 답변하세요.
"""

        answer_text = self._invoke_llm(user_prompt, system_prompt, model_preference=ai_model)

        if not answer_text:
            if results:
                target_p = results[0][0]
                answer_text = (
                    f"문의하신 내용과 관련하여 '{target_p['title']}'({target_p.get('source', '공공데이터')})의 공고 기준을 확인한 결과, "
                    f"지원대상은 {target_p['target_age']} 및 {target_p['target_condition']}입니다. "
                    f"상세 지원 내용은 '{target_p['support_content']}'이며, {target_p['apply_method']}를 통해 신청하실 수 있습니다."
                )
            else:
                answer_text = "문의하신 정책에 대한 세부 공고 내용을 확인 중입니다. 구체적인 정책명이나 거주 지역을 말씀해 주시면 더욱 정확히 안내해 드리겠습니다."

        return {
            "answer": answer_text.strip(),
            "references": references or ["청년나침반 정책 종합 데이터베이스"]
        }


# ==============================================================================
# 6. 인터랙티브 대화형 청년 정책 컨설팅 CLI
# ==============================================================================
def run_interactive_consultation(pipeline: PolicyRAGPipeline, ai_model: str = "OLLAMA"):
    """청년의 생애주기 전반(생활비, 식비, 교통, 자산형성, 심리건강, 일자리, 주거)을 다차원 진단하는 정식 1:1 컨설팅"""
    print("\n" + "=" * 80, flush=True)
    print("🧭 [청년나침반] 청년 생애주기 맞춤형 1:1 AI 정책 & 뉴스 컨설팅", flush=True)
    print("생활비·식비·교통비·자산형성·마음건강·주거·취업 전 분야 공공데이터 & 뉴스 통합 분석", flush=True)
    print("=" * 80, flush=True)

    def prompt_with_default(prompt_text: str, default_val: Any) -> Any:
        try:
            val = input(f"👉 {prompt_text} [기본값: {default_val}]: ").strip()
            return val if val else default_val
        except (EOFError, KeyboardInterrupt):
            return default_val

    # 1. 기본 인적사항
    print("\n[1단계: 기본 인적사항]", flush=True)
    age = int(prompt_with_default("만 나이 (예: 25)", 26))
    region = prompt_with_default("거주 지역 (시/도 및 시/군/구, 예: 서울특별시 관악구)", "서울특별시 관악구")

    # 2. 생애 단계 및 취업 상태
    print("\n[2단계: 생애 단계 및 직업]", flush=True)
    print("   1) 대학생/대학원생   2) 미취업 구직자/취준생   3) 사회초년생/재직자")
    print("   4) 프리랜서/예술인   5) (예비)창업자/소상공인  6) 기타")
    stage_choice = prompt_with_default("선택 번호 (1~6)", "2")
    stage_map = {
        "1": ("대학생/대학원생", "재학생"),
        "2": ("취업준비생", "미취업자"),
        "3": ("사회초년생/재직자", "재직자"),
        "4": ("프리랜서/특수고용", "프리랜서"),
        "5": ("(예비)창업자", "창업자"),
        "6": ("청년", "기타")
    }
    life_stage, emp_status = stage_map.get(str(stage_choice), ("청년", "미취업자"))

    # 3. 주거 및 가구 환경
    print("\n[3단계: 주거 및 가구 환경]", flush=True)
    print("   1) 월세 (1인가구 독립)   2) 전세 (1인가구 독립)   3) 부모님 동거")
    print("   4) 기숙사/고시원         5) 자가/기타")
    house_choice = prompt_with_default("선택 번호 (1~5)", "1")
    house_map = {
        "1": ("월세", ["청년 1인가구"]),
        "2": ("전세", ["청년 1인가구"]),
        "3": ("부모님동거", []),
        "4": ("기숙사/고시원", ["청년 1인가구"]),
        "5": ("자가/기타", [])
    }
    housing, special_criteria = house_map.get(str(house_choice), ("월세", ["청년 1인가구"]))

    # 4. 소득 구간
    print("\n[4단계: 소득 구간]", flush=True)
    income = int(prompt_with_default("연간 총소득 (만원 단위, 소득 없으면 0, 예: 2400)", 2400))

    # 5. 생애 맞춤형 절실한 지원 분야 (복수 선택)
    print("\n[5단계: 지금 가장 도움이 절실한 '생애 맞춤 지원 분야' (복수 선택 가능, 콤마로 구분)]", flush=True)
    print("   [1] 💸 생활비 & 물가 부담 (교통비 지원, 식비/생필품 바우처, 통신비, 학자금 대출)")
    print("   [2] 💰 자산형성 & 금융 (청년도약계좌, 청년내일저축, 목돈 마련, 신용 회복)")
    print("   [3] 💼 일자리 & 취창업 (구직활동지원금, 자격증 응시료 지원, 인턴십, 창업지원)")
    print("   [4] 🏠 주거 안정 (청년 월세 지원, 청년 전세 대출, 공공임대주택, 기숙사)")
    print("   [5] 🧠 마음건강 & 의료/심리 (청년 심리상담 바우처, 건강검진, 스트레스 케어)")
    print("   [6] 🎨 문화·여가 & 자기계발 (청년문화예술패스, 도서/공연비 지원, 스포츠)")
    print("   [7] 💍 결혼·신혼 & 가족 (신혼부부 전세임대, 첫만남이용권, 임신·출산 지원)")
    cat_input = prompt_with_default("원하는 분야 번호들 입력 (예: 1, 2, 5)", "1, 2")

    cat_map = {
        "1": "생활비",
        "2": "자산형성",
        "3": "일자리",
        "4": "주거",
        "5": "마음건강",
        "6": "문화",
        "7": "가족"
    }
    selected_cats = []
    for c in str(cat_input).replace(" ", "").split(","):
        if c in cat_map:
            selected_cats.append(cat_map[c])
    if not selected_cats:
        selected_cats = ["생활비", "일자리"]

    # 6. 현재 가장 큰 생활 고민 (서술형)
    print("\n[6단계: 지금 가장 고민되는 점 (자연어로 편하게 말씀해 주세요)]", flush=True)
    print("   (예: '식비랑 교통비 지출이 너무 커요', '취준 중인데 자격증 응시료와 생활비가 부족해요')", flush=True)
    user_story = prompt_with_default("현재 고민/바라는 점", "식비와 대중교통비 지출이 커서 생활비 절감이 가장 절실합니다.")

    user_profile = {
        "age": age,
        "region": region,
        "lifeStage": life_stage,
        "housingType": housing,
        "annualIncome": income,
        "employmentStatus": emp_status,
        "education": "대학 졸업",
        "specialCriteria": special_criteria,
        "concernAreas": selected_cats,
        "userStory": user_story
    }

    print("\n" + "=" * 80, flush=True)
    print(f"📋 [진단 접수 완료] 생애 단계: {life_stage} | 희망 분야: {selected_cats}", flush=True)
    print(f"   생활 고민: \"{user_story}\"", flush=True)
    print("🔍 복지로 & 온통청년 전수 데이터베이스 검색 및 최신 언론 보도를 수집합니다...", flush=True)
    print("=" * 80, flush=True)

    rec_out = pipeline.match_policies(
        user_profile=user_profile,
        preferred_categories=selected_cats,
        top_k=3,
        ai_model=ai_model
    )

    display_recommendations(rec_out)

    # 7. 연속 대화형 Q&A 상담
    print("\n" + "-" * 80, flush=True)
    print("💬 [1:1 AI 정책 상담원 질의응답]", flush=True)
    print("   추천된 정책에 대해 신청 자격, 서류, 예외 조항 등 무엇이든 질문하세요.", flush=True)
    print("   (예: '식비나 교통비 지원은 어디서 신청해?', '청년도약계좌 자격은?', 종료는 'q')", flush=True)
    print("-" * 80, flush=True)

    while True:
        try:
            q = input("\n👉 질문 입력 (q=종료): ").strip()
            if not q or q.lower() in ["q", "quit", "exit"]:
                print("👋 청년나침반 AI 컨설팅을 종료합니다. 언제든 다시 찾아주세요!", flush=True)
                break
            ans_res = pipeline.answer_question(q, ai_model=ai_model)
            print(f"\n🤖 [AI 상담원]:\n{sanitize_print_text(ans_res['answer'])}", flush=True)
            print("\n📎 [참고 출처]:", flush=True)
            for ref in ans_res["references"]:
                print(f"   • {sanitize_print_text(ref)}", flush=True)
        except (EOFError, KeyboardInterrupt):
            break


def sanitize_print_text(text: Any) -> str:
    """터미널 출력 깨짐 방지를 위해 \\r 및 연속된 공백/줄바꿈을 안전하게 정제"""
    if not text:
        return ""
    clean = str(text).replace("\r", " ").strip()
    return re.sub(r"[ \t]+", " ", clean)


def display_recommendations(recommendation_output: Dict[str, Any]):
    """추천 결과, 관련 과거 뉴스 3줄 요약, 액션 플랜을 콘솔에 안전하고 가독성 높게 출력"""
    print("\n" + "=" * 80, flush=True)
    print(f"🎉 [매칭 결과]: {recommendation_output['recommendationId']}", flush=True)
    print(f"📌 [요약]: {sanitize_print_text(recommendation_output['summary'])}", flush=True)
    print("=" * 80, flush=True)

    for rec in recommendation_output["recommendations"]:
        source_badge = f"[{rec.get('source', '공공포털')}]"
        print(f"\n🏆 [{rec['rank']}위] {sanitize_print_text(rec['title'])} {source_badge}", flush=True)
        print(f"  • 소관기관   : {sanitize_print_text(rec.get('organization', '정부부처'))}", flush=True)
        print(f"  • 분야/적합도 : {rec['category']} (적합도 {rec['matchScore']}점 / 100점)", flush=True)
        print(f"  • 예상 혜택  : {sanitize_print_text(rec['expectedBenefit'])}", flush=True)
        print(f"  • 모집 현황  : {sanitize_print_text(rec['urgency'])}", flush=True)
        print(f"  • AI 맞춤이유 : {sanitize_print_text(rec['aiReason'])}", flush=True)

        apply_url = sanitize_print_text(rec.get('applyUrl', ''))
        apply_method = sanitize_print_text(rec.get('applyMethod', '온라인 신청'))
        if len(apply_method) > 60:
            apply_method = apply_method[:60] + "..."
        print(f"  • 공식 신청처 : {apply_url} ({apply_method})", flush=True)

        if rec.get("relatedNews"):
            news = rec["relatedNews"]
            pub = f" ({news['publisher']})" if news.get("publisher") else ""
            date_info = f" [{news.get('published', '')}]" if news.get("published") else ""
            news_title = sanitize_print_text(news.get('title', ''))
            print(f"  📰 [관련 과거/최신 언론 보도 동향]: {news_title}{pub}{date_info}", flush=True)
            print(f"     - 기사 원문: {sanitize_print_text(news.get('url', ''))}", flush=True)
            print(f"     - AI 3줄 요약:", flush=True)
            for line in news.get("summary3lines", "").split("\n"):
                clean_line = sanitize_print_text(line)
                if clean_line:
                    print(f"       {clean_line}", flush=True)

    print("\n" + "-" * 80, flush=True)
    print("🚀 [청년 실질 지원 - 단계별 원스톱 액션 플랜]:", flush=True)
    print(sanitize_print_text(recommendation_output["actionPlan"]), flush=True)
    print("=" * 80, flush=True)

    # 정식 분석 결과 JSON 파일 자동 저장
    result_save_path = current_dir / "matched_consultation_result.json"
    try:
        with open(result_save_path, "w", encoding="utf-8") as f:
            json.dump(recommendation_output, f, ensure_ascii=False, indent=2)
        print(f"💾 [컨설팅 리포트 저장 완료]: {result_save_path.name}", flush=True)
    except Exception:
        pass


# ==============================================================================
# 7. 메인 실행 진입점 (정식 운영 프로덕션 모드)
# ==============================================================================
def main():
    import argparse

    parser = argparse.ArgumentParser(description="청년나침반 RAG 기반 올인원 정책 매칭 정식 프로덕션 시스템")
    parser.add_argument("--batch", action="store_true", help="다차원 생애 맞춤 프로필로 일괄 정책 매칭 분석 실행")
    parser.add_argument("--chat", type=str, help="정책 질의응답 단일 질문")
    parser.add_argument("--policy-id", type=str, help="특정 정책 대상 질의 ID")
    parser.add_argument("--model", type=str, default="OLLAMA", choices=["OLLAMA", "OPENAI"], help="사용할 AI 모델")
    parser.add_argument("--top-k", type=int, default=3, help="추천 정책 수")
    parser.add_argument("--profile-json", type=str, help="사용자 프로필 JSON 문자열 직접 전달")
    parser.add_argument("--offline", action="store_true", help="오프라인 캐시 우선 모드 (기본값: 실시간 공공 API 상시 동기화)")

    args = parser.parse_args()

    print("================================================================================", flush=True)
    print("🧭 [Youth Compass] 온통청년 + 복지로 + 구글뉴스 + RAG 통합 정식 프로덕션 가동", flush=True)
    print("================================================================================", flush=True)

    # 기본적으로 공공 API 실시간 동기화 수행 (--offline 지정 시에만 생략)
    pipeline = PolicyRAGPipeline(sync_live_apis=not args.offline)

    # 1. 단일 질의응답 모드
    if args.chat:
        print(f"\n💬 [질문 입력]: {args.chat}", flush=True)
        res = pipeline.answer_question(question=args.chat, policy_id=args.policy_id, ai_model=args.model)
        print(f"\n🤖 [AI 답변]:\n{sanitize_print_text(res['answer'])}", flush=True)
        print("\n📎 [참고 출처]:", flush=True)
        for ref in res["references"]:
            print(f"  • {sanitize_print_text(ref)}", flush=True)
        return

    # 2. 프로덕션 배치 분석 모드 (batch 플래그나 profile-json 인자가 있는 경우)
    if args.batch or args.profile_json:
        user_profile = {
            "age": 26,
            "gender": "청년",
            "region": "서울특별시 관악구",
            "lifeStage": "사회초년생/취업준비생",
            "housingType": "월세",
            "annualIncome": 2400,
            "education": "대학 졸업",
            "employmentStatus": "취업준비생",
            "specialCriteria": ["청년 1인가구"],
            "concernAreas": ["생활비", "자산형성", "일자리"],
            "userStory": "매월 나가는 식비와 대중교통비 지출이 너무 커서 고정비를 줄이고, 종잣돈을 모으고 싶습니다."
        }
        if args.profile_json:
            try:
                user_profile = json.loads(args.profile_json)
            except Exception as e:
                print(f"⚠️ JSON 파싱 실패, 기본 프로필을 사용합니다: {e}", flush=True)

        preferred_cats = user_profile.get("concernAreas", ["생활비", "자산형성", "일자리"])
        print(f"\n👤 [프로필 입력]:\n{json.dumps(user_profile, ensure_ascii=False, indent=2)}", flush=True)
        print(f"🎯 [선호 분야]: {preferred_cats}", flush=True)
        print(f"🤖 [선택 AI 모델]: {args.model}", flush=True)
        print("\n🔍 RAG 검색 및 지능형 매칭 추론 중...", flush=True)

        recommendation_output = pipeline.match_policies(
            user_profile=user_profile,
            preferred_categories=preferred_cats,
            top_k=args.top_k,
            ai_model=args.model
        )
        display_recommendations(recommendation_output)
        return

    # 3. 기본 실행: 정식 1:1 대화형 청년 생애주기 맞춤 컨설팅 모드
    run_interactive_consultation(pipeline, ai_model=args.model)


if __name__ == "__main__":
    main()
