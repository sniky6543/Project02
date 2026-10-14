import os
import re
import json
from typing import Dict, Any, List, Optional
import httpx
from openai import AsyncOpenAI, OpenAI
from dotenv import load_dotenv

load_dotenv()

class LLMClient:
    """
    청년나침반 AI 추천, 분석 및 키워드 추출 클라이언트
    지원 공급자: OpenRouter (기본: nvidia/nemotron-3-ultra-550b-a55b:free), OpenAI, Ollama
    """
    def __init__(self):
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY", "")
        self.openrouter_model = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free")
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")

    async def generate_recommendation(
        self,
        provider: str = "Router API",
        user_profile: Dict[str, Any] = None,
        candidate_policies: List[Dict[str, Any]] = None,
        custom_api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        사용자 프로필과 후보 정책 목록을 기반으로 AI 맞춤 추천 및 이유 생성
        """
        user_profile = user_profile or {}
        candidate_policies = candidate_policies or []

        # 시스템 프롬프트 정의
        system_prompt = (
            "당신은 대한민국 청년정책 전문 AI 컨설턴트입니다. "
            "사용자의 나이, 소득, 거주형태, 취업상태를 정밀 분석하여 가장 혜택이 크고 적합한 정책을 추천하고 "
            "그 이유를 친절하고 명확하게 설명해주세요."
        )

        user_content = f"""
        [사용자 프로필]
        - 연령: 만 {user_profile.get('age', 29)}세
        - 연소득: {user_profile.get('annualIncome', 3200)}만원
        - 주거형태: {user_profile.get('housingType', '월세')}
        - 취업상태: {user_profile.get('employmentStatus', '미취업자')}
        - 학력: {user_profile.get('education', '대학 졸업')}
        - 거주지역: {user_profile.get('region', '서울특별시')}

        [후보 정책 데이터 (총 {len(candidate_policies)}건)]
        {candidate_policies[:5]}

        위 후보 정책 중 사용자가 최우선으로 신청해야 할 TOP 3 정책을 선정하고 매칭 스코어(0~100)와 분석 사유를 JSON으로 응답해주세요.
        """

        provider_norm = (provider or "Router API").upper()

        if provider_norm in ["ROUTER API", "OPENROUTER", "ROUTER"]:
            key = custom_api_key or self.openrouter_api_key
            client = AsyncOpenAI(
                api_key=key,
                base_url="https://openrouter.ai/api/v1"
            )
            response = await client.chat.completions.create(
                model=self.openrouter_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ]
            )
            return {"content": response.choices[0].message.content, "provider": "OpenRouter"}

        elif provider_norm == "OPENAI":
            key = custom_api_key or self.openai_api_key
            client = AsyncOpenAI(api_key=key)
            response = await client.chat.completions.create(
                model=self.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                temperature=0.3
            )
            return {"content": response.choices[0].message.content, "provider": "OPENAI"}

        elif provider_norm == "OLLAMA":
            endpoint = custom_api_key or self.ollama_base_url
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{endpoint}/api/generate",
                    json={
                        "model": self.ollama_model,
                        "prompt": f"{system_prompt}\n\n{user_content}",
                        "stream": False
                    },
                    timeout=30.0
                )
                data = resp.json()
                return {"content": data.get("response", ""), "provider": "OLLAMA"}

        return {"error": f"지원하지 않는 공급자입니다: {provider}"}

    def extract_keywords(
        self,
        title: str,
        content: str = "",
        category: str = "",
        custom_api_key: Optional[str] = None
    ) -> List[str]:
        """
        OpenRouter(기본: nvidia/nemotron-3-ultra-550b-a55b:free) 모델을 활용하여
        정책 내용에서 핵심 키워드 3개를 추출. API 호출 실패 시 지능형 룰 기반 Fallback 적용.
        """
        api_key = custom_api_key or self.openrouter_api_key

        if api_key and not api_key.startswith("sk-or-v1-your"):
            try:
                client = OpenAI(
                    api_key=api_key,
                    base_url="https://openrouter.ai/api/v1"
                )
                system_prompt = (
                    "당신은 대한민국 청년 정책 메타데이터 분류 전문가입니다.\n"
                    "주어진 청년 정책의 제목과 지원내용을 분석하여 검색 및 분류에 가장 유용한 핵심 키워드 딱 3개를 추출하세요.\n"
                    "반드시 JSON 배열 포맷(예: [\"월세지원\", \"주거안정\", \"무주택청년\"])으로만 응답하세요."
                )
                user_prompt = f"""
[정책명]: {title}
[카테고리]: {category}
[지원내용]: {content[:500]}

핵심 키워드 3개를 JSON 배열로 출력하세요:
"""
                resp = client.chat.completions.create(
                    model=self.openrouter_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.1
                )
                text = resp.choices[0].message.content.strip()
                match = re.search(r"\[[\s\S]*?\]", text)
                if match:
                    parsed = json.loads(match.group(0))
                    if isinstance(parsed, list) and len(parsed) >= 1:
                        clean_kws = [str(k).strip().replace("#", "") for k in parsed if str(k).strip()][:3]
                        if len(clean_kws) == 3:
                            return clean_kws
            except Exception:
                pass

        # Fallback 룰 기반 키워드 3개 추출
        return self._fallback_extract_keywords(title, content, category)

    def _fallback_extract_keywords(self, title: str, content: str = "", category: str = "") -> List[str]:
        """룰 기반으로 유의미한 청년 정책 키워드 3개 추출"""
        candidates = []
        combined = f"{title} {category} {content}".lower()

        keyword_pool = [
            ("월세", "월세지원"), ("전세", "전세보증"), ("주거", "주거안정"), ("임대", "공공임대"),
            ("취업", "취업지원"), ("구직", "구직활동"), ("인턴", "일경험인턴"), ("창업", "청년창업"),
            ("자산", "자산형성"), ("도약", "청년도약"), ("적금", "청년적금"), ("교통", "교통비지원"),
            ("패스", "K패스"), ("마음", "심리지원"), ("역량", "역량강화"), ("교육", "직업훈련"),
            ("학자금", "학자금지원"), ("문화", "문화예술"), ("소득세", "세제감면"), ("중소기업", "중소기업청년")
        ]

        for trigger, kw in keyword_pool:
            if trigger in combined and kw not in candidates:
                candidates.append(kw)
                if len(candidates) == 3:
                    return candidates

        # 제목 명사 기반 보충
        nouns = [w for w in re.sub(r"[^\w\s]", " ", title).split() if len(w) >= 2 and w not in ["청년", "지원", "사업", "안내"]]
        for n in nouns:
            if n not in candidates:
                candidates.append(n)
                if len(candidates) == 3:
                    return candidates

        default_fallbacks = ["청년지원", "생활안정", "맞춤혜택"]
        for df in default_fallbacks:
            if df not in candidates:
                candidates.append(df)
            if len(candidates) == 3:
                break

        return candidates[:3]

    def extract_news_keywords(
        self,
        title: str,
        content: str = "",
        policy_name: str = "",
        custom_api_key: Optional[str] = None,
        min_count: int = 5
    ) -> List[str]:
        """
        OpenRouter(기본: nvidia/nemotron-3-ultra-550b-a55b:free) 모델을 활용하여
        뉴스 기사 내용 및 관련 정책 정보를 정밀 분석하여 핵심 뉴스 키워드를 5개 이상 추출.
        API 호출 실패 시 지능형 룰 기반 Fallback 적용.
        """
        api_key = custom_api_key or self.openrouter_api_key

        if api_key and not api_key.startswith("sk-or-v1-your"):
            try:
                client = OpenAI(
                    api_key=api_key,
                    base_url="https://openrouter.ai/api/v1"
                )
                system_prompt = (
                    "당신은 대한민국 청년 정책 및 경제/시사 뉴스 전문 AI 분석관입니다.\n"
                    "주어진 뉴스 기사의 제목, 본문, 관련 정책명을 종합 분석하여 독자가 뉴스의 맥락을 즉시 파악할 수 있는 "
                    f"핵심 키워드를 반드시 {min_count}개 이상 (5~8개) 추출하세요.\n"
                    "반드시 JSON 배열 포맷(예: [\"청년도약계좌\", \"정부기여금\", \"비과세혜택\", \"자산형성\", \"시중은행금리\"])으로만 응답하세요."
                )
                user_prompt = f"""
[관련 정책명]: {policy_name}
[뉴스 기사 제목]: {title}
[뉴스 기사 본문]: {content[:1000]}

위 뉴스 기사를 대변하는 핵심 키워드 5개 이상을 JSON 배열로 출력하세요:
"""
                resp = client.chat.completions.create(
                    model=self.openrouter_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.1
                )
                text = resp.choices[0].message.content.strip()
                match = re.search(r"\[[\s\S]*?\]", text)
                if match:
                    parsed = json.loads(match.group(0))
                    if isinstance(parsed, list) and len(parsed) >= 1:
                        clean_kws = [str(k).strip().replace("#", "") for k in parsed if str(k).strip()]
                        if len(clean_kws) >= min_count:
                            return clean_kws[:8]
                        elif len(clean_kws) > 0:
                            # 5개 미만인 경우 룰 기반으로 보강
                            extra = self._fallback_extract_news_keywords(title, content, policy_name)
                            for ek in extra:
                                if ek not in clean_kws:
                                    clean_kws.append(ek)
                                if len(clean_kws) >= min_count:
                                    break
                            return clean_kws[:8]
            except Exception:
                pass

        # Fallback 룰 기반 뉴스 키워드 5개 이상 추출
        return self._fallback_extract_news_keywords(title, content, policy_name, min_count=min_count)

    def _fallback_extract_news_keywords(
        self,
        title: str,
        content: str = "",
        policy_name: str = "",
        min_count: int = 5
    ) -> List[str]:
        """룰 및 형태소 기반으로 유의미한 뉴스 키워드 5개 이상 추출"""
        candidates = []
        combined = f"{policy_name} {title} {content}".lower()

        # 도메인 사전 매칭
        keyword_pool = [
            ("도약계좌", "청년도약계좌"), ("기여금", "정부기여금"), ("비과세", "비과세혜택"), ("자산", "자산형성"),
            ("월세", "청년월세지원"), ("보증금", "보증금대출"), ("주거", "주거안정"), ("공공임대", "공공임대주택"),
            ("구직", "구직활동지원"), ("취업", "청년취업지원"), ("인턴", "일경험인턴십"), ("창업", "청년창업육성"),
            ("교통비", "K-패스교통비"), ("학자금", "학자금대출이자"), ("역량", "직무역량강화"), ("마음건강", "청년마음건강"),
            ("소득기준", "중위소득요건"), ("신청기간", "모집접수일정"), ("선발인원", "지원선발기준"), ("금리우대", "우대금리적용")
        ]

        # 1. 정책명 우선 삽입
        if policy_name:
            clean_pol = re.sub(r"\[.*?\]|\(.*?\)", "", policy_name).strip()
            if clean_pol and clean_pol not in candidates:
                candidates.append(clean_pol)

        # 2. 풀 매칭
        for trigger, kw in keyword_pool:
            if trigger in combined and kw not in candidates:
                candidates.append(kw)
                if len(candidates) >= min_count + 2:
                    return candidates[:min_count + 2]

        # 3. 제목 명사 추출
        nouns = [w for w in re.sub(r"[^\w\s]", " ", f"{title} {content[:200]}").split() if len(w) >= 2 and w not in ["청년", "지원", "사업", "안내", "뉴스", "기자", "보도", "지난", "이번", "따라", "관련", "위해"]]
        for n in nouns:
            if n not in candidates:
                candidates.append(n)
                if len(candidates) >= min_count + 2:
                    return candidates[:min_count + 2]

        # 4. 기본 폴백 키워드 추가로 5개 이상 보장
        defaults = ["청년정책동향", "맞춤수혜혜택", "정부지원사업", "온라인신청", "생활안정지원"]
        for df in defaults:
            if df not in candidates:
                candidates.append(df)
            if len(candidates) >= min_count:
                break

        return candidates[:max(min_count, len(candidates))]

