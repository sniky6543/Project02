from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.database import get_db
from app.schemas.bookmark import BookmarkToggleRequest
from app.crud import bookmark as bookmark_crud
from app.crud.policy import format_policy_list_item
from app.crud.user import DEFAULT_USER_ID

router = APIRouter()

@router.post("/toggle", summary="관심 정책 북마크 토글 (저장 / 해제)")
async def toggle_bookmark(
    request: BookmarkToggleRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    특정 정책의 북마크 상태를 반전시키고 저장합니다.
    """
    is_bookmarked, total_count = await bookmark_crud.toggle_bookmark(
        db=db,
        policy_id=request.policyId,
        user_id=DEFAULT_USER_ID
    )
    return {
        "success": True,
        "statusCode": 200,
        "message": "북마크 상태가 성공적으로 변경되었습니다.",
        "data": {
            "policyId": request.policyId,
            "isBookmarked": is_bookmarked,
            "totalBookmarkedCount": total_count
        },
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@router.get("", summary="내 관심 정책 북마크 목록 조회")
@router.get("/", summary="내 관심 정책 북마크 목록 조회")
async def get_bookmarks(
    db: AsyncSession = Depends(get_db)
):
    """
    현재 사용자가 북마크한 모든 정책 목록을 조회합니다.
    """
    policies = await bookmark_crud.get_user_bookmarks(db, user_id=DEFAULT_USER_ID)
    items = [format_policy_list_item(p, is_bookmarked=True) for p in policies]
    
    return {
        "success": True,
        "statusCode": 200,
        "message": "북마크 목록을 성공적으로 조회했습니다.",
        "data": {
            "totalCount": len(items),
            "policies": items
        },
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
