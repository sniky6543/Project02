import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

def get_supabase_client():
    """Supabase Python 클라이언트를 안전하게 초기화하여 반환합니다 (미설치 또는 미설정 시 None)."""
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        return None

    try:
        from supabase import create_client, Client
        # Direct PostgreSQL URL인 경우 클라이언트 생성 생략
        if supabase_url.startswith("postgresql://") or supabase_url.startswith("postgres://"):
            return None
        client: Client = create_client(supabase_url, supabase_key)
        return client
    except Exception as e:
        logger.debug(f"Supabase 클라이언트 초기화 불가 (SQLAlchemy Direct 연동 사용): {e}")
        return None
