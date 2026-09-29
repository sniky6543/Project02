from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy import String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class AIRecommendationLog(Base):
    __tablename__ = "ai_recommendation_logs"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    user_id: Mapped[Optional[str]] = mapped_column(String(50), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_context: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    recommended_policies: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, nullable=False)
    ai_reasoning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
