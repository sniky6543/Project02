# 🧭 청년나침반 (Youth Compass) 4인 원격 협업 & 개발 종합 가이드

> **프로젝트 개요**: 대한민국 청년 맞춤 정책 탐색 & AI 추천 플랫폼  
> **협업 방식**: GitHub 기반 4인 원격 분업 (Interface-First 워크플로우)  
> **문서 버전**: v1.0.0 (2026-09-22)

---

## 👥 1. 4인 역할 분담 및 책임 영역 (R&R)

| 담당자 | 담당 역할 | 핵심 작업 디렉토리 | 주요 기술 스택 및 작업 내용 |
| :--- | :--- | :--- | :--- |
| **팀원 1 (Frontend)** | React UI/UX, 화면 인터랙션, 상태 관리, API 연동 | `src/`, `index.html` | • React 18, TypeScript, Tailwind CSS, Vite<br>• 탐색/상세/프로필/북마크 화면 개발 및 API 바인딩 |
| **팀원 2 (Backend & API)** | REST API 서버 구축, 비즈니스 로직, 인증 | `backend/` | • FastAPI, Pydantic, Uvicorn, Python 3.11+<br>• 정책 검색/상세 API, 프로필 API, CORS 설정 |
| **팀원 3 (DB & Data)** | 데이터베이스 설계, 공공데이터 수집·정제·적재 | `db/` | • PostgreSQL / Supabase, SQL, ORM<br>• 온통청년 공공데이터 크롤링 및 인덱싱 |
| **팀원 4 (LLM AI)** | AI 맞춤 추천, 프롬프트 엔지니어링, 챗봇 RAG | `ai/` | • OpenAI, Ollama, OpenRouter API 연동<br>• 개인 프로필 기반 정책 적합도 스코어링 & 사유 생성 |

---

## 📁 2. 프로젝트 폴더 구조 (Monorepo)

```text
project02/
├── docs/                     # 📄 [공통] 프로젝트 문서 및 명세서
│   ├── api_spec.md           # 📌 REST API 요청/응답 규격서 (Single Source of Truth)
│   └── team_collaboration_guide.md
│
├── src/                      # 🌐 [팀원 1: Frontend] React 클라이언트
│   ├── api/                  # API 클라이언트 (client.ts, mockData.ts)
│   ├── types/                # 공통 TypeScript 인터페이스 (api.ts, policy.ts, user.ts)
│   ├── components/           # 재사용 가능한 UI 컴포넌트
│   └── views/                # 주요 화면 (ExploreView, ProfileView, DetailView 등)
│
├── backend/                  # ⚙️ [팀원 2: Backend] FastAPI 서버
│   ├── app/
│   │   ├── main.py           # 서버 진입점 및 CORS 미들웨어
│   │   ├── routers/          # API 엔드포인트 라우터
│   │   └── services/         # 비즈니스 로직
│   └── requirements.txt      # 백엔드 의존성 패키지 목록
│
├── db/                       # 🗄️ [팀원 3: DB & Data] 데이터베이스
│   ├── schema.sql            # PostgreSQL/Supabase 테이블 DDL
│   └── seeds/                # seed_policies.sql, mock_policies.json
│
├── ai/                       # 🤖 [팀원 4: LLM AI] 추천 & 분석 엔진
│   ├── client.py             # OpenAI / Ollama / OpenRouter 다중 연동 클라이언트
│   ├── prompts/              # 시스템 및 사용자 프롬프트 템플릿
│   └── chains/               # RAG 및 맞춤 추천 파이프라인
│
├── .env.example              # 🔑 환경변수 공유 템플릿
├── .gitignore                # 🚫 GitHub 보안 및 빌드 산출물 제외 룰
├── package.json              # Frontend npm 설정
└── README.md                 # 프로젝트 전체 가이드
```

---

## 🔒 3. 보안 점검 및 `.gitignore` / `.env` 관리 수칙

> ⚠️ **가장 중요한 보안 원칙: 실제 API Key 및 DB 접속 비밀번호는 절대 GitHub에 Commit/Push하지 마세요.**

1. **`.gitignore` 설정 완료**: `node_modules/`, `dist/`, `.env*` (단, `.env.example` 제외), `.venv/`, `__pycache__/`, `*.sqlite3`, `*.pem`, `*.key` 등이 모두 차단되었습니다.
2. **환경변수 공유 방식**:
   - 변수 명칭 템플릿은 [`.env.example`](file:///d:/project02/.env.example) 파일로 관리합니다.
   - 각 팀원은 로컬에서 `cp .env.example .env` 후 본인 파트에 필요한 실제 키값을 입력하여 사용합니다.

---

## 🏛️ 4. 온통청년(청년센터) Open API 활용 전략

* **공식 사이트**: [온통청년 오픈 API 안내](https://www.youthcenter.go.kr/cmnFooter/openapiIntro/oaiDoc)
* **적합성**: 중앙부처 + 전국 지자체 수천 건의 청년정책을 제공하며, 우리 서비스의 조건 필터(연령, 소득, 거주지, 학력, 취업상태)와 100% 매칭됩니다.

### 파트별 구체적 데이터 파이프라인
1. **DB 파트 (팀원 3)**: 매일 1회(새벽) 배치 스케줄러로 온통청년 API 전체 정책을 수집하여 로컬/클라우드 DB에 캐싱. `ageInfo`, `prcpCn` 등 텍스트 조건을 숫자 필드(`min_age`, `max_age`, `min_income`, `max_income`)로 1차 파싱하여 고속 인덱스 검색 구현.
2. **AI 파트 (팀원 4)**: 길고 딱딱한 행정 공고문을 청년 친화적인 3줄 핵심 요약으로 가공하고, 사용자 프로필 조건과 대조하여 **매칭 스코어(0~100점)** 및 추천 사유 생성.
3. **Backend 파트 (팀원 2)**: DB에 적재된 정제 데이터를 페이징/필터링하여 프론트엔드로 전달하는 고속 REST API 구축.
4. **Frontend 파트 (팀원 1)**: 정책 카드 및 상세 모달에 데이터 바인딩.

---

## 📦 5. 3가지 포맷의 Mock Data 세트 (즉시 개발용)

온통청년 API 승인 대기 중에도 병목 없이 개발할 수 있도록 3가지 형태의 더미 데이터를 구축했습니다.

1. **TypeScript 모듈 (`src/api/mockData.ts`)**:
   - 프론트엔드에서 즉시 `import { getMockPolicies, getMockPolicyDetail } from '../api/mockData'` 호출 가능.
2. **JSON 데이터셋 (`db/seeds/mock_policies.json`)**:
   - 백엔드 Mock API 및 LLM AI 프롬프트 테스트용.
3. **SQL 시드 스크립트 (`db/seeds/seed_policies.sql`)**:
   - Supabase/PostgreSQL에서 1초 만에 8개 대표 정책(주거, 일자리, 금융, 교육, 참여)을 DB에 인서트 가능.

---

## 🌿 6. Git & GitHub 원격 협업 규칙

1. **브랜치 전략 (GitHub Flow)**:
   - `main`: 배포용 안정 브랜치 (직접 Push 금지)
   - `develop`: 개발 통합 브랜치
   - 기능별 브랜치:
     - `feat/frontend-{기능명}`
     - `feat/backend-{기능명}`
     - `feat/db-{기능명}`
     - `feat/ai-{기능명}`
2. **Pull Request (PR) 필수**:
   - 작업 완료 후 `develop`으로 PR 생성
   - 최소 1명 이상의 팀원 Review & Approve 후 Merge
3. **Commit 메시지 컨벤션**:
   - `feat:` 새로운 기능 추가
   - `fix:` 버그 수정
   - `docs:` 문서 수정
   - `refactor:` 코드 리팩토링
   - `chore:` 패키지/빌드 설정 변경

---

## 📅 7. 추천 4주 개발 로드맵

* **1주차 (기반 & 스키마)**: API 명세서 확정, DB ERD 및 스키마 생성, 온통청년 API Key 발급 신청
* **2주차 (개별 모듈 개발)**: DB 적재 스크립트 작성, AI 추천 체인 구현, 백엔드 CRUD API 개발, 프론트엔드 연동 레이어 구조화
* **3주차 (E2E 통합)**: 프론트 ↔ 백엔드 ↔ DB ↔ LLM 실제 데이터 연동 및 맞춤 필터링 테스트
* **4주차 (테스트 & 배포)**: 예외 처리, 반응형 UI 최종 점검, 클라우드 호스팅(Vercel, Supabase, Render 등) 배포
