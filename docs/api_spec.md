# 🧭 청년나침반 (Youth Compass) API 명세서 (v1.0)

> **문서 버전**: v1.0.0  
> **최종 수정일**: 2026-09-22  
> **기본 Base URL**: `http://localhost:8000/api`  
> **담당 팀원**: 4인 협업 (Frontend / Backend / Database / LLM AI)

---

## 📌 1. 공통 규격 (Standard Conventions)

### 1.1 HTTP 상태 코드
- `200 OK`: 요청 성공 및 데이터 반환
- `201 Created`: 리소스 생성 성공
- `400 Bad Request`: 요청 파라미터 또는 본문 유효성 검증 실패
- `401 Unauthorized`: 인증 토큰 누락 또는 유효하지 않음
- `404 Not Found`: 요청한 리소스를 찾을 수 없음
- `500 Internal Server Error`: 서버 내부 오류 또는 외부 API(LLM 등) 호출 실패

### 1.2 공통 응답 포맷 (Standard Response Format)
모든 API 응답은 아래의 일관된 JSON 래퍼 구조를 따릅니다.

```json
// 성공 응답 (Success)
{
  "success": true,
  "statusCode": 200,
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": { ... },
  "timestamp": "2026-09-22T15:30:00Z"
}

// 실패 응답 (Error)
{
  "success": false,
  "statusCode": 400,
  "message": "필수 파라미터가 누락되었습니다: age",
  "errorDetails": {
    "field": "age",
    "reason": "age must be an integer greater than 0"
  },
  "timestamp": "2026-09-22T15:30:00Z"
}
```

---

## 🏛️ 2. 정책 탐색 & 상세 API (`/policies`) - [Backend & DB 담당]

### 2.1 정책 목록 조회 및 다차원 필터링 (Explore List)
- **메서드**: `GET`
- **엔드포인트**: `/policies`
- **설명**: 조건 필터(카테고리, 지역, 혼인여부, 연령, 소득, 학력, 취업상태, 특화분야) 및 정렬 조건에 따른 정책 목록을 페이징하여 조회합니다.

#### Query Parameters
| 파라미터명 | 타입 | 필수여부 | 기본값 | 설명 |
| :--- | :--- | :---: | :---: | :--- |
| `keyword` | string | X | `null` | 검색 키워드 (제목, 내용, 주관기관) |
| `category` | string | X | `전체` | `일자리`, `주거`, `교육·직업훈련`, `금융·복지·문화`, `참여·기반` |
| `region` | string | X | `전국` | `서울특별시`, `경기도`, `부산광역시` 등 |
| `maritalStatus` | string | X | `제한없음` | `미혼`, `기혼`, `기타` |
| `age` | integer | X | `null` | 청년 만 나이 (예: 29) |
| `minIncome` | integer | X | `0` | 연소득 최소값 (만원 단위) |
| `maxIncome` | integer | X | `null` | 연소득 최대값 (만원 단위, 예: 3600) |
| `education` | string | X | `제한없음` | `고졸 미만`, `고교 재학`, `고교 졸업`, `대학 재학`, `대학 졸업`, `석·박사` |
| `employment` | string | X | `제한없음` | `재직자`, `미취업자`, `프리랜서`, `(예비)창업자`, `단기근로자` |
| `specialCriteria` | string | X | `제한없음` | `중소기업`, `청년 1인가구`, `기초생활수급자`, `자립준비청년` |
| `sortBy` | string | X | `latest` | `latest`(최신순), `popular`(인기순), `deadline`(마감임박순), `matchScore`(적합도순) |
| `page` | integer | X | `1` | 페이지 번호 |
| `limit` | integer | X | `10` | 페이지당 아이템 개수 |

#### 응답 예시 (`200 OK`)
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "totalCount": 18,
    "currentPage": 1,
    "totalPages": 2,
    "policies": [
      {
        "id": "POL-2026-001",
        "title": "청년 월세 특별지원 (2차)",
        "organization": "국토교통부",
        "category": "주거",
        "categoryBadgeColor": "rose",
        "status": "상시모집",
        "dDay": null,
        "benefitSummary": "월 최대 20만원 지원 (최장 12개월간 분할 지급, 총 240만원)",
        "targetAge": "만 19세 ~ 34세",
        "incomeCondition": "중위소득 60% 이하 (원가구 100% 이하)",
        "employmentCondition": "무관",
        "matchScore": 96,
        "viewCount": 1420,
        "isBookmarked": false
      }
    ]
  }
}
```

---

### 2.2 정책 상세 정보 조회 (Policy Detail)
- **메서드**: `GET`
- **엔드포인트**: `/policies/{policyId}`
- **설명**: 특정 정책의 상세 지원 자격, 혜택 세부내역, 신청 절차, 구비 서류, 문의처를 조회합니다.

#### Path Parameters
| 파라미터명 | 타입 | 설명 |
| :--- | :--- | :--- |
| `policyId` | string | 정책 고유 ID (예: `POL-2026-001`) |

#### 응답 예시 (`200 OK`)
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "POL-2026-001",
    "title": "청년 월세 특별지원 (2차)",
    "organization": "국토교통부 / 한국토지주택공사(LH)",
    "category": "주거",
    "status": "접수중",
    "period": "2026.01.01 ~ 2026.12.31",
    "benefit": {
      "amount": "월 최대 20만원 (최장 12개월)",
      "totalMax": "240만원",
      "method": "매월 계좌 입금",
      "details": "실제 납부하는 월세 범위 내에서 최대 20만원까지 지원"
    },
    "eligibility": {
      "age": "만 19세 ~ 34세 청년 (부모와 별도 거주 무주택 청년)",
      "income": "청년가구 기준 중위소득 60% 이하 & 원가구 100% 이하",
      "residence": "보증금 5천만원 이하 및 월세 70만원 이하 주택",
      "restrictions": "주택 소유자, 직계존속 주택 임차인, 공공임대 거주자 제외"
    },
    "documents": [
      "월세지원 신청서",
      "소득·재산 신고서",
      "임대차계약서 사본 및 최근 3개월 월세 이체 증빙서류",
      "가족관계증명서 (상세)"
    ],
    "applicationUrl": "https://www.bokjiro.go.kr",
    "contact": "국토교통부 콜센터 (1600-0777)",
    "matchScore": 96,
    "aiMatchReason": "귀하의 연소득(3,200만원) 및 월세 거주 조건에 완벽히 부합하며, 연간 최대 240만원 주거비 절감이 가능합니다."
  }
}
```

---

## 🤖 3. AI 맞춤 추천 & 챗봇 API (`/ai`) - [LLM AI & Backend 담당]

### 3.1 사용자 프로필 기반 AI 맞춤 정책 추천 생성 (AI Recommendation Engine)
- **메서드**: `POST`
- **엔드포인트**: `/ai/recommendations`
- **설명**: 사용자의 프로필 조건(소득, 주거, 학력, 취업상태 등)을 분석하여 최적의 추천 정책 TOP 3~5와 매칭 이유, 우선순위 로드맵을 반환합니다.

#### Request Body
```json
{
  "userProfile": {
    "age": 29,
    "gender": "남성",
    "region": "서울특별시 관악구",
    "housingType": "월세",
    "annualIncome": 3200,
    "education": "대학 졸업",
    "employmentStatus": "미취업자",
    "specialCriteria": ["청년 1인가구"]
  },
  "preferredCategory": ["주거", "일자리"],
  "aiModel": "OPENAI" // "OPENAI" | "OLLAMA" | "Router API"
}
```

#### 응답 예시 (`200 OK`)
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "recommendationId": "REC-20260922-9841",
    "summary": "회원님의 조건에 맞는 지원금 혜택은 연간 최대 620만원 수준입니다.",
    "matchCount": 3,
    "recommendations": [
      {
        "rank": 1,
        "policyId": "POL-2026-001",
        "title": "청년 월세 특별지원 (2차)",
        "category": "주거",
        "matchScore": 96,
        "expectedBenefit": "연간 최대 240만원",
        "aiReason": "현재 서울시 관악구 월세 거주 중이며 연소득 3,200만원 조건에서 1순위 지원 대상입니다.",
        "urgency": "상시접수"
      },
      {
        "rank": 2,
        "policyId": "POL-2026-008",
        "title": "청년 구직활동지원금 & 부트캠프",
        "category": "일자리",
        "matchScore": 92,
        "expectedBenefit": "월 50만원 x 6개월 (총 300만원)",
        "aiReason": "미취업 상태의 구직 활동을 지원하는 사업으로 자격 요건을 충족합니다.",
        "urgency": "마감 14일전"
      }
    ],
    "actionPlan": "1단계로 월세 지원을 먼저 신청하신 후, 2단계로 구직활동 지원금을 신청하시는 것을 권장합니다."
  }
}
```

---

### 3.2 정책 Q&A 및 AI 어시스턴트 질의 (AI Chat / Policy Inquiries)
- **메서드**: `POST`
- **엔드포인트**: `/ai/chat`
- **설명**: 특정 정책 또는 청년 지원 제도에 대해 사용자가 질문하면 RAG 기반으로 답변을 생성합니다.

#### Request Body
```json
{
  "policyId": "POL-2026-001",
  "question": "부모님과 따로 살고 있는데 부모님 소득도 심사 대상에 포함되나요?",
  "chatHistory": [
    { "role": "user", "content": "신청 조건이 어떻게 되나요?" },
    { "role": "assistant", "content": "만 19~34세 무주택 청년으로 기준 중위소득 60% 이하입니다." }
  ]
}
```

#### 응답 예시 (`200 OK`)
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "answer": "네, 청년가구 소득(중위소득 60% 이하) 외에도 부모님을 포함한 '원가구 소득'(중위소득 100% 이하)을 함께 심사합니다. 단, 만 30세 이상이거나 기혼자, 혹은 중위소득 50% 이상의 독립 소득이 있는 경우 원가구 소득 심사가 면제될 수 있습니다.",
    "references": [
      "국토교통부 청년월세특별지원 사업지침 제4조(소득·재산 기준)"
    ]
  }
}
```

---

## 👤 4. 사용자 프로필 & 설정 API (`/profile`) - [Backend & DB 담당]

### 4.1 내 프로필 정보 조회
- **메서드**: `GET`
- **엔드포인트**: `/profile/me`
- **설명**: 현재 로그인한 사용자의 인적사항, 소득구간, 주거형태, 알림 설정 정보를 가져옵니다.

#### 응답 예시 (`200 OK`)
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "userId": "usr-10029",
    "personal": {
      "name": "김청년",
      "birthDate": "1997-05-14",
      "gender": "남성",
      "contact": "010-1234-5678",
      "region": "서울특별시 관악구"
    },
    "education": "대학 졸업",
    "employmentStatus": "미취업자",
    "housing": {
      "housingType": "월세", // "자가" | "전세" | "월세"
      "annualIncome": 3200 // 만원
    },
    "aiSettings": {
      "selectedProvider": "OPENAI", // "OPENAI" | "OLLAMA" | "Router API"
      "hasApiKey": true
    },
    "notificationChannels": {
      "telegram": {
        "enabled": true,
        "account": "@youth_compass_user"
      },
      "email": {
        "enabled": true,
        "account": "youth.compass@example.com"
      }
    }
  }
}
```

---

### 4.2 프로필 정보 및 설정 업데이트
- **메서드**: `PUT`
- **엔드포인트**: `/profile/me`
- **설명**: 사용자의 소득, 주거계약 형태, AI API 키 설정, 알림 수신 채널 설정을 저장합니다.

#### Request Body
```json
{
  "housingType": "월세",
  "annualIncome": 3200,
  "education": "대학 졸업",
  "employmentStatus": "미취업자",
  "aiSettings": {
    "selectedProvider": "Router API",
    "apiKey": "sk-or-v1-xxxxxxxxxxxxxxx"
  },
  "notificationChannels": {
    "telegram": {
      "enabled": true,
      "account": "@youth_compass_user"
    },
    "email": {
      "enabled": false,
      "account": "youth.compass@example.com"
    }
  }
}
```

---

## 🔖 5. 관심 정책 북마크 API (`/bookmarks`) - [Backend & DB 담당]

### 5.1 북마크 토글 (저장 / 저장 취소)
- **메서드**: `POST`
- **엔드포인트**: `/bookmarks/toggle`
- **Request Body**:
```json
{
  "policyId": "POL-2026-001"
}
```
- **응답 예시**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "policyId": "POL-2026-001",
    "isBookmarked": true,
    "totalBookmarkedCount": 3
  }
}
```

---

## 🚀 6. 프론트엔드 연동 팁 (For Frontend Team)

1. **API 클라이언트 위치**: `src/api/` 폴더 내에 서비스별(e.g., `policyApi.ts`, `aiApi.ts`, `profileApi.ts`)로 함수를 분리하여 호출합니다.
2. **타입 정의 위치**: `src/types/api.ts`, `src/types/policy.ts`에서 위 JSON 명세의 TypeScript 인터페이스를 선언하고 사용합니다.
3. **환경변수 접근**: `import.meta.env.VITE_API_BASE_URL`을 통해 Base URL을 동적으로 설정합니다.
