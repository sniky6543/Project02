from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import date

class PersonalInfo(BaseModel):
    name: str
    birthDate: Optional[str] = None
    gender: Optional[str] = None
    contact: Optional[str] = None
    region: Optional[str] = None

class HousingInfo(BaseModel):
    housingType: str = "월세"
    annualIncome: int = 0  # 만원

class AISettings(BaseModel):
    selectedProvider: str = "OPENAI"
    hasApiKey: bool = False
    apiKey: Optional[str] = None

class ChannelConfig(BaseModel):
    enabled: bool = False
    account: Optional[str] = None

class NotificationChannels(BaseModel):
    telegram: ChannelConfig = ChannelConfig()
    email: ChannelConfig = ChannelConfig()

class UserProfileResponseData(BaseModel):
    userId: str
    personal: PersonalInfo
    education: Optional[str] = "제한없음"
    employmentStatus: Optional[str] = "미취업자"
    housing: HousingInfo
    aiSettings: AISettings
    notificationChannels: NotificationChannels

    model_config = ConfigDict(from_attributes=True)

class UserProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    birthDate: Optional[str] = None
    gender: Optional[str] = None
    contact: Optional[str] = None
    region: Optional[str] = None
    housingType: Optional[str] = None
    annualIncome: Optional[int] = None
    education: Optional[str] = None
    employmentStatus: Optional[str] = None
    aiSettings: Optional[Dict[str, Any]] = None
    notificationChannels: Optional[Dict[str, Any]] = None
