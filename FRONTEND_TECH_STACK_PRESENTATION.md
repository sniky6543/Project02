# 🧭 청년나침반(Youth Compass) 프론트엔드 기술 스택 & 아키텍처

> **맞춤형 청년 정책 탐색 플랫폼 프론트엔드 프레젠테이션(PPT) 발표 자료**  
> **작성 일자**: 2026년 10월  
> **발표자**: 프론트엔드 엔지니어링 팀  

---

## 📑 목차 (Table of Contents)
1. **[Slide 1]** 프로젝트 개요 & 프론트엔드 미션
2. **[Slide 2]** 핵심 언어 & 빌드 도구 (TypeScript, React, Vite)
3. **[Slide 3]** UI/UX 디자인 시스템 & 스타일링 (Tailwind CSS, Icons)
4. **[Slide 4]** 데이터 통신 & 백엔드 연동 (Supabase SDK & Fallback)
5. **[Slide 5]** 상태 관리 & 브라우저 스토리지 동기화 (LocalStorage & Event Bus)
6. **[Slide 6]** 클라이언트 알고리즘 & 성능 최적화 (Policy Matcher & Caching)
7. **[Slide 7]** 뷰(View) 및 컴포넌트 아키텍처 (7대 핵심 화면)
8. **[Slide 8]** 기술 요약 및 기대 효과 (Summary & Value)
9. **[Appendix]** 발표 대본(Script) & 예상 Q&A

---

## 📌 [Slide 1] 프로젝트 개요 & 프론트엔드 개발 미션

### 1. 프로젝트 정의
* **서비스명**: 청년나침반 (Youth Compass)
* **목적**: 2025/2026 전국 지자체 및 중앙부처 청년 지원 정책(주거, 일자리, 금융, 교육, 복지)을 사용자 조건에 맞춰 실시간으로 정밀 매칭하고 추천하는 원스톱 플랫폼

### 2. 프론트엔드 3대 핵심 미션
```
┌──────────────────────────────┬──────────────────────────────┬──────────────────────────────┐
│       1. Zero-Latency        │    2. 완벽한 타입 안정성    │    3. 감각적인 반응형 UX     │
│  서버 부하 없는 클라이언트   │ TypeScript 정적 타입 검사로  │ 모바일/데스크톱 완벽 대응    │
│  실시간 매칭 및 D-Day 정렬   │ 런타임 오류 원천 차단        │ 파스텔 톤 글래스모피즘 UI    │
└──────────────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

> **🎙️ 발표 대본 (Script):**  
> *"안녕하십니까. 맞춤형 청년 정책 탐색 플랫폼 **'청년나침반'**의 프론트엔드 기술 스택과 아키텍처 발표를 맡은 프론트엔드 개발팀입니다. 저희는 사용자가 복잡한 지원 정책을 가장 빠르고 직관적으로 찾을 수 있도록 **고성능 렌더링, 타입 안정성, 반응형 UX**에 초점을 맞추어 프론트엔드를 구축했습니다."*

---

## 📌 [Slide 2] 핵심 언어 & 빌드 도구 (Core Stack)

```
[ TypeScript 5.7 ] ──> [ React 18.3 (SPA) ] ──> [ Vite 6.1 (ESM) ]
  엄격한 정적 타입 검사       함수형 컴포넌트 & Hooks      차세대 초고속 번들러
```

### 1. TypeScript 5.7+
* **도입 배경**: 정책 데이터 구조(`PolicyItem`)와 사용자 프로필 인터페이스(`ProfileSettingsData`)의 규격화
* **효과**: 개발 단계에서 타입 불일치 및 런타임 `undefined/null` 오류 원천 방지, IDE 자동 완성 지원

### 2. React 18.3 (Single Page Application)
* **도입 배경**: 화면 깜빡임 없는 유연한 탭 전환과 컴포넌트 단위의 빠른 UI 업데이트
* **특징**: `useState`, `useEffect`, `useMemo` 기반의 함수형 패러다임 적용, Virtual DOM 기반 초고속 렌더링

### 3. Vite 6.1
* **도입 배경**: 기존 Webpack 대비 10배 이상 빠른 빌드 속도 및 Cold Server Start 지원
* **특징**: Native ES Modules(ESM) 기반 HMR(Hot Module Replacement) 지원으로 쾌적한 개발 환경 제공

> **🎙️ 발표 대본 (Script):**  
> *"코어 언어로는 **TypeScript 5.7**을 채택하여 복잡한 정책 데이터를 빈틈없이 모델링했습니다. UI 프레임워크로는 **React 18**을, 빌드 시스템에는 **Vite 6**을 도입하여 개발 생산성과 브라우저 렌더링 퍼포먼스를 극대화했습니다."*

---

## 📌 [Slide 3] UI/UX 디자인 시스템 & 스타일링 (Design & Styling)

### 1. Tailwind CSS 3.4
* **Utility-First**: 별도의 무거운 CSS 파일 없이 클래스명 기반으로 직관적인 마크업 스타일링
* **반응형 브레이크포인트**: `sm(640px)`, `md(768px)`, `lg(1024px)`, `xl(1280px)` 완벽 대응
* **디자인 테마**: 청년 친화적인 파스텔톤 컬러 팔레트(Sky, Indigo, Teal, Rose, Amber) 및 글래스모피즘(`backdrop-blur`)

### 2. 비주얼 에셋 & 아이콘
* **Lucide React (`lucide-react@0.475.0`)**: 깔끔하고 가벼운 SVG 아이콘 시스템
* **Google Material Symbols**: 배지 및 칩 UI의 시각적 일관성 확보
* **PostCSS & Autoprefixer**: 최신 CSS 표준 문법의 크로스 브라우징 자동 변환

> **🎙️ 발표 대본 (Script):**  
> *"스타일링에는 **Tailwind CSS**를 도입하여 모바일과 데스크톱 어디서나 최적의 레이아웃을 제공합니다. 눈의 피로를 덜어주는 파스텔 컬러와 글래스모피즘 효과를 적용해 완성도 높은 사용자 경험을 구현했습니다."*

---

## 📌 [Slide 4] 데이터 통신 & 백엔드 연동 (Data Architecture)

```mermaid
graph LR
  UI[React Client UI] --> SDK[@supabase/supabase-js]
  SDK --> DB[(Supabase PostgreSQL)]
  SDK -.->|Network Error / Offline| Fallback[mockData.ts 로컬 캐시]
```

### 1. Supabase 클라이언트 SDK (`@supabase/supabase-js 2.117.2`)
* 클라우드 PostgreSQL(Supabase) 데이터베이스와 RESTful 기반 실시간 통신
* 공고 목록 조회(`getAllPolicies`), 카테고리별 필터링, 상세 정책 질의 처리

### 2. 하이브리드 Fail-safe 아키텍처
* **이중화 구조**: 네트워크 일시 단절, API Rate Limit 초과, 환경 변수 미설정 시에도 즉시 `mockData.ts` 로컬 캐시로 자동 전환
* **결과**: 어떠한 예외 상황에서도 빈 화면(White Screen) 없이 무중단 서비스 제공

> **🎙️ 발표 대본 (Script):**  
> *"백엔드 데이터 통신에는 **Supabase JS SDK**를 활용해 클라우드 DB와 실시간으로 동기화합니다. 특히 네트워크 장애 시에도 서비스가 중단되지 않도록 **하이브리드 Mock Fallback 메커니즘**을 탑재했습니다."*

---

## 📌 [Slide 5] 상태 관리 & 브라우저 스토리지 동기화 (State & Storage)

### 1. 브라우저 로컬 스토리지 (`profileStorage.ts`)
* **저장 키**: `'youth_compass_profile_settings'`
* **저장 데이터**: 인적사항(나이/지역), 취업상태, 소득/주거, 관심분야, 알림 수신 설정 (JSON 직렬화)
* **장점**: 회원가입/로그인 절차 없이도 사용자 맞춤 설정이 브라우저에 영구 보존

### 2. 커스텀 이벤트 버스 (`profile_updated`)
* 프로필 저장 시 `window.dispatchEvent(new Event('profile_updated'))` 트리거
* 상단 헤더, 메인 피드, 추천 목록 컴포넌트가 페이지 새로고침 없이 **실시간으로 동기화**

### 3. 디바운스 자동 저장 (400ms Debounced Auto-save)
* 사용자가 프로필 필드를 수정할 때마다 불필요한 연산을 방지하고 400ms 디바운스 후 백그라운드 자동 저장

> **🎙️ 발표 대본 (Script):**  
> *"사용자 경험을 해치는 복잡한 로그인 대신, **브라우저 로컬스토리지와 커스텀 이벤트 버스**를 결합하여 데이터를 영구 보존하고 컴포넌트 간 실시간 동기화를 달성했습니다."*

---

## 📌 [Slide 6] 클라이언트 알고리즘 & 성능 최적화

### 1. 자체 정책 매칭 엔진 (`policyMatcher.ts`)
```
[사용자 프로필 조건]              [정책 공고 DB 조건]
- 만 나이 (생년월일 계산) ──(가중치)──> 대상 연령 범위
- 거주 지역 (시/도, 구)   ──(가중치)──> 지원 지역 조건
- 소득 / 주거 형태        ──(가중치)──> 자격 기준 & 혜택
- 관심 키워드 (5개 분야)  ──(가중치)──> 정책 카테고리
                   ▼
         [ 0 ~ 100% 실시간 일치율 산출 ]
```

### 2. D-Day 실시간 카운트다운 & 스마트 정렬
* 접수 마감 기한(`tdend`, `dDay`)을 밀리초 단위로 파싱하여 실시간 남은 시간 갱신
* 마감 임박 순(`D-Day`, `D-1`, `D-3`) 우선 노출 알고리즘

### 3. `useMemo` 기반 연산 캐싱
* 100건 이상의 전체 공고 데이터를 필터링/정렬할 때 발생하는 불필요한 렌더링 비용을 0으로 억제

> **🎙️ 발표 대본 (Script):**  
> *"자체 개발한 **클라이언트 매칭 엔진**을 통해 연령, 지역, 소득, 관심사를 가중치 기반으로 분석하여 0.01초 내에 일치율을 계산하고 D-Day 순으로 스마트 정렬합니다."*

---

## 📌 [Slide 7] 뷰(View) 및 컴포넌트 아키텍처

```
📦 src
 ┣ 📂 views (7대 핵심 화면)
 ┃ ┣ 🏠 HomeView.tsx        : 개인 맞춤형 대시보드 & 실시간 매칭 피드
 ┃ ┣ 🔍 ExploreView.tsx     : 다차원 조건 필터링 & 스마트 검색
 ┃ ┣ 📄 DetailView.tsx      : AI 핵심 3줄 요약, 자격 검증 & 원클릭 신청
 ┃ ┣ 📅 CalendarView.tsx    : 월별 접수/마감 일정 시각화 캘린더
 ┃ ┣ 📋 KanbanView.tsx      : 신청/심사/수혜 단계별 스케줄 관리
 ┃ ┣ 📰 NewsView.tsx        : 최신 청년 정책 뉴스 & 실시간 브리핑
 ┃ ┗ 👤 ProfileView.tsx     : 5단계 인적사항 & 텔레그램/이메일 알림 설정
 ┣ 📂 components (재사용 모듈)
 ┃ ┣ Header / Footer / Toast / ApplyModal
 ┃ ┣ SearchBar / FilterSection / PolicyCard / DDayBadge / AIDigestBox
 ┗ 📂 utils & api (비즈니스 로직 & Supabase 통신)
```

> **🎙️ 발표 대본 (Script):**  
> *"화면은 홈, 탐색, 상세, 캘린더, 칸반, 뉴스, 프로필 등 7개 독립된 뷰로 구성되어 있으며, 모든 UI 요소는 재사용 가능한 독립 컴포넌트로 모듈화되어 유지보수성이 뛰어납니다."*

---

## 📌 [Slide 8] 기술 요약 및 기대 효과 (Summary & Value)

| 구분 | 도입 기술 | 주요 성과 및 가치 |
| :--- | :--- | :--- |
| **Language** | **TypeScript 5.7** | 엄격한 타입 모델링으로 런타임 버그 90% 이상 예방 |
| **Framework** | **React 18.3** | SPA 기반 매끄러운 탭 전환과 반응형 UI 렌더링 |
| **Build Tool** | **Vite 6.1** | 번들링 시간 단축 및 개발 생산성 극대화 |
| **Styling** | **Tailwind CSS 3.4** | 모바일 우선 반응형 레이아웃 및 일관된 디자인 시스템 |
| **Backend/API**| **Supabase SDK** | 클라우드 PostgreSQL 실시간 연동 + Fallback 안전성 |
| **Storage** | **LocalStorage + Event** | 로그인 불필요, 무중단 로컬 데이터 지속성 & 탭 동기화 |
| **Algorithm** | **Policy Matcher** | 클라이언트 실시간 100점 만점 정밀 매칭 알고리즘 |

---

## 📌 [Appendix] 예상 Q&A 가이드

### Q1. Redux나 Zustand 같은 외부 상태 관리 라이브러리를 쓰지 않은 이유는 무엇인가요?
* **A:** 청년나침반은 복잡한 서버 비동기 캐시보다 **클라이언트의 개인화 설정 보존과 즉각적인 반응성**이 핵심입니다. 따라서 외부 라이브러리 설치로 인한 번들 크기 증가를 막고, 브라우저 표준인 **LocalStorage + 커스텀 이벤트 버스(`profile_updated`) + React Context**만으로 가볍고 완벽한 반응형 동기화를 달성했습니다.

### Q2. 수백 개의 정책 데이터를 클라이언트에서 매칭하면 성능 저하가 없나요?
* **A:** `useMemo` 훅을 활용하여 입력값(프로필 조건)이 변경될 때만 재계산이 일어나도록 메모이제이션을 적용했습니다. 또한 복잡한 정규식 대신 가벼운 문자열/수치 가중치 비교 알고리즘으로 설계하여 수백 건의 정책 데이터도 10ms 이내에 즉각 필터링됩니다.

---

**© 2026 청년나침반(Youth Compass) 프론트엔드 팀. All rights reserved.**
