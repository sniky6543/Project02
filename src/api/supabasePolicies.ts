import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PolicyItem, PolicyDetail, PolicyFilterParams, PolicyCategory } from '../types/policy';
import { MOCK_POLICIES } from './mockData';

// 카테고리별 뱃지 컬러 매핑
const CATEGORY_COLOR_MAP: Record<string, string> = {
  '주거': 'rose',
  '일자리': 'amber',
  '금융·복지·문화': 'emerald',
  '금융': 'emerald',
  '복지': 'emerald',
  '교육·직업훈련': 'blue',
  '교육': 'blue',
  '참여·기반': 'purple',
  '참여': 'purple',
};

// 카테고리 텍스트 정규화
function normalizeCategory(rawCat: string): PolicyCategory {
  if (!rawCat) return '주거';
  const clean = rawCat.replace('･', '·').split('>')[0].trim();
  if (clean.includes('주거')) return '주거';
  if (clean.includes('일자리') || clean.includes('취업')) return '일자리';
  if (clean.includes('교육') || clean.includes('훈련')) return '교육·직업훈련';
  if (clean.includes('금융') || clean.includes('복지') || clean.includes('문화')) return '금융·복지·문화';
  if (clean.includes('참여') || clean.includes('기반')) return '참여·기반';
  return '금융·복지·문화';
}

// Supabase DB Row -> PolicyItem 변환
export function mapRowToPolicyItem(row: any, isBookmarked: boolean = false): PolicyItem {
  const rawCat = row.category || '주거';
  const category = normalizeCategory(rawCat);
  const badgeColor = CATEGORY_COLOR_MAP[category] || 'indigo';

  let dDay: string | null = null;
  const endDate = row.period_edate || row.period_end;
  if (endDate) {
    const cleanDate = endDate.replace(/[^0-9]/g, '');
    if (cleanDate.length === 8) {
      const year = parseInt(cleanDate.slice(0, 4));
      const month = parseInt(cleanDate.slice(4, 6)) - 1;
      const day = parseInt(cleanDate.slice(6, 8));
      const end = new Date(year, month, day);
      const today = new Date();
      const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0 && diffDays <= 30) {
        dDay = `D-${diffDays}`;
      } else if (diffDays === 0) {
        dDay = 'D-Day';
      }
    }
  }

  return {
    id: row.id,
    title: row.title || '제목 없음',
    organization: row.organization || '정부부처/지자체',
    category,
    categoryBadgeColor: badgeColor,
    status: row.status || (dDay ? '접수중' : '상시모집'),
    dDay: dDay || (row.status === '접수중' ? '접수중' : null),
    benefitSummary: row.summary || row.benefit_summary || row.support_content || '',
    targetAge: row.target_age || (row.min_age && row.max_age ? `만 ${row.min_age}세 ~ ${row.max_age}세` : '연령 무관'),
    incomeCondition: row.target_condition || row.income_condition || '소득 무관',
    employmentCondition: row.employment_condition || '제한없음',
    matchScore: row.match_score || 85,
    viewCount: row.view_count || 120,
    isBookmarked,
    source: row.source || '온통청년 / 복지로',
  };
}

// Supabase DB Row -> PolicyDetail 변환
export function mapRowToPolicyDetail(row: any, documents: string[] = [], isBookmarked: boolean = false): PolicyDetail {
  const item = mapRowToPolicyItem(row, isBookmarked);

  // 1. 신청기간 (접수 기간)
  let applyPeriodStr = '상시 접수 / 공고 참조';
  if (row.period_sdate && row.period_edate) {
    applyPeriodStr = `${row.period_sdate} ~ ${row.period_edate}`;
  } else if (row.period_start && row.period_end) {
    applyPeriodStr = `${row.period_start} ~ ${row.period_end}`;
  } else if (row.apply_period) {
    applyPeriodStr = row.apply_period;
  } else if (row.period_edate) {
    applyPeriodStr = `~ ${row.period_edate}`;
  } else if (row.period_sdate) {
    applyPeriodStr = row.period_sdate;
  } else if (row.period) {
    applyPeriodStr = row.period;
  }

  // 2. 사업기간 (운영/수혜 기간)
  let bizPeriodStr = '사업 공고 및 선정 후 세부 진행';
  if (row.biz_sdate && row.biz_edate) {
    bizPeriodStr = `${row.biz_sdate} ~ ${row.biz_edate}`;
  } else if (row.biz_period || row.business_period || row.operation_period || row.biz_prid) {
    bizPeriodStr = row.biz_period || row.business_period || row.operation_period || row.biz_prid;
  } else if (row.support_period) {
    bizPeriodStr = row.support_period;
  } else {
    bizPeriodStr = applyPeriodStr.includes('상시') ? '연중 상시 운영 및 지원' : '선정일로부터 지원 종료일까지 (공고 참조)';
  }

  return {
    ...item,
    period: applyPeriodStr,
    applyPeriod: applyPeriodStr,
    bizPeriod: bizPeriodStr,
    summary: row.summary || row.benefit_summary || '',
    benefit: {
      amount: row.support_content || row.benefit_amount || '지원 내용 참조',
      totalMax: row.benefit_total_max || row.support_content || '공고문 참조',
      method: row.apply_method || row.benefit_method || '온라인 / 방문 접수',
      details: row.support_content || row.benefit_details || row.summary || '',
    },
    eligibility: {
      age: row.target_age || '연령 무관',
      income: row.target_condition || row.income_condition || '제한 없음',
      residence: row.residence_condition || '전국',
      restrictions: row.special_criteria,
    },
    documents: documents.length > 0 ? documents : [
      '신청서 및 개인정보 수집·이용 동의서',
      '주민등록등본 (상세)',
      '자격 요건 증빙 서류'
    ],
    applicationUrl: row.apply_url || row.application_url || 'https://www.youthcenter.go.kr',
    contact: row.contact || row.organization || '주관기관 고객센터',
    aiMatchReason: row.ai_match_reason || '청년 연령 및 자격 요건 기반 매칭',
  };
}

// 1. 정책 목록 조회 (unified_policies 우선 조회)
export async function getPolicies(params?: PolicyFilterParams): Promise<PolicyItem[]> {
  if (!isSupabaseConfigured) {
    console.info('ℹ️ [Supabase] 환경 변수가 설정되지 않아 Mock 데이터를 반환합니다.');
    return MOCK_POLICIES.map((p) => ({ ...p }));
  }

  try {
    // 1차: unified_policies 테이블 조회
    let table = 'unified_policies';
    let { data, error } = await supabase.from(table).select('*').limit(params?.limit || 50);

    // unified_policies가 없으면 policies 테이블 시도
    if (error || !data || data.length === 0) {
      table = 'policies';
      const fallbackRes = await supabase.from(table).select('*').limit(params?.limit || 50);
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error || !data || data.length === 0) {
      console.warn('Supabase getPolicies empty or error:', error);
      return MOCK_POLICIES.map((p) => ({ ...p }));
    }

    let items = data.map((row) => mapRowToPolicyItem(row));

    // 클라이언트 필터링
    if (params?.category && params.category !== '전체') {
      items = items.filter((item) => item.category === params.category);
    }
    if (params?.keyword) {
      const kw = params.keyword.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(kw) ||
          item.benefitSummary.toLowerCase().includes(kw) ||
          item.organization.toLowerCase().includes(kw)
      );
    }

    return items;
  } catch (err) {
    console.error('Failed to fetch policies from Supabase:', err);
    return MOCK_POLICIES.map((p) => ({ ...p }));
  }
}

// 2. 정책 상세 조회
export async function getPolicyDetail(id: string): Promise<PolicyDetail | null> {
  if (!isSupabaseConfigured) {
    return MOCK_POLICIES.find((p) => p.id === id) || null;
  }

  try {
    // 1차: unified_policies 조회
    let { data: policyData, error } = await supabase
      .from('unified_policies')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!policyData) {
      // 2차: policies 조회
      const res = await supabase.from('policies').select('*').eq('id', id).maybeSingle();
      policyData = res.data;
    }

    if (!policyData) {
      return MOCK_POLICIES.find((p) => p.id === id) || null;
    }

    return mapRowToPolicyDetail(policyData, []);
  } catch (err) {
    console.error(`Failed to fetch policy detail for ${id}:`, err);
    return MOCK_POLICIES.find((p) => p.id === id) || null;
  }
}

// 3. 북마크 / 알림 저장 조회 및 토글
export const BOOKMARKS_STORAGE_KEY = 'youth_compass_bookmarked_policies';

export function getLocalBookmarkedIds(): string[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getBookmarkedPolicyIds(userId: string = 'guest_user'): Promise<string[]> {
  const localIds = getLocalBookmarkedIds();
  if (!isSupabaseConfigured) return localIds;

  try {
    const { data, error } = await supabase
      .from('user_bookmarks')
      .select('policy_id')
      .eq('user_id', userId);

    if (error || !data) return localIds;
    const dbIds = data.map((r: any) => r.policy_id).filter(Boolean);
    const combined = Array.from(new Set([...localIds, ...dbIds]));
    return combined;
  } catch (err) {
    console.error('Error fetching bookmarked policy IDs:', err);
    return localIds;
  }
}

export async function toggleBookmark(userId: string, policyId: string): Promise<boolean> {
  let localIds = getLocalBookmarkedIds();
  const existsLocally = localIds.includes(policyId);
  let isNowBookmarked = false;

  if (existsLocally) {
    localIds = localIds.filter((id) => id !== policyId);
    isNowBookmarked = false;
  } else {
    localIds.push(policyId);
    isNowBookmarked = true;
  }

  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(localIds));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('bookmarks_updated'));
    }
  } catch (e) {
    console.error('Failed to save bookmarks to localStorage:', e);
  }

  if (isSupabaseConfigured) {
    try {
      const { data: existing } = await supabase
        .from('user_bookmarks')
        .select('*')
        .eq('user_id', userId)
        .eq('policy_id', policyId)
        .maybeSingle();

      if (existing) {
        await supabase.from('user_bookmarks').delete().eq('user_id', userId).eq('policy_id', policyId);
      } else {
        await supabase.from('user_bookmarks').insert({ user_id: userId, policy_id: policyId });
      }
    } catch (err) {
      console.error('Error syncing bookmark to Supabase:', err);
    }
  }

  return isNowBookmarked;
}
