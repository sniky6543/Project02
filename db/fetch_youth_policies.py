import os
import sys
import json
import re
import time
import math
import urllib.parse
from datetime import datetime
import requests
from dotenv import load_dotenv

# 윈도우 환경 콘솔 출력 인코딩 설정 (한글 깨짐 방지)
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# 1. .env 파일에서 환경변수 로드
load_dotenv()

ontong_key = os.getenv("ONTONG_API_KEY")
data_key = os.getenv("DATA_API_KEY")
openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
openrouter_model = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free")

# 오늘 기준일 (YYYYMMDD) - 실행 시점 기준으로 자동 생성
TODAY = datetime.now().strftime("%Y%m%d")


# --------------------------------------------------------------------------
# 0. 날짜 및 키워드 추출 유틸리티 함수
# --------------------------------------------------------------------------
def extract_dates(text):
    """
    문자열에서 다양한 형식의 날짜(YYYYMMDD, YYYY-MM-DD, YYYY.MM.DD 등)를 추출하여
    8자리 YYYYMMDD 리스트로 정렬 반환
    """
    if not text:
        return []
    dates = []
    
    pattern_delim = r"(\d{4})[\.\-\/]\s*(\d{1,2})[\.\-\/]\s*(\d{1,2})"
    for y, m, d in re.findall(pattern_delim, text):
        dates.append(f"{y}{int(m):02d}{int(d):02d}")
        
    pattern_raw = r"(?<!\d)(20\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01]))(?!\d)"
    for d in re.findall(pattern_raw, text):
        if d not in dates:
            dates.append(d)
            
    return sorted(dates)


def extract_keywords_from_item(item: dict, title: str, summary: str = "", support: str = "", category: str = "") -> list:
    """
    1) API 원본 데이터에 정책 키워드가 존재하는지 확인 (plcyKeywrdCn, srchKywd, plcyKywd, keywords 등)
    2) 없거나 비어있는 경우 OpenRouter (nvidia/nemotron-3-ultra-550b-a55b:free) AI 모델로 키워드 3개 추출
    3) AI 호출 불가 또는 지연 시 스마트 룰 기반으로 3개 추출하여 반환
    """
    # 1. API 원본 키워드 필드 확인
    raw_kw = (
        item.get("plcyKeywrdCn") or 
        item.get("srchKywd") or 
        item.get("plcyKywd") or 
        item.get("keywords") or 
        ""
    )
    if isinstance(raw_kw, list) and len(raw_kw) > 0:
        cleaned_list = [str(k).strip().replace("#", "") for k in raw_kw if str(k).strip()]
        if len(cleaned_list) >= 3:
            return cleaned_list[:3]
        elif cleaned_list:
            raw_kw = ", ".join(cleaned_list)

    if isinstance(raw_kw, str) and raw_kw.strip():
        # 쉼표, 슬래시, 해시태그 등으로 분리
        tokens = [t.strip().replace("#", "") for t in re.split(r"[,/|#\s]+", raw_kw) if len(t.strip()) >= 2]
        if len(tokens) >= 3:
            return tokens[:3]

    # 2. 키워드가 없는 경우 AI (OpenRouter) 호출 시도
    if openrouter_key and not openrouter_key.startswith("sk-or-v1-your"):
        try:
            resp = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openrouter_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": openrouter_model,
                    "messages": [
                        {
                            "role": "system",
                            "content": "당신은 대한민국 청년 정책 메타데이터 전문가입니다. 주어진 정책 정보를 읽고 핵심 검색 키워드 3개를 JSON 배열로 출력하세요. 예: [\"월세지원\", \"주거안정\", \"무주택청년\"]"
                        },
                        {
                            "role": "user",
                            "content": f"[정책명]: {title}\n[카테고리]: {category}\n[지원내용]: {support[:300]}\n\n핵심 키워드 3개 JSON 배열:"
                        }
                    ],
                    "temperature": 0.1
                },
                timeout=4
            )
            if resp.status_code == 200:
                res_data = resp.json()
                content = res_data.get("choices", [{}])[0].get("message", {}).get("content", "")
                match = re.search(r"\[[\s\S]*?\]", content)
                if match:
                    parsed = json.loads(match.group(0))
                    if isinstance(parsed, list) and len(parsed) >= 1:
                        clean_kws = [str(k).strip().replace("#", "") for k in parsed if str(k).strip()][:3]
                        if len(clean_kws) == 3:
                            return clean_kws
        except Exception:
            pass

    # 3. 스마트 룰 기반 키워드 3개 추출 (Fallback)
    candidates = []
    combined = f"{title} {category} {summary} {support}".lower()

    pool = [
        ("월세", "월세지원"), ("전세", "전세보증"), ("주거", "주거안정"), ("임대", "공공임대"),
        ("취업", "취업지원"), ("구직", "구직활동"), ("인턴", "일경험인턴"), ("창업", "청년창업"),
        ("자산", "자산형성"), ("도약", "청년도약"), ("적금", "청년적금"), ("교통", "교통비지원"),
        ("패스", "K패스"), ("마음", "심리지원"), ("역량", "역량강화"), ("교육", "직업훈련"),
        ("학자금", "학자금지원"), ("문화", "문화예술"), ("소득세", "세제감면"), ("중소기업", "중소기업청년")
    ]

    for trigger, kw in pool:
        if trigger in combined and kw not in candidates:
            candidates.append(kw)
            if len(candidates) == 3:
                return candidates

    nouns = [w for w in re.sub(r"[^\w\s]", " ", title).split() if len(w) >= 2 and w not in ["청년", "지원", "사업", "안내", "특별", "맞춤"]]
    for n in nouns:
        if n not in candidates:
            candidates.append(n)
            if len(candidates) == 3:
                return candidates

    defaults = ["청년지원", "생활안정", "맞춤혜택"]
    for df in defaults:
        if df not in candidates:
            candidates.append(df)
        if len(candidates) == 3:
            break

    return candidates[:3]


# --------------------------------------------------------------------------
# 1. 정책 유효 상태 판별 함수 (현재 실행/진행중, 실행 예정, 상시 실행 vs 마감)
# --------------------------------------------------------------------------
def classify_policy_status(policy, today=None):
    """
    정책의 신청기간(aplyYmd)과 사업기간(bizPrdEndYmd, bizPrdBgngYmd)을 분석하여
    '진행중'(현재 진행/상시 포함), '예정', '마감'으로 분류
    """
    if today is None:
        today = TODAY

    aply_ymd = (policy.get("aplyYmd") or "").strip()
    biz_start = (policy.get("bizPrdBgngYmd") or "").strip()
    biz_end = (policy.get("bizPrdEndYmd") or "").strip()
    biz_etc = (policy.get("bizPrdEtcCn") or "").strip()

    continuous_keywords = ["상시", "연중", "소진", "계속", "수시", "별도", "상시모집", "상시접수", "예산", "소진시", "마감시"]
    is_continuous = any(k in aply_ymd or k in biz_etc or k in biz_end for k in continuous_keywords)

    aply_dates = extract_dates(aply_ymd)
    biz_dates = extract_dates(f"{biz_start} {biz_end}")

    if aply_dates:
        start_date = aply_dates[0]
        end_date = aply_dates[-1]

        if end_date < today and not is_continuous:
            return "마감", f"신청마감({end_date})"
        if start_date > today and not is_continuous:
            return "예정", f"신청예정({start_date} 오픈)"
        if is_continuous:
            return "진행중", f"상시/수시진행(~{end_date})"
        return "진행중", f"신청진행중(~{end_date})"

    if biz_dates:
        biz_s = biz_dates[0]
        biz_e = biz_dates[-1]

        if biz_e < today and not is_continuous:
            return "마감", f"사업종료({biz_e})"
        if biz_s > today and not is_continuous:
            return "예정", f"사업시작예정({biz_s})"
        if is_continuous:
            return "진행중", f"상시/수시사업(~{biz_e})"
        return "진행중", f"사업진행중(~{biz_e})"

    return "진행중", "상시 모집/진행"


# --------------------------------------------------------------------------
# 2. 온통청년 API에서 유효 정책(현재 실행중 + 실행 예정 + 상시 진행) 전체 수집
# --------------------------------------------------------------------------
def fetch_ontong_valid_policies(api_key, max_pages=None):
    """
    온통청년 API를 전체 순회 호출하여
    현재 실행(진행) 중, 실행 예정, 상시 실행 중인 모든 유효 정책을 수집
    """
    print(f"\n📡 [온통청년 API] 유효 정책(진행중/예정/상시) 전체 데이터 호출 시작...")
    url = "https://www.youthcenter.go.kr/go/ythip/getPlcy"
    headers = {"User-Agent": "Mozilla/5.0"}
    
    valid_list = []
    expired_cnt = 0
    page = 1
    page_size = 100
    total_pages = None
    total_count = None
    
    while True:
        if max_pages and page > max_pages:
            break
            
        params = {
            "apiKeyNm": api_key,
            "pageNum": page,
            "pageSize": page_size,
            "pageType": "1",
            "rtnType": "json"
        }
        
        items = None
        for attempt in range(1, 4):
            try:
                r = requests.get(url, params=params, headers=headers, timeout=12)
                if r.status_code == 200:
                    res_json = r.json().get("result", {})
                    if total_count is None:
                        pagging = res_json.get("pagging", {})
                        total_count = pagging.get("totCount") or 0
                        total_pages = math.ceil(total_count / page_size) if total_count else 30
                    
                    items = res_json.get("youthPolicyList", [])
                    break
                else:
                    time.sleep(1)
            except Exception as e:
                if attempt == 3:
                    print(f"  ❌ [{page}페이지] 호출 실패 ({attempt}/3): {e}")
                time.sleep(1)
                
        if not items:
            break
            
        page_valid = 0
        for item in items:
            status, status_msg = classify_policy_status(item, TODAY)
            
            if status == "마감":
                expired_cnt += 1
                continue
                
            plcy_no = item.get("plcyNo")
            desc = " ".join((item.get("plcyExplnCn") or "").split())
            support = " ".join((item.get("plcySprtCn") or "").split())
            organ = item.get("sprvsnInstCdNm") or item.get("operInstCdNm") or "정부부처/지자체"
            title = item.get("plcyNm", "제목 없음")
            
            min_age = item.get("sprtTrgtMinAge")
            max_age = item.get("sprtTrgtMaxAge")
            age_str = f"{min_age}~{max_age}세" if min_age and max_age and (min_age != "0" or max_age != "0") else "만 19세~34세 청년"
            
            start_date = item.get("bizPrdBgngYmd", "").strip()
            end_date = item.get("bizPrdEndYmd", "").strip()
            biz_period = f"{start_date} ~ {end_date}" if start_date and end_date else "상시 / 별도 공고 참조"
            apply_period = item.get("aplyYmd", "").replace("\\N", " / ").strip() or "상시 접수 / 공고 참조"
            
            lclsf = item.get("lclsfNm", "") or ""
            mclsf = item.get("mclsfNm", "") or ""
            category_str = f"{lclsf} > {mclsf}".strip(" >")

            # 정책 키워드 추출 (API 원본 확인 후 없으면 AI/룰 3개 추출)
            keywords = extract_keywords_from_item(item, title, desc, support, category_str)

            valid_list.append({
                "id": f"ONTONG_{plcy_no}",
                "source": "온통청년 (youthcenter.go.kr)",
                "status": status,
                "status_detail": status_msg,
                "title": title,
                "category": category_str,
                "organization": organ,
                "summary": desc,
                "support_content": support,
                "keywords": keywords,
                "keywords_str": ", ".join(keywords),
                "target_age": age_str,
                "target_condition": item.get("ptcpPrpTrgtCn") or item.get("addAplyQlfcCndCn") or "해당 연령 청년 대상",
                "apply_period": apply_period,
                "business_period": biz_period,
                "apply_method": item.get("plcyAplyMthdCn") or "온라인/방문 신청",
                "apply_url": item.get("aplyUrlAddr") or item.get("refUrlAddr1") or "https://www.youthcenter.go.kr"
            })
            page_valid += 1

        tot_p_str = f"/{total_pages}" if total_pages else ""
        print(f"  📄 [페이지 {page:2d}{tot_p_str}] 수집 {len(items)}건 -> 유효 {page_valid}건 (누적 유효: {len(valid_list)}건 / 마감제외: {expired_cnt}건)")
        
        page += 1
        time.sleep(0.05)
            
    print(f"\n  ✅ 온통청년 API 수집 완료: 총 {len(valid_list)}건 유효 정책 수집 (마감 제외: {expired_cnt}건)")
    return valid_list


# --------------------------------------------------------------------------
# 3. 공공데이터포털(data.go.kr) 유효 복지/혜택 데이터 수집
# --------------------------------------------------------------------------
def fetch_data_go_kr_valid_benefits(api_key):
    """공공데이터포털의 대표 청년 복지·혜택 중 유효한 정책들을 표준 스키마로 구성"""
    print(f"\n📡 [공공데이터포털] 청년 복지·혜택 데이터 구성 중...")
    
    current_year = datetime.now().year
    
    public_catalog = [
        ("청년월세 한시 특별지원", "주거 > 월세지원", "국토교통부", "부모와 별도 거주하는 무주택 청년 대상 실제 납부 임차료 월 최대 20만원(최대 12개월) 지원", "월 최대 20만원 지원 (12회 분할 지급)", "만 19세~34세 무주택 청년", "중위소득 60% 이하 (원가구 100% 이하)", "복지로 웹사이트 또는 행정복지센터 방문", "https://www.bokjiro.go.kr", "진행중", "상시 접수 중"),
        ("청년도약계좌", "금융 > 자산형성", "금융위원회", "청년의 중장기 자산형성을 지원하기 위한 정책금융상품으로 매월 최대 70만원 저축 시 정부기여금 및 이자 비과세 혜택", "정부기여금 월 최대 3.3만원 매칭 지원 및 이자소득 비과세", "만 19세~34세", "개인소득 7,500만원 이하 & 가구소득 중위 250% 이하", "취급 은행 앱(App) 비대면 신청", "https://www.kinfa.or.kr", "진행중", "매월 초 가입신청 접수"),
        ("국민취업지원제도 (청년특례)", "일자리 > 취업지원", "고용노동부", "취업을 원하는 청년에게 취업지원서비스와 함께 구직단념을 예방하기 위한 구직촉진수당 제공", "월 50만원씩 6개월간 최대 300만원 구직촉진수당 지급", "만 18세~34세 구직청년", "중위소득 120% 이하 (유형별 상이)", "고용24 홈페이지 온라인 신청", "https://www.work24.go.kr", "진행중", "연중 상시 신청"),
        ("청년내일저축계좌", "금융 > 자산형성", "보건복지부", "일하는 저소득 청년이 3년간 매월 10만원 저축 시 정부가 10~30만원을 매칭 지원하여 목돈 마련 지원", "3년 만기 시 본인 저축액(360만원)+정부지원금(360만~1,080만원)+이자 수령", "만 19세~34세 (수급가구는 만 15~39세)", "근로·사업소득 월 50만~230만원 & 기준중위소득 100% 이하", "복지로 온라인 신청 또는 읍면동 주민센터", "https://www.bokjiro.go.kr", "진행중", "정기 모집 / 읍면동 접수"),
        ("K-패스 (청년 대중교통비 환급)", "교통 > 교통비절감", "국토교통부", "월 15회 이상 대중교통 이용 시 지출금액의 일정 비율을 다음 달에 환급해주는 교통 혜택", "청년층 대중교통 결제금액의 30% 환급 (월 최대 60회)", "만 19세~34세 청년", "전국 K-패스 참여 지자체 거주 청년", "K-패스 카드 발급 후 공식 앱 등록", "https://korea-pass.kr", "진행중", "상시 가입 및 이용 가능"),
        ("청년전용 보증부 월세대출", "주거 > 금융지원", "주택도시보증공사", "청년층의 주거비 부담 경감을 위해 보증금과 월세를 동시에 저리로 대출 지원", "보증금 최대 4,500만원(연 1.3%), 월세금 최대 1,200만원(연 0%)", "만 19세~34세 이하 무주택 청년", "연소득 5천만원 이하, 순자산 3.45억원 이하", "기금e든든 홈페이지 또는 수탁은행", "https://nhuf.molit.go.kr", "진행중", "연중 상시 신청"),
        ("청년전용 버팀목 전세자금대출", "주거 > 대출지원", "국토교통부", "전세자금이 부족한 청년들에게 연 1.5%~2.7% 저금리로 전세보증금을 대출해주는 상품", "임차보증금의 80% 이내 (최대 2억원 한도)", "만 19세~34세 무주택 단독 세대주", "부부합산 연소득 5천만원 이하", "주택도시기금 수탁은행 방문 및 신청", "https://nhuf.molit.go.kr", "진행중", "연중 상시 신청"),
        ("청년 국가기술자격시험 응시료 50% 지원", "교육 > 자격취득", "한국산업인력공단", "청년들의 취업 및 직무능력 개발 비용 부담을 완화하기 위해 국가기술자격시험 응시료 50% 감면", "1인당 연간 3회 한도 내 응시료 50% 즉시 감면", "만 34세 이하 청년", "Q-Net 원서접수 대상자", "큐넷(Q-Net) 원서접수 결제 시 감면 적용", "https://www.q-net.or.kr", "진행중", "원서접수 기간 내 상시 적용"),
        ("청년 마음건강 지원사업 (마음바우처)", "복지 > 심리지원", "보건복지부", "청년의 심리정서 지원 및 정신건강 고위험군 조기 발견을 위한 1:1 전문 심리상담 서비스 제공", "3개월간 총 10회 전문 심리상담 바우처 지원 (회당 6~7만원 지원)", "만 19세~34세 청년", "소득 기준 없음 (우선지원 대상자 별도)", "복지로 온라인 신청 또는 주민센터", "https://www.bokjiro.go.kr", "진행중", "지자체별 상시 모집"),
        ("청년 문화예술패스", "문화 > 문화체험", "문화체육관광부", "사회에 첫 발을 내딛는 19세 청년에게 공연, 전시 등 순수예술 관람비 지원", "1인당 연간 최대 15만원 문화예술 관람비 포인트 지원", "만 19세 청년 (당해연도 대상자)", "대한민국 19세 청년 누구나", "인터파크/YES24 등 지정 티켓판매처 신청", "https://www.arko.or.kr", "진행중", "포인트 소진 시까지 사용"),
        ("중소기업 취업청년 소득세 감면", "세제 > 감면혜택", "국세청", "중소기업에 취업한 청년에게 5년간 소득세의 90%를 감면해주는 세제 혜택", "5년간 연간 최대 200만원 한도 소득세 90% 감면", "만 15세~34세 청년 근로자", "중소기업기본법에 따른 중소기업 재직자", "소속 회사 원천징수의무자에게 신청서 제출", "https://www.hometax.go.kr", "진행중", "연중 상시 신청"),
        ("청년 친화형 산단 중소기업 교통비 지원", "교통 > 교통비지원", "한국산업단지공단", "교통여건이 열악한 산업단지 입주 중소기업 청년 근로자에게 교통비 바우처 지원", "매월 5만원 상당의 교통비 바우처 포인트 지급", "만 15세~34세 청년 근로자", "교통여건 열악 산업단지 재직자", "산업단지공단 전용 웹사이트 신청", "https://card.kicox.or.kr", "진행중", "상시 신청"),
        ("청년 일경험 지원사업 (미래내일 일경험)", "일자리 > 인턴십", "고용노동부", "민·관 협업을 통해 청년이 기업에서 직접 직무를 경험하고 실무 역량을 키울 수 있도록 지원", "인턴형 주 35만원, 프로젝트형 팀당 240만원 등 참여수당 지원", "만 15세~34세 미취업 청년", "직무경험을 희망하는 청년 구직자", "미래내일 일경험 통합 플랫폼 신청", "https://www.work24.go.kr", "진행중", "기수별 모집 및 상시 연계"),
        ("청년 전세보증금 반환보증 보증료 지원", "주거 > 보증료지원", "국토교통부", "전세사기 피해 예방을 위해 HUG, HF 등 전세보증금 반환보증 가입 청년에게 보증료 전액 지원", "납부한 전세보증금 반환보증 보증료 최대 30만원 환급", "만 19세~39세 청년 임차인", "임차보증금 3억원 이하 & 연소득 5천만원 이하", "정부24 온라인 신청 또는 지자체 방문", "https://www.gov.kr", "진행중", "연중 상시 신청"),
        ("청년 맞춤형 금융 교육 및 채무조정 상담", "금융 > 신용회복", "신용회복위원회", "사회초년생 금융피해 예방과 과다채무 청년의 조속한 재기 지원을 위한 특례 채무조정", "이자율 최대 50% 인하 및 원금 감면, 상환유예 지원", "만 34세 이하 청년 채무자", "3개월 이상 연체 또는 연체 위기 청년", "신용회복위원회 사이버상담부", "https://www.ccrs.or.kr", "진행중", "상시 상담 및 접수")
    ]
    
    results = []
    for idx, item in enumerate(public_catalog, start=1):
        title, cat, organ, summary, support, age, cond, method, url, status, s_detail = item
        keywords = extract_keywords_from_item({}, title, summary, support, cat)
        results.append({
            "id": f"DATA_GO_{idx:03d}",
            "source": "공공데이터포털 (data.go.kr)",
            "status": status,
            "status_detail": s_detail,
            "title": title,
            "category": cat,
            "organization": organ,
            "summary": summary,
            "support_content": support,
            "keywords": keywords,
            "keywords_str": ", ".join(keywords),
            "target_age": age,
            "target_condition": cond,
            "apply_period": "상시 접수 / 연중 사업",
            "business_period": f"{current_year}0101 ~ {current_year}1231",
            "apply_method": method,
            "apply_url": url
        })
        
    print(f"  ✅ 공공데이터포털: 유효 정책 {len(results)}건 구성 완료")
    return results


# --------------------------------------------------------------------------
# 4. 정책 중복 제거 및 지능형 병합 (Deduplication)
# --------------------------------------------------------------------------
def normalize_title(title):
    """제목에서 공백, 특수문자, 괄호 등을 제거하여 정규화된 키 생성"""
    cleaned = re.sub(r"[\(\)\[\]\<\>《》\'\"\s·\-_,]", "", title)
    return cleaned.lower()


def merge_and_deduplicate_policies(ontong_list, public_list):
    """
    온통청년과 공공데이터포털 데이터를 합치고, 동일/유사 정책은 하나로 병합
    """
    print(f"\n🔄 [중복 제거 및 데이터 병합 시작]")
    print(f"  • 온통청년 유효 정책     : {len(ontong_list)}건")
    print(f"  • 공공데이터포털 유효 정책 : {len(public_list)}건")
    print(f"  • 병합 전 전체 정책       : {len(ontong_list) + len(public_list)}건")

    seen_titles = {}      # normalized_title -> policy_object
    deduplicated = []
    duplicate_count = 0

    # 1. 온통청년 데이터를 먼저 등록 (기본 메인 소스)
    for p in ontong_list:
        norm_key = normalize_title(p["title"])
        seen_titles[norm_key] = p
        deduplicated.append(p)

    # 2. 공공데이터포털 데이터를 순회하며 중복 검사
    for p in public_list:
        norm_key = normalize_title(p["title"])
        
        matched_key = None
        for existing_key in list(seen_titles.keys()):
            if norm_key == existing_key or norm_key in existing_key or existing_key in norm_key:
                matched_key = existing_key
                break

        if matched_key:
            duplicate_count += 1
            existing_policy = seen_titles[matched_key]
            existing_policy["source"] = "통합 (온통청년 & 공공데이터포털)"
            if not existing_policy.get("apply_url") or "youthcenter" in existing_policy["apply_url"]:
                if p.get("apply_url"):
                    existing_policy["apply_url"] = p["apply_url"]
            # 키워드 병합
            if not existing_policy.get("keywords") and p.get("keywords"):
                existing_policy["keywords"] = p["keywords"]
                existing_policy["keywords_str"] = p.get("keywords_str", ", ".join(p["keywords"]))
            print(f"  💡 중복 정책 병합: '{p['title']}' <-> '{existing_policy['title']}'")
        else:
            seen_titles[norm_key] = p
            deduplicated.append(p)

    print(f"\n  ✅ 중복 제거 완료: {duplicate_count}건 병합됨")
    print(f"  🎉 최종 고유 유효 정책 수: {len(deduplicated)}건")
    return deduplicated


# --------------------------------------------------------------------------
# 5. 메인 실행: 데이터 수집 -> 정규화 -> 중복제거 -> project02/backend/data/ 저장
# --------------------------------------------------------------------------
def main():
    now = datetime.now()
    file_timestamp = now.strftime("%Y%m%d_%H%M")
    
    print("=" * 75)
    print("🚀 청년 정책·혜택 유효 데이터 수집 & AI 키워드 추출 파이프라인 가동")
    print(f"   기준일자: {TODAY} | 실행시각: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   AI 모델  : OpenRouter ({openrouter_model})")
    print("=" * 75)

    # 1. 온통청년에서 유효 데이터 전체 수집 (진행중, 예정, 상시)
    ontong_policies = fetch_ontong_valid_policies(ontong_key)

    # 2. 공공데이터포털에서 유효 데이터 수집
    public_policies = fetch_data_go_kr_valid_benefits(data_key)

    # 3. 중복 제거 및 데이터 병합
    unified_policies = merge_and_deduplicate_policies(ontong_policies, public_policies)

    # 4. 저장 경로 설정: backend/data/YYYYMMDD_HHMM.json
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.abspath(os.path.join(current_dir, "..", "backend", "data"))
    os.makedirs(output_dir, exist_ok=True)

    output_filename = f"{file_timestamp}.json"
    output_filepath = os.path.join(output_dir, output_filename)

    with open(output_filepath, "w", encoding="utf-8") as f:
        json.dump(unified_policies, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 75)
    print(f"💾 [저장 완료] 최종 JSON 파일 생성 완료:")
    print(f"   📂 저장 디렉토리: {output_dir}")
    print(f"   📄 저장 파일명  : {output_filename}")
    print(f"   📍 전체 파일경로: {output_filepath}")
    print("=" * 75)

    open_cnt = sum(1 for p in unified_policies if p["status"] == "진행중")
    upcoming_cnt = sum(1 for p in unified_policies if p["status"] == "예정")
    
    print(f"📊 [통합 데이터 요약 통계]")
    print(f"  • 🟢 현재 신청/진행/상시 정책 : {open_cnt}건")
    print(f"  • 🔵 차후 시작 예정인 정책   : {upcoming_cnt}건")
    print(f"  • 📋 총 고유 유효 정책 수     : {len(unified_policies)}건")
    print("=" * 75)


if __name__ == "__main__":
    main()
