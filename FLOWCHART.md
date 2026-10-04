# 🧭 청년나침반 (Youth Compass) - 프로젝트 플로우차트 & 아키텍처 가이드

> **프로젝트명**: 청년나침반 (Youth Compass / 청년큐레이터)  
> **프로젝트 개요**: 2025-2026 대한민국 청년 맞춤 정책 탐색 & AI 추천·분석 플랫폼  
> **문서 버전**: v1.0.0  
> **최종 작성일**: 2026-10-04  

---

## 📌 목차
1. [전체 시스템 아키텍처 (System Architecture)](#1-전체-시스템-아키텍처-system-architecture)
2. [사용자 서비스 플로우 (User Journey & View Flow)](#2-사용자-서비스-플로우-user-journey--view-flow)
3. [AI 맞춤 추천 & RAG 질의응답 플로우 (AI & RAG Pipeline)](#3-ai-맞춤-추천--rag-질의응답-플로우-ai--rag-pipeline)
4. [공공데이터 수집 및 배치 스케줄러 플로우 (Data Ingestion & Sync)](#4-공공데이터-수집-및-배치-스케줄러-플로우-data-ingestion--sync)
5. [D-3 마감 임박 알림 서비스 플로우 (Notification Flow)](#5-d-3-마감-임박-알림-서비스-플로우-notification-flow)
6. [데이터베이스 엔티티 관계도 (Database ERD)](#6-데이터베이스-엔티티-관계도-database-erd)

---

## 1. 전체 시스템 아키텍처 (System Architecture)

청년나침반 서비스는 **Frontend (React)**, **Backend (FastAPI)**, **AI & RAG Engine (Python/LLM)**, **Database (PostgreSQL / Supabase)** 및 **외부 공공 API/LLM 제공자**로 유기적으로 연결되어 있습니다.

```mermaid
graph TB
    subgraph ClientLayer ["🌐 1. 프론트엔드 (Frontend Layer)"]
        UI["React 18 + TypeScript + Tailwind CSS"]
        Views["7대 메인 뷰<br/>(Home, Explore, Detail, Kanban, Calendar, News, Profile)"]
        ApiClient["API Client Module (fetch wrapper)"]
        UI --> Views
        Views --> ApiClient
    end

    subgraph APILayer ["⚙️ 2. 백엔드 API (Backend Layer - FastAPI)"]
        FastAPI["FastAPI REST Server (Port 8000)"]
        RouterPolicy["/policies (정책 탐색 & 상세)"]
        RouterAI["/ai (AI 추천 & Q&A)"]
        RouterProfile["/profile (프로필 관리)"]
        RouterBookmarks["/bookmarks (북마크)"]
        RouterNoti["/notifications (알림 설정)"]
        Scheduler["APScheduler (매일 12:00 / 18:30 배치)"]

        FastAPI --> RouterPolicy
        FastAPI --> RouterAI
        FastAPI --> RouterProfile
        FastAPI --> RouterBookmarks
        FastAPI --> RouterNoti
        FastAPI --> Scheduler
    end

    subgraph AIEngine ["🤖 3. AI 파이프라인 (AI & RAG Pipeline Layer)"]
        RAG["RAG Pipeline (RAG_pipeline.py)"]
        VectorDB["Ollama nomic-embed-text (벡터 임베딩)"]
        Summarizer["AI 3줄 요약 엔진 (summarize_and_save_policies.py)"]
        TelegramBot["D-3 마감 알림 봇 (0928_alarm.py)"]
        NewsPipeline["실시간 정책 뉴스 크롤러 & 큐레이터"]

        RAG --> VectorDB
    end

    subgraph DataLayer ["🗄️ 4. 데이터베이스 & 스토리지 (Database Layer)"]
        Supabase[("PostgreSQL / Supabase")]
        T_Users[("users (사용자 프로필)")]
        T_Policies[("policies (통합 정책 데이터)")]
        T_Docs[("policy_documents (구비 서류)")]
        T_Bookmarks[("user_bookmarks (북마크)")]
        T_Logs[("ai_recommendation_logs (추천 기록)")]

        Supabase --- T_Users
        Supabase --- T_Policies
        Supabase --- T_Docs
        Supabase --- T_Bookmarks
        Supabase --- T_Logs
    end

    subgraph ExternalServices ["☁️ 5. 외부 연동 서비스 (External APIs)"]
        OntongAPI["온통청년 오픈 API"]
        BokjiroAPI["복지로 공공데이터 API"]
        GoogleNews["Google News RSS (정책 언론보도)"]
        LLMProviders["LLM Providers<br/>(OpenAI / Ollama Llama3 / OpenRouter)"]
        TelegramAPI["Telegram Bot API"]
    end

    %% 연결 관계
    ApiClient <==>|HTTP / REST JSON| FastAPI
    RouterPolicy <==> Supabase
    RouterProfile <==> Supabase
    RouterBookmarks <==> Supabase
    RouterAI <==> RAG
    Scheduler ==> OntongAPI
    Scheduler ==> BokjiroAPI

    RAG <==> LLMProviders
    RAG <==> Supabase
    Summarizer <==> LLMProviders
    Summarizer ==> Supabase

    OntongAPI ==> Summarizer
    BokjiroAPI ==> Summarizer
    GoogleNews ==> NewsPipeline
    NewsPipeline ==> Supabase

    TelegramBot <==> Supabase
    TelegramBot ==> TelegramAPI
```

---

## 2. 사용자 서비스 플로우 (User Journey & View Flow)

사용자가 웹 애플리케이션에 접속하여 맞춤 정책을 추천받고, 탐색, 캘린더 관리, AI 상담까지 진행하는 단계별 흐름입니다.

```mermaid
flowchart TD
    Start([사용자 웹사이트 접속]) --> HomeView["1. HomeView (홈/대시보드)"]

    HomeView --> CheckProfile{프로필 등록 여부}
    CheckProfile -- 미등록/수정 필요 --> ProfileView["7. ProfileView (맞춤 프로필 설정)"]
    ProfileView --> SaveProfile["인적사항/소득/주거/관심분야 저장"] --> HomeView
    
    CheckProfile -- 등록 완료 --> AIRecommendCard["AI 맞춤 혜택 Top 3 & 예상 수혜액 확인"]
    
    HomeView --> QuickActions{사용자 행동 선택}
    
    QuickActions -- "1. 정책 직접 검색/필터링" --> ExploreView["2. ExploreView (다차원 정책 탐색)"]
    QuickActions -- "2. 관심 정책 클릭" --> DetailView["3. DetailView (정책 상세 정보)"]
    QuickActions -- "3. 마감 일정 확인" --> CalendarSelect{보기 모드 선택}
    QuickActions -- "4. 최신 정책 뉴스/브리핑" --> NewsView["6. NewsView (AI 요약 뉴스 피드)"]

    ExploreView --> FilterAction["카테고리/지역/소득/연령 필터 & 검색"]
    FilterAction --> SelectPolicy["정책 카드 선택"] --> DetailView

    CalendarSelect -- 칸반 형태 --> KanbanView["4. KanbanView (D-Day 마감 칸반)"]
    CalendarSelect -- 월별 달력 --> CalendarView["5. CalendarView (월별 마감 캘린더)"]
    KanbanView --> SelectPolicy
    CalendarView --> SelectPolicy

    subgraph PolicyDetailInteraction ["DetailView 내 주요 인터랙션"]
        DetailView --> ViewDigest["AI 3줄 핵심 요약 & 적합도(%) 확인"]
        DetailView --> CheckEligibility["지원 자격 & 필요 서류 체크리스트"]
        DetailView --> BookmarkAction["북마크 토글 (관심 정책 등록)"]
        DetailView --> AskChatbot["AI 정책 질의응답 (RAG Chatbot)"]
        DetailView --> ApplyExternal["공식 신청 사이트 바로가기"]
    end

    NewsView --> ReadSummary["관련 정책 AI 3줄 요약 뉴스 열람"]
    NewsView --> GoRelatedPolicy["해당 정책 상세로 이동"] --> DetailView
```

---

## 3. AI 맞춤 추천 & RAG 질의응답 플로우 (AI & RAG Pipeline)

사용자의 개인 특성(연령, 소득, 지역, 취업상태 등)을 기반으로 자격 요건을 판별하고, 벡터 유사도 검색과 LLM을 통해 최적의 정책 및 액션 플랜을 도출합니다.

```mermaid
sequenceDiagram
    autonumber
    actor User as 사용자 (Frontend)
    participant API as FastAPI Backend (/ai)
    participant RAG as RAG Pipeline Engine
    participant VDB as Ollama Vector Embeddings
    participant DB as PostgreSQL (Supabase)
    participant LLM as LLM Engine (OpenAI/Llama3)

    rect rgb(240, 248, 255)
        Note over User, LLM: 1단계: 프로필 기반 AI 맞춤 정책 추천
        User->>API: POST /ai/recommendations (User Profile JSON)
        API->>RAG: 프로필 전달 및 추천 요청
        RAG->>DB: 1차 하드 필터링 (나이, 지역, 소득 조건 충족 정책 조회)
        DB-->>RAG: 후보 정책 목록 (Candidate Policies)
        RAG->>VDB: 사용자 관심사 & 상태 벡터 임베딩 유사도 계산
        VDB-->>RAG: 유사도 랭킹 Top K 정책
        RAG->>LLM: 프롬프트 전달 (프로필 + Top K 정책 + 매칭 근거 요청)
        LLM-->>RAG: Top 3 정책 매칭 점수, 추천 사유, 단계별 액션 플랜 생성
        RAG->>DB: AI 추천 로그 저장 (ai_recommendation_logs)
        RAG-->>API: 추천 결과 JSON 반환
        API-->>User: 맞춤 추천 카드 및 액션 플랜 렌더링
    end

    rect rgb(254, 243, 199)
        Note over User, LLM: 2단계: 정책별 실시간 RAG Q&A 챗봇
        User->>API: POST /ai/chat (policyId, 질문 텍스트, 대화 히스토리)
        API->>RAG: 질의 전달
        RAG->>DB: 해당 정책의 상세 조례/자격요건/구비서류 컨텍스트 조회
        DB-->>RAG: 정책 상세 데이터 전문
        RAG->>LLM: 시스템 프롬프트 (정확한 정책 지침 기반 답변 유도)
        LLM-->>RAG: 근거 조항 포함 맞춤형 답변 생성
        RAG-->>API: AI 답변 & 출처 레퍼런스 반환
        API-->>User: 챗봇 답변 말풍선 출력
    end
```

---

## 4. 공공데이터 수집 및 배치 스케줄러 플로우 (Data Ingestion & Sync)

온통청년 및 복지로의 공공 API를 통해 신규 및 변경 정책 데이터를 주기적으로 수집하고, LLM을 통해 표준화 및 3줄 요약을 거쳐 DB에 반영합니다.

```mermaid
flowchart TD
    SchedulerTimer(["⏰ APScheduler 트리거<br/>(매일 12:00, 18:30 또는 수동 실행)"]) --> TriggerSync[cron_policy_sync.py 실행]

    subgraph DataFetch ["1. 공공데이터 수집 (Data Fetching)"]
        TriggerSync --> FetchYouthCenter["온통청년 API 호출 (youthcenter_client.py)"]
        TriggerSync --> FetchBokjiro["복지로 복지서비스 API 호출 (bokjiro_client.py)"]
        TriggerSync --> FetchNews["Google News RSS 수집 (정책 키워드)"]
    end

    subgraph DataTransform ["2. 정규화 및 AI 요약 (ETL & AI Digest)"]
        FetchYouthCenter --> Normalize["스키마 표준화 (policy_data_schema.md 준수)"]
        FetchBokjiro --> Normalize
        Normalize --> Deduplicate["중복 정책 검증 및 변경사항 감지"]
        Deduplicate --> LLMSummarize["LLM 3줄 요약 생성<br/>(Ollama Llama3 / OpenAI)"]
        LLMSummarize --> FormatPayload["DB 적재용 Payload 완성"]
    end

    subgraph DataPersistence ["3. 데이터베이스 적재 (Upsert)"]
        FormatPayload --> UpsertDB["Supabase REST API (PostgREST) / SQLAlchemy"]
        UpsertDB --> SavePolicies[("policies 테이블 갱신")]
        UpsertDB --> SaveDocs[("policy_documents 테이블 갱신")]
        FetchNews --> SaveNews[("policy_news_integrated.json / DB 갱신")]
    end

    SavePolicies --> Finish([동기화 완료 로그 기록])
```

---

## 5. D-3 마감 임박 알림 서비스 플로우 (Notification Flow)

사용자가 북마크하거나 관심 등록한 정책 중 마감일이 3일 남은 정책을 자동으로 감지하여 텔레그램 메신저로 푸시 알림을 발송합니다.

```mermaid
flowchart LR
    CronDaily(["⏰ 매일 아침 알림 배치"]) --> FindExpiring["마감일이 D-3인 정책 조회<br/>(period_end = Today + 3일)"]
    
    FindExpiring --> CheckSubscribers["해당 정책을 북마크한 사용자<br/>& 텔레그램 수신 동의 사용자 매칭"]
    
    CheckSubscribers --> HasUsers{발송 대상 청년 존재?}
    HasUsers -- Yes --> BuildMessage["알림 메시지 빌드<br/>- 정책명<br/>- 마감일 (D-3)<br/>- 핵심 혜택 및 신청 링크"]
    HasUsers -- No --> EndNoUser([알림 없음 종료])
    
    BuildMessage --> TelegramAPI["Telegram Bot API 전송<br/>(send_message)"]
    TelegramAPI --> UserTelegram["📱 사용자 텔레그램 앱 수신"]
    UserTelegram --> LogHistory[("notifications_log 기록")]
    LogHistory --> End([발송 완료])
```

---

## 6. 데이터베이스 엔티티 관계도 (Database ERD)

데이터베이스의 주요 테이블 구조와 외래키(FK) 참조 관계입니다.

```mermaid
erDiagram
    USERS ||--o{ USER_BOOKMARKS : "북마크 저장"
    USERS ||--o{ AI_RECOMMENDATION_LOGS : "추천 이력 생성"
    USERS ||--o{ NOTIFICATIONS : "알림 수신"
    POLICIES ||--o{ POLICY_DOCUMENTS : "구비서류 포함"
    POLICIES ||--o{ USER_BOOKMARKS : "사용자에게 북마크됨"

    USERS {
        VARCHAR(50) id PK "사용자 고유 ID"
        VARCHAR(100) name "사용자 이름"
        VARCHAR(255) email "이메일 (Unique)"
        DATE birth_date "생년월일"
        VARCHAR(10) gender "성별"
        VARCHAR(20) contact "연락처"
        VARCHAR(100) region "거주 지역"
        VARCHAR(50) education "학력 상태"
        VARCHAR(50) employment_status "취업 상태"
        VARCHAR(20) housing_type "주거 형태 (월세/전세/자가)"
        INTEGER annual_income "연소득 (만원 단위)"
        VARCHAR(50) ai_provider "선택한 AI 엔진"
        VARCHAR(100) telegram_account "텔레그램 계정 ID"
        BOOLEAN is_telegram_enabled "텔레그램 알림 수신 여부"
        BOOLEAN is_email_enabled "이메일 알림 수신 여부"
        TIMESTAMP created_at "가입일시"
        TIMESTAMP updated_at "수정일시"
    }

    POLICIES {
        VARCHAR(50) id PK "정책 고유 ID (예: POL-2026-001)"
        VARCHAR(255) title "정책명"
        VARCHAR(150) organization "주관기관"
        VARCHAR(50) category "카테고리 (일자리/주거/교육/금융/참여)"
        VARCHAR(30) status "모집 상태 (상시/접수중/마감임박/마감)"
        DATE period_start "신청 시작일"
        DATE period_end "신청 마감일"
        TEXT benefit_summary "핵심 혜택 요약 (AI 3줄 요약)"
        VARCHAR(100) benefit_amount "지원 금액"
        VARCHAR(100) benefit_total_max "최대 지원 한도"
        VARCHAR(100) benefit_method "지급 방식"
        TEXT benefit_details "상세 혜택 설명"
        VARCHAR(50) target_age "연령 조건 텍스트"
        INTEGER min_age "최소 연령"
        INTEGER max_age "최대 연령"
        VARCHAR(150) income_condition "소득 조건 설명"
        INTEGER min_income "최소 소득"
        INTEGER max_income "최대 소득 한도"
        VARCHAR(255) residence_condition "거주지 요건"
        VARCHAR(100) education_condition "학력 요건"
        VARCHAR(100) employment_condition "취업상태 요건"
        VARCHAR(100) special_criteria "특화 분야"
        TEXT application_url "공식 신청 URL"
        VARCHAR(100) contact "문의처"
        VARCHAR(255) keywords "정책 핵심 키워드 3개"
        INTEGER view_count "조회수"
        TIMESTAMP created_at "등록일시"
        TIMESTAMP updated_at "수정일시"
    }

    POLICY_DOCUMENTS {
        SERIAL id PK "서류 ID"
        VARCHAR(50) policy_id FK "정책 ID (policies.id)"
        VARCHAR(255) document_name "제출 필요 서류명"
    }

    USER_BOOKMARKS {
        VARCHAR(50) user_id PK,FK "사용자 ID (users.id)"
        VARCHAR(50) policy_id PK,FK "정책 ID (policies.id)"
        TIMESTAMP created_at "북마크 일시"
    }

    AI_RECOMMENDATION_LOGS {
        VARCHAR(50) id PK "로그 ID"
        VARCHAR(50) user_id FK "사용자 ID"
        JSONB user_context "추천 당시 프로필 스냅샷"
        JSONB recommended_policies "추천된 정책 목록 & 점수"
        TEXT ai_reasoning "AI 매칭 및 액션플랜 종합 의견"
        VARCHAR(50) ai_provider "사용된 LLM 모델"
        TIMESTAMP created_at "추천 생성 일시"
    }

    NOTIFICATIONS {
        SERIAL id PK "알림 ID"
        VARCHAR(50) user_id FK "수신 사용자 ID"
        VARCHAR(50) policy_id FK "관련 정책 ID"
        VARCHAR(50) channel "알림 채널 (TELEGRAM / EMAIL)"
        TEXT message "발송된 알림 메시지"
        VARCHAR(20) status "전송 상태 (SENT / FAILED)"
        TIMESTAMP sent_at "발송 일시"
    }
```

---

## 7. 팀별 역할 및 파이프라인 매핑 요약

| 팀 역할 | 주요 코드 경로 | 핵심 담당 프로세스 |
| :--- | :--- | :--- |
| **🌐 Frontend** | `src/` (`App.tsx`, `views/`, `components/`) | 7개 뷰 UI/UX, 필터링 및 캘린더 인터랙션, AI 대화 인터페이스 |
| **⚙️ Backend** | `backend/` (`app/routers/`, `app/services/`) | RESTful API 엔드포인트 제공, 스케줄러 오케스트레이션, DB 트랜잭션 |
| **🤖 LLM AI** | `ai/` (`RAG_pipeline.py`, `summarize_and_save_policies.py`) | 정책 3줄 요약, 벡터 임베딩(Ollama), RAG 정책 Q&A 및 매칭 추천 |
| **🗄️ DB & Data** | `db/` (`schema.sql`, `fetch_youth_policies.py`) | DB 스키마 설계 및 인덱싱, 공공데이터 API 크롤러 및 데이터 적재 |
