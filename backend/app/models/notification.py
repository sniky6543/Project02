from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class NotificationLog(Base):
    """
    알림/메시지 발송 기록 테이블 모델
    - NO (PK): 자동 증가 식별 번호
    - 발송방법: email, telegram 등
    - ID: 수신 대상 텔레그램 ID 또는 이메일 주소
    - 내용: 발송 메시지 본문
    - 발송시간: 발송 완료 일시
    """
    __tablename__ = "notification_logs"

    # 1. NO (Primary Key)
    no: Mapped[int] = mapped_column(
        Integer, 
        primary_key=True, 
        autoincrement=True, 
        comment="고유 발송 번호 (PK)"
    )

    # 2. 발송방법 (email / 텔레그램)
    send_method: Mapped[str] = mapped_column(
        String(20), 
        nullable=False, 
        index=True, 
        comment="발송 방법 (email / telegram)"
    )

    # 3. ID (텔레그램아이디 / email주소)
    recipient_id: Mapped[str] = mapped_column(
        String(255), 
        nullable=False, 
        index=True, 
        comment="수신자 식별자 (텔레그램 사용자 ID 또는 이메일 주소)"
    )

    # 4. 내용
    content: Mapped[str] = mapped_column(
        Text, 
        nullable=False, 
        comment="발송된 메시지 내용"
    )

    # 5. 발송시간
    sent_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        nullable=False, 
        index=True, 
        comment="발송 일시"
    )

    # 부가 관리 필드 (선택적)
    user_id: Mapped[Optional[str]] = mapped_column(
        String(50), 
        ForeignKey("users.id", ondelete="SET NULL"), 
        nullable=True, 
        comment="연계 사용자 ID (선택)"
    )
    policy_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True,
        comment="연계 정책 ID (선택)"
    )
    status: Mapped[str] = mapped_column(
        String(20), 
        default="SENT", 
        comment="발송 상태 (SENT, SUCCESS, FAILED, REGISTERED)"
    )

    # 사용자 테이블과의 관계 설정
    user = relationship("User", backref="notifications", lazy="selectin")

    __table_args__ = (
        Index("idx_notifications_method_sent", "send_method", "sent_at"),
        Index("idx_notifications_policy_id", "policy_id"),
        Index("idx_notifications_user_id", "user_id"),
    )
