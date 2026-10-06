import os
import sys
import json
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
root_dir = os.path.dirname(backend_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from models import UnifiedPolicy, Base

load_dotenv(os.path.join(current_dir, ".env"))
load_dotenv(os.path.join(backend_dir, ".env"))
load_dotenv(os.path.join(root_dir, ".env"))

db_url = os.getenv("SUPABASE_URL") or os.getenv("DATABASE_URL")
if db_url:
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    if "@" in db_url and ":[" in db_url and "]@" in db_url:
        db_url = db_url.replace(":[", ":").replace("]@", "@")

print(f"🔗 Supabase DB 연결 중: {db_url}")
engine = create_engine(db_url)
Session = sessionmaker(bind=engine)
session = Session()

Base.metadata.create_all(engine)

candidate_paths = [
    os.path.join(root_dir, "db", "policy_news_integrated.json"),
    os.path.join(root_dir, "ai", "summarized_policies.json"),
    os.path.join(root_dir, "db", "seeds", "mock_policies.json"),
]

json_file_path = None
for path in candidate_paths:
    if os.path.exists(path):
        json_file_path = path
        break

if not json_file_path:
    print("❌ 삽입할 정책 JSON 파일(policy_news_integrated.json / summarized_policies.json)을 찾을 수 없습니다.")
    sys.exit(1)

with open(json_file_path, 'r', encoding='utf-8') as file:
    policies_data = json.load(file)
    if isinstance(policies_data, dict):
        policies_data = policies_data.get("youthPolicyList", policies_data.get("data", [policies_data]))
    print(f"📄 JSON 파일에서 {len(policies_data)}개의 정책 데이터를 성공적으로 읽었습니다. (경로: {json_file_path})")

# 1. 기존 DB에 저장된 정책 목록 조회 (ID -> 객체 매핑)
existing_policies = session.query(UnifiedPolicy).all()
existing_map = {p.id: p for p in existing_policies}
print(f"🔍 기존 DB에 저장된 정책 수: {len(existing_map)}건")

new_policies = []
updated_policies = []
unchanged_count = 0
seen_ids = set()

for data in policies_data:
    policy_id = str(data.get("id") or data.get("plcyNo") or "").strip()
    if not policy_id or policy_id in seen_ids:
        continue
    seen_ids.add(policy_id)

    src = data.get("source", "출처 불명")
    ttl = (data.get("title") or data.get("plcyNm") or "제목 없음").strip()
    cat = (data.get("category") or data.get("lclsfNm") or "분류 없음").strip()
    org = (data.get("organization") or data.get("sprvsnInstCdNm") or data.get("operInstCdNm") or "기관 불명").strip()
    smr = (data.get("summary") or data.get("plcyExplnCn") or "").strip()
    spt = (data.get("support_content") or data.get("plcyExplnCn") or "").strip()
    age = (data.get("target_age") or f"{data.get('sprtTrgtMinAge', '')}~{data.get('sprtTrgtMaxAge', '')}").strip()
    cnd = (data.get("target_condition") or data.get("prtcpntReqstEtcMatterCn") or "").strip()
    mth = (data.get("apply_method") or data.get("rqutUrldddr") or "").strip()
    url = (data.get("apply_url") or data.get("rqutUrldddr") or "").strip()
    sdt = (data.get("period_sdate") or data.get("apply_period") or data.get("rqutPrdCn") or "").strip()
    edt = (data.get("period_edate") or data.get("business_period") or data.get("bizPrdCn") or "").strip()

    # [규칙 1] DB에 없는 신규 공고번호: 신규 등록
    if policy_id not in existing_map:
        policy_obj = UnifiedPolicy(
            id=policy_id,
            source=src,
            title=ttl,
            category=cat,
            organization=org,
            summary=smr,
            support_content=spt,
            target_age=age,
            target_condition=cnd,
            apply_method=mth,
            apply_url=url,
            period_sdate=sdt,
            period_edate=edt
        )
        new_policies.append(policy_obj)
        existing_map[policy_id] = policy_obj
    else:
        # [규칙 2] DB에 이미 존재하는 공고: 필드 변경 확인 및 수정 (UPDATE)
        existing_obj = existing_map[policy_id]
        diff_fields = []

        if (existing_obj.title or "").strip() != ttl:
            diff_fields.append("title")
            existing_obj.title = ttl
        if (existing_obj.category or "").strip() != cat:
            diff_fields.append("category")
            existing_obj.category = cat
        if (existing_obj.organization or "").strip() != org:
            diff_fields.append("organization")
            existing_obj.organization = org
        if (existing_obj.summary or "").strip() != smr:
            diff_fields.append("summary")
            existing_obj.summary = smr
        if (existing_obj.support_content or "").strip() != spt:
            diff_fields.append("support_content")
            existing_obj.support_content = spt
        if (existing_obj.target_age or "").strip() != age:
            diff_fields.append("target_age")
            existing_obj.target_age = age
        if (existing_obj.target_condition or "").strip() != cnd:
            diff_fields.append("target_condition")
            existing_obj.target_condition = cnd
        if (existing_obj.apply_method or "").strip() != mth:
            diff_fields.append("apply_method")
            existing_obj.apply_method = mth
        if (existing_obj.apply_url or "").strip() != url:
            diff_fields.append("apply_url")
            existing_obj.apply_url = url
        if (existing_obj.period_sdate or "").strip() != sdt:
            diff_fields.append("period_sdate")
            existing_obj.period_sdate = sdt
        if (existing_obj.period_edate or "").strip() != edt:
            diff_fields.append("period_edate")
            existing_obj.period_edate = edt

        if diff_fields:
            updated_policies.append((policy_id, ttl, diff_fields))
        else:
            unchanged_count += 1

if new_policies:
    session.add_all(new_policies)

session.commit()

print("\n" + "=" * 60)
print("🎉 [정책 DB 동기화 완료 보고]")
print(f"  • ✨ 신규 등록 완료 (INSERT) : {len(new_policies)}건 (중복 ID 저장 방지)")
print(f"  • 🔄 변경 수정 완료 (UPDATE) : {len(updated_policies)}건 (변경된 필드 자동 수정)")
print(f"  • ⏸️ 변경 없음 유지 (SKIP)   : {unchanged_count}건")
print(f"  • 📋 총 검토 공고 수         : {len(policies_data)}건")
print("=" * 60)

if updated_policies:
    print(f"\n🔄 [수정된 공고 샘플 (상위 5건)]:")
    for pid, pttl, fields in updated_policies[:5]:
        print(f"  - [{pid}] {pttl} (수정 필드: {', '.join(fields)})")

session.close()
