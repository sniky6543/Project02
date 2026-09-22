export type PolicyCategory = '일자리' | '주거' | '교육·직업훈련' | '금융·복지·문화' | '참여·기반';

export interface PolicyItem {
  id: string;
  title: string;
  organization: string;
  category: PolicyCategory;
  categoryBadgeColor?: string;
  status: '상시모집' | '접수중' | '마감임박' | '마감';
  dDay?: string | null;
  benefitSummary: string;
  targetAge: string;
  incomeCondition: string;
  employmentCondition: string;
  matchScore?: number;
  viewCount?: number;
  isBookmarked?: boolean;
}

export interface PolicyDetail extends PolicyItem {
  period: string;
  benefit: {
    amount: string;
    totalMax: string;
    method: string;
    details: string;
  };
  eligibility: {
    age: string;
    income: string;
    residence: string;
    restrictions?: string;
  };
  documents: string[];
  applicationUrl: string;
  contact: string;
  aiMatchReason?: string;
}

export interface PolicyFilterParams {
  keyword?: string;
  category?: string;
  region?: string;
  maritalStatus?: string;
  age?: number;
  minIncome?: number;
  maxIncome?: number;
  education?: string;
  employment?: string;
  specialCriteria?: string;
  sortBy?: 'latest' | 'popular' | 'deadline' | 'matchScore';
  page?: number;
  limit?: number;
}
