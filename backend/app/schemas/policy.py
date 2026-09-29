from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import date, datetime

# 1. DB 직접 저장 / 생성용 스키마
class PolicyCreate(BaseModel):
    id: str
    title: str
    organization: str
    category: str
    status: Optional[str] = "상시모집"
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    benefit_summary: str
    benefit_amount: Optional[str] = None
    benefit_total_max: Optional[str] = None
    benefit_method: Optional[str] = None
    benefit_details: Optional[str] = None
    target_age: Optional[str] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    income_condition: Optional[str] = None
    min_income: Optional[int] = 0
    max_income: Optional[int] = None
    residence_condition: Optional[str] = None
    education_condition: Optional[str] = None
    employment_condition: Optional[str] = None
    special_criteria: Optional[str] = None
    application_url: Optional[str] = None
    contact: Optional[str] = None
    document_names: Optional[List[str]] = []

class PolicyUpdate(BaseModel):
    title: Optional[str] = None
    organization: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    benefit_summary: Optional[str] = None
    benefit_amount: Optional[str] = None
    benefit_total_max: Optional[str] = None
    benefit_method: Optional[str] = None
    benefit_details: Optional[str] = None
    target_age: Optional[str] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    income_condition: Optional[str] = None
    min_income: Optional[int] = None
    max_income: Optional[int] = None
    residence_condition: Optional[str] = None
    education_condition: Optional[str] = None
    employment_condition: Optional[str] = None
    special_criteria: Optional[str] = None
    application_url: Optional[str] = None
    contact: Optional[str] = None
    document_names: Optional[List[str]] = None

# 2. 프론트엔드 API 반환용 스키마 (API 명세서 v1.0 준수)
class PolicyListItem(BaseModel):
    id: str
    title: str
    organization: str
    category: str
    categoryBadgeColor: Optional[str] = "blue"
    status: str
    dDay: Optional[str] = None
    benefitSummary: str
    targetAge: Optional[str] = None
    incomeCondition: Optional[str] = None
    employmentCondition: Optional[str] = None
    matchScore: Optional[int] = 90
    viewCount: int = 0
    isBookmarked: bool = False

    model_config = ConfigDict(from_attributes=True)

class PolicyBenefitDetail(BaseModel):
    amount: Optional[str] = None
    totalMax: Optional[str] = None
    method: Optional[str] = None
    details: Optional[str] = None

class PolicyEligibilityDetail(BaseModel):
    age: Optional[str] = None
    income: Optional[str] = None
    residence: Optional[str] = None
    restrictions: Optional[str] = None

class PolicyDetail(BaseModel):
    id: str
    title: str
    organization: str
    category: str
    status: str
    period: Optional[str] = None
    benefit: PolicyBenefitDetail
    eligibility: PolicyEligibilityDetail
    documents: List[str] = []
    applicationUrl: Optional[str] = None
    contact: Optional[str] = None
    matchScore: Optional[int] = 90
    aiMatchReason: Optional[str] = None
    viewCount: int = 0
    isBookmarked: bool = False

    model_config = ConfigDict(from_attributes=True)

class PolicyListResponseData(BaseModel):
    totalCount: int
    currentPage: int
    totalPages: int
    policies: List[PolicyListItem]
