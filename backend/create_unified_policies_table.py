import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, String, Text
from sqlalchemy.orm import declarative_base

# 콘솔 출력 utf-8 인코딩 설정
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# 1. 환경변수 로드 및 DB 연결 (.env 파일 탐색)
# 현재 디렉토리 또는 상위 디렉토리의 .env 로드
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
load_dotenv(os.path.join(current_dir, ".env"))
load_dotenv(os.path.join(parent_dir, ".env"))

db_url = os.getenv("SUPABASE_URL") or os.getenv("DATABASE_URL")

# 대괄호 [비밀번호] 형태 자동 보정 및 postgresql:// 보정
if db_url:
    if "@" in db_url and ":[" in db_url and "]@" in db_url:
        db_url = db_url.replace(":[", ":").replace("]@", "@")
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")

print(f"🔗 DB 연결 시도 중: {db_url}")
engine = create_engine(db_url)
Base = declarative_base()

# 2. 통합 정책 데이터 스키마 모델 정의
class UnifiedPolicy(Base):
    __tablename__ = 'unified_policies'

    # 필수 필드 (nullable=False)
    id = Column(String(100), primary_key=True) # 고유 식별자 (예: ONTONG_2026...)
    source = Column(String(100), nullable=False) # 원본 출처
    title = Column(String(255), nullable=False) # 정책 명칭
    category = Column(String(100), nullable=False) # 카테고리
    organization = Column(String(100), nullable=False) # 주관 부처
    summary = Column(Text, nullable=False) # 1~2줄 요약 (길어질 수 있으므로 Text 사용)

    # 선택 필드 (nullable=True)
    support_content = Column(Text, nullable=True) # 구체적 지원 혜택
    target_age = Column(String(100), nullable=True) # 대상 연령
    target_condition = Column(Text, nullable=True) # 자격 요건 (길어질 수 있으므로 Text)
    apply_method = Column(String(255), nullable=True) # 신청 방법
    apply_url = Column(String(255), nullable=True) # 신청 페이지 URL
    period_sdate = Column(String(50), nullable=True) # 시작일 (상시 등 문자열 포함 가능)
    period_edate = Column(String(50), nullable=True) # 종료일

# 3. Supabase 클라우드에 테이블 생성 적용
try:
    Base.metadata.create_all(engine)
    print("Supabase에 UnifiedPolicy 테이블 생성이 완료되었습니다!")
except Exception as e:
    print(f"❌ 테이블 생성 중 오류 발생: {e}")
    # Pooler 주소 안내
    if "could not translate host name" in str(e) or "Name or service not known" in str(e):
        print("\n💡 [해결 방법] Supabase Direct Host는 IPv6 전용입니다. Supabase 대시보드(Project Settings -> Database)에서 Session Pooler 주소를 복사하여 .env의 SUPABASE_URL에 넣어주세요:")
        print("   예: postgresql://postgres.zeparegwsfyzeueunmuq:ndyTawGNVFVix6c1@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres")
