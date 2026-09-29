import os
import sys
import json
import asyncio
import re
from datetime import datetime, date
from typing import Optional, Tuple

# 백엔드 루트를 sys.path에 추가하여 app 모듈 임포트 가능하도록 설정
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


from app.database import engine, AsyncSessionLocal, init_db
from app.models.policy import Policy, PolicyDocument
from app.crud.policy import upsert_policy
from app.schemas.policy import PolicyCreate

def parse_date(date_str: Optional[str]) -> Optional[date]:
    if not date_str:
        return None
    # 8자리 숫자 추출 (e.g., 20260922, 2026-09-22)
    cleaned = re.sub(r"[^0-9]", "", date_str)
    if len(cleaned) >= 8:
        try:
            return datetime.strptime(cleaned[:8], "%Y%m%d").date()
        except ValueError:
            return None
    return None

def parse_age(age_str: Optional[str]) -> Tuple[Optional[int], Optional[int]]:
    if not age_str:
        return None, None
    numbers = [int(n) for n in re.findall(r"\d+", age_str)]
    if len(numbers) >= 2:
        return min(numbers[0], numbers[1]), max(numbers[0], numbers[1])
    elif len(numbers) == 1:
        return numbers[0], None
    return None, None

def parse_period(period_str: Optional[str]) -> Tuple[Optional[date], Optional[date]]:
    if not period_str:
        return None, None
    dates = re.findall(r"\d{4}[-.]?\d{2}[-.]?\d{2}|\d{8}", period_str)
    start_d = parse_date(dates[0]) if len(dates) > 0 else None
    end_d = parse_date(dates[1]) if len(dates) > 1 else None
    return start_d, end_d

async def seed_policies_from_json(json_path: str):
    print(f"🚀 정책 데이터 DB 시딩 시작: {json_path}")
    
    if not os.path.exists(json_path):
        print(f"❌ 파일을 찾을 수 없습니다: {json_path}")
        return

    # 1. DB 테이블 초기화
    await init_db()

    # 2. JSON 데이터 로드
    with open(json_path, "r", encoding="utf-8") as f:
        items = json.load(f)

    if isinstance(items, dict):
        items = items.get("youthPolicyList", items.get("data", [items]))

    print(f"📦 총 {len(items)}개의 정책 데이터를 파싱하여 DB에 저장합니다...")

    async with AsyncSessionLocal() as session:
        success_count = 0
        for item in items:
            p_id = item.get("id") or f"POL-{success_count+1:04d}"
            title = item.get("title") or "제목 없음"
            org = item.get("organization") or "기관 미정"
            category = item.get("category", "기타").split(" > ")[0] if " > " in item.get("category", "") else item.get("category", "기타")
            summary = item.get("summary") or item.get("support_content") or title
            target_age = item.get("target_age")
            min_age, max_age = parse_age(target_age)
            
            # 기간 파싱
            b_period = item.get("business_period") or item.get("apply_period")
            p_start, p_end = parse_period(b_period)

            # 상태 판별
            raw_status = item.get("status") or "상시모집"
            if p_end and p_end < date.today():
                status = "마감"
            elif "진행" in raw_status or "접수" in raw_status:
                status = "접수중"
            else:
                status = "상시모집"

            policy_create = PolicyCreate(
                id=p_id,
                title=title,
                organization=org,
                category=category,
                status=status,
                period_start=p_start,
                period_end=p_end,
                benefit_summary=summary,
                benefit_details=item.get("support_content"),
                target_age=target_age,
                min_age=min_age,
                max_age=max_age,
                income_condition=item.get("target_condition"),
                residence_condition="전국",
                application_url=item.get("apply_url"),
                contact=item.get("apply_method"),
                document_names=["신분증 사본", "주민등록등본", "신청서"]
            )

            await upsert_policy(session, policy_create)
            success_count += 1
            if success_count % 20 == 0:
                print(f"  ... {success_count}/{len(items)}건 저장 완료")

    print(f"✨ 시딩 완료! 총 {success_count}건의 정책이 DB에 성공적으로 저장되었습니다.")

if __name__ == "__main__":
    default_path = os.path.join(backend_dir, "..", "db", "[2026.09.22 17시16분].json")
    target_file = sys.argv[1] if len(sys.argv) > 1 else default_path
    asyncio.run(seed_policies_from_json(os.path.normpath(target_file)))
