import re
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, desc, asc
from sqlalchemy.orm import selectinload

from app.models.policy import Policy, PolicyDocument
from app.models.user import UserBookmark
from app.schemas.policy import PolicyCreate, PolicyUpdate, PolicyListItem, PolicyDetail, PolicyBenefitDetail, PolicyEligibilityDetail

def get_badge_color(category: str) -> str:
    mapping = {
        "주거": "rose",
        "일자리": "amber",
        "금융": "blue",
        "금융·복지·문화": "blue",
        "교육·직업훈련": "emerald",
        "참여·기반": "purple"
    }
    for k, v in mapping.items():
        if k in category:
            return v
    return "indigo"

def calculate_d_day(end_date: Optional[date]) -> Optional[str]:
    if not end_date:
        return None
    today = date.today()
    delta = (end_date - today).days
    if delta < 0:
        return "마감"
    elif delta == 0:
        return "D-Day"
    elif delta <= 30:
        return f"D-{delta}"
    return None

def format_policy_list_item(policy: Policy, is_bookmarked: bool = False) -> PolicyListItem:
    return PolicyListItem(
        id=policy.id,
        title=policy.title,
        organization=policy.organization,
        category=policy.category,
        categoryBadgeColor=get_badge_color(policy.category),
        status=policy.status or "상시모집",
        dDay=calculate_d_day(policy.period_end),
        benefitSummary=policy.benefit_summary,
        targetAge=policy.target_age or (f"만 {policy.min_age}세 ~ {policy.max_age}세" if policy.min_age and policy.max_age else "제한없음"),
        incomeCondition=policy.income_condition or "제한없음",
        employmentCondition=policy.employment_condition or "제한없음",
        matchScore=90,
        viewCount=policy.view_count,
        isBookmarked=is_bookmarked
    )

def format_policy_detail(policy: Policy, is_bookmarked: bool = False) -> PolicyDetail:
    period_str = "상시 접수"
    if policy.period_start and policy.period_end:
        period_str = f"{policy.period_start.strftime('%Y.%m.%d')} ~ {policy.period_end.strftime('%Y.%m.%d')}"
    elif policy.period_end:
        period_str = f"~ {policy.period_end.strftime('%Y.%m.%d')}"

    return PolicyDetail(
        id=policy.id,
        title=policy.title,
        organization=policy.organization,
        category=policy.category,
        status=policy.status or "상시모집",
        period=period_str,
        benefit=PolicyBenefitDetail(
            amount=policy.benefit_amount,
            totalMax=policy.benefit_total_max,
            method=policy.benefit_method,
            details=policy.benefit_details or policy.benefit_summary
        ),
        eligibility=PolicyEligibilityDetail(
            age=policy.target_age or (f"만 {policy.min_age}세 ~ {policy.max_age}세" if policy.min_age and policy.max_age else "제한없음"),
            income=policy.income_condition or "제한없음",
            residence=policy.residence_condition or "전국",
            restrictions=policy.special_criteria or "없음"
        ),
        documents=[d.document_name for d in policy.documents] if policy.documents else ["신분증", "주민등록등본"],
        applicationUrl=policy.application_url,
        contact=policy.contact,
        matchScore=95,
        aiMatchReason=f"{policy.category} 분야에서 청년 대상 혜택을 제공하는 주요 지원 정책입니다.",
        viewCount=policy.view_count,
        isBookmarked=is_bookmarked
    )


# 1. 다차원 필터링 및 페이징 목록 조회
async def get_policies(
    db: AsyncSession,
    keyword: Optional[str] = None,
    category: Optional[str] = None,
    region: Optional[str] = None,
    age: Optional[int] = None,
    min_income: Optional[int] = None,
    max_income: Optional[int] = None,
    education: Optional[str] = None,
    employment: Optional[str] = None,
    special_criteria: Optional[str] = None,
    sort_by: Optional[str] = "latest",
    page: int = 1,
    limit: int = 10,
    user_id: Optional[str] = None
) -> Tuple[List[PolicyListItem], int]:
    query = select(Policy)
    
    conditions = []
    
    if keyword:
        conditions.append(
            or_(
                Policy.title.ilike(f"%{keyword}%"),
                Policy.benefit_summary.ilike(f"%{keyword}%"),
                Policy.organization.ilike(f"%{keyword}%")
            )
        )
        
    if category and category != "전체":
        conditions.append(Policy.category.ilike(f"%{category}%"))
        
    if region and region != "전국":
        conditions.append(
            or_(
                Policy.residence_condition.ilike(f"%{region}%"),
                Policy.organization.ilike(f"%{region}%"),
                Policy.residence_condition.ilike("%전국%"),
                Policy.residence_condition.is_(None)
            )
        )

    if age is not None:
        conditions.append(
            and_(
                or_(Policy.min_age.is_(None), Policy.min_age <= age),
                or_(Policy.max_age.is_(None), Policy.max_age >= age)
            )
        )

    if max_income is not None and max_income > 0:
        conditions.append(
            or_(Policy.max_income.is_(None), Policy.max_income >= max_income)
        )

    if education and education != "제한없음":
        conditions.append(
            or_(
                Policy.education_condition.ilike(f"%{education}%"),
                Policy.education_condition.is_(None),
                Policy.education_condition.ilike("%제한없음%")
            )
        )

    if employment and employment != "제한없음":
        conditions.append(
            or_(
                Policy.employment_condition.ilike(f"%{employment}%"),
                Policy.employment_condition.is_(None),
                Policy.employment_condition.ilike("%제한없음%")
            )
        )

    if special_criteria and special_criteria != "제한없음":
        conditions.append(
            or_(
                Policy.special_criteria.ilike(f"%{special_criteria}%"),
                Policy.special_criteria.is_(None)
            )
        )

    if conditions:
        query = query.where(and_(*conditions))

    # 전체 개수
    count_query = select(func.count()).select_from(query.subquery())
    total_count = (await db.execute(count_query)).scalar_one()

    # 정렬 조건
    if sort_by == "popular":
        query = query.order_by(desc(Policy.view_count), desc(Policy.created_at))
    elif sort_by == "deadline":
        # 마감일 있는 것 우선 오름차순
        query = query.order_by(asc(Policy.period_end).nulls_last(), desc(Policy.created_at))
    else:  # latest or matchScore
        query = query.order_by(desc(Policy.created_at))

    # 페이징
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    policies = result.scalars().all()

    # 북마크 여부 확인
    bookmarked_ids = set()
    if user_id:
        bm_result = await db.execute(
            select(UserBookmark.policy_id).where(UserBookmark.user_id == user_id)
        )
        bookmarked_ids = set(bm_result.scalars().all())

    items = [format_policy_list_item(p, is_bookmarked=(p.id in bookmarked_ids)) for p in policies]
    return items, total_count


# 2. 정책 상세 조회 (조회수 1 증가)
async def get_policy_by_id(db: AsyncSession, policy_id: str, user_id: Optional[str] = None) -> Optional[PolicyDetail]:
    result = await db.execute(
        select(Policy).options(selectinload(Policy.documents)).where(Policy.id == policy_id)
    )
    policy = result.scalar_one_or_none()
    if not policy:
        return None

    # 조회수 증가
    policy.view_count += 1
    await db.commit()

    # 북마크 여부
    is_bookmarked = False
    if user_id:
        bm_result = await db.execute(
            select(UserBookmark).where(UserBookmark.user_id == user_id, UserBookmark.policy_id == policy_id)
        )
        is_bookmarked = bm_result.scalar_one_or_none() is not None

    return format_policy_detail(policy, is_bookmarked=is_bookmarked)


# 3. 단건 저장 / Upsert
async def upsert_policy(db: AsyncSession, policy_in: PolicyCreate) -> Policy:
    # 기존 정책 조회
    existing = (await db.execute(select(Policy).where(Policy.id == policy_in.id))).scalar_one_or_none()

    policy_data = policy_in.model_dump(exclude={"document_names"})
    if existing:
        for k, v in policy_data.items():
            setattr(existing, k, v)
        policy_obj = existing
    else:
        policy_obj = Policy(**policy_data)
        db.add(policy_obj)

    # 구비 서류 동기화
    if policy_in.document_names is not None:
        # 기존 서류 삭제 후 추가
        await db.execute(PolicyDocument.__table__.delete().where(PolicyDocument.policy_id == policy_in.id))
        for doc_name in policy_in.document_names:
            db.add(PolicyDocument(policy_id=policy_in.id, document_name=doc_name))

    await db.commit()
    await db.refresh(policy_obj)
    return policy_obj


# 4. 벌크 저장 / Upsert (대량 적재용)
async def bulk_upsert_policies(db: AsyncSession, policies_list: List[Dict[str, Any]]) -> int:
    count = 0
    for data in policies_list:
        p_id = data["id"]
        existing = (await db.execute(select(Policy).where(Policy.id == p_id))).scalar_one_or_none()
        if existing:
            for k, v in data.items():
                if k != "id":
                    setattr(existing, k, v)
        else:
            db.add(Policy(**data))
        count += 1

    await db.commit()
    return count


# 5. 총 정책 개수 조회
async def count_policies(db: AsyncSession) -> int:
    result = await db.execute(select(func.count(Policy.id)))
    return result.scalar_one()
