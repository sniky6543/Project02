# 🚀 AI 청년정책 파이프라인 (AI & Notification Workspace)

본 디렉토리(`ai/pipeline/`)는 **AI 3줄 요약, 공공 API 연동, D-3 마감 알림 봇, Supabase DB 적재**를 담당하는 독립 개발 공간입니다.
다른 팀원의 작업 영역(`db/`, `backend/`, `src/`)과 충돌 없이 전용 파이프라인을 구축 및 유지보수할 수 있습니다.

---

## 📂 파일 구성 안내

| 파일명 | 역할 및 설명 |
| :--- | :--- |
| **`summarize_and_save_policies.py`** | 온통청년/복지로 공공 API 수집 ➔ Ollama `llama3` 3줄 핵심 요약 ➔ `policy_data_schema.md` 규격 정규화 ➔ JSON 파일 저장 및 Supabase Upsert 원클릭 파이프라인 |
| **`save_to_supabase.py`** | Supabase REST API(PostgREST) 기반 `policies` 테이블 자동 Upsert 전송 모듈 |
| **`0928_alarm.py`** | 청년정책 마감 3일 전(D-3) 텔레그램 봇 자동 알림 발송 및 스케줄러 |
| **`bokjiro_client.py`** | 복지로 공공데이터 API 연동 클라이언트 (중앙부처/지자체 복지서비스) |
| **`youthcenter_client.py`** | 온통청년(청년센터) 오픈 API 연동 클라이언트 (전국 청년정책) |
| **`0923_test2.py`** | 복지로 + 온통청년 + 구글 뉴스 RSS 통합 AI 요약 테스트 스크립트 |
| **`0923_test.py`** | 단일 공고문 대상 Ollama LLM 3줄 요약 단독 테스트 스크립트 |
| **`summarized_policies.json`** | AI 3줄 요약 및 표준 스키마가 적용된 정책 데이터셋 결과 파일 |

---

## 💻 실행 방법

모든 스크립트는 프로젝트 루트 경로에서 가상환경 Python(`\.venv\Scripts\python.exe`)으로 실행할 수 있습니다.

### 1. 정책 수집 + AI 3줄 요약 + JSON 저장
```powershell
# 온통청년/복지로 API에서 3건 수집 후 AI 요약하여 summarized_policies.json에 저장
& ".\.venv\Scripts\python.exe" ai/pipeline/summarize_and_save_policies.py --limit 3

# 요약 완료 후 Supabase DB까지 자동 저장하고 싶을 때
& ".\.venv\Scripts\python.exe" ai/pipeline/summarize_and_save_policies.py --limit 5 --to-supabase
```

### 2. 저장된 요약 데이터를 Supabase DB에 적재 (Upsert)
```powershell
# .env에 SUPABASE_URL, SUPABASE_KEY가 설정되어 있는 경우
& ".\.venv\Scripts\python.exe" ai/pipeline/save_to_supabase.py

# CLI 인자로 직접 전달하여 실행하는 경우
& ".\.venv\Scripts\python.exe" ai/pipeline/save_to_supabase.py --url "https://xxx.supabase.co" --key "eyJhbGciOi..."
```

### 3. 청년정책 마감 3일 전(D-3) 텔레그램 알림 테스트
```powershell
# 텔레그램 봇 설정 및 마감 임박 알림 즉시 테스트
& ".\.venv\Scripts\python.exe" ai/pipeline/0928_alarm.py --test
```

### 4. API + 뉴스 통합 AI 요약 테스트
```powershell
& ".\.venv\Scripts\python.exe" ai/pipeline/0923_test2.py
```
