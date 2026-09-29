# 🚀 Supabase 클라우드 DB 연동 및 JSON 데이터 일괄 적재 가이드

> **문서 버전:** v1.0  
> **대상 데이터:** [`db/[2026.09.22 17시16분].json`](file:///c:/Users/Donga/Project02/db/%5B2026.09.22%2017%EC%8B%9C16%EB%B6%84%5D.json) (254건)  
> **적용 모델:** [`models.py`](file:///c:/Users/Donga/Project02/backend/models.py) (`UnifiedPolicy`)  
> **실행 스크립트:** [`insert_unified_policies.py`](file:///c:/Users/Donga/Project02/backend/insert_unified_policies.py)  

---

## 1. 개요

본 문서는 수집된 청년 정책 JSON 파일([`db/[2026.09.22 17시16분].json`](file:///c:/Users/Donga/Project02/db/%5B2026.09.22%2017%EC%8B%9C16%EB%B6%84%5D.json))을 읽어 **SQLAlchemy ORM**을 통해 **Supabase PostgreSQL 클라우드 데이터베이스**의 `unified_policies` 테이블에 **중복 방지 및 대량 일괄 저장(Bulk Insert)**하는 전체 코드와 실행 방법을 설명합니다.

---

## 2. 파일 구성

```
backend/
├── models.py                   # UnifiedPolicy ORM 모델 정의
├── create_unified_policies_table.py  # 테이블 생성 스크립트
├── insert_unified_policies.py  # JSON -> Supabase DB 적재 스크립트
└── .env                        # SUPABASE_URL 및 환경 변수
```

---

## 3. ORM 모델 정의 (`backend/models.py`)

```python
from sqlalchemy import Column, String, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class UnifiedPolicy(Base):
    __tablename__ = 'unified_policies'

    # 필수 필드 (nullable=False)
    id = Column(String(100), primary_key=True)         # 고유 식별자 (예: ONTONG_2026...)
    source = Column(String(100), nullable=False)        # 원본 출처
    title = Column(Text, nullable=False)                # 정책 명칭
    category = Column(String(100), nullable=False)      # 카테고리
    organization = Column(String(150), nullable=False)  # 주관 부처
    summary = Column(Text, nullable=False)              # 1~2줄 요약

    # 선택 필드 (nullable=True)
    support_content = Column(Text, nullable=True)       # 구체적 지원 혜택
    target_age = Column(Text, nullable=True)            # 대상 연령
    target_condition = Column(Text, nullable=True)      # 자격 요건
    apply_method = Column(Text, nullable=True)          # 신청 방법 (장문 안내 포함)
    apply_url = Column(Text, nullable=True)             # 신청 페이지 URL
    period_sdate = Column(Text, nullable=True)          # 시작일
    period_edate = Column(Text, nullable=True)          # 종료일
```

---

## 4. DB 일괄 저장 코드 (`backend/insert_unified_policies.py`)

```python
import os
import sys
import json
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import UnifiedPolicy, Base

# 1. 환경변수 및 DB 연결 설정
load_dotenv()
db_url = os.getenv("SUPABASE_URL") or os.getenv("DATABASE_URL")
if db_url:
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")

engine = create_engine(db_url)
Session = sessionmaker(bind=engine)
session = Session()

# (참고) 만약 테이블이 아직 없다면 생성
Base.metadata.create_all(engine)

# 2. JSON 파일 읽기
json_file_path = "[2026.09.22 17시16분].json"

with open(json_file_path, 'r', encoding='utf-8') as file:
    policies_data = json.load(file)
    if isinstance(policies_data, dict):
        policies_data = policies_data.get("youthPolicyList", policies_data.get("data", [policies_data]))
    print(f"JSON 파일에서 {len(policies_data)}개의 정책 데이터를 성공적으로 읽었습니다.")

# 3. DB 저장을 위한 객체 리스트 생성
new_policies = []
duplicate_ids = 0

# 기존에 존재하는 ID 목록 한 번에 조회 (네트워크 최적화)
existing_ids = set(r[0] for r in session.query(UnifiedPolicy.id).all())

for data in policies_data:
    policy_id = str(data.get("id") or data.get("plcyNo") or "")
    if not policy_id:
        continue

    # 데이터 중복 삽입 방지
    if policy_id in existing_ids:
        duplicate_ids += 1
        continue
    
    # 스키마 매핑
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
    existing_ids.add(policy_id)

# 4. DB에 일괄 저장 (Bulk Insert)
if new_policies:
    session.add_all(new_policies)
    session.commit()
    print(f"✅ 총 {len(new_policies)}건의 정책 데이터가 Supabase DB에 성공적으로 저장되었습니다.")
else:
    print("✅ 새로 추가할 정책 데이터가 없습니다. (모두 이미 DB에 존재함)")

if duplicate_ids > 0:
    print(f"⚠️ 중복된 ID로 인해 제외된 데이터: {duplicate_ids}건")

session.close()
```

---

## 5. 실행 결과

```bash
cd backend
python insert_unified_policies.py
```

```
🔗 DB 연결 설정: postgresql://postgres.zeparegwsfyzeueunmuq:ndyTawGNVFVix6c1@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
📄 JSON 파일에서 254개의 정책 데이터를 성공적으로 읽었습니다.
✅ 총 254건의 정책 데이터가 Supabase DB에 성공적으로 저장되었습니다.
```
