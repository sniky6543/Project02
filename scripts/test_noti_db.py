import os
import sys
from datetime import datetime, timezone
from dotenv import load_dotenv

# 콘솔 출력 utf-8 인코딩 설정
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

load_dotenv()
from supabase import create_client

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')

if not url or not key:
    print("Supabase config missing")
    sys.exit(1)

supabase = create_client(url, key)

now_iso = datetime.now(timezone.utc).isoformat()

# 1. 텔레그램 알림 DB 저장 테스트
tg_log = {
    'send_method': 'telegram',
    'recipient_id': '@youth_compass_user',
    'content': '🔔 [청년 맞춤 정책 알림]\n• 정책명: 청년월세 한시 특별지원\n• 주관기관: 국토교통부\n• 지원혜택: 월 최대 20만원 지원\n• 신청방법: 온라인 접수',
    'sent_at': now_iso,
    'status': 'SENT'
}
res_tg = supabase.table('notification_logs').insert(tg_log).execute()
print(f"✅ 텔레그램 알림 DB 저장 완료 (PK No: {res_tg.data[0]['no']})")

# 2. 이메일 알림 DB 저장 테스트
em_log = {
    'send_method': 'email',
    'recipient_id': 'youth.compass@example.com',
    'content': '📧 [청년 맞춤 정책 알림]\n• 정책명: 청년도약계좌\n• 주관기관: 금융위원회\n• 지원혜택: 정부기여금 매칭 지원\n• 신청방법: 청년도약계좌 공식 누리집',
    'sent_at': now_iso,
    'status': 'SENT'
}
res_em = supabase.table('notification_logs').insert(em_log).execute()
print(f"✅ 이메일 알림 DB 저장 완료 (PK No: {res_em.data[0]['no']})")

# 3. DB에서 저장된 알림 로그 목록 조회
res_all = supabase.table('notification_logs').select('*').order('sent_at', desc=True).limit(5).execute()
print("\n📋 [Supabase notification_logs 테이블 최신 저장 내역]")
for row in res_all.data:
    print("-" * 50)
    print(f"• NO: {row.get('no')} | 채널: {row.get('send_method')} | 상태: {row.get('status')}")
    print(f"• 수신자 ID/이메일: {row.get('recipient_id')}")
    print(f"• 발송 일시: {row.get('sent_at')}")
    print(f"• 발송 내용:\n{row.get('content')}")
