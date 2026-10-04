-- ==============================================================================
-- 📋 청년 정책 및 혜택 통합 데이터베이스 스키마 (schema.sql)
--
-- 기반 문서:
--   1) policy_data_schema.md (통합 청년 정책 데이터 스키마 명세)
--   2) fetch_youth_policies.py (온통청년 & 공공데이터포털 수집/정규화 파이프라인)
--
-- 데이터 출처:
--   - 온통청년 API (youthcenter.go.kr)
--   - 공공데이터포털 API/카탈로그 (data.go.kr)
-- ==============================================================================

-- 1. 청년 정책 및 혜택 통합 테이블 (youth_policies)
CREATE TABLE IF NOT EXISTS youth_policies (
    -- 식별자 및 출처 정보
    id                  VARCHAR(100) PRIMARY KEY,                   -- 정책 고유 식별자 (예: ONTONG_20260922005400113524, DATA_GO_001)
    source              VARCHAR(100) NOT NULL,                      -- 데이터 수집 출처 (온통청년, 공공데이터포털, 통합 등)
    
    -- 상태 정보 (fetch_youth_policies.py의 classify_policy_status 결과)
    status              VARCHAR(50) DEFAULT '진행중',               -- 정책 진행 상태 (진행중, 예정, 마감 등)
    status_detail       VARCHAR(150),                               -- 상세 상태 설명 (예: 사업진행중(~20261231), 신청예정, 상시 모집 등)
    
    -- 기본 정책 정보
    title               VARCHAR(255) NOT NULL,                      -- 정책/혜택 명칭
    category            VARCHAR(150) NOT NULL,                      -- 대분류 > 중분류 형태의 카테고리 (예: 교육･직업훈련 > 미래역량강화)
    organization        VARCHAR(255) NOT NULL,                      -- 주관 부처 및 운영 기관명 (예: 문화체육관광부, 국토교통부)
    summary             TEXT NOT NULL,                              -- 정책 핵심 내용 요약 (1~2줄)
    support_content     TEXT,                                       -- 구체적인 지원 혜택 및 지원금/내용
    
    -- 지원 자격 요건
    target_age          VARCHAR(100),                               -- 지원 대상 연령 기준 (예: 만 19세~34세 청년, 19~39세)
    target_condition    TEXT,                                       -- 소득, 거주지, 학력, 취업상태 등 지원 자격 요건
    
    -- 기간 정보
    apply_period        VARCHAR(255),                               -- 신청 가능 기간 (예: 20260727 ~ 20260812, 상시 접수 등)
    business_period     VARCHAR(255),                               -- 사업 수행/운영 기간 (예: 20260101 ~ 20261231)
    
    -- 신청 및 링크
    apply_method        TEXT,                                       -- 신청 방법 및 접수 절차 (온라인 접수처, 방문 접수 등)
    apply_url           TEXT,                                       -- 신청 및 상세 공고 링크 (URL)
    
    -- 정책 키워드 (3개)
    keywords            VARCHAR(255),                               -- 정책 핵심 키워드 (예: 월세지원, 주거안정, 무주택청년)
    
    -- 부가 메타데이터
    view_count          INTEGER DEFAULT 0,                          -- 조회수
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,        -- 레코드 생성 일시
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP         -- 레코드 수정 일시
);

-- ==============================================================================
-- 2. 검색 및 필터링 성능 최적화 인덱스 (Indexes)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_youth_policies_category ON youth_policies(category);
CREATE INDEX IF NOT EXISTS idx_youth_policies_status ON youth_policies(status);
CREATE INDEX IF NOT EXISTS idx_youth_policies_organization ON youth_policies(organization);
CREATE INDEX IF NOT EXISTS idx_youth_policies_source ON youth_policies(source);
CREATE INDEX IF NOT EXISTS idx_youth_policies_title ON youth_policies(title);
CREATE INDEX IF NOT EXISTS idx_youth_policies_keywords ON youth_policies(keywords);

-- ==============================================================================
-- 3. 선택적 보조 테이블 (관심 정책 북마크 및 구비서류 관리용 확장 스키마)
-- ==============================================================================

-- 3-1. 관심 정책 북마크 테이블 (user_bookmarks)
CREATE TABLE IF NOT EXISTS user_bookmarks (
    user_id             VARCHAR(100) NOT NULL,                      -- 사용자 고유 ID
    policy_id           VARCHAR(100) NOT NULL REFERENCES youth_policies(id) ON DELETE CASCADE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, policy_id)
);

-- 3-2. 정책별 구비서류 목록 테이블 (policy_documents)
CREATE TABLE IF NOT EXISTS policy_documents (
    id                  SERIAL PRIMARY KEY,
    policy_id           VARCHAR(100) NOT NULL REFERENCES youth_policies(id) ON DELETE CASCADE,
    document_name       VARCHAR(255) NOT NULL,                      -- 구비서류 명칭 (예: 주민등록등본, 소득금액증명원 등)
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3-3. 정책 직결 뉴스 및 AI 요약/키워드 테이블 (policy_news)
CREATE TABLE IF NOT EXISTS policy_news (
    id                  VARCHAR(100) PRIMARY KEY,                   -- 뉴스 고유 ID (예: NEWS_ONTONG_001_1727000000)
    policy_id           VARCHAR(100) REFERENCES youth_policies(id) ON DELETE SET NULL,
    policy_name         VARCHAR(255) NOT NULL,                      -- 정책명
    title               VARCHAR(255) NOT NULL,                      -- 기사 제목
    publisher           VARCHAR(100),                               -- 언론사명
    url                 TEXT NOT NULL,                              -- 기사 원문 링크
    published_at        VARCHAR(50),                                -- 보도 일시
    summary_3lines      TEXT NOT NULL,                              -- AI 3줄 요약
    keywords            VARCHAR(255),                               -- AI 추출 뉴스 핵심 키워드 5개 이상 (쉼표 구분)
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_policy_news_policy_id ON policy_news(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_news_keywords ON policy_news(keywords);

