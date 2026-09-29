import os
import sys
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

# 콘솔 인코딩 utf-8 설정
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# 1. 환경변수 로드 (.env 파일 읽기)
load_dotenv()
db_url = os.getenv("SUPABASE_URL") or os.getenv("DATABASE_URL")

# 대괄호 [비밀번호] 형태 자동 보정 및 asyncpg 접두사 보정
if db_url:
    # [password] 형태의 불필요한 대괄호 제거
    if "@" in db_url and ":[" in db_url and "]@" in db_url:
        db_url = db_url.replace(":[", ":").replace("]@", "@")
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")

# 2. 클라우드 DB 연결
if db_url and not db_url.startswith("http"):
    try:
        engine = create_engine(db_url)
        Base = declarative_base()

        # 3. 테이블 모델 정의 (예: 팀원 정보)
        class TeamMember(Base):
            __tablename__ = 'team_members'
            id = Column(Integer, primary_key=True)
            name = Column(String)
            role = Column(String)

        # 4. DB에 테이블 생성 (클라우드에 최초 1회 생성됨)
        Base.metadata.create_all(engine)

        # 5. 세션 열기 및 데이터 저장
        Session = sessionmaker(bind=engine)
        session = Session()

        # 새로운 데이터 추가 (INSERT)
        new_member = TeamMember(name='신입개발자', role='프론트엔드')
        session.add(new_member)
        session.commit()
        print("클라우드 DB에 데이터 저장 완료!")

        # 6. 저장된 데이터 모두 불러와서 확인 (SELECT)
        members = session.query(TeamMember).all()
        for m in members:
            print(f"ID: {m.id}, 이름: {m.name}, 역할: {m.role}")

        session.close()
    except Exception as e:
        print(f"클라우드 DB 연결/저장 안내: {e}")

# ==============================================================================
# FastAPI 애플리케이션 및 라우터 설정
# ==============================================================================
from app.core.config import settings
from app.database import init_db
from app.routers import policies_router, profile_router, bookmarks_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 서버 기동 시 DB 테이블 초기화
    await init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="청년 맞춤 정책 탐색 및 AI 추천 백엔드 서비스 (SQLAlchemy 2.0 DB 연동)",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "status": "online",
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/api/health")
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# 라우터 등록 (/api prefix 및 기본 prefix 모두 등록)
app.include_router(policies_router, prefix="/policies", tags=["Policies"])
app.include_router(policies_router, prefix="/api/policies", tags=["Policies (API)"])

app.include_router(profile_router, prefix="/profile", tags=["Profile"])
app.include_router(profile_router, prefix="/api/profile", tags=["Profile (API)"])

app.include_router(bookmarks_router, prefix="/bookmarks", tags=["Bookmarks"])
app.include_router(bookmarks_router, prefix="/api/bookmarks", tags=["Bookmarks (API)"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
