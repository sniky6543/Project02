import logging
from typing import Dict, Any, List
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.services.policy_collector import sync_policies_with_id_check

logger = logging.getLogger(__name__)

# 전역 비동기 스케줄러 인스턴스
scheduler = AsyncIOScheduler(timezone="Asia/Seoul")

async def scheduled_sync_job(job_label: str = "정기 스케줄러"):
    """스케줄러에 의해 주기적으로 실행되는 정책 수집 및 중복 체크 저장 작업"""
    logger.info(f"⏰ [{job_label}] 매일 정기 정책 API 수집 및 DB 동기화 작업을 시작합니다... ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})")
    result = await sync_policies_with_id_check()
    logger.info(f"🏁 [{job_label}] 작업 완료 결과: {result}")

def start_scheduler():
    """
    스케줄러 등록 및 시작:
    1. 매일 12:00 (정오)
    2. 매일 18:30 (오후 6시 30분)
    한국 표준시(KST: Asia/Seoul) 기준
    """
    if scheduler.running:
        logger.info("ℹ️ 스케줄러가 이미 실행 중입니다.")
        return

    # Job 1: 매일 12시 00분 실행
    scheduler.add_job(
        scheduled_sync_job,
        trigger=CronTrigger(hour=12, minute=0, timezone="Asia/Seoul"),
        id="policy_sync_12_00",
        name="매일 12:00 청년정책 API 수집 및 중복확인 DB 적재",
        kwargs={"job_label": "12:00 정기 동기화"},
        replace_existing=True
    )

    # Job 2: 매일 18시 30분 실행
    scheduler.add_job(
        scheduled_sync_job,
        trigger=CronTrigger(hour=18, minute=30, timezone="Asia/Seoul"),
        id="policy_sync_18_30",
        name="매일 18:30 청년정책 API 수집 및 중복확인 DB 적재",
        kwargs={"job_label": "18:30 정기 동기화"},
        replace_existing=True
    )

    scheduler.start()
    logger.info("🚀 [Scheduler] 정책 자동 수집 스케줄러 시작 완료 (매일 12:00 및 18:30 KST 자동 실행)")

def stop_scheduler():
    """스케줄러 종료"""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("🛑 [Scheduler] 스케줄러가 성공적으로 종료되었습니다.")

def get_scheduler_status() -> Dict[str, Any]:
    """현재 스케줄러의 등록된 작업 및 다음 실행 예정 시각 조회"""
    jobs_info: List[Dict[str, Any]] = []
    if scheduler.running:
        for job in scheduler.get_jobs():
            next_run = job.next_run_time.strftime("%Y-%m-%d %H:%M:%S %Z") if job.next_run_time else "없음"
            jobs_info.append({
                "id": job.id,
                "name": job.name,
                "next_run_time": next_run,
                "trigger": str(job.trigger)
            })

    return {
        "is_running": scheduler.running,
        "total_jobs": len(jobs_info),
        "jobs": jobs_info,
        "current_time_kst": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
