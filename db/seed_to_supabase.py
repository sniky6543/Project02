"""
Supabase Database Seeding Script
================================
이 스크립트는 db/[2026.09.22 17시16분].json 및 seeds/mock_policies.json의 정책 데이터를
Supabase 'policies' 테이블로 일괄 업로드(Upsert)합니다.

사용법:
  python db/seed_to_supabase.py
"""

import os
import re
import json
import glob
from pathlib import Path
from dotenv import load_dotenv

# 루트 .env 로드
root_env = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=root_env)

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

def parse_age(age_str: str):
    """'만 19세~34세' 형태에서 min_age, max_age 파싱"""
    if not age_str:
        return 19, 34
    numbers = [int(n) for n in re.findall(r'\d+', age_str)]
    if len(numbers) >= 2:
        return min(numbers), max(numbers)
    elif len(numbers) == 1:
        return numbers[0], 39
    return 19, 34

def normalize_policy(item: dict) -> dict:
    """크롤링 JSON / Mock JSON 항목을 DB policies 테이블 규격에 맞게 변환"""
    cat = item.get("category", "주거")
    if ">" in cat:
        # '교육･직업훈련 > 미래역량강화' -> '교육·직업훈련'
        main_cat = cat.split(">")[0].strip().replace("･", "·")
    else:
        main_cat = cat.strip().replace("･", "·")

    min_age, max_age = parse_age(item.get("target_age", ""))
    
    summary = item.get("summary") or item.get("benefit_summary") or item.get("title") or ""
    details = item.get("support_content") or item.get("benefit_details") or summary

    return {
        "id": item.get("id"),
        "title": item.get("title", ""),
        "organization": item.get("organization", "정부부처/지자체"),
        "category": main_cat,
        "status": item.get("status", "상시모집"),
        "benefit_summary": summary[:500],
        "benefit_details": details,
        "target_age": item.get("target_age") or f"만 {min_age}세 ~ {max_age}세",
        "min_age": min_age,
        "max_age": max_age,
        "income_condition": item.get("income_condition") or item.get("target_condition") or "제한없음",
        "employment_condition": item.get("employment_condition", "제한없음"),
        "residence_condition": item.get("residence_condition", "전국"),
        "application_url": item.get("apply_url") or item.get("application_url") or "https://www.youthcenter.go.kr",
        "contact": item.get("contact", "고객센터 문의"),
        "view_count": item.get("view_count", 0),
    }

def seed():
    if not SUPABASE_URL or not SUPABASE_KEY or "your-project" in SUPABASE_URL:
        print("❌ [오류] 유효한 SUPABASE_URL 또는 SUPABASE_KEY가 설정되지 않았습니다.")
        print("👉 .env 파일에 실제 Supabase 프로젝트 URL과 Key를 입력해주세요.")
        return

    try:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except ImportError:
        print("❌ 'supabase' 패키지가 필요합니다. (.venv\\Scripts\\pip install supabase)")
        return

    db_dir = Path(__file__).resolve().parent
    
    # 크롤링된 실데이터 JSON 찾기
    crawled_files = list(db_dir.glob("*.json"))
    target_file = None
    if crawled_files:
        target_file = crawled_files[0]
    else:
        target_file = db_dir / "seeds" / "mock_policies.json"

    if not target_file or not target_file.exists():
        print(f"❌ 시드 파일이 없습니다: {db_dir}")
        return

    print(f"📂 데이터 소스 파일: {target_file.name}")
    with open(target_file, "r", encoding="utf-8") as f:
        raw_items = json.load(f)

    print(f"🚀 총 {len(raw_items)}개의 정책 데이터를 변환하여 Supabase로 전송합니다...")
    
    success_count = 0
    batch_size = 50
    normalized_items = [normalize_policy(item) for item in raw_items if item.get("id")]

    for i in range(0, len(normalized_items), batch_size):
        batch = normalized_items[i:i + batch_size]
        try:
            supabase.table("policies").upsert(batch).execute()
            success_count += len(batch)
            print(f"   ⏳ {success_count}/{len(normalized_items)} 완료...")
        except Exception as e:
            print(f"   ⚠️ 배치 업로드 실패 ({i}~{i+len(batch)}): {e}")

    print(f"\n🎉 완료! 총 {success_count}개 정책 데이터가 Supabase DB에 성공적으로 저장되었습니다.")

if __name__ == "__main__":
    seed()
