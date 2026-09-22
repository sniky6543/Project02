# 청년큐레이터 (Youth Policy Curator) - Design System & Guide

> 본 문서는 Stitch 프로젝트 **`청년큐레이터`** (`projects/13579599468837343469`)에서 추출된 공식 디자인 시스템, 컬러 팔레트, 타이포그래피, 레이아웃 규칙 및 UI 컴포넌트 명세서입니다.

---

## 1. 브랜드 & 디자인 철학 (Brand & Stance)

- **타겟 사용자**: 대한민국 19~39세 청년층 (대학생, 취업준비생, 사회초년생, 신혼부부 등 1인 가구 청년)
- **핵심 감성 (Emotional Tone)**:
  - **Trustworthy & Authoritative (신뢰성 & 공공성)**: 복잡하고 방대한 정부 행정/복지 정책 정보를 명확한 위계와 높은 가독성으로 신뢰도 있게 전달
  - **Supportive & Direct (직관적 지원)**: 긴 정책 공고문을 3줄 핵심 요약(AI Digest), D-Day 카운트다운, 개인 맞춤 적합도(%)로 즉시 가공하여 제공
  - **Fresh & Optimistic (산뜻함 & 활력)**: 청량한 코발트/스카이 블루와 민트-시안 액센트, 넉넉한 여백을 활용해 관료주의적 피로도를 해소하고 현대 핀테크(Toss, Naver Financial) 수준의 쾌적한 UX 제공

---

## 2. 컬러 시스템 (Color Palette)

### 2.1 Core Brand Colors
| 역할 | 토큰명 | Hex Code | 설명 / 주요 용도 |
|---|---|---|---|
| **Primary** | `primary` | `#2563EB` (Blue-600) / `#004AC6` | 메인 브랜드 컬러, 주요 CTA 버튼, 활성 탭, 앵커 링크 |
| **Secondary / Accent** | `secondary` / `accent` | `#06B6D4` (Cyan-500) / `#00687A` | 매칭 적합도 하이라이트 (예: `98% 적합`), 진행률 바, 활성 키워드 칩 |
| **Tertiary** | `tertiary` | `#3B82F6` (Blue-500) / `#0051B1` | 보조 인터랙션, 링크 호버, 아이콘 강조 |
| **Primary Container** | `primary-container` | `#2563EB` | 주요 컨테이너 배경 |
| **Secondary Container** | `secondary-container`| `#57DFFE` | 보조 하이라이트 배경 |
| **Tertiary Container** | `tertiary-container` | `#0F69DC` | 3차 요소 컨테이너 |

### 2.2 Surface & Background Layering
| 계층 | Hex Code | 설명 |
|---|---|---|
| **Base Canvas / Background** | `#FFFFFF` / `#FAF8FF` | 기본 페이지 배경 (최적의 대비 및 시인성 보장) |
| **Surface Subdued** | `#F8FAFC` (Slate-50) | 사이드바, 필터 패널, 카드 백플레이트 |
| **Surface Highlight (AI Digest)** | `#EFF6FF` (Blue-50) | AI 정책 3줄 요약 박스, 핵심 가치 콜아웃, 선택된 리스트 항목 |
| **Surface Container Low** | `#F2F3FF` | 저대비 서피스 |
| **Surface Container** | `#EAEDFF` | 표준 서피스 컨테이너 |
| **Surface Container High** | `#E2E7FF` | 고대비 서피스 컨테이너 |
| **Border / Divider** | `#E2E8F0` (Slate-200) / `#F1F5F9` | 카드 및 섹션 구분선 |
| **Outline / Subtle Border** | `#737686` / `#C3C6D7` | 폼 필드 테두리 및 비활성 아웃라인 |

### 2.3 Typography & Neutrals
| 토큰명 | Hex Code | 용도 |
|---|---|---|
| **Headlines / Deep Charcoal** | `#0F172A` (Slate-900) / `#131B2E` | H1, H2, 메인 타이틀, 주요 통계 수치 |
| **Body Copy** | `#334155` (Slate-700) | 본문 텍스트, 정책 상세 내용 |
| **Muted Copy / Metadata** | `#64748B` (Slate-500) / `#434655` | 발행기관, 등록일, 보조 캡션, 툴팁 |
| **Inverse Surface** | `#283044` | 툴팁/다크 모달 배경 |

### 2.4 Status & Urgency (D-Day Indicators)
| 상태 | D-Day 범위 | 배경색 | 텍스트색 | 테두리색 |
|---|---|---|---|---|
| **긴급 (Immediate Urgency)** | `D-1` ~ `D-3`, 마감임박 | `#FEF2F2` (Red-50) | `#DC2626` (Red-600) | `#FECACA` (Red-200) |
| **주의 (Moderate Urgency)** | `D-7` ~ `D-14` | `#FFFBEB` (Amber-50) | `#B45309` (Amber-700) | `#FDE68A` (Amber-200) |
| **여유 / 상시 (Standard / Open)**| `상시`, `D-30+` | `#EFF6FF` (Blue-50) | `#1D4ED8` (Blue-700) | `#BFDBFE` (Blue-200) |

---

## 3. 타이포그래피 (Typography)

- **기본 서체 (Font Family)**: `Inter`, `Pretendard`, `Plus Jakarta Sans`, `-apple-system`, sans-serif
- **행간 원칙**: 한글 행정 용어 및 정책 정보의 최적 가독성을 위해 **150% ~ 170%**의 여유 있는 행간 적용

### 3.1 Type Scale
| 스타일 | Font Size | Font Weight | Line Height | Letter Spacing | 적용 대상 |
|---|---|---|---|---|---|
| `display-lg` | `2.25rem` (36px) | `700` (Bold) | `2.75rem` (44px) | `-0.02em` | 데스크톱 히어로 타이틀 |
| `display-lg-mobile` | `1.75rem` (28px) | `700` (Bold) | `2.25rem` (36px) | `-0.015em` | 모바일 히어로 타이틀 |
| `headline-lg` | `1.5rem` (24px) | `700` (Bold) | `2.0rem` (32px) | `-0.015em` | 섹션 대제목, 정책명 상세 |
| `headline-md` | `1.25rem` (20px) | `600` (SemiBold) | `1.75rem` (28px) | `-0.01em` | 카드 제목, 모달 헤더 |
| `match-stat` | `1.125rem` (18px) | `800` (ExtraBold) | `1.25rem` (20px) | `-0.02em` | 적합도 수치 (예: `98%`) |
| `body-lg` | `1.0625rem` (17px)| `400` (Regular) | `1.75rem` (28px) | `-0.005em` | 주요 본문 리드문 |
| `body-md` | `0.9375rem` (15px)| `400` (Regular) | `1.5rem` (24px) | `0em` | 일반 본문, 정책 설명 |
| `body-sm` | `0.8125rem` (13px)| `400` (Regular) | `1.25rem` (20px) | `0em` | 부가 설명, 메타데이터 |
| `label-lg` | `0.875rem` (14px) | `600` (SemiBold) | `1.25rem` (20px) | `-0.005em` | 버튼 텍스트, 탭 라벨 |
| `label-md` | `0.75rem` (12px)  | `600` (SemiBold) | `1.0rem` (16px) | `0.01em` | 뱃지, D-Day 태그 |

---

## 4. 레이아웃 & 스페이싱 (Layout & Spacing)

### 4.1 그리드 구조 (Grid Architecture)
- **데스크톱 (>= 1024px)**:
  - Max Container Width: `1200px` (중앙 정렬)
  - 12-Column Grid (Gutter: `1.5rem` / Margin: `3rem`)
  - 레이아웃 구성: **3열 좌측 고정 사이드바** (프로필, 필터, 북마크) + **9열 메인 피드** (정책 카드, 뉴스 피드, 상세 서랍)
- **태블릿 (768px ~ 1023px)**:
  - 8-Column Grid (Gutter: `1.25rem` / Margin: `2rem`)
  - 수평 태그 리본 및 접이식 필터 드로어
- **모바일 (< 768px)**:
  - 1-Column 단일 피드 (Margin: `1rem`)
  - 상단 고정 카테고리 알약(Pills) 네비게이션

### 4.2 스페이싱 토큰 (Spacing Scale - 8pt Base System)
| 토큰 | 크기 (Rem / Px) | 용도 |
|---|---|---|
| `space-xs` | `0.25rem` (4px) | 인라인 뱃지 패딩, 아이콘-텍스트 간격 |
| `space-sm` | `0.5rem` (8px) | 칩 내부 여백, 작은 버튼 패딩 |
| `space-md` | `0.75rem` (12px) | 인풋 패딩, 카드 내부 섹션 간격 |
| `space-lg` | `1.25rem` (20px) | 정책 카드 간 상하 간격, 컨테이너 패딩 |
| `space-xl` | `2.0rem` (32px) | 메인 섹션 간격 |

---

## 5. 코너 라운드 & 그림자 (Elevation & Shapes)

### 5.1 Corner Radius
- `sm`: `0.25rem` (4px) - 태그 내부 미세 요소
- `DEFAULT / md`: `0.5rem` (8px) - 폼 인풋, 필터 칩, 일반 버튼
- `lg`: `0.75rem` (12px) - AI 요약(Digest) 박스
- `xl`: `1.0rem` (16px) - 정책 카드, 주요 컨테이너
- `2xl`: `1.5rem` (24px) - 메인 모달, 대형 다이얼로그
- `full`: `9999px` - D-Day 뱃지, 적합도 알약 칩

### 5.2 Elevation Hierarchy
- **Level 0 (Flat)**: `#FFFFFF` 베이스 캔버스, `#F8FAFC` 패널
- **Level 1 (Default Card)**: 테두리 `1px solid #E2E8F0`, 그림자 `0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)`
- **Level 2 (Hover / Active Card)**: 마우스 호버 시 부드러운 리프트 효과 `0 10px 15px -3px rgba(37, 99, 235, 0.07), 0 4px 6px -2px rgba(15, 23, 42, 0.03)` 및 테두리 `#93C5FD` 전환
- **Level 3 (Sticky Header / Modal)**: 글래스모피즘 `backdrop-filter: blur(12px)` + `rgba(255, 255, 255, 0.85)` + 그림자 `0 20px 25px -5px rgba(15, 23, 42, 0.08)`

---

## 6. 주요 UI 컴포넌트 명세 (Components)

### 6.1 정책 요약 카드 (Policy Summary Card)
- **컨테이너**: 배경 `#FFFFFF`, 테두리 `1px solid #E2E8F0`, `rounded-xl` (16px)
- **상단 헤더**: 좌측 발급 기관명 (예: `국토교통부`, `서울시`) + 우측 상태 칩 클러스터 (적합도 % + D-Day 뱃지)
- **적합도 인디케이터**: `#ECFEFF` 배경, `#0E7490` 텍스트, `1px solid #A5F3FC` 테두리 (`98% 적합`)
- **AI 3줄 요약 박스 (Digest Box)**: `#EFF6FF` (Blue-50) 배경, `rounded-lg` (12px), `지원대상`, `지원혜택`, `신청방법` 3개 항목 구조화

### 6.2 D-Day 마감일 뱃지 (Deadline Badges)
- **D-3 이하 (긴급)**: `bg-red-50 text-red-600 border border-red-200`
- **D-7 ~ D-14 (임박)**: `bg-amber-50 text-amber-700 border border-amber-200`
- **상시 / D-30+ (여유)**: `bg-blue-50 text-blue-700 border border-blue-200`

### 6.3 필터 칩 & 카테고리 셀렉터 (Filter Chips)
- **기본 상태**: `bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg`
- **선택 상태**: `bg-blue-600 text-white font-semibold rounded-lg shadow-sm`
- **카테고리 분류**: 주거·월세, 취업·창업, 금융·자산형성, 문화·복지, 교육

### 6.4 액션 버튼 (Action Buttons)
- **Primary CTA ("신청 바로가기")**: `bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2.5`
- **Secondary CTA ("관심공고 저장")**: `bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg px-4 py-2.5`

### 6.5 검색창 (Search Input)
- `bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-900`
- 포커스 시: `ring-2 ring-blue-500 border-transparent outline-none transition-all`
