import os
import json
import logging
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.notification import NotificationLog
from app.models.unified_policy import UnifiedPolicy
from app.models.policy import Policy
from app.models.user import User
from app.crud.user import get_or_create_default_user, DEFAULT_USER_ID
from app.schemas.notification import (
    NotificationCreate,
    PolicyAlertApplyRequest,
    NotificationResponse,
    PolicyAlertChannelInfo,
    PolicyAlertApplyResponseData
)

logger = logging.getLogger(__name__)

async def fetch_policy_metadata(db: AsyncSession, policy_id: str) -> Dict[str, Any]:
    """
    DB(unified_policies -> policies) 및 로컬 백업에서 정책 세부 정보를 조회합니다.
    """
    # 1차: unified_policies 테이블 조회
    stmt_unified = select(UnifiedPolicy).where(UnifiedPolicy.id == policy_id)
    res_unified = await db.execute(stmt_unified)
    unified = res_unified.scalar_one_or_none()
    if unified:
        period_str = "상시 접수 / 공고 참조"
        if unified.period_sdate and unified.period_edate:
            period_str = f"{unified.period_sdate} ~ {unified.period_edate}"
        elif unified.period_edate:
            period_str = f"~ {unified.period_edate}"

        return {
            "id": unified.id,
            "title": unified.title,
            "category": unified.category,
            "organization": unified.organization,
            "summary": unified.summary,
            "support_content": unified.support_content or unified.summary,
            "target_age": unified.target_age or "만 19세~34세 청년",
            "target_condition": unified.target_condition or "해당 자격 충족자",
            "apply_period": period_str,
            "apply_method": unified.apply_method or "온라인 및 방문 접수",
            "apply_url": unified.apply_url or "https://www.youthcenter.go.kr",
            "source": unified.source
        }

    # 2차: policies 테이블 조회
    stmt_policy = select(Policy).where(Policy.id == policy_id)
    res_policy = await db.execute(stmt_policy)
    policy = res_policy.scalar_one_or_none()
    if policy:
        period_str = "상시 접수"
        if policy.period_start and policy.period_end:
            period_str = f"{policy.period_start.strftime('%Y.%m.%d')} ~ {policy.period_end.strftime('%Y.%m.%d')}"
        elif policy.period_end:
            period_str = f"~ {policy.period_end.strftime('%Y.%m.%d')}"

        return {
            "id": policy.id,
            "title": policy.title,
            "category": policy.category,
            "organization": policy.organization,
            "summary": policy.benefit_summary,
            "support_content": policy.benefit_details or policy.benefit_amount or policy.benefit_summary,
            "target_age": policy.target_age or (f"만 {policy.min_age}세 ~ {policy.max_age}세" if policy.min_age and policy.max_age else "청년 대상"),
            "target_condition": policy.income_condition or policy.employment_condition or "제한없음",
            "apply_period": period_str,
            "apply_method": policy.benefit_method or "온라인/방문 접수",
            "apply_url": policy.application_url or "https://www.youthcenter.go.kr",
            "source": "청년나침반 DB"
        }

    # 3차: 로컬 백업 JSON 파일 확인
    candidate_paths = [
        os.path.join(os.getcwd(), "db", "[2026.09.22 17시16분].json"),
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "db", "[2026.09.22 17시16분].json"),
    ]
    for p in candidate_paths:
        if os.path.exists(p):
            try:
                with open(p, 'r', encoding='utf-8') as f:
                    items = json.load(f)
                    for it in items:
                        if it.get("id") == policy_id:
                            return {
                                "id": it.get("id", policy_id),
                                "title": it.get("title", "청년 맞춤 정책"),
                                "category": it.get("category", "청년정책"),
                                "organization": it.get("organization", "정부/지자체"),
                                "summary": it.get("summary", "상세 지원 내용"),
                                "support_content": it.get("support_content") or it.get("summary", ""),
                                "target_age": it.get("target_age", "만 19세~34세"),
                                "target_condition": it.get("target_condition", "자격 충족자"),
                                "apply_period": f"{it.get('period_sdate', '')} ~ {it.get('period_edate', '')}".strip(" ~") or "상시 접수",
                                "apply_method": it.get("apply_method", "온라인 신청"),
                                "apply_url": it.get("apply_url", "https://www.youthcenter.go.kr"),
                                "source": it.get("source", "온통청년")
                            }
            except Exception:
                pass

    # 기본 Fallback
    return {
        "id": policy_id,
        "title": f"청년 정책 ({policy_id})",
        "category": "청년지원",
        "organization": "정부부처/지자체",
        "summary": "맞춤형 청년 복지 및 지원 혜택",
        "support_content": "신청 및 자격 확인 후 지원금 또는 맞춤 혜택 제공",
        "target_age": "만 19세 ~ 34세 청년",
        "target_condition": "소득 및 거주 요건 충족 청년",
        "apply_period": "공고문 접수 기간 참조",
        "apply_method": "공식 홈페이지 온라인 접수 또는 관할 기관 방문",
        "apply_url": "https://www.youthcenter.go.kr",
        "source": "청년나침반"
    }

def format_policy_alert_content(
    policy_info: Dict[str, Any],
    user: User,
    send_method: str,
    recipient_id: str,
    custom_message: Optional[str] = None
) -> str:
    """
    신청한 정책의 핵심 내용과 사용자 수신자 정보를 포함한 풍부하고 정돈된 알림 메시지 본문을 생성합니다.
    """
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    channel_name = "텔레그램 (@" + recipient_id.lstrip("@") + ")" if send_method == "telegram" else f"이메일 ({recipient_id})"
    
    content = (
        f"🔔 [청년 맞춤 정책 알림 신청 완료]\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"📌 정책명: {policy_info['title']}\n"
        f"🏢 주관기관: {policy_info['organization']} ({policy_info['category']})\n"
        f"🎁 주요 지원 혜택: {policy_info['support_content']}\n"
        f"🎯 지원 자격 요건: {policy_info['target_age']} | {policy_info['target_condition']}\n"
        f"📅 접수 기간: {policy_info['apply_period']}\n"
        f"📝 신청 방법: {policy_info['apply_method']}\n"
        f"🔗 공식 공고 링크: {policy_info['apply_url']}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"👤 신청 회원: {user.name} ({user.id})\n"
        f"📬 알림 수신 채널: {channel_name}\n"
        f"🕒 신청 일시: {now_str}\n"
    )
    if custom_message:
        content += f"💬 전달 메모: {custom_message}\n"
        
    content += (
        f"✨ 안내: 해당 공고의 접수 마감 D-7, D-3 및 주요 변동 사항이 본 수신 채널로 자동 발송됩니다."
    )
    return content

async def apply_policy_alert(
    db: AsyncSession,
    request: PolicyAlertApplyRequest
) -> PolicyAlertApplyResponseData:
    """
    사용자가 특정 정책의 알람을 신청할 때:
    1. 사용자의 텔레그램 ID 및 이메일 정보를 DB(users)에서 조회 및 갱신합니다.
    2. 해당 정책의 상세 내용(제목, 혜택, 신청기간, 링크 등)을 DB(unified_policies/policies)에서 조회합니다.
    3. 수신 대상(텔레그램 또는 이메일)별로 발송/신청 기록(notification_logs)을 DB에 저장합니다.
    """
    user_id = request.userId or DEFAULT_USER_ID
    user = await get_or_create_default_user(db, user_id=user_id)

    # 1. 전달된 텔레그램ID 또는 이메일이 있다면 사용자 프로필 실시간 갱신 및 활성화
    user_updated = False
    if request.telegramId:
        user.telegram_account = request.telegramId
        user.is_telegram_enabled = True
        user_updated = True
    if request.email:
        user.email = request.email
        user.is_email_enabled = True
        user_updated = True

    if user_updated:
        await db.commit()
        await db.refresh(user)

    # 2. 정책 상세 정보 조회
    policy_info = await fetch_policy_metadata(db, request.policyId)

    # 3. 발송 수신 채널 결정 (telegram, email, both)
    target_channels: List[Tuple[str, str]] = [] # [(send_method, recipient_id), ...]
    method_pref = (request.sendMethod or "").lower()

    if method_pref == "telegram":
        tg_id = request.telegramId or user.telegram_account or "@youth_compass_user"
        target_channels.append(("telegram", tg_id))
    elif method_pref == "email":
        em_addr = request.email or user.email or "youth.compass@example.com"
        target_channels.append(("email", em_addr))
    else:
        # both 또는 미지정: 사용자 프로필에 등록/활성화된 채널 우선 탐색
        if user.is_telegram_enabled and user.telegram_account:
            target_channels.append(("telegram", user.telegram_account))
        if user.is_email_enabled and user.email:
            target_channels.append(("email", user.email))

        # 만약 프로필에 활성화된 채널이 없으면, 존재하는 값 기준 fallback
        if not target_channels:
            if user.telegram_account:
                target_channels.append(("telegram", user.telegram_account))
            elif user.email:
                target_channels.append(("email", user.email))
            else:
                # 기본 데모 텔레그램 채널 적용
                target_channels.append(("telegram", "@youth_compass_user"))

    # 4. 각 채널별 알림 로그 객체 생성 및 DB 저장
    created_logs: List[NotificationLog] = []
    registered_channel_infos: List[PolicyAlertChannelInfo] = []

    for send_method, recipient_id in target_channels:
        content_text = format_policy_alert_content(
            policy_info=policy_info,
            user=user,
            send_method=send_method,
            recipient_id=recipient_id,
            custom_message=request.customMessage
        )

        notification = NotificationLog(
            send_method=send_method,
            recipient_id=recipient_id,
            content=content_text,
            user_id=user.id,
            policy_id=request.policyId,
            status="REGISTERED",
            sent_at=datetime.utcnow()
        )
        db.add(notification)
        created_logs.append(notification)
        registered_channel_infos.append(
            PolicyAlertChannelInfo(method=send_method, recipientId=recipient_id)
        )

    await db.commit()

    # refresh
    for log in created_logs:
        await db.refresh(log)

    channel_desc = ", ".join([f"{info.method}({info.recipientId})" for info in registered_channel_infos])
    success_msg = f"[{policy_info['title']}] 정책 알림이 {channel_desc} 채널로 성공적으로 등록되어 DB에 저장되었습니다."

    return PolicyAlertApplyResponseData(
        policyId=request.policyId,
        policyTitle=policy_info["title"],
        userId=user.id,
        userName=user.name,
        registeredChannels=registered_channel_infos,
        notificationsCreated=[NotificationResponse.model_validate(log) for log in created_logs],
        message=success_msg
    )

async def create_notification_log(
    db: AsyncSession,
    data: NotificationCreate
) -> NotificationLog:
    """
    새로운 알림/메시지 발송 내역을 DB에 저장합니다.
    policy_id가 지정되어 있고 content가 누락되었을 경우 정책 내용을 자동 포맷팅합니다.
    """
    content = data.content
    recipient_id = data.recipient_id

    # 정책 연계 정보 자동 보강
    if data.policy_id and (not content or content.strip() == ""):
        user = await get_or_create_default_user(db, user_id=data.user_id or DEFAULT_USER_ID)
        policy_info = await fetch_policy_metadata(db, data.policy_id)
        content = format_policy_alert_content(
            policy_info=policy_info,
            user=user,
            send_method=data.send_method,
            recipient_id=recipient_id or (user.telegram_account if data.send_method == "telegram" else user.email or "")
        )

    notification = NotificationLog(
        send_method=data.send_method,
        recipient_id=recipient_id,
        content=content,
        user_id=data.user_id,
        policy_id=data.policy_id,
        status=data.status or "SENT",
        sent_at=data.sent_at or datetime.utcnow()
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification

async def get_notification_logs(
    db: AsyncSession,
    send_method: Optional[str] = None,
    recipient_id: Optional[str] = None,
    user_id: Optional[str] = None,
    policy_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[NotificationLog]:
    """
    저장된 알림 발송 기록 목록을 조회합니다 (최신 발송순 정렬).
    """
    stmt = select(NotificationLog).order_by(desc(NotificationLog.sent_at), desc(NotificationLog.no))

    if send_method:
        stmt = stmt.where(NotificationLog.send_method == send_method)
    if recipient_id:
        stmt = stmt.where(NotificationLog.recipient_id == recipient_id)
    if user_id:
        stmt = stmt.where(NotificationLog.user_id == user_id)
    if policy_id:
        stmt = stmt.where(NotificationLog.policy_id == policy_id)

    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_notification_by_no(
    db: AsyncSession,
    no: int
) -> Optional[NotificationLog]:
    """
    고유 번호(NO, PK)로 특정 발송 내역을 조회합니다.
    """
    stmt = select(NotificationLog).where(NotificationLog.no == no)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
