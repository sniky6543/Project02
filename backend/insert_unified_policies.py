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

# 앞서 작성했던 통합 정책 모델을 불러옵니다 (models.py 등에 분리해 두었다고 가정)
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from models import UnifiedPolicy, Base

# 1. 환경변수 및 DB 연결 설정
load_dotenv(os.path.join(current_dir, ".env"))
load_dotenv(os.path.join(parent_dir, ".env"))

db_url = os.getenv("SUPABASE_URL") or os.getenv("DATABASE_URL")
if db_url:
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    if "@" in db_url and ":[" in db_url and "]@" in db_url:
        db_url = db_url.replace(":[", ":").replace("]@", "@")

print(f"🔗 DB 연결 설정: {db_url}")
engine = create_engine(db_url)
Session = sessionmaker(bind=engine)
session = Session()

# (참고) 만약 테이블이 아직 없다면 생성합니다.
Base.metadata.create_all(engine)

# 2. JSON 파일 읽기 (파일명은 실제 저장된 파일명으로 수정 필요)
# 파일명 예시: "[2026.09.22 17시16분].json"
candidate_paths = [
    os.path.join(current_dir, "[2026.09.22 17시16분].json"),
    os.path.join(parent_dir, "db", "[2026.09.22 17시16분].json"),
    os.path.join(current_dir, "db", "[2026.09.22 17시16분].json"),
    "[2026.09.22 17시16분].json",
]

json_file_path = None
for path in candidate_paths:
    if os.path.exists(path):
        json_file_path = path
        break

if not json_file_path:
    print("❌ '[2026.09.22 17시16분].json' 파일을 찾을 수 없습니다.")
    sys.exit(1)

try:
    with open(json_file_path, 'r', encoding='utf-8') as file:
        policies_data = json.load(file)
        if isinstance(policies_data, dict):
            policies_data = policies_data.get("youthPolicyList", policies_data.get("data", [policies_data]))
        print(f"📄 JSON 파일에서 {len(policies_data)}개의 정책 데이터를 성공적으로 읽었습니다.")
except FileNotFoundError:
    print(f"❌ '{json_file_path}' 파일을 찾을 수 없습니다.")
    sys.exit(1)

# 3. DB 저장을 위한 객체 리스트 생성
new_policies = []
duplicate_ids = 0

# 기존에 존재하는 ID 목록 한 번에 조회 (네트워크 최적화)
existing_ids = set(r[0] for r in session.query(UnifiedPolicy.id).all())

for data in policies_data:
    policy_id = str(data.get("id") or data.get("plcyNo") or "")
    if not policy_id:
        continue

    # 💡 실무 팁: 데이터 중복 삽입 방지 (이미 같은 ID가 DB에 있는지 확인)
    if policy_id in existing_ids:
        duplicate_ids += 1
        continue
    
    # 📝 스키마 문서(policy_data_schema.md)의 필드와 JSON 데이터 매핑
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
        keywords=data.get("keywords_str") or (", ".join(data.get("keywords")) if isinstance(data.get("keywords"), list) else data.get("keywords", "")),
        period_sdate=data.get("period_sdate") or data.get("apply_period") or data.get("rqutPrdCn") or "",
        period_edate=data.get("period_edate") or data.get("business_period") or data.get("bizPrdCn") or ""
    )
    new_policies.append(policy_obj)
    existing_ids.add(policy_id)

# 4. DB에 일괄 저장 (Bulk Insert)
if new_policies:
    # session.add_all()을 쓰면 수백/수천 건의 데이터를 한 번의 트랜잭션으로 빠르게 저장합니다.
    session.add_all(new_policies)
    session.commit()
    print(f"✅ 총 {len(new_policies)}건의 정책 데이터가 Supabase DB에 성공적으로 저장되었습니다.")
else:
    print("✅ 새로 추가할 정책 데이터가 없습니다. (모두 이미 DB에 존재함)")

if duplicate_ids > 0:
    print(f"⚠️ 중복된 ID로 인해 제외된 데이터: {duplicate_ids}건")

session.close()
