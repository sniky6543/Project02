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

# ==============================================================================
# FastAPI 애플리케이션 및 라우터 설정
# ==============================================================================
from app.core.config import settings
from app.database import init_db
from app.services.scheduler import start_scheduler, stop_scheduler
from app.routers import (
    policies_router,
    profile_router,
    bookmarks_router,
    notifications_router,
    scheduler_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. 서버 기동 시 DB 테이블 초기화
    await init_db()
    # 2. 매일 12:00, 18:30 정책 자동 수집 스케줄러 가동
    start_scheduler()
    yield
    # 3. 서버 종료 시 스케줄러 안전 종료
    stop_scheduler()

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

app.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
app.include_router(notifications_router, prefix="/api/notifications", tags=["Notifications (API)"])

app.include_router(scheduler_router, prefix="/scheduler", tags=["Scheduler"])
app.include_router(scheduler_router, prefix="/api/scheduler", tags=["Scheduler (API)"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


