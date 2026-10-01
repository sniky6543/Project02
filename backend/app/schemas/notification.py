from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

class NotificationCreate(BaseModel):
    send_method: str = Field(..., description="발송방법 (email 또는 telegram)", example="telegram")
    recipient_id: str = Field(..., description="수신자 식별 정보 (텔레그램 ID 또는 이메일 주소)", example="@youth_compass_user")
    content: str = Field(..., description="발송 메시지 본문", example="[청년 맞춤 정책 알림] 맞춤 주거 지원 정책이 업데이트 되었습니다.")
    user_id: Optional[str] = Field(None, description="연계 사용자 ID (선택)")
    policy_id: Optional[str] = Field(None, description="연계 정책 ID (선택)")
    status: Optional[str] = Field("SENT", description="발송 상태 (SENT, SUCCESS, FAILED, REGISTERED)")
    sent_at: Optional[datetime] = Field(default_factory=datetime.utcnow, description="발송 일시")

class PolicyAlertApplyRequest(BaseModel):
    policyId: str = Field(..., description="알람 신청할 정책 고유 ID (예: ONTONG_2026... 또는 POL_...)", example="ONTONG_20260922005400113524")
    userId: Optional[str] = Field(None, description="신청 사용자 ID (미입력 시 기본 사용자 'usr-10029' 적용)", example="usr-10029")
    sendMethod: Optional[str] = Field(None, description="수신 채널 ('telegram', 'email', 'both' 등. 미입력 시 프로필 등록 채널 자동 조회)")
    telegramId: Optional[str] = Field(None, description="수신 텔레그램 ID (미입력 시 사용자 프로필 정보 사용)")
    email: Optional[str] = Field(None, description="수신 이메일 주소 (미입력 시 사용자 프로필 정보 사용)")
    customMessage: Optional[str] = Field(None, description="추가 사용자 메모 또는 메시지")

class NotificationResponse(BaseModel):
    no: int = Field(..., description="고유 발송 번호 (PK)")
    send_method: str = Field(..., description="발송방법 (email / telegram)")
    recipient_id: str = Field(..., description="수신자 ID (텔레그램 ID 또는 이메일 주소)")
    content: str = Field(..., description="발송 내용 (정책 세부사항 포함)")
    sent_at: datetime = Field(..., description="발송시간")
    user_id: Optional[str] = Field(None, description="연계 사용자 ID")
    policy_id: Optional[str] = Field(None, description="연계 정책 ID")
    status: str = Field("SENT", description="발송 상태")

    model_config = ConfigDict(from_attributes=True)

class PolicyAlertChannelInfo(BaseModel):
    method: str
    recipientId: str

class PolicyAlertApplyResponseData(BaseModel):
    policyId: str
    policyTitle: str
    userId: str
    userName: str
    registeredChannels: List[PolicyAlertChannelInfo]
    notificationsCreated: List[NotificationResponse]
    message: str

class NotificationListResponseData(BaseModel):
    totalCount: int
    items: List[NotificationResponse]
