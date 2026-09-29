from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.database import get_db
from app.schemas.user import UserProfileUpdateRequest
from app.crud import user as user_crud
from app.crud.user import DEFAULT_USER_ID

router = APIRouter()

@router.get("/me", summary="내 프로필 정보 조회 (DB 연동)")
async def get_my_profile(
    db: AsyncSession = Depends(get_db)
):
    """
    현재 사용자의 인적사항, 주거형태, 소득구간, 알림 설정 정보를 DB에서 조회합니다.
    """
    profile = await user_crud.get_user_profile(db, user_id=DEFAULT_USER_ID)
    return {
        "success": True,
        "statusCode": 200,
        "message": "프로필 정보를 성공적으로 조회했습니다.",
        "data": profile,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@router.put("/me", summary="프로필 정보 및 설정 업데이트 (DB 연동)")
async def update_my_profile(
    update_data: UserProfileUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    사용자의 소득, 주거계약 형태, AI 설정, 알림 수신 설정을 DB에 저장합니다.
    """
    updated_profile = await user_crud.update_user_profile(
        db=db,
        user_id=DEFAULT_USER_ID,
        update_data=update_data
    )
    return {
        "success": True,
        "statusCode": 200,
        "message": "프로필 정보가 성공적으로 수정되었습니다.",
        "data": updated_profile,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
