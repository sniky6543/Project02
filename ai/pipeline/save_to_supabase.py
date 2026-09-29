"""
save_to_supabase.py
AI 요약 및 정규화된 청년 정책 데이터를 Supabase 데이터베이스에 저장(Upsert)하는 스크립트
- Supabase REST API(PostgREST)를 활용하여 추가 패키지 설치 없이 즉시 실행
- db/schema.sql의 policies 테이블 및 policy_data_schema.md 표준 규격 양방향 자동 매핑
- 중복 방지를 위한 UPSERT (resolution=merge-duplicates) 처리
- 대량 배치 저장 및 실시간 상태 피드백 지원
"""

import os
import sys
import json
import re
import argparse
from datetime import datetime, date
from typing import List, Dict, Any, Optional, Tuple
import requests
from dotenv import load_dotenv

# Windows 콘솔 인코딩 대응
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

load_dotenv()


# ==============================================================================
# 1. Supabase API 클라이언트
# ==============================================================================
class SupabasePolicyUploader:
    def __init__(self, supabase_url: Optional[str] = None, supabase_key: Optional[str] = None):
        self.url = (supabase_url or os.getenv("SUPABASE_URL", "")).strip().rstrip("/")
        self.key = (supabase_key or os.getenv("SUPABASE_KEY", "")).strip()

        # 기본 플레이스홀더 체크
        self.is_configured = (
            bool(self.url) and 
            bool(self.key) and 
            "your-project" not in self.url and 
            "your_supabase" not in self.key
        )

    def _get_headers(self) -> Dict[str, str]:
        return {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=representation"  # UPSERT
        }

    def check_connection(self, table_name: str = "policies") -> Tuple[bool, str]:
        """Supabase 연결 및 테이블 접근 가능 여부 테스트"""
        if not self.is_configured:
            return False, "SUPABASE_URL 또는 SUPABASE_KEY가 올바르게 설정되지 않았습니다 (.env 파일 확인 필요)."

        endpoint = f"{self.url}/rest/v1/{table_name}?select=id&limit=1"
        try:
            res = requests.get(endpoint, headers=self._get_headers(), timeout=7)
            if res.status_code == 200:
                return True, f"Supabase '{table_name}' 테이블 연결 성공!"
            elif res.status_code == 404:
                return False, f"'{table_name}' 테이블을 찾을 수 없습니다 (404 Not Found)."
            elif res.status_code in [401, 403]:
                return False, f"Supabase 인증 실패 ({res.status_code}): API Key를 확인해주세요."
            else:
                return False, f"Supabase 응답 오류 ({res.status_code}): {res.text}"
        except Exception as e:
            return False, f"Supabase 서버 연결 실패: {e}"

    def parse_age_limits(self, age_str: Optional[str]) -> Tuple[int, int]:
        """연령 문자열에서 min_age, max_age 추출 (예: '만 19세~34세' -> 19, 34)"""
        if not age_str:
            return 19, 34
        numbers = [int(n) for n in re.findall(r"\d+", str(age_str))]
        if len(numbers) >= 2:
            return min(numbers[0], numbers[1]), max(numbers[0], numbers[1])
        elif len(numbers) == 1:
            return numbers[0], 39
        return 19, 34

    def parse_date(self, date_str: Optional[str]) -> Optional[str]:
        """YYYYMMDD 또는 YYYY-MM-DD -> YYYY-MM-DD 형식으로 변환"""
        if not date_str:
            return None
        cleaned = re.sub(r"[^0-9]", "", str(date_str))
        if len(cleaned) == 8:
            try:
                dt = datetime.strptime(cleaned, "%Y%m%d")
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                pass
        return None

    def transform_to_db_schema(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """
        policy_data_schema.md 형식의 데이터를 
        db/schema.sql의 policies 테이블 컬럼 형식에 맞추어 변환
        """
        # 연령 파싱
        min_age, max_age = self.parse_age_limits(item.get("target_age"))

        # 날짜 파싱
        start_date = self.parse_date(item.get("period_sdate"))
        end_date = self.parse_date(item.get("period_edate"))
        if not end_date:
            # period 필드에서 날짜 탐색
            raw_period = str(item.get("period", ""))
            numbers = re.findall(r"\b20\d{6}\b", raw_period)
            if numbers:
                end_date = self.parse_date(numbers[-1])
                if len(numbers) > 1 and not start_date:
                    start_date = self.parse_date(numbers[0])

        # 혜택 요약 및 상세 구성
        summary = item.get("summary") or item.get("benefit_summary") or item.get("title", "")
        support = item.get("support_content") or item.get("benefit_details") or ""
        ai_3lines = item.get("ai_summary_3lines", "")
        
        details = support
        if ai_3lines and ai_3lines not in details:
            details = f"{support}\n\n[AI 3줄 요약]\n{ai_3lines}".strip()

        # policies 테이블 스키마에 대응
        record = {
            "id": str(item.get("id")),
            "title": str(item.get("title", "제목 없음"))[:255],
            "organization": str(item.get("organization", "정부부처/지자체"))[:150],
            "category": str(item.get("category", "청년지원"))[:50],
            "status": str(item.get("status", "접수중"))[:30],
            "benefit_summary": summary,
            "benefit_details": details or summary,
            "target_age": str(item.get("target_age", "만 19세 ~ 34세"))[:50],
            "min_age": min_age,
            "max_age": max_age,
            "income_condition": str(item.get("target_condition", "제한없음"))[:150],
            "application_url": str(item.get("apply_url") or item.get("application_url") or "https://www.youthcenter.go.kr"),
            "residence_condition": "전국",
            "employment_condition": "제한없음",
            "view_count": int(item.get("view_count", 0))
        }

        if start_date:
            record["period_start"] = start_date
        if end_date:
            record["period_end"] = end_date

        return record

    def upsert_policies(self, policies: List[Dict[str, Any]], table_name: str = "policies", batch_size: int = 50) -> Dict[str, Any]:
        """
        정책 목록을 Supabase DB에 배치 단위로 Upsert 전송
        """
        if not self.is_configured:
            return {
                "success": False,
                "message": "Supabase 설정이 누락되었습니다. .env 파일에 SUPABASE_URL 및 SUPABASE_KEY를 입력해주세요.",
                "inserted_count": 0
            }

        endpoint = f"{self.url}/rest/v1/{table_name}"
        headers = self._get_headers()

        # 데이터 변환 (schema.sql 형태 우선 매핑)
        transformed_records = [self.transform_to_db_schema(p) for p in policies]
        total_records = len(transformed_records)
        successful_count = 0
        errors = []

        print(f"\n🚀 [Supabase 업로드 시작] 대상 테이블: '{table_name}' | 총 {total_records}건")

        for i in range(0, total_records, batch_size):
            batch = transformed_records[i:i + batch_size]
            try:
                res = requests.post(endpoint, headers=headers, json=batch, timeout=20)
                if res.status_code in [200, 201]:
                    successful_count += len(batch)
                    print(f"   ✅ 배치 [{i+1} ~ {min(i+batch_size, total_records)}] 저장 성공 ({len(batch)}건)")
                else:
                    # 혹시 스키마 차이로 실패했을 경우, 변환 전 원본 레코드 형태로 재시도
                    print(f"   ⚠️ 배치 저장 1차 응답 ({res.status_code}): {res.text[:100]}... 원본 규격으로 대체 시도 중...")
                    raw_batch = policies[i:i + batch_size]
                    retry_res = requests.post(endpoint, headers=headers, json=raw_batch, timeout=20)
                    if retry_res.status_code in [200, 201]:
                        successful_count += len(raw_batch)
                        print(f"   ✅ 원본 규격 배치 [{i+1} ~ {min(i+batch_size, total_records)}] 저장 성공 ({len(raw_batch)}건)")
                    else:
                        error_msg = f"배치 {i//batch_size + 1} 실패 ({res.status_code}): {res.text}"
                        errors.append(error_msg)
                        print(f"   ❌ {error_msg}")
            except Exception as e:
                err = f"배치 {i//batch_size + 1} 네트워크 오류: {e}"
                errors.append(err)
                print(f"   ❌ {err}")

        return {
            "success": successful_count > 0,
            "total_attempted": total_records,
            "inserted_count": successful_count,
            "errors": errors
        }


# ==============================================================================
# 2. CLI 안내 및 실행 제어
# ==============================================================================
def print_supabase_guide():
    guide = """
================================================================================
🔑 [Supabase 연결 설정 안내]
================================================================================
현재 .env 파일에 등록된 Supabase 정보가 기본 예시(placeholder) 상태입니다.

실제 Supabase 프로젝트에 데이터를 저장하려면:
1. Supabase 대시보드(https://supabase.com/dashboard) 접속
2. 프로젝트 선택 > 좌측 하단 [Project Settings] (⚙️ 아이콘) 클릭
3. [Configuration] > [Data API] (또는 API 메뉴) 클릭
4. 아래 2가지 값을 복사하여 .env 파일에 입력:
   - Project URL -> SUPABASE_URL=https://your-real-id.supabase.co
   - Project API Keys의 'service_role' 또는 'anon' -> SUPABASE_KEY=your_real_key_here

💡 팁: 명령줄에서 직접 입력하여 실행할 수도 있습니다:
   python ai/save_to_supabase.py --url "https://xxx.supabase.co" --key "eyJhbGciOi..."
================================================================================
"""
    print(guide)


def main():
    parser = argparse.ArgumentParser(description="AI 요약 청년정책 데이터를 Supabase DB에 저장")
    parser.add_argument("--file", type=str, default=None, help="저장할 JSON 파일 경로 (기본: ai/summarized_policies.json)")
    parser.add_argument("--table", type=str, default="policies", help="Supabase 테이블명 (기본: policies)")
    parser.add_argument("--url", type=str, default=None, help="Supabase 프로젝트 URL")
    parser.add_argument("--key", type=str, default=None, help="Supabase API Key")
    parser.add_argument("--guide", action="store_true", help="Supabase 설정 가이드 출력")

    args = parser.parse_args()

    if args.guide:
        print_supabase_guide()
        return

    # 1. 파일 탐색 및 로드
    file_path = args.file
    if not file_path:
        # 우선순위: ai/summarized_policies.json -> db/summarized_policies.json
        candidate_paths = [
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "summarized_policies.json"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "db", "summarized_policies.json"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "db", "seeds", "mock_policies.json")
        ]
        for p in candidate_paths:
            if os.path.exists(p):
                file_path = p
                break

    if not file_path or not os.path.exists(file_path):
        print("❌ 저장할 정책 JSON 파일을 찾을 수 없습니다. 먼저 ai/summarize_and_save_policies.py를 실행해주세요.")
        return

    print("=" * 80)
    print("📤 [청년나침반] Supabase 데이터베이스 정책 데이터 저장(Upsert) 파이프라인")
    print("=" * 80)
    print(f"📄 대상 파일: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        policy_data = json.load(f)

    if isinstance(policy_data, dict) and "policies" in policy_data:
        policy_data = policy_data["policies"]

    print(f"📊 로드된 정책 수: {len(policy_data)}건")

    # 2. Supabase 업로더 초기화
    uploader = SupabasePolicyUploader(supabase_url=args.url, supabase_key=args.key)

    # 3. 연결 테스트
    is_connected, msg = uploader.check_connection(table_name=args.table)
    print(f"\n📡 [연결 점검] {msg}")

    if not is_connected:
        print_supabase_guide()
        print("\n💡 실제 Supabase 접속 정보가 .env에 입력되면 즉시 원격 저장이 수행됩니다.")
        return

    # 4. Upsert 실행
    result = uploader.upsert_policies(policies=policy_data, table_name=args.table)

    print("\n" + "=" * 80)
    if result["success"]:
        print(f"🎉 [성공] 총 {result['inserted_count']}/{result['total_attempted']}건의 정책이 Supabase '{args.table}' 테이블에 저장/갱신되었습니다!")
    else:
        print(f"❌ [실패] 저장 작업 중 오류가 발생했습니다.")
        for err in result.get("errors", []):
            print(f"   • {err}")
    print("=" * 80)


if __name__ == "__main__":
    main()
