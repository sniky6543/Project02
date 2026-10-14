import asyncio
import sys
import os

# UTF-8 출력 설정
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import AsyncSessionLocal
from app.models.unified_policy import UnifiedPolicy
from app.services.policy_collector import sync_policies_with_id_check
from sqlalchemy import select

async def run_diff_test():
    print("=" * 60)
    print("🧪 [테스트] API 정책 데이터 동기화 & 변경 감지/수정 검증")
    print("=" * 60)

    # 1. DB의 특정 정책 레코드 하나를 임의로 수정 (과거 데이터 상태로 시뮬레이션)
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(UnifiedPolicy).limit(1))
        policy = res.scalar_one_or_none()
        if not policy:
            print("❌ DB에 정책 데이터가 없습니다.")
            return
        
        target_id = policy.id
        old_title = policy.title
        print(f"🎯 테스트 대상 ID: {target_id}")
        print(f"   • 기존 DB 제목: {old_title}")
        
        policy.title = "[과거 변경 제목] " + old_title
        policy.organization = "[과거 임의 기관]"
        await session.commit()
        print("   • DB에 임의 과거 데이터 적용 (수정 감지 테스트 준비 완료)")

    # 2. 동기화 실행 (API에서 최신 데이터를 가져와 DB와 비교)
    print("\n🔄 sync_policies_with_id_check() 동기화 실행 중...")
    sync_result = await sync_policies_with_id_check()

    print("\n" + "=" * 60)
    print("📊 [동기화 실행 결과]")
    print(f"  • ✨ 신규 등록 건수 (INSERT) : {sync_result.get('newly_inserted')}건")
    print(f"  • 🔄 변경 수정 건수 (UPDATE) : {sync_result.get('updated_count')}건")
    print(f"  • ⏸️ 기존 유지 건수 (SKIP)   : {sync_result.get('unchanged_count')}건")
    print(f"  • 🔍 변경 감지 상세 내역     : {sync_result.get('updated_details')}")
    print("=" * 60)

    # 3. DB 확인
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(UnifiedPolicy).filter_by(id=target_id))
        updated_policy = res.scalar_one_or_none()
        print(f"\n🔍 동기화 후 DB 저장된 제목: {updated_policy.title}")
        print(f"🔍 동기화 후 DB 저장된 기관: {updated_policy.organization}")
        assert "[과거" not in updated_policy.title, "❌ 복구/수정 실패"
        print("🎉 ✅ [검증 성공] 변경된 데이터가 정상 감지되어 DB가 최신 API 데이터로 수정(UPDATE)되었습니다!")

if __name__ == "__main__":
    asyncio.run(run_diff_test())
