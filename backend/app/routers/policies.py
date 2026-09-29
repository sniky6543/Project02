from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict, Any
from datetime import datetime, date

from app.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.policy import (
    PolicyCreate,
    PolicyListItem,
    PolicyDetail,
    PolicyListResponseData,
)
from app.crud import policy as policy_crud
from app.crud.user import DEFAULT_USER_ID

router = APIRouter()

# 3개의 기본 샘플 정책 (초기 DB 시딩용)
INITIAL_SEED_POLICIES = [
    {
        "id": "POL-2026-001",
        "title": "청년 월세 특별지원 (2차)",
        "organization": "국토교통부 / 한국토지주택공사(LH)",
        "category": "주거",
        "status": "상시모집",
        "period_start": date(2026, 1, 1),
        "period_end": date(2026, 12, 31),
        "benefit_summary": "월 최대 20만원 지원 (최장 12개월간 분할 지급, 총 240만원)",
        "benefit_amount": "월 최대 20만원 (최장 12개월)",
        "benefit_total_max": "240만원",
        "benefit_method": "매월 계좌 입금",
        "benefit_details": "실제 납부하는 월세 범위 내에서 최대 20만원까지 지원",
        "target_age": "만 19세 ~ 34세",
        "min_age": 19,
        "max_age": 34,
        "income_condition": "중위소득 60% 이하 (원가구 100% 이하)",
        "min_income": 0,
        "max_income": 3600,
        "residence_condition": "보증금 5천만원 이하 및 월세 70만원 이하 주택",
        "education_condition": "제한없음",
        "employment_condition": "제한없음",
        "special_criteria": "청년 1인가구",
        "application_url": "https://www.bokjiro.go.kr",
        "contact": "국토교통부 콜센터 (1600-0777)",
        "document_names": ["월세지원 신청서", "소득·재산 신고서", "임대차계약서 사본", "가족관계증명서"]
    },
    {
        "id": "POL-2026-002",
        "title": "청년전용 버팀목 전세자금대출",
        "organization": "주택도시보증공사(HUG) / 국토교통부",
        "category": "주거",
        "status": "상시모집",
        "period_start": date(2026, 1, 1),
        "period_end": None,
        "benefit_summary": "최대 2억원 한도 내 연 1.5%~2.7% 초저금리 전세자금 대출",
        "benefit_amount": "최대 2억원 이내",
        "benefit_total_max": "2억원",
        "benefit_method": "대출 실행 (은행)",
        "benefit_details": "연 1.5%~2.7% 초저금리 청년전용 전세보증금 대출",
        "target_age": "만 19세 ~ 34세",
        "min_age": 19,
        "max_age": 34,
        "income_condition": "부부합산 연소득 5,000만원 이하",
        "min_income": 0,
        "max_income": 5000,
        "residence_condition": "전국",
        "education_condition": "제한없음",
        "employment_condition": "재직자, 프리랜서, 사업자",
        "special_criteria": "무주택 청년",
        "application_url": "https://nhuf.molit.go.kr",
        "contact": "주택도시기금 콜센터 (1566-9009)",
        "document_names": ["신분증", "주민등록등본", "확정일자부 임대차계약서", "소득확인서류"]
    },
    {
        "id": "POL-2026-003",
        "title": "2026 청년도전지원사업 (도전 & 도전+)",
        "organization": "고용노동부",
        "category": "일자리",
        "status": "접수중",
        "period_start": date(2026, 1, 15),
        "period_end": date(2026, 10, 31),
        "benefit_summary": "맞춤형 취업역량 프로그램 참여 시 최대 300만원 참여수당 및 인센티브 지급",
        "benefit_amount": "프로그램 이수 시 50만원~300만원",
        "benefit_total_max": "300만원",
        "benefit_method": "프로그램 이수 후 참여수당 지급",
        "benefit_details": "단기/중장기 맞춤형 취업역량 강화 프로그램 제공 및 참여수당 지원",
        "target_age": "만 18세 ~ 34세",
        "min_age": 18,
        "max_age": 34,
        "income_condition": "제한없음",
        "min_income": 0,
        "max_income": None,
        "residence_condition": "전국",
        "education_condition": "제한없음",
        "employment_condition": "미취업자 (구직단념청년, 자립준비청년 등)",
        "special_criteria": "구직단념청년",
        "application_url": "https://www.work.go.kr",
        "contact": "고용노동부 고객상담센터 (1350)",
        "document_names": ["참여신청서", "구직문답서", "개인정보동의서"]
    }
]

async def ensure_initial_data(db: AsyncSession):
    """DB에 데이터가 없을 경우 기본 샘플 정책 3개를 자동 시딩합니다."""
    count = await policy_crud.count_policies(db)
    if count == 0:
        for p in INITIAL_SEED_POLICIES:
            p_create = PolicyCreate(**p)
            await policy_crud.upsert_policy(db, p_create)


@router.get("", summary="정책 목록 조회 및 다차원 필터링 (DB 연동)")
@router.get("/", summary="정책 목록 조회 및 다차원 필터링 (DB 연동)")
async def get_policies(
    keyword: Optional[str] = Query(None, description="검색 키워드 (제목, 내용, 주관기관)"),
    category: Optional[str] = Query(None, description="카테고리 필터"),
    region: Optional[str] = Query(None, description="지역 필터"),
    maritalStatus: Optional[str] = Query(None, description="혼인 여부"),
    age: Optional[int] = Query(None, description="청년 만 나이"),
    minIncome: Optional[int] = Query(0, description="연소득 최소값 (만원)"),
    maxIncome: Optional[int] = Query(None, description="연소득 최대값 (만원)"),
    education: Optional[str] = Query(None, description="학력 조건"),
    employment: Optional[str] = Query(None, description="취업 상태"),
    specialCriteria: Optional[str] = Query(None, description="특화 분야"),
    sortBy: Optional[str] = Query("latest", description="정렬 조건 (latest, popular, deadline, matchScore)"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    limit: int = Query(10, ge=1, le=100, description="페이지당 개수"),
    db: AsyncSession = Depends(get_db)
):
    """
    조건 필터 및 정렬 조건에 따른 정책 목록을 데이터베이스에서 페이징 조회합니다.
    """
    await ensure_initial_data(db)

    policies, total_count = await policy_crud.get_policies(
        db=db,
        keyword=keyword,
        category=category,
        region=region,
        age=age,
        min_income=minIncome,
        max_income=maxIncome,
        education=education,
        employment=employment,
        special_criteria=specialCriteria,
        sort_by=sortBy,
        page=page,
        limit=limit,
        user_id=DEFAULT_USER_ID
    )

    total_pages = (total_count + limit - 1) // limit if limit > 0 and total_count > 0 else 1

    return {
        "success": True,
        "statusCode": 200,
        "message": "정책 목록을 성공적으로 조회했습니다.",
        "data": {
            "totalCount": total_count,
            "currentPage": page,
            "totalPages": total_pages,
            "policies": policies
        },
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@router.get("/{policy_id}", summary="정책 상세 정보 조회 (DB 연동)")
async def get_policy_detail(
    policy_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    특정 정책의 상세 정보 및 구비 서류를 DB에서 조회하며 조회수를 1 증가시킵니다.
    """
    await ensure_initial_data(db)

    policy = await policy_crud.get_policy_by_id(db, policy_id=policy_id, user_id=DEFAULT_USER_ID)
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"정책 ID '{policy_id}'를 찾을 수 없습니다."
        )

    return {
        "success": True,
        "statusCode": 200,
        "message": "정책 상세 정보를 성공적으로 조회했습니다.",
        "data": policy,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@router.post("", summary="신규 정책 등록 또는 갱신 (Upsert)", status_code=status.HTTP_201_CREATED)
async def create_policy(
    policy_in: PolicyCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    정책 데이터를 DB에 등록(또는 ID 존재 시 업데이트)합니다.
    """
    try:
        saved = await policy_crud.upsert_policy(db, policy_in)
        return {
            "success": True,
            "statusCode": 201,
            "message": "정책이 성공적으로 저장되었습니다.",
            "data": {
                "id": saved.id,
                "title": saved.title,
                "category": saved.category
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"정책 저장 중 오류가 발생했습니다: {str(e)}"
        )
