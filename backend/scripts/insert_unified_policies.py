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

new_policies = []
duplicate_ids = 0

for data in policies_data:
    policy_id = str(data.get("id") or data.get("plcyNo") or "")
    if not policy_id:
        continue

    exists = session.query(UnifiedPolicy).filter_by(id=policy_id).first()
    if exists:
        duplicate_ids += 1
        continue
    
    policy_obj = UnifiedPolicy(
        id=policy_id,
        source=data.get("source", "출처 불명"),
        title=data.get("title") or data.get("plcyNm") or "제목 없음",
        category=data.get("category") or data.get("lclsfNm") or "분류 없음",
        organization=data.get("organization") or data.get("sprvsnInstCdNm") or data.get("operInstCdNm") or "기관 불명",
        summary=data.get("summary") or data.get("plcyExplnCn") or "",
        support_content=data.get("support_content") or data.get("plcyExplnCn") or "",
        target_age=data.get("target_age") or f"{data.get('sprtTrgtMinAge', '')}~{data.get('sprtTrgtMaxAge', '')}",
        target_condition=data.get("target_condition") or data.get("prtcpntReqstEtcMatterCn") or "",
        apply_method=data.get("apply_method") or data.get("rqutUrldddr") or "",
        apply_url=data.get("apply_url") or data.get("rqutUrldddr") or "",
        period_sdate=data.get("period_sdate") or data.get("apply_period") or data.get("rqutPrdCn") or "",
        period_edate=data.get("period_edate") or data.get("business_period") or data.get("bizPrdCn") or ""
    )
    new_policies.append(policy_obj)

if new_policies:
    session.add_all(new_policies)
    session.commit()
    print(f"✅ 총 {len(new_policies)}건의 정책 데이터가 Supabase DB에 성공적으로 저장되었습니다.")
else:
    print("✅ 새로 추가할 정책 데이터가 없습니다. (모두 이미 DB에 존재함)")

if duplicate_ids > 0:
    print(f"⚠️ 중복된 ID로 인해 제외된 데이터: {duplicate_ids}건")

session.close()
