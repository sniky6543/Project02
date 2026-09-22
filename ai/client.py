import os
from typing import Dict, Any, List, Optional
import httpx
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

class LLMClient:
    """
    청년나침반 AI 추천 및 분석 엔진 클라이언트
    지원 공급자: OpenAI, Ollama, OpenRouter
    """
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY", "")
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    async def generate_recommendation(
        self,
        provider: str,
        user_profile: Dict[str, Any],
        candidate_policies: List[Dict[str, Any]],
        custom_api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        사용자 프로필과 후보 정책 목록을 기반으로 AI 맞춤 추천 및 이유 생성
        """
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

        if provider == "OPENAI":
            key = custom_api_key or self.openai_api_key
            client = AsyncOpenAI(api_key=key)
            response = await client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                temperature=0.3
            )
            return {"content": response.choices[0].message.content, "provider": "OPENAI"}

        elif provider == "OLLAMA":
            endpoint = custom_api_key or self.ollama_base_url
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{endpoint}/api/generate",
                    json={
                        "model": os.getenv("OLLAMA_MODEL", "qwen2.5:7b"),
                        "prompt": f"{system_prompt}\n\n{user_content}",
                        "stream": False
                    },
                    timeout=30.0
                )
                data = resp.json()
                return {"content": data.get("response", ""), "provider": "OLLAMA"}

        elif provider in ["Router API", "OPENRouter"]:
            key = custom_api_key or self.openrouter_api_key
            client = AsyncOpenAI(
                api_key=key,
                base_url="https://openrouter.ai/api/v1"
            )
            response = await client.chat.completions.create(
                model=os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ]
            )
            return {"content": response.choices[0].message.content, "provider": "OpenRouter"}

        return {"error": f"지원하지 않는 공급자입니다: {provider}"}
