from sqlalchemy import Column, String, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class UnifiedPolicy(Base):
    __tablename__ = 'unified_policies'

    # 필수 필드 (nullable=False)
    id = Column(String(100), primary_key=True)         # 고유 식별자 (예: ONTONG_2026...)
    source = Column(String(100), nullable=False)        # 원본 출처
    title = Column(Text, nullable=False)                # 정책 명칭
    category = Column(String(100), nullable=False)      # 카테고리
    organization = Column(String(150), nullable=False)  # 주관 부처
    summary = Column(Text, nullable=False)              # 1~2줄 요약

    # 선택 필드 (nullable=True)
    support_content = Column(Text, nullable=True)       # 구체적 지원 혜택
    target_age = Column(Text, nullable=True)            # 대상 연령
    target_condition = Column(Text, nullable=True)      # 자격 요건
    apply_method = Column(Text, nullable=True)          # 신청 방법 (장문 안내 포함)
    apply_url = Column(Text, nullable=True)             # 신청 페이지 URL
    period_sdate = Column(Text, nullable=True)          # 시작일
    period_edate = Column(Text, nullable=True)          # 종료일
