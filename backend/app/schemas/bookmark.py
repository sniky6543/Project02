from typing import Optional
from pydantic import BaseModel

class BookmarkToggleRequest(BaseModel):
    policyId: str
    userId: Optional[str] = None
    subscribeAlert: Optional[bool] = False

class BookmarkToggleResponseData(BaseModel):
    policyId: str
    isBookmarked: bool
    totalBookmarkedCount: int
