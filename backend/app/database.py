import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

logger = logging.getLogger(__name__)

# 1. 비동기 엔진 파라미터 구성
engine_args = {
    "echo": False,
    "pool_pre_ping": True,
}

connect_args = {}

# PostgreSQL / Supabase 특화 설정
if not settings.async_database_url.startswith("sqlite"):
    engine_args.update({
        "pool_size": 10,
        "max_overflow": 20,
    })
    # Supabase 또는 PgBouncer Pooler 사용 시 statement_cache_size=0 필수
    if "supabase" in settings.async_database_url or ":6543" in settings.async_database_url or "pooler" in settings.async_database_url:
        connect_args["statement_cache_size"] = 0
        logger.info("⚡ Supabase / PgBouncer Pooler 모드 활성화 (statement_cache_size=0)")

if connect_args:
    engine_args["connect_args"] = connect_args

engine = create_async_engine(settings.async_database_url, **engine_args)

# 2. 비동기 세션 팩토리 생성
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

# 3. Base 클래스 정의
class Base(DeclarativeBase):
    pass

# 4. FastAPI Dependency 주입용 get_db
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """요청 단위 비동기 세션 관리 (자동 롤백 및 종료)"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"DB 세션 에러 발생 후 롤백: {e}")
            raise
        finally:
            await session.close()

# 5. DB 테이블 자동 초기화 함수
async def init_db():
    """서버 시작 시 테이블 생성"""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ 데이터베이스 테이블 초기화 완료")
    except Exception as e:
        logger.warning(f"⚠️ 테이블 초기화 중 경고 (이미 존재하거나 권한 제한): {e}")
