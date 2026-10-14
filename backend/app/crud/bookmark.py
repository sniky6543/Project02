from typing import Tuple, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete

from app.models.user import UserBookmark
from app.models.policy import Policy
from app.crud.user import get_or_create_default_user, DEFAULT_USER_ID
from app.schemas.notification import PolicyAlertApplyRequest

async def toggle_bookmark(
    db: AsyncSession,
    policy_id: str,
    user_id: str = DEFAULT_USER_ID,
    subscribe_alert: bool = False
) -> Tuple[bool, int]:
    # 유저 확인
    user = await get_or_create_default_user(db, user_id)

    # 기존 북마크 조회
    query = select(UserBookmark).where(
        UserBookmark.user_id == user_id,
        UserBookmark.policy_id == policy_id
    )
    result = await db.execute(query)
    bookmark = result.scalar_one_or_none()

    if bookmark:
        await db.delete(bookmark)
        is_bookmarked = False
    else:
        new_bookmark = UserBookmark(user_id=user_id, policy_id=policy_id)
        db.add(new_bookmark)
        is_bookmarked = True

    await db.commit()

    # 알람 신청 옵션이 켜져 있거나 관심 저장 시 알람 신청 처리
    if is_bookmarked and subscribe_alert:
        from app.crud.notification import apply_policy_alert
        try:
            await apply_policy_alert(
                db=db,
                request=PolicyAlertApplyRequest(
                    policyId=policy_id,
                    userId=user_id
                )
            )
        except Exception:
            pass

    # 전체 북마크 개수 계산
    count_query = select(func.count(UserBookmark.policy_id)).where(UserBookmark.user_id == user_id)
    total_count = (await db.execute(count_query)).scalar_one()

    return is_bookmarked, total_count

async def get_user_bookmarks(
    db: AsyncSession,
    user_id: str = DEFAULT_USER_ID
) -> List[Policy]:
    query = (
        select(Policy)
        .join(UserBookmark, Policy.id == UserBookmark.policy_id)
        .where(UserBookmark.user_id == user_id)
        .order_by(UserBookmark.created_at.desc())
    )
    result = await db.execute(query)
    return list(result.scalars().all())
