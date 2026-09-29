"""
복지로(한국사회보장정보원) 공공데이터 오픈 API 클라이언트
- 중앙부처 복지서비스 (NationalWelfareInformationsV001)
- 지자체 복지서비스 (LocalGovernmentWelfareInformations)
"""

import os
import sys
import urllib.parse
import xml.etree.ElementTree as ET
from typing import Dict, Any, List, Optional
import requests
from dotenv import load_dotenv

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

class BokjiroClient:
    def __init__(self, service_key: Optional[str] = None):
        raw_key = (
            service_key
            or os.getenv("BOKJIRO_API_KEY")
            or os.getenv("DATA_API_KEY")
            or os.getenv("DATA_GO_KR_API_KEY")
            or ""
        )
        # requests params 사용 시 requests가 자체 인코딩하므로 디코딩된 키 사용
        self.service_key = urllib.parse.unquote(raw_key).strip()
        
        # 기본 엔드포인트
        self.central_base_url = "http://apis.data.go.kr/B554287/NationalWelfareInformationsV001"
        self.local_base_url = "http://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations"

    def _xml_to_dict(self, element: ET.Element) -> Any:
        """XML 엘리먼트를 재귀적으로 파이썬 딕셔너리로 변환합니다."""
        children = list(element)
        if not children:
            return element.text.strip() if element.text else ""
        
        result = {}
        for child in children:
            child_data = self._xml_to_dict(child)
            if child.tag in result:
                if isinstance(result[child.tag], list):
                    result[child.tag].append(child_data)
                else:
                    result[child.tag] = [result[child.tag], child_data]
            else:
                result[child.tag] = child_data
        return result

    def _request_get(self, url: str, params: Dict[str, Any], max_retries: int = 2) -> Dict[str, Any]:
        """API 요청 전송 및 XML 응답 파싱 (타임아웃 시 재시도 포함)"""
        if not self.service_key:
            return {"error": "BOKJIRO_API_KEY(또는 DATA_GO_KR_API_KEY)가 설정되지 않았습니다."}
            
        params["serviceKey"] = self.service_key
        last_error = None
        for attempt in range(max_retries):
            try:
                response = requests.get(url, params=params, timeout=25)
                response.raise_for_status()
                
                # XML 파싱
                root = ET.fromstring(response.content)
                data = self._xml_to_dict(root)
                return data
            except requests.exceptions.RequestException as e:
                last_error = f"API 요청 실패 (시도 {attempt+1}/{max_retries}): {e}"
            except ET.ParseError as e:
                return {"error": f"XML 파싱 실패: {e}"}

        return {"error": last_error}

    # ==========================================
    # 1. 중앙부처 복지서비스 (National Welfare)
    # ==========================================
    def get_central_welfare_list(
        self,
        search_wrd: Optional[str] = None,
        life_array: Optional[str] = None, # 예: '청년', '004' 등
        age: Optional[int] = None,
        page_no: int = 1,
        num_of_rows: int = 10,
        order_by: str = "popular" # date: 최신순, popular: 인기순
    ) -> Dict[str, Any]:
        """
        중앙부처 복지서비스 목록 조회
        """
        # 생애주기 코드 변환 (001:영유아, 002:아동, 003:청소년, 004:청년, 005:중장년, 006:노년)
        life_map = {
            "영유아": "001",
            "아동": "002",
            "청소년": "003",
            "청년": "004",
            "중장년": "005",
            "노년": "006"
        }
        mapped_life = life_map.get(life_array, life_array) if life_array else None

        url = f"{self.central_base_url}/NationalWelfarelistV001"
        params = {
            "callTp": "L",
            "pageNo": str(page_no),
            "numOfRows": str(num_of_rows),
            "srchKeyCode": "003", # 001:제목, 002:내용, 003:제목+내용
            "orderBy": order_by
        }
        if search_wrd:
            params["searchWrd"] = search_wrd
        if mapped_life:
            params["lifeArray"] = mapped_life
        if age:
            params["age"] = str(age)

        data = self._request_get(url, params)
        return data

    def get_central_welfare_detail(self, serv_id: str) -> Dict[str, Any]:
        """
        중앙부처 복지서비스 상세 조회 (지원대상, 선정기준, 급여내용, 신청방법 등)
        """
        url = f"{self.central_base_url}/NationalWelfaredetailedV001"
        params = {
            "callTp": "D",
            "servId": serv_id
        }
        return self._request_get(url, params)

    # ==========================================
    # 2. 지자체 복지서비스 (Local Government Welfare)
    # ==========================================
    def get_local_welfare_list(
        self,
        search_wrd: Optional[str] = None,
        ctpv_nm: Optional[str] = None,  # 시도명 (예: 경상남도, 서울특별시)
        sgg_nm: Optional[str] = None,   # 시군구명 (예: 밀양시, 강남구)
        life_array: Optional[str] = None, # 예: 청년
        age: Optional[int] = None,
        page_no: int = 1,
        num_of_rows: int = 10
    ) -> Dict[str, Any]:
        """
        지자체 복지서비스 목록 조회
        """
        url = f"{self.local_base_url}/LcgvWelfarelist"
        params = {
            "pageNo": str(page_no),
            "numOfRows": str(num_of_rows)
        }
        if search_wrd:
            params["searchWrd"] = search_wrd
        if ctpv_nm:
            params["ctpvNm"] = ctpv_nm
        if sgg_nm:
            params["sggNm"] = sgg_nm
        if life_array:
            params["lifeArray"] = life_array
        if age:
            params["age"] = str(age)

        return self._request_get(url, params)

    def get_local_welfare_detail(self, serv_id: str) -> Dict[str, Any]:
        """
        지자체 복지서비스 상세 조회
        """
        url = f"{self.local_base_url}/LcgvWelfaredetailed"
        params = {
            "servId": serv_id
        }
        return self._request_get(url, params)


if __name__ == "__main__":
    print("=" * 70)
    print("🏛️ [복지로 공공데이터 API 클라이언트 직접 실행 테스트]")
    print("=" * 70)
    
    client = BokjiroClient()
    if not client.service_key:
        print("❌ [경고] BOKJIRO_API_KEY 또는 DATA_GO_KR_API_KEY가 .env 파일에 설정되어 있지 않습니다.")
        sys.exit(1)
        
    print(f"🔑 API Key 확인 완료 (Key 길이: {len(client.service_key)}자)")
    
    # 1. 중앙부처 청년 복지서비스 목록 조회
    print("\n🔍 [1] 중앙부처 청년 복지서비스 목록 조회 중 (키워드: '청년', 2건)...")
    res = client.get_central_welfare_list(search_wrd="청년", life_array="청년", num_of_rows=2)
    
    if "error" in res:
        print(f"❌ 조회 실패: {res['error']}")
    else:
        serv_list = res.get("servList", [])
        if isinstance(serv_list, dict):
            serv_list = [serv_list]
        print(f"✅ 총 {len(serv_list)}건 수집 완료:\n")
        
        for idx, item in enumerate(serv_list, start=1):
            serv_id = item.get("servId", "N/A")
            serv_nm = item.get("servNm", "제목 없음")
            dept = item.get("jurMnofNm", "부처 미상")
            outline = item.get("servDgst", "") or item.get("wlfareInfoOutlCn", "")
            print(f"   [{idx}] {serv_nm} (ID: {serv_id})")
            print(f"       - 소관부처: {dept}")
            if outline:
                print(f"       - 내용: {outline[:80]}...")
                
        # 2. 첫 번째 항목 상세 조회
        if serv_list:
            target_id = serv_list[0].get("servId")
            print(f"\n📄 [2] 첫 번째 정책 상세 조회 중 (ID: {target_id})...")
            detail = client.get_central_welfare_detail(target_id)
            wanted = detail.get("wantedDtl", detail)
            print(f"   📌 선정기준: {wanted.get('slctCritCn', 'N/A')[:90]}...")
            print(f"   🎁 지원내용: {wanted.get('alwServCn', 'N/A')[:90]}...")

    print("\n" + "=" * 70)
    print("✨ 복지로 API 클라이언트 동작 검증 완료!")
    print("=" * 70)
