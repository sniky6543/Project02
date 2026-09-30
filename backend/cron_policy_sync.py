import os
import sys
import asyncio
from datetime import datetime

# 콘솔 출력 utf-8 인코딩 설정
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# 프로젝트 경로 설정
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app.database import init_db, AsyncSessionLocal
from app.services.policy_collector import sync_policies_with_id_check

async def main():
    print("=" * 60)
    print(f"🚀 청년정책 API 자동 수집 및 중복 ID 확인 동기화 시작")
    print(f"⏰ 실행 시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # 테이블 초기화 확인
    await init_db()

    # 비동기 세션으로 동기화 실행
    async with AsyncSessionLocal() as session:
        result = await sync_policies_with_id_check(session=session)

    print("\n" + "=" * 60)
    print("📊 [실행 결과 보고서]")
    print(f"  • 상태: {'✅ 성공' if result.get('success') else '❌ 실패'}")
    print(f"  • API 호출 총 수집 건수: {result.get('total_fetched', 0)}건")
    print(f"  • 신규 DB 저장 건수: {result.get('newly_inserted', 0)}건")
    print(f"  • 기존 DB 중복 제외 건수: {result.get('skipped_duplicates', 0)}건")
    print(f"  • 소요 시간: {result.get('elapsed_seconds', 0):.2f}초")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
