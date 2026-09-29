from pydantic import BaseModel

class BookmarkToggleRequest(BaseModel):
    policyId: str

class BookmarkToggleResponseData(BaseModel):
    policyId: str
    isBookmarked: bool
    totalBookmarkedCount: int
