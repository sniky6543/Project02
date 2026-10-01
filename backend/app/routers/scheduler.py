from fastapi import APIRouter, Depends, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.database import get_db
from app.services.scheduler import get_scheduler_status
from app.services.policy_collector import sync_policies_with_id_check

router = APIRouter()

@router.get("/status", summary="스케줄러 상태 및 다음 실행 예정 시각 조회")
async def get_status():
    """
    매일 12:00, 18:30에 등록된 정책 자동 수집 스케줄러의 현재 동작 상태와 
    다음 실행 예정 시각(Next Run Time)을 반환합니다.
    """
    status_data = get_scheduler_status()
    return {
        "success": True,
        "statusCode": 200,
        "message": "스케줄러 상태를 성공적으로 조회했습니다.",
        "data": status_data,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@router.post("/sync-now", summary="정책 API 즉시 호출 및 없는 ID DB 저장 실행 (수동 트리거)")
async def trigger_sync_now(
    db: AsyncSession = Depends(get_db)
):
    """
    정기 스케줄(12:00, 18:30) 외에 즉시 API를 호출하여 
    DB에 없는 새로운 정책 ID만 필터링하여 DB에 저장합니다.
    """
    result = await sync_policies_with_id_check(session=db)
    return {
        "success": result.get("success", True),
        "statusCode": 200 if result.get("success") else 500,
        "message": result.get("message", "동기화 완료"),
        "data": result,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
