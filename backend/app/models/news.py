from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class PolicyNews(Base):
    __tablename__ = "policy_news"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    policy_id: Mapped[Optional[str]] = mapped_column(String(50), ForeignKey("policies.id", ondelete="SET NULL"), nullable=True)
    policy_name: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    publisher: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    published_at: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    summary_3lines: Mapped[str] = mapped_column(Text, nullable=False)
    keywords: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # AI 추출 뉴스 핵심 키워드 5개 이상
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_policy_news_policy_id", "policy_id"),
        Index("idx_policy_news_keywords", "keywords"),
    )
