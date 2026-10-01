from typing import Optional
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class UnifiedPolicy(Base):
    """
    온통청년 및 공공데이터포털 연동 통합 정책 테이블 모델
    """
    __tablename__ = 'unified_policies'

    # 필수 필드 (nullable=False)
    id: Mapped[str] = mapped_column(String(100), primary_key=True, comment="고유 식별자 (예: ONTONG_2026...)")
    source: Mapped[str] = mapped_column(String(100), nullable=False, comment="원본 출처")
    title: Mapped[str] = mapped_column(Text, nullable=False, comment="정책 명칭")
    category: Mapped[str] = mapped_column(String(100), nullable=False, comment="카테고리")
    organization: Mapped[str] = mapped_column(String(150), nullable=False, comment="주관 부처/기관")
    summary: Mapped[str] = mapped_column(Text, nullable=False, comment="1~2줄 요약")

    # 선택 필드 (nullable=True)
    support_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="구체적 지원 혜택")
    target_age: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="대상 연령")
    target_condition: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="자격 요건")
    apply_method: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="신청 방법")
    apply_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="신청 페이지 URL")
    period_sdate: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="시작일")
    period_edate: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="종료일")
