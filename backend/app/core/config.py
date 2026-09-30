import os
from typing import List, Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "청년나침반 (Youth Compass) API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # DB 연결 URL: 기본값으로 로컬 SQLite(비동기) 사용, .env에 PostgreSQL 설정 시 자동 적용
    DATABASE_URL: str = "sqlite+aiosqlite:///./youth_compass.db"
    
    # CORS 허용 도메인 (쉼표 구분 문자열 및 리스트 지원)
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        return []

    # AI API Keys
    OPENAI_API_KEY: Optional[str] = None
    ROUTER_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def async_database_url(self) -> str:
        """PostgreSQL 드라이버 호환성 자동 보정 (postgres:// -> postgresql+asyncpg://)"""
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

settings = Settings()
