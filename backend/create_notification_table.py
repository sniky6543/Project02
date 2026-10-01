import os
import sys
from dotenv import load_dotenv
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import declarative_base

# 콘솔 출력 utf-8 인코딩 설정
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# 1. 환경변수 로드 및 DB 연결 (.env 파일 탐색)
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
load_dotenv(os.path.join(current_dir, ".env"))
load_dotenv(os.path.join(parent_dir, ".env"))

db_url = os.getenv("DATABASE_URL")
if not db_url or db_url.startswith("http"):
    supabase_env = os.getenv("SUPABASE_URL")
    if supabase_env and not supabase_env.startswith("http"):
        db_url = supabase_env

# 대괄호 [비밀번호] 형태 자동 보정 및 postgresql:// 보정
if db_url:
    if "@" in db_url and ":[" in db_url and "]@" in db_url:
        db_url = db_url.replace(":[", ":").replace("]@", "@")
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")


if not db_url:
    # 기본 로컬 SQLite fallback
    db_url = "sqlite:///./youth_compass.db"

print(f"🔗 DB 연결 시도 중: {db_url}")
engine = create_engine(db_url)
Base = declarative_base()

# 2. 알림 발송 기록 모델 정의
class NotificationLog(Base):
    __tablename__ = 'notification_logs'

    # 1. NO (Primary Key)
    no = Column(Integer, primary_key=True, autoincrement=True, comment="고유 발송 번호 (PK)")
    
    # 2. 발송방법 (email / 텔레그램)
    send_method = Column(String(20), nullable=False, comment="발송 방법 (email / telegram)")
    
    # 3. ID (텔레그램아이디 / email주소)
    recipient_id = Column(String(255), nullable=False, comment="수신자 ID (텔레그램 ID 또는 이메일 주소)")
    
    # 4. 내용
    content = Column(Text, nullable=False, comment="발송 내용")
    
    # 5. 발송시간
    sent_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="발송시간")

    # 6. 연계 정보
    user_id = Column(String(50), nullable=True, comment="연계 사용자 ID")
    policy_id = Column(String(100), nullable=True, comment="연계 정책 ID")
    status = Column(String(20), default="SENT", comment="발송 상태")

# 3. DB에 테이블 생성 적용
try:
    Base.metadata.create_all(engine)
    print("✅ notification_logs 테이블이 성공적으로 생성되었습니다!")
except Exception as e:
    print(f"❌ 테이블 생성 중 오류 발생: {e}")
