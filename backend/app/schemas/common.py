from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    statusCode: int = 200
    message: str = "요청이 성공적으로 처리되었습니다."
    data: Optional[T] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

class ApiErrorResponse(BaseModel):
    success: bool = False
    statusCode: int = 400
    message: str
    errorDetails: Optional[Any] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
