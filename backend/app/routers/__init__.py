from .policies import router as policies_router
from .profile import router as profile_router
from .bookmarks import router as bookmarks_router
from .notifications import router as notifications_router
from .scheduler import router as scheduler_router

__all__ = [
    "policies_router",
    "profile_router",
    "bookmarks_router",
    "notifications_router",
    "scheduler_router",
]


