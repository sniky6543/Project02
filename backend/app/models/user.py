from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import String, Integer, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    birth_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    contact: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    region: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    education: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    employment_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    housing_type: Mapped[str] = mapped_column(String(20), default="월세")
    annual_income: Mapped[int] = mapped_column(Integer, default=0)  # 만원 단위
    ai_provider: Mapped[str] = mapped_column(String(50), default="OPENAI")
    telegram_account: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_telegram_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    is_email_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 북마크 관계 (1:N)
    bookmarks: Mapped[List["UserBookmark"]] = relationship(
        "UserBookmark",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )


class UserBookmark(Base):
    __tablename__ = "user_bookmarks"

    user_id: Mapped[str] = mapped_column(String(50), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    policy_id: Mapped[str] = mapped_column(String(50), ForeignKey("policies.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="bookmarks")
    policy: Mapped["Policy"] = relationship("Policy", lazy="selectin")
