from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime
from sqlalchemy.orm import declarative_base


Base = declarative_base()

class UnifiedPolicy(Base):
    __tablename__ = 'unified_policies'

    # 필수 필드 (nullable=False)
    id = Column(String(100), primary_key=True)         # 고유 식별자 (예: ONTONG_2026...)
    source = Column(String(100), nullable=False)        # 원본 출처
    title = Column(Text, nullable=False)                # 정책 명칭
    category = Column(String(100), nullable=False)      # 카테고리
    organization = Column(String(150), nullable=False)  # 주관 부처
    summary = Column(Text, nullable=False)              # 1~2줄 요약

    # 선택 필드 (nullable=True)
    support_content = Column(Text, nullable=True)       # 구체적 지원 혜택
    target_age = Column(Text, nullable=True)            # 대상 연령
    target_condition = Column(Text, nullable=True)      # 자격 요건
    apply_method = Column(Text, nullable=True)          # 신청 방법 (장문 안내 포함)
    apply_url = Column(Text, nullable=True)             # 신청 페이지 URL
    period_sdate = Column(Text, nullable=True)          # 시작일
    period_edate = Column(Text, nullable=True)          # 종료일


class NotificationLog(Base):
    __tablename__ = 'notification_logs'

    # 1. NO (Primary Key)
    no = Column(Integer, primary_key=True, autoincrement=True)  # 고유 식별 번호 (PK)
    
    # 2. 발송방법 (email / 텔레그램)
    send_method = Column(String(20), nullable=False)            # 발송 방법 (email / telegram)
    
    # 3. ID (텔레그램아이디 / email주소)
    recipient_id = Column(String(255), nullable=False)          # 수신자 ID (텔레그램 ID 또는 이메일 주소)
    
    # 4. 내용
    content = Column(Text, nullable=False)                      # 발송 내용
    
    # 5. 발송시간
    sent_at = Column(DateTime, default=datetime.utcnow, nullable=False)  # 발송시간

    # 6. 연계 정보
    user_id = Column(String(50), nullable=True)                 # 연계 사용자 ID
    policy_id = Column(String(100), nullable=True)              # 연계 정책 ID
    status = Column(String(20), default="SENT")                 # 발송 상태 (SENT, REGISTERED 등)

