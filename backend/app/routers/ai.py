"""
ai.py
================================================================================
청년나침반 (Youth Compass) AI 맞춤 추천 및 정책 Q&A 라우터
(docs/api_spec.md 섹션 3 표준 규격 구현)
================================================================================
"""

import sys
import os
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# 프로젝트 루트 경로를 sys.path에 추가하여 ai.pipeline 임포트 지원
router_dir = Path(__file__).resolve().parent
project_root = router_dir.parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from ai.pipeline.RAG_pipeline import PolicyRAGPipeline

router = APIRouter()

# RAG 파이프라인 싱글톤 인스턴스 (메모리 절약 및 인덱스 재사용)
_rag_pipeline_instance: Optional[PolicyRAGPipeline] = None

def get_rag_pipeline() -> PolicyRAGPipeline:
    global _rag_pipeline_instance
    if _rag_pipeline_instance is None:
        _rag_pipeline_instance = PolicyRAGPipeline()
    return _rag_pipeline_instance


# ==============================================================================
# Pydantic Schemas (api_spec.md 규격)
# ==============================================================================
class UserProfileSchema(BaseModel):
    age: Optional[int] = Field(26, description="청년 만 나이")
    gender: Optional[str] = Field("청년", description="성별 (남성, 여성, 기타)")
    region: Optional[str] = Field("서울특별시 관악구", description="거주 지역")
    lifeStage: Optional[str] = Field("사회초년생/취업준비생", description="생애 단계 (대학생, 취준생, 사회초년생 등)")
    housingType: Optional[str] = Field("월세", description="주거 형태 (자가, 전세, 월세, 기숙사, 부모님동거 등)")
    annualIncome: Optional[int] = Field(2400, description="연소득 (만원 단위, 없으면 0)")
    education: Optional[str] = Field("대학 졸업", description="최종 학력")
    employmentStatus: Optional[str] = Field("미취업자", description="취업 상태 (재직자, 미취업자, 프리랜서 등)")
    specialCriteria: Optional[List[str]] = Field(default_factory=lambda: ["청년 1인가구"], description="특화 조건")
    concernAreas: Optional[List[str]] = Field(default_factory=lambda: ["생활비", "자산형성", "일자리"], description="생애주기 핵심 관심 분야")
    userStory: Optional[str] = Field(None, description="현재 겪고 있는 가장 큰 생활 고민이나 바라는 점")


class RecommendationRequest(BaseModel):
    userProfile: UserProfileSchema
    preferredCategory: Optional[List[str]] = Field(default_factory=lambda: ["생활비", "자산형성", "일자리"], description="선호 정책 카테고리")
    aiModel: Optional[str] = Field("Router API", description="사용할 AI 모델 ('Router API' | 'OPENAI' | 'OLLAMA')")
    limit: Optional[int] = Field(3, ge=1, le=10, description="추천받을 정책 개수")


class ChatMessageSchema(BaseModel):
    role: str = Field(..., description="'user' | 'assistant'")
    content: str = Field(..., description="메시지 내용")


class ChatRequest(BaseModel):
    policyId: Optional[str] = Field(None, description="특정 정책 고유 ID (선택)")
    question: str = Field(..., min_length=2, description="청년 정책 관련 질문 내용")
    chatHistory: Optional[List[ChatMessageSchema]] = Field(default_factory=list, description="이전 대화 내역")
    aiModel: Optional[str] = Field("Router API", description="사용할 AI 모델")


# ==============================================================================
# Endpoints
# ==============================================================================
@router.post("/recommendations", summary="사용자 프로필 기반 AI 맞춤 정책 추천 생성")
async def generate_recommendations(req: RecommendationRequest):
    """
    사용자의 프로필 조건(소득, 주거, 학력, 취업상태 등)을 분석하여
    최적의 추천 정책 TOP 3~5와 매칭 이유, 우선순위 로드맵을 반환합니다.
    """
    try:
        pipeline = get_rag_pipeline()
        result = pipeline.match_policies(
            user_profile=req.userProfile.model_dump(),
            preferred_categories=req.preferredCategory,
            top_k=req.limit or 3,
            ai_model=req.aiModel
        )

        return {
            "success": True,
            "statusCode": 200,
            "message": "AI 맞춤 정책 추천이 성공적으로 생성되었습니다.",
            "data": result,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"reason": f"AI 추천 생성 중 오류가 발생했습니다: {str(e)}"}
        )


@router.post("/chat", summary="정책 Q&A 및 AI 어시스턴트 질의")
async def chat_with_policy_ai(req: ChatRequest):
    """
    특정 정책 또는 청년 지원 제도 전반에 대해 사용자가 질문하면 RAG 기반으로 답변을 생성합니다.
    """
    try:
        pipeline = get_rag_pipeline()
        history = [msg.model_dump() for msg in req.chatHistory] if req.chatHistory else None

        result = pipeline.answer_question(
            question=req.question,
            policy_id=req.policyId,
            chat_history=history,
            ai_model=req.aiModel
        )

        return {
            "success": True,
            "statusCode": 200,
            "message": "질문에 대한 AI 답변이 생성되었습니다.",
            "data": result,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"reason": f"AI 챗봇 질의 중 오류가 발생했습니다: {str(e)}"}
        )
