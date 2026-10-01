"""
youthcenter_test.py: 온통청년(youthcenter.go.kr) 오픈 API 연동 및 AI 정책 요약 검증 스크립트
"""

import sys
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from backend.app.youthcenter_client import YouthCenterClient
from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate

def test_youthcenter():
    print("=" * 75)
    print("🇰🇷 [온통청년 (Youth Center)] 청년정책 오픈 API 연동 테스트")
    print("=" * 75)

    client = YouthCenterClient()

    # 1. 정책 검색 (예: '월세' 관련 주거 정책)
    search_keyword = "월세"
    print(f"\n🔍 [1단계] 온통청년 정책 검색 중 (키워드: '{search_keyword}', 2건 조회)...")
    res = client.get_policies(query=search_keyword, page_size=2)

    if "error" in res:
        print(f"❌ 온통청년 API 호출 실패: {res['error']}")
        return

    result_data = res.get("result", {})
    tot_count = result_data.get("pagging", {}).get("totCount", 0)
    policy_list = result_data.get("youthPolicyList", [])

    print(f"✅ 온통청년 전체 등록 정책 중 '{search_keyword}' 관련 정책 총 {tot_count}건 검색됨.")

    if not policy_list:
        print("⚠️ 검색된 정책이 없습니다.")
        return

    selected_policy = policy_list[0]

    for i, p in enumerate(policy_list, 1):
        print(f"\n  [{i}] {p.get('plcyNm', '')} (정책번호: {p.get('plcyNo', '')})")
        print(f"      - 분야: {p.get('lclsfNm', '')} > {p.get('mclsfNm', '')}")
        print(f"      - 대상연령: 만 {p.get('sprtTrgtMinAge', '')}세 ~ 만 {p.get('sprtTrgtMaxAge', '')}세")
        print(f"      - 주관기관: {p.get('sprvsnInstCdNm', '')}")
        print(f"      - 지원내용: {p.get('plcySprtCn', '')[:90]}...")

    # 2. 선택된 정책을 Ollama Llama3로 3줄 요약
    print("\n" + "=" * 75)
    print("🤖 [2단계] 온통청년 실데이터 기반 AI(Ollama Llama3) 3줄 요약")
    print("=" * 75)

    policy_text = f"""
정책명: {selected_policy.get('plcyNm', '')}
분야: {selected_policy.get('lclsfNm', '')} - {selected_policy.get('mclsfNm', '')}
주관기관: {selected_policy.get('sprvsnInstCdNm', '')}
지원대상연령: 만 {selected_policy.get('sprtTrgtMinAge', '')}세 ~ {selected_policy.get('sprtTrgtMaxAge', '')}세
지원내용: {selected_policy.get('plcySprtCn', '')}
신청방법: {selected_policy.get('plcyAplyMthdCn', '')}
제출서류: {selected_policy.get('sbmsnDcmntCn', '')}
신청사이트: {selected_policy.get('aplyUrlAddr', '') or selected_policy.get('refUrlAddr1', '')}
"""

    template = """
당신은 대한민국 청년정책 전문 AI 큐레이터입니다.
아래 온통청년 공식 정책 데이터를 정밀 분석하여, 청년들이 꼭 알아야 할 핵심을 100% 한국어로 딱 3줄로 요약하세요.
영어나 인사말 없이 [1], [2], [3] 번호 매긴 3줄 형식으로만 작성하세요.

[정책 원문 데이터]
{content}

[3줄 요약]:
"""
    prompt = PromptTemplate(input_variables=["content"], template=template)
    llm = Ollama(model="llama3", temperature=0)

    print(f"📰 대상 정책: {selected_policy.get('plcyNm', '')}")
    print("📝 [AI 3줄 요약 결과]:")
    summary = llm.invoke(prompt.format(content=policy_text))
    print(summary.strip())

    print("\n" + "=" * 75)
    print("🎉 온통청년 API 연동 및 AI 요약 테스트 완료!")
    print("=" * 75)

if __name__ == "__main__":
    test_youthcenter()
