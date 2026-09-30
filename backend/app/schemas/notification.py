from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

class NotificationCreate(BaseModel):
    send_method: str = Field(..., description="발송방법 (email 또는 telegram)", example="telegram")
    recipient_id: str = Field(..., description="수신자 식별 정보 (텔레그램 ID 또는 이메일 주소)", example="@youth_compass_user")
    content: str = Field(..., description="발송 메시지 본문", example="[청년 맞춤 정책 알림] 맞춤 주거 지원 정책이 업데이트 되었습니다.")
    user_id: Optional[str] = Field(None, description="연계 사용자 ID (선택)")
    status: Optional[str] = Field("SENT", description="발송 상태 (SENT, SUCCESS, FAILED)")
    sent_at: Optional[datetime] = Field(default_factory=datetime.utcnow, description="발송 일시")

class NotificationResponse(BaseModel):
    no: int = Field(..., description="고유 발송 번호 (PK)")
    send_method: str = Field(..., description="발송방법 (email / telegram)")
    recipient_id: str = Field(..., description="수신자 ID (텔레그램 ID 또는 이메일 주소)")
    content: str = Field(..., description="발송 내용")
    sent_at: datetime = Field(..., description="발송시간")
    user_id: Optional[str] = Field(None, description="연계 사용자 ID")
    status: str = Field("SENT", description="발송 상태")

    model_config = ConfigDict(from_attributes=True)

class NotificationListResponseData(BaseModel):
    totalCount: int
    items: List[NotificationResponse]
