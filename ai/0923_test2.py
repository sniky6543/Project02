"""
summary_test.py: 
[청년 정책 & 뉴스 통합 AI 요약 파이프라인]
1. 복지로 공공데이터 API 연동 (중앙부처 & 지자체 복지서비스) + AI 3줄 요약
2. 온통청년 오픈 API 연동 (대한민국 전체 청년정책 포털 실데이터) + AI 3줄 요약
3. 구글 뉴스 RSS 실시간 크롤링 (언론사 원문 디코딩 수집) + AI 3줄 요약
"""

import sys
import urllib.parse
import feedparser
import requests
import bs4
from googlenewsdecoder import gnewsdecoder
from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate
from backend.app.bokjiro_client import BokjiroClient
from backend.app.youthcenter_client import YouthCenterClient

# Windows 콘솔 인코딩 대응
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")


# ==============================================================================
# [공통] AI 요약 엔진 및 프롬프트 설정 (Ollama Llama3)
# ==============================================================================
llm = Ollama(model="llama3", temperature=0)

# 1. 정책 공고문 전용 3줄 요약 프롬프트
policy_template = """
당신은 대한민국 청년정책 전문 AI 큐레이터입니다.
아래 정부 공식 API로부터 수집된 정책 정보를 정밀 분석하여, 청년들이 꼭 알아야 할 핵심을 100% 한국어로 딱 3줄로 요약하세요.
영어나 인사말, 서론/결론 문구는 절대 추가하지 말고 오직 [1], [2], [3] 번호 매긴 3줄 형식으로만 작성하세요.

[정책 원문 데이터]
{content}

[3줄 요약]:
"""
policy_prompt = PromptTemplate(input_variables=["content"], template=policy_template)

# 2. 뉴스 기사 전용 3줄 요약 프롬프트
news_template = """
당신은 청년 정책 및 시사 뉴스 전문 AI 요약가입니다.
아래 제공된 뉴스 기사 원문을 분석하여 가장 핵심적인 내용을 반드시 한국어로 정확히 딱 3줄로 요약하세요.
영어나 인사말, 서론/결론 문구(예: Here is a 3-line summary 등)는 절대 출력하지 말고 바로 [1] 번으로 시작하여 3줄만 작성하세요.

뉴스 기사 원문:
{content}

[3줄 요약]:
"""
news_prompt = PromptTemplate(input_variables=["content"], template=news_template)


# ==============================================================================
# [기능] 구글 뉴스 RSS 수집 및 크롤링 헬퍼 함수
# ==============================================================================
def fetch_article_text(decoded_url: str) -> str:
    """실제 언론사 기사 링크에서 본문 텍스트를 추출합니다."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        response = requests.get(decoded_url, headers=headers, timeout=7)
        response.raise_for_status()
        soup = bs4.BeautifulSoup(response.content, "html.parser")
        
        for tag in soup(["script", "style", "header", "footer", "nav", "aside"]):
            tag.decompose()
            
        paragraphs = [p.get_text(strip=True) for p in soup.find_all("p") if len(p.get_text(strip=True)) > 30]
        full_text = "\n".join(paragraphs)
        
        if len(full_text) < 100:
            full_text = soup.get_text(separator=" ", strip=True)
            
        return full_text[:2000]
    except Exception as e:
        return f"(기사 원문 수집 실패: {e})"

def get_google_news_rss(keyword: str, max_results: int = 1):
    """구글 뉴스 RSS에서 최신 관련 뉴스를 검색하여 가져옵니다."""
    encoded_query = urllib.parse.quote(keyword)
    rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=ko&gl=KR&ceid=KR:ko"
    feed = feedparser.parse(rss_url)
    
    news_items = []
    for entry in feed.entries[:max_results]:
        title = entry.title
        google_link = entry.link
        published = entry.get("published", "")
        
        try:
            decode_result = gnewsdecoder(google_link)
            original_url = decode_result.get("decoded_url", google_link) if decode_result.get("success") else google_link
        except Exception:
            original_url = google_link
            
        content = fetch_article_text(original_url)
        news_items.append({
            "title": title,
            "url": original_url,
            "published": published,
            "content": content
        })
    return news_items


# ==============================================================================
# [메인 파이프라인] 복지로 API + 온통청년 API + 구글 뉴스 RSS 통합
# ==============================================================================
def main():
    print("=" * 80)
    print("🚀 [청년나침반 AI] 3대 데이터 소스 (복지로 + 온통청년 + 구글뉴스) 통합 요약 테스트")
    print("=" * 80)

    # --------------------------------------------------------------------------
    # 파트 1: 복지로(한국사회보장정보원) 공공데이터 API
    # --------------------------------------------------------------------------
    print("\n🏛️ [파트 1] 복지로 공공데이터 API (중앙부처 & 지자체 복지서비스)")
    bokjiro = BokjiroClient()
    central_res = bokjiro.get_central_welfare_list(search_wrd="청년", life_array="청년", num_of_rows=1)
    
    if "error" in central_res:
        print(f"   ❌ 복지로 조회 실패: {central_res['error']}")
    else:
        serv_list = central_res.get("servList", [])
        if isinstance(serv_list, dict):
            serv_list = [serv_list]
        if serv_list:
            target = serv_list[0]
            serv_id = target.get("servId", "")
            print(f"   📌 [중앙부처] {target.get('servNm', '')} (ID: {serv_id}) - {target.get('jurMnofNm', '')}")
            
            detail_res = bokjiro.get_central_welfare_detail(serv_id)
            wanted = detail_res.get("wantedDtl", detail_res)
            policy_text = f"""
정책명: {wanted.get('servNm', '')}
소관부처: {wanted.get('jurMnofNm', '')}
개요: {wanted.get('wlfareInfoOutlCn', '')}
지원대상: {wanted.get('tgtrDtlCn', '')}
선정기준: {wanted.get('slctCritCn', '')}
지원내용: {wanted.get('alwServCn', '')}
"""
            print("\n   🤖 [AI 3줄 요약 - 복지로 중앙 정책]:")
            summary = llm.invoke(policy_prompt.format(content=policy_text))
            print(summary.strip())

    # --------------------------------------------------------------------------
    # 파트 2: 온통청년(한국고용정보원) 청년정책 오픈 API
    # --------------------------------------------------------------------------
    print("\n" + "-" * 80)
    print("🇰🇷 [파트 2] 온통청년(youthcenter.go.kr) 대한민국 청년정책 오픈 API")
    youthcenter = YouthCenterClient()
    yc_res = youthcenter.get_policies(query="월세", page_size=1)
    
    if "error" in yc_res:
        print(f"   ❌ 온통청년 조회 실패: {yc_res['error']}")
    else:
        yc_list = yc_res.get("result", {}).get("youthPolicyList", [])
        if yc_list:
            yc_target = yc_list[0]
            print(f"   📌 [온통청년] {yc_target.get('plcyNm', '')} (정책번호: {yc_target.get('plcyNo', '')})")
            print(f"      - 분야: {yc_target.get('lclsfNm', '')} > {yc_target.get('mclsfNm', '')} | 주관: {yc_target.get('sprvsnInstCdNm', '')}")
            
            yc_text = f"""
정책명: {yc_target.get('plcyNm', '')}
분야: {yc_target.get('lclsfNm', '')} - {yc_target.get('mclsfNm', '')}
주관기관: {yc_target.get('sprvsnInstCdNm', '')}
지원대상연령: 만 {yc_target.get('sprtTrgtMinAge', '')}세 ~ {yc_target.get('sprtTrgtMaxAge', '')}세
지원내용: {yc_target.get('plcySprtCn', '')}
신청방법: {yc_target.get('plcyAplyMthdCn', '')}
신청사이트: {yc_target.get('aplyUrlAddr', '') or yc_target.get('refUrlAddr1', '')}
"""
            print("\n   🤖 [AI 3줄 요약 - 온통청년 정책]:")
            yc_summary = llm.invoke(policy_prompt.format(content=yc_text))
            print(yc_summary.strip())

    # --------------------------------------------------------------------------
    # 파트 3: 구글 뉴스 RSS 실시간 정책 뉴스 크롤링 & AI 요약
    # --------------------------------------------------------------------------
    print("\n" + "-" * 80)
    print("📰 [파트 3] 구글 뉴스 RSS 실시간 청년 정책 뉴스 크롤링 & AI 요약")
    news_items = get_google_news_rss("청년 정책", max_results=1)
    
    if news_items:
        news = news_items[0]
        print(f"   📌 기사 제목: {news['title']}")
        print(f"   🔗 원문 링크: {news['url']}")
        
        if not news["content"].startswith("(기사 원문 수집 실패"):
            print("\n   🤖 [AI 3줄 요약 - 최신 시사 뉴스]:")
            news_summary = llm.invoke(news_prompt.format(content=news["content"]))
            print(news_summary.strip())

    print("\n" + "=" * 80)
    print("✨ [완료] 복지로 + 온통청년 + 구글 뉴스 3대 데이터 파이프라인 검증 완료!")
    print("=" * 80)

if __name__ == "__main__":
    main()