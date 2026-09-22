# 🧭 청년나침반 (Youth Compass) - 4인 팀 협업 저장소

> **2025-2026 대한민국 청년 맞춤 정책 탐색 & AI 추천 플랫폼**

---

## 👥 1. 팀원별 담당 역할 및 작업 경로

| 역할 | 담당자 | 주요 디렉토리 | 핵심 기술 스택 |
| :--- | :--- | :--- | :--- |
| **🌐 Frontend / UI** | 팀원 1 | `src/`, `index.html` | React 18, TypeScript, Tailwind CSS, Vite |
| **⚙️ Backend / API** | 팀원 2 | `backend/` | FastAPI, Pydantic, Uvicorn, Python 3.11+ |
| **🗄️ DB & Data** | 팀원 3 | `db/` | PostgreSQL / Supabase, SQL, Data Crawler |
| **🤖 LLM AI** | 팀원 4 | `ai/` | OpenAI API, Ollama, OpenRouter, RAG |

---

## 🚀 2. 빠른 시작 가이드 (Quick Start)

### 2.1 공통: 환경변수 설정
```bash
# 루트 디렉토리에서 환경변수 템플릿 복사
cp .env.example .env
# .env 파일을 열고 본인 파트에 필요한 키값을 입력하세요.
```

### 2.2 프론트엔드 실행 (`Frontend`)
```bash
# 패키지 설치
npm install

# 개발 서버 실행 (기본 포트 3000)
npm run dev

# 프로덕션 빌드 검증
npm run build
```

### 2.3 백엔드 실행 (`Backend`)
```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# FastAPI 서버 실행 (http://localhost:8000/docs 에서 Swagger 확인)
uvicorn app.main:app --reload --port 8000
```

---

## 📁 3. 프로젝트 전체 폴더 구조

```text
project02/
├── docs/                     # 📄 [공통] API 명세서 및 프로젝트 문서
│   └── api_spec.md           # 📌 REST API 요청/응답 규격서 (필수 확인)
│
├── src/                      # 🌐 [Frontend] React 웹 애플리케이션
│   ├── api/                  # 백엔드 연동 API 클라이언트 모듈
│   │   └── client.ts         # fetch wrapper
│   ├── components/           # 공통 UI (헤더, 푸터 등)
│   ├── types/                # 공통 TypeScript 인터페이스 (policy, user, api)
│   │   ├── api.ts
│   │   ├── policy.ts
│   │   └── user.ts
│   └── views/                # 페이지 뷰 (ExploreView, ProfileView 등)
│
├── backend/                  # ⚙️ [Backend] FastAPI REST API 서버
│   ├── app/
│   │   ├── main.py           # 서버 진입점 및 CORS 설정
│   │   ├── routers/          # API 엔드포인트 라우터
│   │   └── services/         # 비즈니스 로직
│   └── requirements.txt      # Python 백엔드 의존성
│
├── ai/                       # 🤖 [LLM AI] AI 추천 및 분석 모듈
│   ├── client.py             # OpenAI / Ollama / OpenRouter 통합 클라이언트
│   ├── prompts/              # 시스템/유저 프롬프트 템플릿
│   └── chains/               # RAG 및 정책 매칭 파이프라인
│
├── db/                       # 🗄️ [DB] 데이터베이스 스키마 및 마이그레이션
│   ├── schema.sql            # PostgreSQL / Supabase 테이블 정의
│   ├── seeds/                # 청년정책 기초 데이터
│   └── models.py             # ORM 모델 (SQLAlchemy 등)
│
├── .env.example              # 🔑 환경변수 템플릿
├── .gitignore                # 🚫 GitHub 커밋 제외 룰 (보안 및 빌드 산출물)
├── package.json              # Frontend npm 패키지 설정
└── tailwind.config.js        # Tailwind 디자인 토큰 설정
```

---

## 🌿 4. Git & GitHub 협업 규칙

1. **절대 `main` 브랜치에 직접 push하지 않습니다.**
2. **브랜치 명명 규칙**:
   - `feat/frontend-{기능명}`
   - `feat/backend-{기능명}`
   - `feat/db-{기능명}`
   - `feat/ai-{기능명}`
   - `fix/{수정내용}`
3. **Pull Request (PR) 필수**:
   - 작업 완료 후 `develop` 브랜치로 PR 생성
   - 최소 1명 이상의 팀원 Review & Approve 후 Merge
4. **보안 주의사항**:
   - `.env` 파일과 실제 API Key, DB 비밀번호는 **절대 커밋/푸시 금지** (현재 `.gitignore`에 등록 완료).
