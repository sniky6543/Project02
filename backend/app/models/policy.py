from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import String, Integer, Text, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Policy(Base):
    __tablename__ = "policies"

    # 기본 식별 및 정보
    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    organization: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(30), default="상시모집", index=True)
    
    # 모집 기간
    period_start: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    period_end: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # 지원 혜택
    benefit_summary: Mapped[str] = mapped_column(Text, nullable=False)
    benefit_amount: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    benefit_total_max: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    benefit_method: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    benefit_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # 지원 대상 및 자격 요건
    target_age: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    min_age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    income_condition: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    min_income: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    max_income: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    residence_condition: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    education_condition: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    employment_condition: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    special_criteria: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # 신청 및 문의
    application_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    contact: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # 생성 및 갱신 시각
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 1:N 관계 (구비 서류)
    documents: Mapped[List["PolicyDocument"]] = relationship(
        "PolicyDocument", 
        back_populates="policy", 
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    __table_args__ = (
        Index("idx_policies_category", "category"),
        Index("idx_policies_status", "status"),
        Index("idx_policies_age", "min_age", "max_age"),
        Index("idx_policies_income", "min_income", "max_income"),
    )


class PolicyDocument(Base):
    __tablename__ = "policy_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    policy_id: Mapped[str] = mapped_column(String(50), ForeignKey("policies.id", ondelete="CASCADE"), nullable=False)
    document_name: Mapped[str] = mapped_column(String(255), nullable=False)

    policy: Mapped["Policy"] = relationship("Policy", back_populates="documents")
