"""
온통청년(youthcenter.go.kr) 오픈 API 클라이언트
- 청년정책 목록 및 상세 조회 (/go/ythip/getPlcy)
- 청년공간 정보 조회 (/go/ythip/getSpace)
- 정책코드 목록 조회 (/go/ythip/getPolicyCode)
"""

import os
import sys
from typing import Dict, Any, List, Optional
import requests
from dotenv import load_dotenv

# Windows 콘솔 인코딩 대응
from pathlib import Path

# Windows 콘솔 인코딩 대응
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# 상위 디렉토리의 .env 파일까지 포함하여 로드
root_env = Path(__file__).resolve().parent.parent / ".env"
if root_env.exists():
    load_dotenv(dotenv_path=root_env)
else:
    load_dotenv()

class YouthCenterClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("YOUTHCENTER_API_KEY") or os.getenv("ONTONG_API_KEY") or ""
        self.base_url = "https://www.youthcenter.go.kr/go/ythip"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

    def _request_get(self, endpoint: str, params: Dict[str, Any], max_retries: int = 2) -> Dict[str, Any]:
        """온통청년 API 요청 및 JSON 응답 반환"""
        if not self.api_key:
            return {"error": "YOUTHCENTER_API_KEY가 설정되지 않았습니다."}

        url = f"{self.base_url}/{endpoint}"
        params["apiKeyNm"] = self.api_key
        params["rtnType"] = "json"

        last_error = None
        for attempt in range(max_retries):
            try:
                response = requests.get(url, params=params, headers=self.headers, timeout=20)
                response.raise_for_status()
                return response.json()
            except requests.exceptions.RequestException as e:
                last_error = f"온통청년 API 요청 실패 (시도 {attempt+1}/{max_retries}): {e}"
            except Exception as e:
                return {"error": f"응답 처리 실패: {e}"}

        return {"error": last_error}

    def get_policies(
        self,
        query: Optional[str] = None,       # 검색어 (정책명 plcyNm)
        lclsf_nm: Optional[str] = None,    # 대분류 (일자리, 주거, 교육, 복지·문화, 참여·권리)
        mclsf_nm: Optional[str] = None,    # 중분류 (취업, 창업, 주거비지원 등)
        min_age: Optional[int] = None,     # 최소 연령
        max_age: Optional[int] = None,     # 최대 연령
        page_num: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """
        온통청년 청년정책 목록 조회
        """
        params = {
            "pageNum": page_num,
            "pageSize": page_size
        }
        if query:
            params["plcyNm"] = query
        if lclsf_nm:
            params["lclsfNm"] = lclsf_nm
        if mclsf_nm:
            params["mclsfNm"] = mclsf_nm
        if min_age:
            params["sprtTrgtMinAge"] = min_age
        if max_age:
            params["sprtTrgtMaxAge"] = max_age

        return self._request_get("getPlcy", params)

    def get_policy_detail(self, plcy_no: str) -> Optional[Dict[str, Any]]:
        """
        특정 정책 번호(plcyNo)로 단일 정책 상세 정보 조회
        """
        res = self._request_get("getPlcy", {"plcyNo": plcy_no, "pageNum": 1, "pageSize": 1})
        if "error" in res:
            return res
        try:
            policies = res.get("result", {}).get("youthPolicyList", [])
            if policies:
                return policies[0]
            return {"error": f"정책 번호 '{plcy_no}'를 찾을 수 없습니다."}
        except Exception as e:
            return {"error": f"정책 상세 파싱 실패: {e}"}

    def get_spaces(self, page_num: int = 1, page_size: int = 10) -> Dict[str, Any]:
        """
        전국 청년공간/센터 정보 조회
        """
        return self._request_get("getSpace", {"pageNum": page_num, "pageSize": page_size})


if __name__ == "__main__":
    print("=" * 70)
    print("🇰🇷 [온통청년 (Youth Center) 오픈 API 클라이언트 직접 실행 테스트]")
    print("=" * 70)

    client = YouthCenterClient()
    if not client.api_key:
        print("❌ [경고] YOUTHCENTER_API_KEY가 .env 파일에 설정되어 있지 않습니다.")
        sys.exit(1)

    print(f"🔑 API Key 확인 완료: {client.api_key[:8]}***")

    # 1. 정책 검색
    search_keyword = "월세"
    print(f"\n🔍 [1] 온통청년 정책 검색 중 (키워드: '{search_keyword}', 2건)...")
    res = client.get_policies(query=search_keyword, page_size=2)

    if "error" in res:
        print(f"❌ 조회 실패: {res['error']}")
    else:
        policy_list = res.get("result", {}).get("youthPolicyList", [])
        print(f"✅ 총 {len(policy_list)}건 수집 완료:\n")
        
        for idx, item in enumerate(policy_list, start=1):
            plcy_no = item.get("plcyNo", "N/A")
            plcy_nm = item.get("plcyNm", "제목 없음")
            organ = item.get("sprvsnInstCdNm", "주관기관 미상")
            category = f"{item.get('lclsfNm', '')} > {item.get('mclsfNm', '')}".strip(" >")
            age_min = item.get("sprtTrgtMinAge", "0")
            age_max = item.get("sprtTrgtMaxAge", "0")
            print(f"   [{idx}] {plcy_nm} (번호: {plcy_no})")
            print(f"       - 분류: {category} | 주관: {organ}")
            print(f"       - 지원연령: 만 {age_min}세 ~ {age_max}세")
            print(f"       - 지원내용: {item.get('plcySprtCn', '')[:70]}...")

        # 2. 첫 번째 정책 상세 조회
        if policy_list:
            first_no = policy_list[0].get("plcyNo")
            print(f"\n📄 [2] 정책 상세 조회 테스트 (번호: {first_no})...")
            detail = client.get_policy_detail(first_no)
            if "error" in detail:
                print(f"❌ 상세 조회 실패: {detail['error']}")
            else:
                print(f"   📌 신청절차: {detail.get('plcyAplyMthdCn', 'N/A')[:80]}...")
                print(f"   🔗 신청URL: {detail.get('aplyUrlAddr') or detail.get('refUrlAddr1', 'N/A')}")

    print("\n" + "=" * 70)
    print("✨ 온통청년 API 클라이언트 동작 검증 완료!")
    print("=" * 70)
