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

def fetch_all_existing_policies(supabase) -> dict:
    """Supabase에서 기존에 저장된 모든 정책을 페이지네이션으로 조회하여 id -> dict 맵 반환"""
    existing_map = {}
    page_size = 1000
    start = 0
    while True:
        try:
            res = supabase.table("policies").select("*").range(start, start + page_size - 1).execute()
            rows = res.data or []
            for r in rows:
                if r.get("id"):
                    existing_map[r["id"]] = r
            if len(rows) < page_size:
                break
            start += page_size
        except Exception as e:
            print(f"⚠️ 기존 정책 조회 중 일부 오류 (무시하고 계속): {e}")
            break
    return existing_map

def check_policy_diff(old: dict, new: dict) -> list:
    """기존 DB 데이터와 신규 API 데이터 간의 변경된 필드 목록 검출"""
    diffs = []
    compare_keys = [
        ("title", "title"),
        ("organization", "organization"),
        ("category", "category"),
        ("status", "status"),
        ("benefit_summary", "benefit_summary"),
        ("benefit_details", "benefit_details"),
        ("target_age", "target_age"),
        ("income_condition", "income_condition"),
        ("employment_condition", "employment_condition"),
        ("residence_condition", "residence_condition"),
        ("application_url", "application_url"),
        ("contact", "contact"),
    ]
    for old_k, new_k in compare_keys:
        old_val = str(old.get(old_k) or "").strip()
        new_val = str(new.get(new_k) or "").strip()
        if old_val != new_val:
            diffs.append(new_k)
    return diffs

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

    print(f"🔍 기존 Supabase DB 저장 현황 조회 중...")
    existing_map = fetch_all_existing_policies(supabase)
    print(f"   📊 현재 DB에 존재하는 정책 수: {len(existing_map)}건")

    normalized_items = [normalize_policy(item) for item in raw_items if item.get("id")]
    print(f"🚀 총 {len(normalized_items)}개의 정책 데이터를 분석하여 [1. 신규 등록] 및 [2. 변경 수정]을 진행합니다...")

    to_insert = []
    to_update = []
    unchanged_count = 0
    seen_ids = set()

    for item in normalized_items:
        p_id = item["id"]
        if p_id in seen_ids:
            continue
        seen_ids.add(p_id)

        # 1. DB에 없는 신규 공고번호: 신규 추가 (INSERT)
        if p_id not in existing_map:
            to_insert.append(item)
        else:
            # 2. DB에 이미 존재하는 공고번호: 변경 감지 후 수정 (UPDATE)
            existing = existing_map[p_id]
            diffs = check_policy_diff(existing, item)
            if diffs:
                to_update.append((item, diffs))
            else:
                unchanged_count += 1

    print(f"\n📊 [분류 결과]")
    print(f"  • ✨ 신규 등록 예정 (새 공고번호) : {len(to_insert)}건")
    print(f"  • 🔄 변경 수정 예정 (데이터 갱신) : {len(to_update)}건")
    print(f"  • ⏸️ 기존 동일 유지 (변경 없음)   : {unchanged_count}건")

    # 1. 신규 INSERT 실행
    insert_success = 0
    if to_insert:
        batch_size = 50
        print(f"\n📥 [신규 정책 일괄 등록 시작]...")
        for i in range(0, len(to_insert), batch_size):
            batch = to_insert[i:i + batch_size]
            try:
                supabase.table("policies").insert(batch).execute()
                insert_success += len(batch)
                print(f"   ⏳ 신규 등록 진행 중: {insert_success}/{len(to_insert)}건...")
            except Exception as e:
                print(f"   ⚠️ 신규 배치 등록 오류 ({i}~{i+len(batch)}): {e}")

    # 2. 변경 UPDATE 실행
    update_success = 0
    if to_update:
        print(f"\n🔄 [변경된 정책 데이터 업데이트 시작]...")
        for item, diffs in to_update:
            try:
                supabase.table("policies").update(item).eq("id", item["id"]).execute()
                update_success += 1
            except Exception as e:
                print(f"   ⚠️ 정책({item['id']}) 업데이트 실패: {e}")

    print("\n" + "=" * 60)
    print("🎉 [동기화 최종 결과 보고]")
    print(f"  • ✨ 신규 등록 완료 (INSERT) : {insert_success}건")
    print(f"  • 🔄 변경 수정 완료 (UPDATE) : {update_success}건")
    print(f"  • ⏸️ 변경 없음 유지 (SKIP)   : {unchanged_count}건")
    print(f"  • 📋 전체 처리 대상          : {len(normalized_items)}건")
    print("=" * 60)

if __name__ == "__main__":
    seed()

