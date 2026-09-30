from datetime import datetime, date
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.schemas.user import (
    UserProfileResponseData,
    UserProfileUpdateRequest,
    PersonalInfo,
    HousingInfo,
    AISettings,
    NotificationChannels,
    ChannelConfig
)

DEFAULT_USER_ID = "usr-10029"

async def get_or_create_default_user(db: AsyncSession, user_id: str = DEFAULT_USER_ID) -> User:
    """사용자가 없을 경우 기본 데모 사용자를 생성하여 반환합니다."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            id=user_id,
            name="김청년",
            email="youth.compass@example.com",
            birth_date=date(1997, 5, 14),
            gender="남성",
            contact="010-1234-5678",
            region="서울특별시 관악구",
            education="대학 졸업",
            employment_status="미취업자",
            housing_type="월세",
            annual_income=3200,
            ai_provider="OPENAI",
            telegram_account="@youth_compass_user",
            is_telegram_enabled=True,
            is_email_enabled=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user

async def get_user_profile(db: AsyncSession, user_id: str = DEFAULT_USER_ID) -> UserProfileResponseData:
    user = await get_or_create_default_user(db, user_id)
    
    return UserProfileResponseData(
        userId=user.id,
        personal=PersonalInfo(
            name=user.name,
            birthDate=user.birth_date.strftime("%Y-%m-%d") if user.birth_date else None,
            gender=user.gender,
            contact=user.contact,
            region=user.region
        ),
        education=user.education or "제한없음",
        employmentStatus=user.employment_status or "미취업자",
        housing=HousingInfo(
            housingType=user.housing_type or "월세",
            annualIncome=user.annual_income or 0
        ),
        aiSettings=AISettings(
            selectedProvider=user.ai_provider or "OPENAI",
            hasApiKey=True
        ),
        notificationChannels=NotificationChannels(
            telegram=ChannelConfig(
                enabled=user.is_telegram_enabled,
                account=user.telegram_account
            ),
            email=ChannelConfig(
                enabled=user.is_email_enabled,
                account=user.email
            )
        )
    )

async def update_user_profile(
    db: AsyncSession,
    user_id: str,
    update_data: UserProfileUpdateRequest
) -> UserProfileResponseData:
    user = await get_or_create_default_user(db, user_id)

    if update_data.name is not None:
        user.name = update_data.name
    if update_data.birthDate is not None:
        try:
            user.birth_date = datetime.strptime(update_data.birthDate, "%Y-%m-%d").date()
        except Exception:
            pass
    if update_data.gender is not None:
        user.gender = update_data.gender
    if update_data.contact is not None:
        user.contact = update_data.contact
    if update_data.region is not None:
        user.region = update_data.region
    if update_data.housingType is not None:
        user.housing_type = update_data.housingType
    if update_data.annualIncome is not None:
        user.annual_income = update_data.annualIncome
    if update_data.education is not None:
        user.education = update_data.education
    if update_data.employmentStatus is not None:
        user.employment_status = update_data.employmentStatus

    if update_data.aiSettings:
        if "selectedProvider" in update_data.aiSettings:
            user.ai_provider = update_data.aiSettings["selectedProvider"]

    if update_data.notificationChannels:
        tg = update_data.notificationChannels.get("telegram")
        if tg and isinstance(tg, dict):
            if "enabled" in tg:
                user.is_telegram_enabled = tg["enabled"]
            if "account" in tg:
                user.telegram_account = tg["account"]

        em = update_data.notificationChannels.get("email")
        if em and isinstance(em, dict):
            if "enabled" in em:
                user.is_email_enabled = em["enabled"]
            if "account" in em:
                user.email = em["account"]

    await db.commit()
    await db.refresh(user)
    return await get_user_profile(db, user_id)
