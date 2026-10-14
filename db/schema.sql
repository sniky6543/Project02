-- ===================================================
-- 청년나침반 (Youth Compass) PostgreSQL / Supabase 스키마
-- 작성일: 2026-09-22
-- 담당: DB 관리 (팀원 3)
-- ===================================================

-- 1. 사용자 테이블 (Users)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    birth_date DATE,
    gender VARCHAR(10),
    contact VARCHAR(20),
    region VARCHAR(100),
    education VARCHAR(50),
    employment_status VARCHAR(50),
    housing_type VARCHAR(20) DEFAULT '월세', -- 자가, 전세, 월세
    annual_income INTEGER DEFAULT 0, -- 만원 단위
    ai_provider VARCHAR(50) DEFAULT 'OPENAI', -- OPENAI, OLLAMA, Router API
    telegram_account VARCHAR(100),
    is_telegram_enabled BOOLEAN DEFAULT FALSE,
    is_email_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 청년 정책 테이블 (Policies)
CREATE TABLE IF NOT EXISTS policies (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    organization VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 일자리, 주거, 교육·직업훈련, 금융·복지·문화, 참여·기반
    status VARCHAR(30) DEFAULT '상시모집', -- 상시모집, 접수중, 마감임박, 마감
    period_start DATE,
    period_end DATE,
    benefit_summary TEXT NOT NULL,
    benefit_amount VARCHAR(100),
    benefit_total_max VARCHAR(100),
    benefit_method VARCHAR(100),
    benefit_details TEXT,
    target_age VARCHAR(50),
    min_age INTEGER,
    max_age INTEGER,
    income_condition VARCHAR(150),
    min_income INTEGER DEFAULT 0,
    max_income INTEGER,
    residence_condition VARCHAR(255),
    education_condition VARCHAR(100),
    employment_condition VARCHAR(100),
    special_criteria VARCHAR(100),
    application_url TEXT,
    contact VARCHAR(100),
    keywords VARCHAR(255), -- 정책 검색 및 AI 분류 키워드 (예: 월세지원, 주거안정, 무주택청년)
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 정책 구비 서류 테이블 (Policy Documents)
CREATE TABLE IF NOT EXISTS policy_documents (
    id SERIAL PRIMARY KEY,
    policy_id VARCHAR(50) REFERENCES policies(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL
);

-- 4. 관심 정책 북마크 테이블 (User Bookmarks)
CREATE TABLE IF NOT EXISTS user_bookmarks (
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    policy_id VARCHAR(50) REFERENCES policies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, policy_id)
);

-- 5. AI 맞춤 추천 기록 테이블 (AI Recommendation Logs)
CREATE TABLE IF NOT EXISTS ai_recommendation_logs (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    user_context JSONB NOT NULL,
    recommended_policies JSONB NOT NULL,
    ai_reasoning TEXT,
    ai_provider VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. 정책 직결 뉴스 및 AI 요약/키워드 테이블 (Policy News & AI Summaries)
CREATE TABLE IF NOT EXISTS policy_news (
    id VARCHAR(100) PRIMARY KEY,
    policy_id VARCHAR(50) REFERENCES policies(id) ON DELETE SET NULL,
    policy_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    publisher VARCHAR(100),
    url TEXT NOT NULL,
    published_at VARCHAR(50),
    summary_3lines TEXT NOT NULL,
    keywords VARCHAR(255), -- AI 추출 뉴스 핵심 키워드 5개 이상 (예: 청년도약계좌, 정부기여금, 비과세혜택, 자산형성, 금리우대)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. 알림 및 메시지 발송 기록 테이블 (Notification Logs)
CREATE TABLE IF NOT EXISTS notification_logs (
    no SERIAL PRIMARY KEY,
    send_method VARCHAR(20) NOT NULL, -- 발송 방법 (email / telegram / system)
    recipient_id VARCHAR(255) NOT NULL, -- 수신자 ID (텔레그램 ID 또는 이메일 주소)
    content TEXT NOT NULL, -- 발송된 알림 메시지 본문 내용
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL, -- 발송 일시
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL, -- 연계 사용자 ID (선택)
    policy_id VARCHAR(50) REFERENCES policies(id) ON DELETE SET NULL, -- 연계 정책 ID (선택)
    status VARCHAR(20) DEFAULT 'SENT', -- 발송 상태 (SENT, REGISTERED, SUCCESS, FAILED)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성 (검색 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_policies_category ON policies(category);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_age ON policies(min_age, max_age);
CREATE INDEX IF NOT EXISTS idx_policies_income ON policies(min_income, max_income);
CREATE INDEX IF NOT EXISTS idx_policies_keywords ON policies(keywords);
CREATE INDEX IF NOT EXISTS idx_policy_news_policy_id ON policy_news(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_news_keywords ON policy_news(keywords);
CREATE INDEX IF NOT EXISTS idx_notification_logs_method_sent ON notification_logs(send_method, sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient ON notification_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_policy_id ON notification_logs(policy_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);


