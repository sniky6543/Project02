from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.database import get_db
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    PolicyAlertApplyRequest
)
from app.crud import notification as notification_crud

router = APIRouter()

@router.get("", summary="알림 발송 내역 목록 조회")
@router.get("/", summary="알림 발송 내역 목록 조회")
async def get_notifications(
    send_method: Optional[str] = Query(None, description="발송방법 필터 (email / telegram)"),
    recipient_id: Optional[str] = Query(None, description="수신자 ID 필터"),
    user_id: Optional[str] = Query(None, description="사용자 ID 필터"),
    policy_id: Optional[str] = Query(None, description="정책 ID 필터"),
    limit: int = Query(50, ge=1, le=100, description="조회 개수"),
    offset: int = Query(0, ge=0, description="조회 시작 위치"),
    db: AsyncSession = Depends(get_db)
):
    """
    저장된 알림/메시지 발송 기록 목록을 조회합니다 (최신 발송순).
    """
    logs = await notification_crud.get_notification_logs(
        db=db,
        send_method=send_method,
        recipient_id=recipient_id,
        user_id=user_id,
        policy_id=policy_id,
        limit=limit,
        offset=offset
    )
    items = [NotificationResponse.model_validate(log) for log in logs]
    return {
        "success": True,
        "statusCode": 200,
        "message": "발송 내역 목록을 성공적으로 조회했습니다.",
        "data": {
            "totalCount": len(items),
            "items": items
        },
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@router.post("/apply", status_code=status.HTTP_201_CREATED, summary="정책 알람 신청 (정책 내용 + 등록 텔레그램ID/이메일 DB 저장)")
@router.post("/apply/", status_code=status.HTTP_201_CREATED, summary="정책 알람 신청 (정책 내용 + 등록 텔레그램ID/이메일 DB 저장)")
@router.post("/subscribe", status_code=status.HTTP_201_CREATED, summary="정책 알람 신청 (Alias)")
@router.post("/subscribe/", status_code=status.HTTP_201_CREATED, summary="정책 알람 신청 (Alias)")
async def apply_policy_alert(
    request: PolicyAlertApplyRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    특정 정책의 알람을 신청합니다:
    1. 사용자의 등록된 텔레그램 ID 또는 이메일을 DB에서 조회하고 (필요 시 신규 입력값으로 갱신),
    2. 신청한 정책의 상세 내용(제목, 혜택, 신청기간, 링크 등)을 DB에서 추출하여,
    3. 수신 채널(텔레그램 / 이메일)에 맞게 발송/알람 내역(notification_logs)을 DB에 즉시 등록합니다.
    """
    result = await notification_crud.apply_policy_alert(db=db, request=request)
    return {
        "success": True,
        "statusCode": 201,
        "message": result.message,
        "data": result,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@router.post("", status_code=status.HTTP_201_CREATED, summary="알림 발송 내역 직접 저장")
@router.post("/", status_code=status.HTTP_201_CREATED, summary="알림 발송 내역 직접 저장")
async def create_notification(
    request: NotificationCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    새로운 알림 발송 기록(email/텔레그램)을 DB에 저장합니다.
    policy_id 입력 시 정책 상세 내용이 자동으로 포맷팅됩니다.
    """
    created = await notification_crud.create_notification_log(db, request)
    return {
        "success": True,
        "statusCode": 201,
        "message": "발송 내역이 성공적으로 기록되었습니다.",
        "data": NotificationResponse.model_validate(created),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@router.get("/{no}", summary="특정 알림 발송 내역 상세 조회")
async def get_notification_detail(
    no: int,
    db: AsyncSession = Depends(get_db)
):
    """
    고유 식별 번호(NO)로 특정 알림 발송 내역의 상세 정보를 조회합니다.
    """
    log = await notification_crud.get_notification_by_no(db, no)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"NO가 {no}인 발송 내역을 찾을 수 없습니다."
        )
    return {
        "success": True,
        "statusCode": 200,
        "message": "발송 내역 상세 정보를 조회했습니다.",
        "data": NotificationResponse.model_validate(log),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
