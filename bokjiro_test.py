"""
bokjiro_test.py: 복지로 중앙부처 및 지자체 복지서비스 API 연동 검증 및 AI 요약 테스트 스크립트
"""

import sys
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from backend.app.bokjiro_client import BokjiroClient
from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate

def test_bokjiro_integration():
    print("=" * 70)
    print("🏛️ [1단계] 복지로(한국사회보장정보원) 공공데이터 API 클라이언트 초기화")
    print("=" * 70)
    client = BokjiroClient()
    
    # -------------------------------------------------------------
    # 1. 중앙부처 복지서비스 테스트
    # -------------------------------------------------------------
    print("\n🔍 [2단계] 중앙부처 청년 복지서비스 목록 조회 중 (키워드: '청년')...")
    central_res = client.get_central_welfare_list(search_wrd="청년", life_array="청년", num_of_rows=2)
    
    if "error" in central_res:
        print(f"❌ 중앙부처 조회 실패: {central_res['error']}")
        return
        
    total_count = central_res.get("totalCount", "0")
    print(f"✅ 중앙부처 청년 복지서비스 총 {total_count}건 검색됨.")
    
    serv_list = central_res.get("servList", [])
    if isinstance(serv_list, dict):
        serv_list = [serv_list]
        
    selected_central_policy = None
    for i, item in enumerate(serv_list, 1):
        serv_id = item.get("servId", "")
        serv_nm = item.get("servNm", "")
        jur_org = item.get("jurMnofNm", "")
        digest = item.get("servDgst", "")
        print(f"\n  [{i}] {serv_nm} (ID: {serv_id})")
        print(f"      - 소관부처: {jur_org}")
        print(f"      - 요약: {digest[:80]}...")
        if not selected_central_policy:
            selected_central_policy = item

    # 중앙부처 1건 상세 조회
    if selected_central_policy:
        target_id = selected_central_policy["servId"]
        print(f"\n📄 [3단계] 중앙부처 정책 상세 조회 (ID: {target_id})...")
        detail_res = client.get_central_welfare_detail(target_id)
        wanted_dtl = detail_res.get("wantedDtl", detail_res)
        print(f"  - 지원대상: {wanted_dtl.get('tgtrDtlCn', '정보 없음')[:90]}...")
        print(f"  - 급여내용: {wanted_dtl.get('alwServCn', '정보 없음')[:90]}...")

    # -------------------------------------------------------------
    # 2. 지자체 복지서비스 테스트 (경상남도 밀양시)
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    print("📍 [4단계] 지자체 복지서비스 목록 조회 중 (지역: '경상남도 밀양시')...")
    print("=" * 70)
    local_res = client.get_local_welfare_list(ctpv_nm="경상남도", sgg_nm="밀양시", num_of_rows=2)
    
    if "error" in local_res:
        print(f"❌ 지자체 조회 실패: {local_res['error']}")
    else:
        local_total = local_res.get("totalCount", "0")
        print(f"✅ 경상남도 밀양시 지자체 복지서비스 총 {local_total}건 검색됨.")
        local_list = local_res.get("servList", [])
        if isinstance(local_list, dict):
            local_list = [local_list]
            
        selected_local_policy = None
        for i, item in enumerate(local_list, 1):
            serv_id = item.get("servId", "")
            serv_nm = item.get("servNm", "")
            dept_nm = item.get("bizChrDeptNm", "")
            digest = item.get("servDgst", "")
            print(f"\n  [{i}] {serv_nm} (ID: {serv_id})")
            print(f"      - 담당부서: {dept_nm}")
            print(f"      - 요약: {digest[:80]}...")
            if not selected_local_policy:
                selected_local_policy = item
                
        # 지자체 1건 상세 조회
        if selected_local_policy:
            local_id = selected_local_policy["servId"]
            print(f"\n📄 [5단계] 지자체 정책 상세 조회 (ID: {local_id})...")
            local_detail_res = client.get_local_welfare_detail(local_id)
            local_wanted = local_detail_res.get("wantedDtl", local_detail_res)
            print(f"  - 지원대상: {local_wanted.get('sprtTrgtCn', '정보 없음')[:90]}...")
            print(f"  - 지원내용: {local_wanted.get('alwServCn', '정보 없음')[:90]}...")
            print(f"  - 신청방법: {local_wanted.get('aplyMtdCn', '정보 없음')[:90]}...")

    # -------------------------------------------------------------
    # 3. LLM 3줄 요약 연동 (중앙부처 정책 활용)
    # -------------------------------------------------------------
    if selected_central_policy and detail_res:
        print("\n" + "=" * 70)
        print("🤖 [6단계] 복지로 API 데이터를 AI(Ollama Llama3)로 3줄 요약")
        print("=" * 70)
        
        detail = detail_res.get("wantedDtl", detail_res)
        policy_full_text = f"""
정책명: {detail.get('servNm', '')}
소관부처: {detail.get('jurMnofNm', '')}
개요: {detail.get('wlfareInfoOutlCn', '')}
지원대상: {detail.get('tgtrDtlCn', '')}
지원내용: {detail.get('alwServCn', '')}
"""
        template = """
당신은 대한민국 복지정책 전문 AI 요약가입니다.
아래 복지로 공공데이터 API로부터 수집된 정책 정보를 분석하여 핵심을 100% 한국어로 딱 3줄로 요약하세요.
영어나 인사말 없이 [1], [2], [3] 번호 매긴 3줄 형식으로만 작성하세요.

[정책 원문 데이터]
{policy_content}

[3줄 요약]:
"""
        prompt = PromptTemplate(input_variables=["policy_content"], template=template)
        llm = Ollama(model="llama3", temperature=0)
        
        summary = llm.invoke(prompt.format(policy_content=policy_full_text))
        print(f"\n📰 대상 정책: {detail.get('servNm', '')}")
        print("📝 [AI 3줄 요약 결과]:")
        print(summary.strip())
        print("\n" + "=" * 70)
        print("🎉 모든 복지로 중앙/지자체 API 연동 테스트가 성공적으로 완료되었습니다!")
        print("=" * 70)

if __name__ == "__main__":
    test_bokjiro_integration()
