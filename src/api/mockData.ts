import { PolicyDetail, PolicyFilterParams } from '../types/policy';

export const MOCK_POLICIES: PolicyDetail[] = [
  // 1. 주거 (Housing)
  {
    id: 'POL-2026-001',
    title: '청년 월세 특별지원 (2차)',
    organization: '국토교통부 / 한국토지주택공사(LH)',
    category: '주거',
    categoryBadgeColor: 'rose',
    status: '상시모집',
    dDay: null,
    benefitSummary: '월 최대 20만원 지원 (최장 12개월간 분할 지급, 총 240만원)',
    targetAge: '만 19세 ~ 34세',
    incomeCondition: '중위소득 60% 이하 (원가구 100% 이하)',
    employmentCondition: '제한없음',
    matchScore: 96,
    viewCount: 18420,
    isBookmarked: true,
    period: '2026.01.01 ~ 2026.12.31 (상시 접수)',
    benefit: {
      amount: '월 최대 20만원',
      totalMax: '240만원',
      method: '매월 청년 본인 명의 계좌 입금',
      details: '실제 납부하는 월세 범위 내에서 최대 20만원까지 최장 12개월 동안 매월 지원합니다.'
    },
    eligibility: {
      age: '만 19세 ~ 34세 청년 (부모와 별도 거주하는 무주택 청년)',
      income: '청년독립가구 기준 중위소득 60% 이하 및 원가구 100% 이하',
      residence: '보증금 5,000만원 이하 및 월세 70만원 이하 주택 (보증부 월세 포함)',
      restrictions: '주택 소유자, 직계존속 주택 임차인, 공공임대주택 거주자 제외'
    },
    documents: [
      '월세지원 신청서',
      '소득·재산 신고서',
      '임대차계약서 사본 및 최근 3개월 월세 이체 증빙서류',
      '가족관계증명서 (상세)',
      '통장 사본'
    ],
    applicationUrl: 'https://www.bokjiro.go.kr',
    contact: '국토교통부 콜센터 (1600-0777)',
    aiMatchReason: '회원님의 연소득(3,200만원) 및 월세 거주 조건에 정확히 부합하며, 연간 최대 240만원의 주거비 절감 효과가 있습니다.'
  },
  {
    id: 'POL-2026-002',
    title: '청년전용 버팀목 전세자금대출',
    organization: '주택도시보증공사(HUG) / 국토교통부',
    category: '주거',
    categoryBadgeColor: 'rose',
    status: '상시모집',
    dDay: null,
    benefitSummary: '최대 2억원 한도 내 연 1.5%~2.7% 초저금리 전세자금 대출',
    targetAge: '만 19세 ~ 34세',
    incomeCondition: '부부합산 연소득 5,000만원 이하 (신혼 7,500만원)',
    employmentCondition: '재직자, 프리랜서, 사업자',
    matchScore: 88,
    viewCount: 14230,
    isBookmarked: false,
    period: '상시 접수',
    benefit: {
      amount: '임차보증금의 80% 이내 (최대 2억원)',
      totalMax: '2억원 대출',
      method: '기금 수탁은행(우리/국민/신한/농협/하나) 심사 후 대출 실행',
      details: '연 1.8% ~ 2.7% 수준의 저금리로 2년 만기 (최장 10년 연장 가능) 전세자금을 지원합니다.'
    },
    eligibility: {
      age: '만 19세 이상 ~ 만 34세 이하의 무주택 단독 세대주',
      income: '신청인 및 배우자 합산 총소득 5,000만원 이하 (순자산 3.45억원 이하)',
      residence: '임차 전용면적 85㎡ 이하 주택 (임차보증금 3억원 이하)',
      restrictions: '중복 대출자 및 신용관리대상자 제외'
    },
    documents: [
      '확정일자부 임대차계약서 사본',
      '임차보증금 5% 이상 납입영수증',
      '주민등록등본 및 초본',
      '소득금액증명원 또는 원천징수영수증'
    ],
    applicationUrl: 'https://nhuf.molit.go.kr',
    contact: '주택도시보증공사 콜센터 (1566-9009)',
    aiMatchReason: '현재 월세에서 전세로 전환 시 주거비 지출을 월 30만원 이상 절감할 수 있는 최우선 금융 정책입니다.'
  },

  // 2. 일자리 (Jobs & Career)
  {
    id: 'POL-2026-003',
    title: '2026 청년도전지원사업 (도전 & 도전+)',
    organization: '고용노동부',
    category: '일자리',
    categoryBadgeColor: 'amber',
    status: '접수중',
    dDay: 'D-12',
    benefitSummary: '맞춤형 취업역량 프로그램 참여 시 최대 300만원 참여수당 및 인센티브 지급',
    targetAge: '만 18세 ~ 34세',
    incomeCondition: '제한없음',
    employmentCondition: '미취업자 (구직단념청년, 자립준비청년 등)',
    matchScore: 94,
    viewCount: 11200,
    isBookmarked: true,
    period: '2026.02.01 ~ 2026.11.30',
    benefit: {
      amount: '단기과정 50만원 / 중·장기과정 최대 300만원',
      totalMax: '300만원 + 취업성공수당 50만원',
      method: '프로그램 단계별 이수 시 참여자 본인 계좌 입금',
      details: '밀착상담, 자신감 회복, 진로 탐색, 취업역량 강화 프로그램을 5주~25주간 제공합니다.'
    },
    eligibility: {
      age: '만 18세 ~ 34세 (지자체 조례에 따라 최대 39세까지 가능)',
      income: '소득 무관',
      residence: '전국 거주 청년',
      restrictions: '최근 6개월 이상 취업 및 교육·직업훈련 이력이 없는 청년'
    },
    documents: [
      '청년도전지원사업 참여신청서',
      '구직단념 문답표',
      '고용보험 피보험자격 이력내역서'
    ],
    applicationUrl: 'https://www.work.go.kr/youthChallenge',
    contact: '고용노동부 고객상담센터 (1350)',
    aiMatchReason: '현재 미취업 상태인 회원님의 구직 자신감 회복 및 역량 강화와 함께 월 최대 수당을 지원받을 수 있습니다.'
  },
  {
    id: 'POL-2026-004',
    title: 'K-디지털 트레이닝 (KDT) 첨단 디지털 신기술 부트캠프',
    organization: '고용노동부 / 직업능력심사평가원',
    category: '일자리',
    categoryBadgeColor: 'amber',
    status: '상시모집',
    dDay: null,
    benefitSummary: '교육비 100% 전액 국비지원 + 매월 훈련장려금 최대 31.6만원 지급',
    targetAge: '만 19세 ~ 34세',
    incomeCondition: '소득무관 (국민내일배움카드 발급자)',
    employmentCondition: '미취업자, 대학 졸업예정자',
    matchScore: 91,
    viewCount: 9870,
    isBookmarked: false,
    period: '연중 상시 기수별 모집',
    benefit: {
      amount: '교육비 전액 무료 (수백~수천만원 상당) + 훈련장려금',
      totalMax: '교육비 100% 전액 지원',
      method: '국민내일배움카드 결제 및 매월 훈련장려금 계좌 지급',
      details: 'AI, 클라우드, 풀스택 개발, 빅데이터 등 기업 실무 프로젝트 중심 6개월 집중 훈련 과정입니다.'
    },
    eligibility: {
      age: '만 19세 ~ 34세 청년 구직자',
      income: '소득 무관',
      residence: '전국',
      restrictions: '기존 KDT 과정 1회 기수료자 제외'
    },
    documents: [
      '국민내일배움카드 발급 신청서',
      '부트캠프 기관 지원서 및 인터뷰 평가표'
    ],
    applicationUrl: 'https://www.hrd.go.kr',
    contact: 'HRD-Net 고객센터 (1588-1919)',
    aiMatchReason: 'IT 개발 및 데이터 분야 직무 진입을 희망할 경우, 100% 국비 지원으로 취업 포트폴리오를 완성할 수 있습니다.'
  },

  // 3. 금융·복지·문화 (Finance & Welfare)
  {
    id: 'POL-2026-005',
    title: '청년도약계좌 (정부기여금 & 비과세 혜택)',
    organization: '금융위원회 / 서민금융진흥원',
    category: '금융·복지·문화',
    categoryBadgeColor: 'purple',
    status: '접수중',
    dDay: 'D-5',
    benefitSummary: '매월 최대 70만원 5년 납입 시 정부기여금(최대 연 6%) + 비과세로 약 5,000만원 목돈 마련',
    targetAge: '만 19세 ~ 34세',
    incomeCondition: '개인소득 연 7,500만원 이하 & 가구 중위소득 250% 이하',
    employmentCondition: '소득이 있는 청년 (직전 과세기간 소득 확정자)',
    matchScore: 95,
    viewCount: 22400,
    isBookmarked: true,
    period: '매월 초 1~2주간 신청 접수',
    benefit: {
      amount: '월 최대 70만원 자유 적립 + 정부기여금 매월 최대 2.4만원',
      totalMax: '5년 만기 시 약 5,000만원 내외 자산 형성',
      method: '취급 시중은행 앱(국민/신한/하나/우리/농협 등)에서 비대면 개설',
      details: '은행 기본 금리(최고 연 6.0%)에 정부기여금과 이자소득 비과세 혜택이 결합된 청년 핵심 자산형성 상품입니다.'
    },
    eligibility: {
      age: '만 19세 ~ 만 34세 이하 (병역 이행 기간 최대 6년 연장 가능)',
      income: '직전 과세기간 총급여 7,500만원 이하 (종합소득 6,300만원 이하)',
      residence: '국내 거주자',
      restrictions: '직전 3개년도 금융소득종합과세 대상자 제외'
    },
    documents: [
      '소득금액증명원 (은행 앱 신청 시 스크래핑으로 자동 제출)',
      '주민등록등본'
    ],
    applicationUrl: 'https://www.kinfa.or.kr',
    contact: '서민금융진흥원 콜센터 (1397)',
    aiMatchReason: '연소득 3,200만원 기준 정부기여금 매칭 비율이 가장 유리한 소득 구간에 해당합니다.'
  },
  {
    id: 'POL-2026-006',
    title: '2026 청년 마음건강 바우처 지원',
    organization: '보건복지부',
    category: '금융·복지·문화',
    categoryBadgeColor: 'purple',
    status: '상시모집',
    dDay: null,
    benefitSummary: '전문 심리상담 서비스 3개월(총 10회) 전액/일부 지원 바우처 (최대 70만원 상당)',
    targetAge: '만 19세 ~ 34세',
    incomeCondition: '소득기준 없음 (우선순위 부여)',
    employmentCondition: '제한없음',
    matchScore: 82,
    viewCount: 6540,
    isBookmarked: false,
    period: '지자체별 예산 소진 시까지 상시 접수',
    benefit: {
      amount: '회당 6~7만원 상당 심리상담 바우처 (본인부담금 0%~10%)',
      totalMax: '총 10회 심리상담 지원',
      method: '국민행복카드 바우처 포인트 지급',
      details: '1:1 맞춤형 전문 심리상담(사전·사후 검사 포함) 서비스를 3개월간 제공합니다.'
    },
    eligibility: {
      age: '만 19세 이상 ~ 만 34세 이하 청년',
      income: '소득 기준 없음 (자립준비청년, 정신건강복지센터 연계자 1순위)',
      residence: '주민등록상 관할 시·군·구 주민',
      restrictions: '유사 심리지원 바우처 중복 수혜자 제외'
    },
    documents: [
      '사회보장급여 제공 신청서',
      '신분증',
      '우선지원 증빙서류 (해당자)'
    ],
    applicationUrl: 'https://www.bokjiro.go.kr',
    contact: '보건복지상담센터 (129) 또는 거주지 읍면동 주민센터',
    aiMatchReason: '소득 제한 없이 거주지 주민센터나 복지로를 통해 간편하게 신청 가능한 복지 혜택입니다.'
  },

  // 4. 교육·직업훈련 (Education & Training)
  {
    id: 'POL-2026-007',
    title: '국민내일배움카드 (청년 자기개발 및 자격증 지원)',
    organization: '고용노동부 / 한국고용정보원',
    category: '교육·직업훈련',
    categoryBadgeColor: 'emerald',
    status: '상시모집',
    dDay: null,
    benefitSummary: '1인당 300만원 ~ 최대 500만원 직무 및 어학, 자격증 훈련비 지원',
    targetAge: '만 19세 이상 대한민국 국민',
    incomeCondition: '소득 무관',
    employmentCondition: '구직자, 재직자, 프리랜서, 자영업자 모두 가능',
    matchScore: 90,
    viewCount: 16500,
    isBookmarked: false,
    period: '상시 발급 (유효기간 5년)',
    benefit: {
      amount: '기본 300만원 지원 (소득구간별 100~200만원 추가 지원 가능)',
      totalMax: '최대 500만원',
      method: '체크/신용카드 형태의 내일배움카드 실물 발급 및 훈련비 차감',
      details: '고용노동부 인정 전국 훈련기관(학원, 인강)의 강의 수강료를 45%~100% 국비 지원합니다.'
    },
    eligibility: {
      age: '만 19세 이상 누구나 (대학생의 경우 졸업까지 남은 수업연한이 2년 이내인 자)',
      income: '소득 제한 없음',
      residence: '전국',
      restrictions: '공무원, 사립학교 교직원, 연매출 4억 이상 자영업자 제외'
    },
    documents: [
      '국민내일배움카드 발급신청서',
      '신분증',
      '졸업예정증명서 또는 재학증명서 (대학생)'
    ],
    applicationUrl: 'https://www.hrd.go.kr',
    contact: '고용노동부 고객상담센터 (1350)',
    aiMatchReason: '취업 준비 및 자격증 취득에 필요한 강의 수강료를 즉시 국비로 감면받을 수 있습니다.'
  },

  // 5. 참여·기반 (Participation & Community)
  {
    id: 'POL-2026-008',
    title: '2026 청년 정책참여단 & 청년네트워크',
    organization: '국무조정실 청년정책조정실 / 각 지자체',
    category: '참여·기반',
    categoryBadgeColor: 'sky',
    status: '접수중',
    dDay: 'D-8',
    benefitSummary: '청년 정책 제안 활동비 지급, 우수 제안 포상 및 중앙부처 장관 표창',
    targetAge: '만 19세 ~ 39세',
    incomeCondition: '제한없음',
    employmentCondition: '제한없음',
    matchScore: 78,
    viewCount: 4320,
    isBookmarked: false,
    period: '2026.03.01 ~ 2026.03.31',
    benefit: {
      amount: '월별 활동비 15~20만원 지원 + 전문가 멘토링',
      totalMax: '활동비 및 프로젝트 실행비 지원',
      method: '활동보고서 제출 후 계좌 지급',
      details: '청년들의 목소리를 정부 정책에 반영하는 위원회 활동 및 청년 자율 기획 프로젝트를 수행합니다.'
    },
    eligibility: {
      age: '만 19세 ~ 39세 청년',
      income: '소득 무관',
      residence: '해당 지자체 거주 또는 활동(직장/학교) 청년',
      restrictions: '특정 정당 소속 정치활동 목적 참여자 제외'
    },
    documents: [
      '청년정책네트워크 지원서',
      '정책 관심분야 활동계획서'
    ],
    applicationUrl: 'https://www.2030youth.go.kr',
    contact: '청년정책조정실 (044-200-1994)',
    aiMatchReason: '정책 참여와 네트워킹을 통해 대외활동 경력을 쌓고 활동비를 지원받을 수 있는 참여형 프로그램입니다.'
  }
];

// Helper Functions for Frontend Mocking
export function getMockPolicies(params: PolicyFilterParams = {}) {
  let filtered = [...MOCK_POLICIES];

  if (params.category && params.category !== '전체') {
    filtered = filtered.filter(p => p.category === params.category);
  }

  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(kw) ||
      p.organization.toLowerCase().includes(kw) ||
      p.benefitSummary.toLowerCase().includes(kw)
    );
  }

  if (params.employment && params.employment !== '제한없음') {
    filtered = filtered.filter(p =>
      p.employmentCondition.includes('제한없음') ||
      p.employmentCondition.includes(params.employment!)
    );
  }

  // Sorting
  if (params.sortBy === 'popular') {
    filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
  } else if (params.sortBy === 'matchScore') {
    filtered.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }

  const page = params.page || 1;
  const limit = params.limit || 10;
  const startIndex = (page - 1) * limit;
  const paginatedItems = filtered.slice(startIndex, startIndex + limit);

  return {
    totalCount: filtered.length,
    currentPage: page,
    totalPages: Math.ceil(filtered.length / limit) || 1,
    policies: paginatedItems
  };
}

export function getMockPolicyDetail(id: string): PolicyDetail | undefined {
  return MOCK_POLICIES.find(p => p.id === id);
}
