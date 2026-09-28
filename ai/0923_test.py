# 프론트엔드 연결 없이 단일 파이썬 파일로 AI 요약 기능을 검증하는 코드입니다.
from langchain_community.llms import Ollama # 로컬 LLM(Ollama)을 호출하기 위한 모듈입니다.
from langchain_core.prompts import PromptTemplate # AI에게 내릴 구체적인 지시서(프롬프트) 양식을 만듭니다.

# 1. 과제의 '입력'에 해당하는 긴 정책 공고문(가짜 데이터)을 준비합니다.
# 실무적인 테스트를 위해 밀양시 청년 정책을 예시로 작성했습니다.
policy_document = """
[2026년 밀양시 청년 월세 특별지원 공고]
밀양시에 거주하는 청년들의 주거비 부담을 덜어주기 위해 월세 지원 사업을 시행합니다.
- 지원 자격: 신청일 기준 밀양시에 주민등록을 둔 만 19세 ~ 34세 이하 무주택 1인 가구 청년
- 지원 금액: 실제 납부하는 월세 범위 내에서 월 최대 20만 원씩 최대 12개월간(최대 240만 원) 현금 지급
- 접수 기간: 2026년 9월 25일(금) ~ 10월 15일(목) 18:00까지
- 신청 방법: 복지로 홈페이지(www.bokjiro.go.kr)를 통한 온라인 신청 또는 관할 행정복지센터 방문 접수
- 유의 사항: 반드시 본인 명의의 임대차 계약서가 있어야 하며, 부모와 함께 거주하거나 기초생활수급자인 경우 대상에서 제외됩니다. 제출된 서류는 반환하지 않습니다.
"""

# 2. 과제에서 요구한 5가지 형식(출력 포맷)을 엄격하게 지키도록 프롬프트를 설계합니다.
template = """
당신은 정책 공고문을 분석하는 AI 보조관입니다.
아래 [정책 공고문]을 읽고, 반드시 지정된 [출력 형식]에 맞춰서만 요약해 주세요.
다른 인사말이나 설명은 절대 넣지 마세요.

[출력 형식]
지원 대상: 
지원 내용: 
신청 기간: 
신청 방법: 
주의 사항: 

[정책 공고문]
{document}
"""

# 3. 빈칸({document})이 뚫려 있는 템플릿 객체를 생성합니다.
prompt = PromptTemplate(input_variables=["document"], template=template)

# 4. 사실 기반의 요약을 위해 창의성(temperature)을 0으로 설정한 LLM을 불러옵니다.
llm = Ollama(model="llama3", temperature=0)

print("⏳ AI가 정책 공고문을 분석하고 있습니다...\n")

# 5. 프롬프트에 공고문을 넣어 최종 명령어를 완성하고 LLM에 전달합니다.
final_prompt = prompt.format(document=policy_document)
result = llm.invoke(final_prompt)

# 6. 과제 완료 기준에 맞게 터미널에 결과를 출력합니다.
print(result)