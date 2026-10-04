"""
policy_news_scheduler.py
================================================================================
[청년 정책 뉴스 자동 동기화 스케줄러]
실행 주기: 매일 오전 10:00 & 오후 19:00 (하루 2회 정기 자동 실행)

동작:
1. 매일 10:00 & 19:00 정각에 정책 DB 키워드 기반 뉴스 탐색 트리거
2. OpenRouter AI를 통해 3줄 요약 및 5개 이상 키워드 생성
3. Supabase 및 로컬 DB 영구 적재
4. 콘솔 및 로그 파일에 실행 이력 기록

실행 방법:
- 상시 실행 (데몬/백그라운드): python ai/policy_news_scheduler.py
- 즉시 1회 테스트 실행: python ai/policy_news_scheduler.py --run-now
================================================================================
"""

import os
import sys
import time
import logging
import argparse
from datetime import datetime, timedelta
from pathlib import Path

# 콘솔 인코딩 대응
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# 프로젝트 경로 설정
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
for p in [str(CURRENT_DIR), str(PROJECT_ROOT)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from ai.policy_news_sync import PolicyNewsSyncService

# 로깅 설정
LOG_DIR = PROJECT_ROOT / "logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = LOG_DIR / "policy_news_scheduler.log"

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_FILE, encoding="utf-8")
    ]
)
logger = logging.getLogger("PolicyNewsScheduler")


def run_scheduled_job(job_name: str = "정기 동기화"):
    """스케줄 작업 실행 래퍼"""
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    logger.info("=" * 70)
    logger.info(f"⏰ [스케줄러 작업 시작: {job_name}] 시각: {now_str}")
    logger.info("=" * 70)

    try:
        service = PolicyNewsSyncService()
        result = service.sync_news_for_all_policies()
        logger.info(f"🎉 [스케줄 작업 성공] 신규/갱신: {result.get('newly_processed')}건, 총 누적: {result.get('total_saved')}건")
    except Exception as e:
        logger.error(f"❌ [스케줄 작업 중 오류 발생]: {e}", exc_info=True)


def calculate_next_run() -> datetime:
    """다음 실행 시각 (10:00 또는 19:00) 계산"""
    now = datetime.now()
    today_10 = now.replace(hour=10, minute=0, second=0, microsecond=0)
    today_19 = now.replace(hour=19, minute=0, second=0, microsecond=0)

    if now < today_10:
        return today_10
    elif now < today_19:
        return today_19
    else:
        # 내일 오전 10시
        tomorrow = now + timedelta(days=1)
        return tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)


def start_scheduler_loop():
    """매일 10:00 & 19:00 정밀 스케줄 루프"""
    print("=" * 70)
    print("🚀 [청년나침반] 청년 정책 뉴스 자동 동기화 데몬 스케줄러 가동")
    print("⏰ 실행 주기: 매일 아침 10:00 / 저녁 19:00 (하루 2회 자동 갱신)")
    print(f"📄 로그 파일: {LOG_FILE}")
    print("=" * 70)

    last_executed_hour = -1

    while True:
        now = datetime.now()
        current_hour = now.hour
        current_minute = now.minute

        # 10시 정각 (10:00) 또는 19시 정각 (19:00) 체크 (동일 시간대 중복 실행 방지)
        is_target_time = (current_hour == 10 or current_hour == 19) and current_minute == 0

        if is_target_time and last_executed_hour != current_hour:
            slot_name = "아침 10시 정기 동기화" if current_hour == 10 else "저녁 7시 정기 동기화"
            logger.info(f"🔔 스케줄 알림: {slot_name} 시간 도달 -> 작업 실행")
            run_scheduled_job(slot_name)
            last_executed_hour = current_hour
            time.sleep(60)  # 동일 분 내 중복 실행 방지

        # 자정 초기화
        if current_hour == 0 and current_minute == 0:
            last_executed_hour = -1

        # 다음 예정 시각 안내 (매 시간 30분에 하트비트 로그)
        if current_minute == 30 and now.second == 0:
            next_run = calculate_next_run()
            logger.info(f"💓 [스케줄러 정상 대기 중] 다음 자동 동기화 예정 시각: {next_run.strftime('%Y-%m-%d %H:%M:%S')}")

        time.sleep(1)


def main():
    parser = argparse.ArgumentParser(description="청년 정책 뉴스 자동 수집 및 AI 요약 스케줄러")
    parser.add_argument("--run-now", action="store_true", help="스케줄 대기 없이 즉시 1회 동기화 실행 후 종료")
    args = parser.parse_args()

    if args.run_now:
        logger.info("👉 '--run-now' 옵션에 따라 즉시 1회 동기화를 실행합니다.")
        run_scheduled_job("즉시 수동 동기화")
        return

    start_scheduler_loop()


if __name__ == "__main__":
    main()
