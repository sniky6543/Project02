"""
summarize_and_save_policies.py
policy_data_schema.md 표준 규격에 맞추어 청년 정책을 AI 요약 및 정규화하고
JSON 파일로 저장하는 데이터 파이프라인 스크립트
"""

import os
import sys
import json
import re
import argparse
import warnings
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

# Windows 콘솔 인코딩 대응
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# 단순 경고 억제
warnings.filterwarnings("ignore", category=DeprecationWarning)

from dotenv import load_dotenv
load_dotenv()

# 클라이언트 임포트 (ai 또는 backend/app)
try:
    from ai.bokjiro_client import BokjiroClient
    from ai.youthcenter_client import YouthCenterClient
except ImportError:
    try:
        from bokjiro_client import BokjiroClient
        from youthcenter_client import YouthCenterClient
    except ImportError:
        from backend.app.bokjiro_client import BokjiroClient
        from backend.app.youthcenter_client import YouthCenterClient


# ==============================================================================
# 1. LLM 요약기 (Ollama 연동 및 Fallback 지원)
# ==============================================================================
class PolicySummarizer:
    def __init__(self, model_name: str = "llama3"):
        self.model_name = model_name
        self.llm = None
        self._init_llm()

    def _init_llm(self):
        try:
            import requests
            # Ollama 서버 생존 여부 1초 핑 테스트
            res = requests.get("http://localhost:11434", timeout=1)
            if res.status_code == 200:
                from langchain_community.llms import Ollama
                self.llm = Ollama(model=self.model_name, temperature=0)
                print(f"🤖 [AI 엔진] Ollama ({self.model_name}) 모델 연결 성공")
        except Exception:
            print("💡 [알림] 로컬 Ollama 미실행 상태 - 규칙 기반 지능형 요약기로 자동 전환됩니다.")
            self.llm = None

    def summarize(self, policy: Dict[str, Any]) -> Tuple[str, str]:
        """
        정책 데이터를 분석하여 
        1) policy_data_schema.md 규격의 1~2줄 핵심 summary
        2) 상세 3줄 AI 요약(ai_summary_3lines) 생성
        """
        raw_text = f"""
정책명: {policy.get('title', '')}
소관부처/기관: {policy.get('organization', '')}
지원대상: {policy.get('target_age', '')} / {policy.get('target_condition', '')}
지원내용: {policy.get('support_content', '') or policy.get('summary', '')}
신청기간: {policy.get('period', '')}
"""
        # 1. Ollama LLM이 사용 가능할 경우 실시간 생성
        if self.llm:
            try:
                prompt = (
                    "당신은 대한민국 청년정책 전문 AI 큐레이터입니다.\n"
                    "아래 정책 정보를 정밀 분석하여, 청년들이 꼭 알아야 할 핵심을 한국어로 딱 3줄로 요약하세요.\n"
                    "다른 인사말이나 영어는 넣지 말고 반드시 [1], [2], [3] 번호 형식으로만 작성하세요.\n\n"
                    f"{raw_text}\n\n[3줄 요약]:"
                )
                ai_3lines = self.llm.invoke(prompt).strip()
                # 3줄 요약 중 첫 번째 줄 또는 정제된 문장을 1~2줄 summary로 채택
                clean_lines = [line.strip() for line in ai_3lines.split("\n") if line.strip()]
                short_summary = re.sub(r"^\[\d+\]\s*", "", clean_lines[0]) if clean_lines else policy.get('summary', '')
                return short_summary, ai_3lines
            except Exception as e:
                print(f"⚠️ [AI 요약 오류: {e}] 규칙 기반 요약으로 대체합니다.")

        # 2. Fallback: 규칙 기반 지능형 요약
        support = policy.get('support_content', '') or policy.get('summary', '')
        # 공백 정리
        clean_support = " ".join(support.split())
        short_summary = clean_support[:120] + ("..." if len(clean_support) > 120 else "")
        
        target = policy.get('target_age', '청년 대상')
        organ = policy.get('organization', '정부부처')
        ai_3lines = (
            f"[1] {policy.get('title')}은 {organ}에서 주관하는 청년 지원 정책입니다.\n"
            f"[2] 지원대상은 {target}이며, {short_summary}\n"
            f"[3] 신청기간은 {policy.get('period', '공고 참조')}이며 온라인/방문 신청이 가능합니다."
        )
        return short_summary, ai_3lines


# ==============================================================================
# 2. 데이터 정규화 및 스키마 변환기 (SchemaMapper)
# ==============================================================================
def normalize_to_schema(raw_item: Dict[str, Any], source_type: str, summarizer: PolicySummarizer) -> Dict[str, Any]:
    """
    db/policy_data_schema.md 에 명시된 12개 필드로 정확히 표준화
    """
    # 1. 고유 ID 추출
    policy_id = raw_item.get("id")
    if not policy_id:
        if source_type == "ONTONG":
            plcy_no = raw_item.get("plcyNo") or raw_item.get("plcy_no") or f"{datetime.now().strftime('%Y%m%d%H%M%S')}"
            policy_id = f"ONTONG_{plcy_no}"
        elif source_type == "BOKJIRO":
            serv_id = raw_item.get("servId") or raw_item.get("serv_id") or "000"
            policy_id = f"BOKJIRO_{serv_id}"
        else:
            policy_id = f"DATA_GO_{raw_item.get('seq', '001')}"

    # 2. 출처
    source = raw_item.get("source") or ("온통청년 (youthcenter.go.kr)" if source_type == "ONTONG" else "복지로 (bokjiro.go.kr)")

    # 3. 제목
    title = raw_item.get("title") or raw_item.get("plcyNm") or raw_item.get("servNm") or "청년 지원 정책"

    # 4. 카테고리
    category = raw_item.get("category")
    if not category:
        lclsf = raw_item.get("lclsfNm", "")
        mclsf = raw_item.get("mclsfNm", "")
        category = f"{lclsf} > {mclsf}".strip(" >") or raw_item.get("jurMnofNm") or "청년복지"

    # 5. 주관기관
    organ = (
        raw_item.get("organization") or
        raw_item.get("sprvsnInstCdNm") or
        raw_item.get("operInstCdNm") or
        raw_item.get("jurMnofNm") or
        "정부부처/지자체"
    )

    # 6. 대상 연령
    target_age = raw_item.get("target_age")
    if not target_age:
        min_age = raw_item.get("sprtTrgtMinAge")
        max_age = raw_item.get("sprtTrgtMaxAge")
        if min_age and max_age and (str(min_age) != "0" or str(max_age) != "0"):
            target_age = f"만 {min_age}세 ~ {max_age}세"
        else:
            target_age = "만 19세~34세 청년"

    # 7. 자격 조건
    condition = (
        raw_item.get("target_condition") or
        raw_item.get("ptcpPrpTrgtCn") or
        raw_item.get("addAplyQlfcCndCn") or
        raw_item.get("tgtrDtlCn") or
        raw_item.get("slctCritCn") or
        "공고문 자격요건 참조"
    )
    condition = " ".join(str(condition).split())

    # 8. 지원 내용
    support = (
        raw_item.get("support_content") or
        raw_item.get("plcySprtCn") or
        raw_item.get("alwServCn") or
        raw_item.get("wlfareInfoOutlCn") or
        raw_item.get("summary") or
        ""
    )
    support = " ".join(str(support).split())

    # 9. 기간
    period = (
        raw_item.get("period") or
        raw_item.get("apply_period") or
        raw_item.get("aplyYmd") or
        raw_item.get("bizPrdEndYmd") or
        "상시 접수 / 공고 참조"
    )

    # 10. 신청 방법 & URL
    apply_method = (
        raw_item.get("apply_method") or
        raw_item.get("plcyAplyMthdCn") or
        raw_item.get("servDtlLink") or
        "온라인 또는 방문 접수"
    )
    apply_method = " ".join(str(apply_method).split())

    apply_url = (
        raw_item.get("apply_url") or
        raw_item.get("aplyUrlAddr") or
        raw_item.get("refUrlAddr1") or
        "https://www.youthcenter.go.kr"
    )

    # 임시 객체로 요약기 실행
    temp_obj = {
        "title": title,
        "organization": organ,
        "target_age": target_age,
        "target_condition": condition,
        "support_content": support,
        "summary": raw_item.get("summary", support),
        "period": period
    }
    short_summary, ai_3lines = summarizer.summarize(temp_obj)

    # policy_data_schema.md 최종 스키마 구조
    normalized_record = {
        "id": policy_id,
        "source": source,
        "title": title,
        "category": category,
        "organization": organ,
        "summary": short_summary,
        "support_content": support,
        "target_age": target_age,
        "target_condition": condition,
        "apply_method": apply_method,
        "apply_url": apply_url,
        "period": period,
        "ai_summary_3lines": ai_3lines  # 부가 AI 요약 필드
    }
    return normalized_record


# ==============================================================================
# 3. 데이터 로드 및 파이프라인 실행
# ==============================================================================
def collect_policies_from_apis(limit_each: int = 3) -> List[Dict[str, Any]]:
    """온통청년 및 복지로 API에서 정책 수집"""
    raw_list = []
    
    # 1. 온통청년 API 수집
    print(f"\n📡 [1/2] 온통청년 오픈 API에서 {limit_each}건 수집 중...")
    try:
        yc = YouthCenterClient()
        yc_res = yc.get_policies(query="청년", page_size=limit_each)
        yc_items = yc_res.get("result", {}).get("youthPolicyList", [])
        for item in yc_items:
            item["_source_type"] = "ONTONG"
            raw_list.append(item)
        print(f"   ✅ 온통청년 {len(yc_items)}건 수집 완료")
    except Exception as e:
        print(f"   ⚠️ 온통청년 API 수집 실패: {e}")

    # 2. 복지로 API 수집
    print(f"\n📡 [2/2] 복지로 공공데이터 API에서 {limit_each}건 수집 중...")
    try:
        bj = BokjiroClient()
        bj_res = bj.get_central_welfare_list(search_wrd="청년", num_of_rows=limit_each)
        bj_items = bj_res.get("servList", [])
        if isinstance(bj_items, dict):
            bj_items = [bj_items]
        for item in bj_items:
            item["_source_type"] = "BOKJIRO"
            raw_list.append(item)
        print(f"   ✅ 복지로 {len(bj_items)}건 수집 완료")
    except Exception as e:
        print(f"   ⚠️ 복지로 API 수집 실패: {e}")

    return raw_list


def collect_policies_from_file(file_path: str, limit: int = 10) -> List[Dict[str, Any]]:
    """기존 수집된 json 파일에서 정책 로드"""
    print(f"\n📂 [파일 모드] 기존 수집 파일({os.path.basename(file_path)})에서 데이터 로드 중...")
    if not os.path.exists(file_path):
        print(f"❌ 파일을 찾을 수 없습니다: {file_path}")
        return []

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    items = data[:limit]
    for item in items:
        item["_source_type"] = "FILE"
    print(f"   ✅ {len(items)}건의 정책 데이터 로드 완료")
    return items


def main():
    parser = argparse.ArgumentParser(description="policy_data_schema.md 규격에 맞춘 청년정책 AI 요약 및 JSON 저장 도구")
    parser.add_argument("--source", choices=["api", "file"], default="api", help="데이터 원본 (api: 실시간 API, file: 기존 JSON 파일)")
    parser.add_argument("--limit", type=int, default=3, help="수집/요약할 정책 개수 (기본: 3건)")
    parser.add_argument("--output", type=str, default=None, help="결과를 저장할 JSON 파일 경로")
    parser.add_argument("--to-supabase", action="store_true", help="요약 완료 후 Supabase 데이터베이스에 자동 Upsert 저장")

    args = parser.parse_args()

    print("=" * 80)
    print("📋 [청년나침반] policy_data_schema.md 기반 AI 정책 요약 & JSON 저장 파이프라인")
    print("=" * 80)

    # 1. 요약 엔진 초기화
    summarizer = PolicySummarizer(model_name="llama3")

    # 2. 원시 데이터 수집
    if args.source == "api":
        raw_policies = collect_policies_from_apis(limit_each=args.limit)
    else:
        # 기존 수집 파일 검색
        db_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "db")
        target_file = None
        for fname in os.listdir(db_dir):
            if fname.endswith(".json") and "2026" in fname:
                target_file = os.path.join(db_dir, fname)
                break
        if not target_file:
            target_file = os.path.join(db_dir, "seeds", "mock_policies.json")

        raw_policies = collect_policies_from_file(target_file, limit=args.limit)

    if not raw_policies:
        print("❌ 처리할 정책 데이터가 없습니다.")
        return

    # 3. 스키마 정규화 및 AI 요약 적용
    print(f"\n🔄 총 {len(raw_policies)}건의 정책을 policy_data_schema.md 스키마로 정규화 및 AI 요약 중...")
    summarized_dataset = []

    for idx, raw in enumerate(raw_policies, start=1):
        source_type = raw.get("_source_type", "ONTONG")
        title = raw.get("title") or raw.get("plcyNm") or raw.get("servNm") or "정책"
        print(f"\n  [{idx}/{len(raw_policies)}] 📝 요약 진행: '{title}'")
        
        normalized = normalize_to_schema(raw, source_type, summarizer)
        summarized_dataset.append(normalized)
        print(f"       ✅ 완료 -> ID: {normalized['id']} | 요약: {normalized['summary'][:50]}...")

    # 4. JSON 파일 저장
    default_output = os.path.join(os.path.dirname(os.path.abspath(__file__)), "summarized_policies.json")
    save_path = args.output or default_output
    
    with open(save_path, "w", encoding="utf-8") as f:
        json.dump(summarized_dataset, f, ensure_ascii=False, indent=2)

    # db/ 디렉토리에도 동기화 복사본 저장
    db_copy_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "db", "summarized_policies.json")
    try:
        with open(db_copy_path, "w", encoding="utf-8") as f:
            json.dump(summarized_dataset, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

    print("\n" + "=" * 80)
    print(f"🎉 [성공] 총 {len(summarized_dataset)}건의 요약 데이터가 JSON 파일로 저장되었습니다!")
    print(f"📁 저장 경로 1 (AI 디렉토리): {save_path}")
    print(f"📁 저장 경로 2 (DB 디렉토리): {db_copy_path}")
    print("=" * 80)

    # 5. 샘플 출력 (첫 번째 항목)
    if summarized_dataset:
        print("\n🔍 [저장된 JSON 스키마 미리보기 - 1번 레코드]")
        print(json.dumps(summarized_dataset[0], ensure_ascii=False, indent=2))

    # 6. Supabase DB 저장 (옵션)
    if args.to_supabase:
        print("\n" + "=" * 80)
        print("☁️ [Supabase 동기화] Supabase DB 업로드 시작")
        print("=" * 80)
        try:
            from save_to_supabase import SupabasePolicyUploader
        except ImportError:
            sys.path.append(os.path.dirname(os.path.abspath(__file__)))
            from save_to_supabase import SupabasePolicyUploader

        uploader = SupabasePolicyUploader()
        res = uploader.upsert_policies(summarized_dataset)
        if res.get("success"):
            print(f"🎉 Supabase 저장 완료: {res.get('inserted_count')}건")
        else:
            print(f"⚠️ Supabase 저장 알림: {res.get('message')}")


if __name__ == "__main__":
    main()

