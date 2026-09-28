"""
0928_alarm.py
청년정책 마감 3일 전(D-3) 텔레그램 알림 전송 프로그램
- 온통청년 API / DB / 로컬 정책 데이터 연동
- 정책 신청 마감일 분석 및 D-3 자동 감지
- 텔레그램 봇(Telegram Bot API) 메시지 및 인라인 버튼 전송
- Chat ID 자동 감지, 매일 정기 스케줄러 및 즉시 테스트 모드 지원
"""

import os
import sys
import json
import re
import time
import argparse
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional, Tuple
import requests
from dotenv import load_dotenv

# Windows 콘솔 인코딩 대응 (한글 깨짐 방지)
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# .env 로드
load_dotenv()

CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "telegram_config.json")


# ==============================================================================
# 1. 텔레그램 봇 API 클라이언트 (TelegramBotClient)
# ==============================================================================
class TelegramBotClient:
    """
    텔레그램 Bot API를 활용하여 마감 알림 메시지를 전송하는 클라이언트
    """
    BASE_URL = "https://api.telegram.org/bot{token}"

    def __init__(self, config_file: str = CONFIG_FILE):
        self.config_file = config_file
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID", "").strip()
        
        # 기본 placeholder 값인 경우 빈 문자열로 처리
        if self.bot_token == "your_telegram_bot_token_here":
            self.bot_token = ""
            
        self._load_config_from_file()

    def _load_config_from_file(self):
        """저장된 json 파일에서 token 및 chat_id 정보 로드"""
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if not self.bot_token and data.get("bot_token"):
                        self.bot_token = data.get("bot_token")
                    if not self.chat_id and data.get("chat_id"):
                        self.chat_id = str(data.get("chat_id"))
            except Exception as e:
                print(f"⚠️ [텔레그램] 설정 파일 로드 실패: {e}")

    def save_config_to_file(self, token: Optional[str] = None, chat_id: Optional[str] = None):
        """인증 정보 및 Chat ID를 파일에 저장"""
        data_to_save = {
            "bot_token": token or self.bot_token,
            "chat_id": chat_id or self.chat_id,
            "updated_at": datetime.now().isoformat()
        }
        try:
            with open(self.config_file, "w", encoding="utf-8") as f:
                json.dump(data_to_save, f, ensure_ascii=False, indent=2)
            if token:
                self.bot_token = token
            if chat_id:
                self.chat_id = str(chat_id)
            print(f"💾 [텔레그램] 설정 정보 저장 완료 -> {self.config_file}")
        except Exception as e:
            print(f"⚠️ [텔레그램] 설정 저장 실패: {e}")

    def auto_detect_chat_id(self) -> Optional[str]:
        """
        텔레그램 getUpdates API를 호출하여 최근 봇에게 /start를 보낸 사용자의 chat_id를 자동 감지
        """
        if not self.bot_token:
            return None

        url = f"{self.BASE_URL.format(token=self.bot_token)}/getUpdates"
        try:
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                data = res.json()
                updates = data.get("result", [])
                if updates:
                    # 가장 최근 메시지 발신자의 chat_id 추출
                    last_update = updates[-1]
                    chat = last_update.get("message", {}).get("chat", {})
                    chat_id = str(chat.get("id"))
                    username = chat.get("username") or chat.get("first_name", "User")
                    if chat_id:
                        print(f"🔎 [텔레그램] 최근 대화 사용자 자동 감지 성공: {username} (Chat ID: {chat_id})")
                        self.save_config_to_file(chat_id=chat_id)
                        return chat_id
        except Exception as e:
            print(f"⚠️ [텔레그램] Chat ID 자동 감지 중 오류: {e}")
        return None

    def send_message(
        self,
        text_html: str,
        web_url: Optional[str] = None,
        button_title: str = "공고 및 서류 확인"
    ) -> bool:
        """
        HTML 서식 및 인라인 키보드 버튼을 포함한 텔레그램 메시지 발송
        """
        # Chat ID가 없을 경우 자동 감지 시도
        if self.bot_token and not self.chat_id:
            self.auto_detect_chat_id()

        # 토큰이나 Chat ID가 없으면 시뮬레이션 출력
        if not self.bot_token or not self.chat_id:
            self._print_mock_telegram_message(text_html, web_url, button_title)
            return False

        url = f"{self.BASE_URL.format(token=self.bot_token)}/sendMessage"
        payload: Dict[str, Any] = {
            "chat_id": self.chat_id,
            "text": text_html,
            "parse_mode": "HTML",
            "disable_web_page_preview": False
        }

        # 인라인 버튼(바로가기 링크) 첨부
        if web_url:
            payload["reply_markup"] = {
                "inline_keyboard": [
                    [{"text": f"🔗 {button_title}", "url": web_url}]
                ]
            }

        try:
            res = requests.post(url, json=payload, timeout=10)
            if res.status_code == 200:
                print("   ✅ 텔레그램 메시지 전송 성공!")
                return True
            else:
                print(f"   ❌ 텔레그램 전송 실패 ({res.status_code}): {res.text}")
                self._print_mock_telegram_message(text_html, web_url, button_title)
                return False
        except Exception as e:
            print(f"   ❌ 텔레그램 API 요청 에러: {e}")
            self._print_mock_telegram_message(text_html, web_url, button_title)
            return False

    def _print_mock_telegram_message(self, html_text: str, web_url: Optional[str], button_title: str):
        """텔레그램 토큰이 미설정 상태일 때 콘솔 시각화 출력"""
        clean_text = re.sub(r"<[^>]+>", "", html_text)
        print("\n" + "┌" + "─" * 60 + "┐")
        print("│ ✈️ [텔레그램 봇 알림 수신 시뮬레이션 미리보기]              │")
        print("├" + "─" * 60 + "┤")
        for line in clean_text.split("\n"):
            print(f"│ {line:<58} │")
        print("├" + "─" * 60 + "┤")
        if web_url:
            print(f"│ 🔘 [인라인 버튼] {button_title} -> {web_url[:42]} │")
        print("└" + "─" * 60 + "┘\n")


# ==============================================================================
# 2. 마감일 파싱 및 D-Day 계산기 (PolicyDeadlineDetector)
# ==============================================================================
class PolicyDeadlineDetector:
    """
    정책 데이터에서 마감일을 추출하고 특정 D-Day(기본: D-3)에 해당하는지 판별
    """
    @staticmethod
    def parse_deadline(date_str: Optional[str]) -> Optional[date]:
        """
        다양한 형식의 날짜 문자열에서 최종 마감일(date) 추출
        예: '2026-10-01', '20261001', '2026.10.01', '2026-09-15 ~ 2026-10-01'
        """
        if not date_str:
            return None
            
        date_str = str(date_str).strip()
        
        # 상시/연중/소진시 등 계속 진행인 경우 종료일 없음
        if any(kw in date_str for kw in ["상시", "연중", "소진시", "수시", "별도"]):
            return None

        # 1. 8자리 연속 숫자 (YYYYMMDD) 추출
        numbers = re.findall(r"\b20\d{6}\b", date_str)
        if numbers:
            try:
                # 범위일 경우 마지막 날짜를 마감일로 간주
                return datetime.strptime(numbers[-1], "%Y%m%d").date()
            except ValueError:
                pass

        # 2. 구분자(.-/)가 포함된 YYYY-MM-DD 형태 추출
        pattern = r"\b(20\d{2})[-./](\d{1,2})[-./](\d{1,2})\b"
        matches = re.findall(pattern, date_str)
        if matches:
            try:
                y, m, d = matches[-1]
                return date(int(y), int(m), int(d))
            except ValueError:
                pass

        # 3. '2026년 10월 1일' 형태
        korean_pattern = r"(20\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일"
        k_matches = re.findall(korean_pattern, date_str)
        if k_matches:
            try:
                y, m, d = k_matches[-1]
                return date(int(y), int(m), int(d))
            except ValueError:
                pass

        return None

    @classmethod
    def calculate_dday(cls, deadline: date, target_date: Optional[date] = None) -> int:
        """
        기준일(기본: 오늘) 대비 남은 일수 계산
        - 3 반환: D-3 (마감 3일 전)
        - 0 반환: D-Day (당일 마감)
        - 음수: 마감 지난 정책
        """
        base_date = target_date or date.today()
        return (deadline - base_date).days


# ==============================================================================
# 3. 정책 데이터 수집 및 관리자 (PolicyAlarmManager)
# ==============================================================================
class PolicyAlarmManager:
    """
    온통청년 API / 로컬 DB / 시드 데이터에서 정책을 로드하고
    마감 3일 전(D-3) 정책을 필터링하여 텔레그램 알림을 전송하는 관리자
    """
    def __init__(self, telegram_client: Optional[TelegramBotClient] = None):
        self.telegram = telegram_client or TelegramBotClient()
        self.detector = PolicyDeadlineDetector()

    def get_seed_policies(self) -> List[Dict[str, Any]]:
        """로컬 시드 데이터 및 샘플 정책 로드"""
        seed_path = os.path.join(os.path.dirname(__file__), "db", "seeds", "mock_policies.json")
        if os.path.exists(seed_path):
            try:
                with open(seed_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️ [정책] 시드 파일 읽기 오류: {e}")
        return []

    def get_ontong_policies(self, page_size: int = 50) -> List[Dict[str, Any]]:
        """온통청년(youthcenter.go.kr) 오픈 API에서 실시간 정책 수집"""
        api_key = os.getenv("YOUTHCENTER_API_KEY") or os.getenv("ONTONG_API_KEY")
        if not api_key:
            return []

        url = "https://www.youthcenter.go.kr/go/ythip/getPlcy"
        params = {
            "apiKeyNm": api_key,
            "pageNum": 1,
            "pageSize": page_size,
            "rtnType": "json"
        }
        headers = {"User-Agent": "Mozilla/5.0"}
        
        try:
            res = requests.get(url, params=params, headers=headers, timeout=12)
            if res.status_code == 200:
                items = res.json().get("result", {}).get("youthPolicyList", [])
                formatted = []
                for item in items:
                    formatted.append({
                        "id": f"ONTONG_{item.get('plcyNo')}",
                        "title": item.get("plcyNm", "제목 없음"),
                        "organization": item.get("sprvsnInstCdNm") or item.get("operInstCdNm") or "정부부처",
                        "category": f"{item.get('lclsfNm', '')} > {item.get('mclsfNm', '')}".strip(" >"),
                        "deadline_raw": item.get("aplyYmd") or item.get("bizPrdEndYmd") or "",
                        "benefit_summary": item.get("plcySprtCn") or item.get("plcyExplnCn") or "",
                        "application_url": item.get("aplyUrlAddr") or item.get("refUrlAddr1") or "https://www.youthcenter.go.kr",
                        "required_documents": item.get("submtDocCn") or "주민등록등본, 신청서 등"
                    })
                return formatted
        except Exception as e:
            print(f"⚠️ [정책] 온통청년 API 호출 실패: {e}")
        return []

    def get_test_policies(self, target_date: Optional[date] = None) -> List[Dict[str, Any]]:
        """
        테스트 및 시연용 정책 데이터 생성
        (기준일 기준 D-3, D-1, D-7 등 다양한 마감일의 정책 포함)
        """
        base_date = target_date or date.today()
        d3_date = base_date + timedelta(days=3)
        d1_date = base_date + timedelta(days=1)
        d7_date = base_date + timedelta(days=7)

        return [
            {
                "id": "TEST-D3-001",
                "title": "2026 청년 도전지원사업 (맞춤형 취업역량 프로그램)",
                "organization": "고용노동부 / 한국고용정보원",
                "category": "일자리 > 취업지원",
                "deadline_raw": d3_date.strftime("%Y-%m-%d"),
                "benefit_summary": "맞춤형 취업역량 프로그램 이수 시 최대 300만원 참여수당 및 인센티브 지급",
                "application_url": "https://www.work.go.kr/youthChallenge",
                "required_documents": "신청서, 구직등록확인서, 개인정보동의서"
            },
            {
                "id": "TEST-D3-002",
                "title": "2026 상반기 청년 월세 한시 특별지원 (2차 접수)",
                "organization": "국토교통부 / LH 한국토지주택공사",
                "category": "주거 > 월세지원",
                "deadline_raw": d3_date.strftime("%Y년 %m월 %d일"),
                "benefit_summary": "실제 납부 임차료 월 최대 20만원씩 12회(총 240만원) 지원",
                "application_url": "https://www.bokjiro.go.kr",
                "required_documents": "확정일자 날인 임대차계약서 사본, 월세이체증빙, 통장사본"
            },
            {
                "id": "TEST-D1-003",
                "title": "청년 국가자격시험 응시료 50% 지원사업",
                "organization": "한국산업인력공단",
                "category": "교육 > 자격취득",
                "deadline_raw": d1_date.strftime("%Y%m%d"),
                "benefit_summary": "국가기술자격시험 응시료 50% 즉시 감면 지원 (연간 3회 한도)",
                "application_url": "https://www.q-net.or.kr",
                "required_documents": "신분증, 응시확인서"
            },
            {
                "id": "TEST-D7-004",
                "title": "청년 도약계좌 정기 가입신청",
                "organization": "금융위원회 / 서민금융진흥원",
                "category": "금융 > 자산형성",
                "deadline_raw": d7_date.strftime("%Y-%m-%d"),
                "benefit_summary": "매월 최대 70만원 저축 시 정부기여금 매칭 및 비과세 혜택",
                "application_url": "https://www.kinfa.or.kr",
                "required_documents": "소득금액증명원, 신분증"
            }
        ]

    def format_telegram_html(self, policy: Dict[str, Any], deadline: date, days_left: int) -> str:
        """
        텔레그램 HTML 서식으로 마감 알림 메시지 포맷팅
        """
        title = policy.get("title", "청년 정책")
        org = policy.get("organization", "정부부처/지자체")
        category = policy.get("category", "청년 혜택")
        summary = policy.get("benefit_summary", "공고문 참조")
        if len(summary) > 80:
            summary = summary[:77] + "..."
            
        docs = policy.get("required_documents") or "공고문 및 신청 사이트 참조"
        if len(docs) > 50:
            docs = docs[:48] + "..."

        deadline_str = deadline.strftime("%Y년 %m월 %d일")
        weekday_kr = ["월", "화", "수", "목", "금", "토", "일"][deadline.weekday()]

        html_message = (
            f"🚨 <b>[청년나침반] 마감 3일 전(D-3) 알림!</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"📌 <b>정책명:</b> {title}\n"
            f"🏢 <b>주관기관:</b> {org} (<i>{category}</i>)\n"
            f"⏳ <b>마감일시:</b> <b>{deadline_str} ({weekday_kr})</b>\n"
            f"⏱️ <b>남은시간:</b> 앞으로 딱 <b>3일</b> 남았습니다!\n\n"
            f"🎁 <b>[주요 혜택]</b>\n{summary}\n\n"
            f"📋 <b>[필수 준비서류]</b>\n<code>{docs}</code>\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"💡 <i>마감일에는 접속자가 몰려 지연될 수 있습니다. 지금 서류를 준비해 미리 접수하세요!</i>"
        )
        return html_message

    def check_and_send_d3_alarms(
        self,
        policies: Optional[List[Dict[str, Any]]] = None,
        target_date: Optional[date] = None,
        target_dday: int = 3,
        force_test: bool = False
    ) -> List[Dict[str, Any]]:
        """
        정책 목록 중 정확히 D-3인 정책을 찾아 텔레그램 메시지를 전송
        """
        base_date = target_date or date.today()
        print(f"\n================================================================================")
        print(f"🔍 [알림 점검 시작] 기준 일자: {base_date.isoformat()} (대상: 마감 D-{target_dday})")
        print(f"================================================================================")

        # 1. 정책 데이터 수집
        policy_pool = []
        if force_test:
            print("🧪 [모드] 테스트 데이터 세트를 로드합니다.")
            policy_pool = self.get_test_policies(base_date)
        elif policies:
            policy_pool = policies
        else:
            print("📡 [데이터] 실시간 정책 데이터를 통합 수집합니다...")
            # 온통청년 API 호출 시도
            ontong_list = self.get_ontong_policies(page_size=30)
            if ontong_list:
                print(f"   - 온통청년 API: {len(ontong_list)}건 수집 완료")
                policy_pool.extend(ontong_list)

            # 로컬 시드 데이터 병합
            seed_list = self.get_seed_policies()
            if seed_list:
                print(f"   - 로컬 DB 시드: {len(seed_list)}건 수집 완료")
                policy_pool.extend(seed_list)

            # 데이터가 부족하면 테스트 데이터도 함께 포함
            if not policy_pool:
                print("   - API/시드 데이터 부재로 테스트 데이터를 사용합니다.")
                policy_pool = self.get_test_policies(base_date)

        print(f"📊 총 검사 대상 정책 수: {len(policy_pool)}건")

        # 2. 마감일 분석 및 D-3 필터링
        matched_policies = []
        for p in policy_pool:
            raw_date = p.get("deadline_raw") or p.get("period_end") or p.get("apply_period") or p.get("period")
            parsed_deadline = self.detector.parse_deadline(raw_date)

            if parsed_deadline:
                days_left = self.detector.calculate_dday(parsed_deadline, base_date)
                p["parsed_deadline"] = parsed_deadline
                p["days_left"] = days_left

                if days_left == target_dday:
                    matched_policies.append((p, parsed_deadline, days_left))

        # 3. 필터링 결과 및 알림 전송
        print(f"\n🎯 [필터링 결과] 마감 D-{target_dday} 대상 정책: {len(matched_policies)}건 발견")
        
        sent_results = []
        if not matched_policies:
            print(f"ℹ️ 오늘({base_date.isoformat()}) 기준 마감 D-{target_dday}에 해당하는 정책이 없습니다.")
            return sent_results

        for idx, (policy, deadline, days_left) in enumerate(matched_policies, start=1):
            title = policy.get("title", "제목 없음")
            apply_url = policy.get("application_url") or policy.get("apply_url") or "https://www.youthcenter.go.kr"
            
            print(f"\n[{idx}/{len(matched_policies)}] 📨 알림 발송 대상: '{title}'")
            print(f"   - 마감일: {deadline.isoformat()} (남은 일수: {days_left}일)")
            print(f"   - 신청링크: {apply_url}")

            # 메시지 구성
            msg_html = self.format_telegram_html(policy, deadline, days_left)

            # 텔레그램 전송
            is_success = self.telegram.send_message(
                text_html=msg_html,
                web_url=apply_url,
                button_title="신청 및 서류 확인"
            )

            sent_results.append({
                "policy_id": policy.get("id"),
                "title": title,
                "deadline": deadline.isoformat(),
                "days_left": days_left,
                "sent_success": is_success
            })

            # 과도한 API 호출 방지를 위한 지연
            time.sleep(0.5)

        print(f"\n✨ [알림 전송 작업 완료] 총 {len(sent_results)}건 처리 완료")
        return sent_results


# ==============================================================================
# 4. 스케줄러 및 대화형 텔레그램 연동 안내 도우미
# ==============================================================================
def print_telegram_setup_guide():
    """텔레그램 봇 토큰 및 Chat ID 발급 방법 안내"""
    guide = """
================================================================================
🔑 [텔레그램 봇 알림 연동 초간단 가이드 (1분 소요)]
================================================================================
텔레그램을 통해 실제 스마트폰이나 PC로 알림을 받으려면 아래 3단계만 진행하세요:

1. 텔레그램에서 봇 생성:
   - 텔레그램 앱 검색창에 @BotFather 검색 후 대화 시작 (/start)
   - /newbot 입력 후 봇 이름 및 아이디 지정 (예: YouthCompassBot)
   - 안내되는 'HTTP API 토큰' 복사
     (예: 7123456789:ABCdefGhIJKlmNoPQRstuVWxyz)

2. 내 Chat ID 확인하기:
   - 생성한 봇(@YourBotName)에게 가서 [시작] 버튼 또는 아무 메시지(/start) 전송
   - 또는 @userinfobot 검색하여 대화 시작 시 나의 숫자 ID(Chat ID)를 즉시 알려줌

3. .env 파일에 등록:
   TELEGRAM_BOT_TOKEN=여기에_발급받은_봇토큰_입력
   TELEGRAM_CHAT_ID=여기에_확인한_숫자ID_입력

💡 팁: TELEGRAM_CHAT_ID를 등록하지 않아도, 봇에게 /start 메시지를 한 번 보내두면
   프로그램이 자동으로 최신 Chat ID를 감지하여 저장합니다!
================================================================================
"""
    print(guide)


def run_daily_scheduler(manager: PolicyAlarmManager, target_hour: int = 9, target_minute: int = 0):
    """
    매일 지정된 시각(기본: 오전 9시 00분)에 자동으로 마감 3일 전 정책을 확인하고 전송하는 데몬
    """
    print(f"\n⏰ [스케줄러 가동] 매일 {target_hour:02d}:{target_minute:02d}에 마감 D-3 정책을 자동 체크합니다.")
    print("   (중단하려면 Ctrl + C 를 누르세요)")
    
    last_run_date = None
    try:
        while True:
            now = datetime.now()
            today_date = now.date()

            # 매일 지정된 시각에 1회 실행
            if now.hour == target_hour and now.minute == target_minute and last_run_date != today_date:
                print(f"\n🔔 [정기 실행 트리거] {now.strftime('%Y-%m-%d %H:%M:%S')}")
                manager.check_and_send_d3_alarms(target_date=today_date, target_dday=3)
                last_run_date = today_date
                time.sleep(60) # 1분 대기하여 중복 실행 방지
            
            time.sleep(10)
    except KeyboardInterrupt:
        print("\n🛑 스케줄러가 사용자에 의해 중단되었습니다.")


# ==============================================================================
# 5. CLI 진입점 (Main)
# ==============================================================================
def main():
    parser = argparse.ArgumentParser(description="청년정책 마감 3일 전(D-3) 텔레그램 알림 전송 프로그램")
    parser.add_argument("--test", action="store_true", help="테스트 데이터를 사용하여 D-3 알림 발송 시뮬레이션")
    parser.add_argument("--guide", action="store_true", help="텔레그램 봇 토큰 발급 및 설정 가이드 출력")
    parser.add_argument("--schedule", action="store_true", help="매일 아침 9시 정기 알림 스케줄러 백그라운드 모드 실행")
    parser.add_argument("--days", type=int, default=3, help="알림을 보낼 마감 D-Day 기준일 (기본: 3)")
    parser.add_argument("--target-date", type=str, default=None, help="기준 날짜 설정 (YYYY-MM-DD, 기본: 오늘)")

    args = parser.parse_args()

    if args.guide:
        print_telegram_setup_guide()
        return

    # 기준일자 파싱
    target_date = None
    if args.target_date:
        try:
            target_date = datetime.strptime(args.target_date, "%Y-%m-%d").date()
        except ValueError:
            print("❌ --target-date 형식이 올바르지 않습니다. YYYY-MM-DD 형식으로 입력해주세요.")
            return

    manager = PolicyAlarmManager()

    if args.schedule:
        run_daily_scheduler(manager, target_hour=9, target_minute=0)
    elif args.test:
        print("🧪 [--test 플래그 실행] 가상 D-3 정책으로 즉시 발송 테스트를 시작합니다.")
        manager.check_and_send_d3_alarms(target_date=target_date, target_dday=args.days, force_test=True)
    else:
        # 기본 실행: 실제/통합 정책 데이터에서 D-3 검사
        manager.check_and_send_d3_alarms(target_date=target_date, target_dday=args.days, force_test=False)


if __name__ == "__main__":
    main()
