from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.notification import NotificationLog
from app.schemas.notification import NotificationCreate

async def create_notification_log(
    db: AsyncSession,
    data: NotificationCreate
) -> NotificationLog:
    """
    새로운 알림/메시지 발송 내역을 DB에 저장합니다.
    - send_method: email 또는 telegram
    - recipient_id: 텔레그램 ID 또는 이메일 주소
    - content: 발송 내용
    - sent_at: 발송 일시
    """
    notification = NotificationLog(
        send_method=data.send_method,
        recipient_id=data.recipient_id,
        content=data.content,
        user_id=data.user_id,
        status=data.status or "SENT",
        sent_at=data.sent_at or datetime.utcnow()
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification

async def get_notification_logs(
    db: AsyncSession,
    send_method: Optional[str] = None,
    recipient_id: Optional[str] = None,
    user_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[NotificationLog]:
    """
    저장된 알림 발송 기록 목록을 조회합니다 (최신 발송순 정렬).
    """
    stmt = select(NotificationLog).order_by(desc(NotificationLog.sent_at), desc(NotificationLog.no))

    if send_method:
        stmt = stmt.where(NotificationLog.send_method == send_method)
    if recipient_id:
        stmt = stmt.where(NotificationLog.recipient_id == recipient_id)
    if user_id:
        stmt = stmt.where(NotificationLog.user_id == user_id)

    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_notification_by_no(
    db: AsyncSession,
    no: int
) -> Optional[NotificationLog]:
    """
    고유 번호(NO, PK)로 특정 발송 내역을 조회합니다.
    """
    stmt = select(NotificationLog).where(NotificationLog.no == no)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
