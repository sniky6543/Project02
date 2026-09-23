from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
from datetime import datetime

router = APIRouter()

# 3개의 샘플 정책 데이터 정의 (API 명세 및 프론트엔드 규격 일치)
SAMPLE_POLICIES: List[Dict[str, Any]] = [
    {
        "id": "POL-2026-001",
        "title": "청년 월세 특별지원 (2차)",
        "organization": "국토교통부 / 한국토지주택공사(LH)",
        "category": "주거",
        "categoryBadgeColor": "rose",
        "status": "상시모집",
        "dDay": None,
        "benefitSummary": "월 최대 20만원 지원 (최장 12개월간 분할 지급, 총 240만원)",
        "targetAge": "만 19세 ~ 34세",
        "incomeCondition": "중위소득 60% 이하 (원가구 100% 이하)",
        "employmentCondition": "제한없음",
        "matchScore": 96,
        "viewCount": 18420,
        "isBookmarked": False
    },
    {
        "id": "POL-2026-002",
        "title": "청년전용 버팀목 전세자금대출",
        "organization": "주택도시보증공사(HUG) / 국토교통부",
        "category": "주거",
        "categoryBadgeColor": "blue",
        "status": "상시모집",
        "dDay": None,
        "benefitSummary": "최대 2억원 한도 내 연 1.5%~2.7% 초저금리 전세자금 대출",
        "targetAge": "만 19세 ~ 34세",
        "incomeCondition": "부부합산 연소득 5,000만원 이하",
        "employmentCondition": "재직자, 프리랜서, 사업자",
        "matchScore": 91,
        "viewCount": 14230,
        "isBookmarked": False
    },
    {
        "id": "POL-2026-003",
        "title": "2026 청년도전지원사업 (도전 & 도전+)",
        "organization": "고용노동부",
        "category": "일자리",
        "categoryBadgeColor": "amber",
        "status": "접수중",
        "dDay": "D-14",
        "benefitSummary": "맞춤형 취업역량 프로그램 참여 시 최대 300만원 참여수당 및 인센티브 지급",
        "targetAge": "만 18세 ~ 34세",
        "incomeCondition": "제한없음",
        "employmentCondition": "미취업자 (구직단념청년, 자립준비청년 등)",
        "matchScore": 88,
        "viewCount": 11200,
        "isBookmarked": True
    }
]

@router.get("", summary="정책 목록 조회 (샘플 3개 반환)")
@router.get("/", summary="정책 목록 조회 (샘플 3개 반환)")
async def get_policies(
    keyword: Optional[str] = Query(None, description="검색 키워드"),
    category: Optional[str] = Query(None, description="카테고리 필터"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    limit: int = Query(10, ge=1, le=100, description="페이지당 개수")
):
    """
    청년 정책 목록을 조회하며, 기본 샘플 정책 3개를 반환합니다.
    """
    return {
        "success": True,
        "statusCode": 200,
        "message": "정책 목록을 성공적으로 조회했습니다.",
        "data": {
            "totalCount": len(SAMPLE_POLICIES),
            "currentPage": page,
            "totalPages": 1,
            "policies": SAMPLE_POLICIES
        },
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
