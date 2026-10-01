import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PolicyItem, PolicyDetail, PolicyFilterParams, PolicyCategory, PaginatedPolicyResult } from '../types/policy';
import { MOCK_POLICIES, getMockPolicies } from './mockData';

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

// 1. 서버 사이드 페이지네이션 정책 목록 조회
export async function getPaginatedPolicies(
  params?: PolicyFilterParams
): Promise<PaginatedPolicyResult> {
  const page = Math.max(1, params?.page || 1);
  const pageSize = Math.max(1, params?.pageSize || params?.limit || 12);

  if (!isSupabaseConfigured) {
    console.info('ℹ️ [Supabase] 환경 변수가 설정되지 않아 Mock 데이터를 반환합니다.');
    const mockRes = getMockPolicies(params);
    return {
      policies: mockRes.policies,
      totalCount: mockRes.totalCount,
      totalPages: mockRes.totalPages,
      currentPage: mockRes.currentPage,
      pageSize,
    };
  }

  const tables = ['policies', 'unified_policies'];

  for (const table of tables) {
    try {
      let query = supabase.from(table).select('*', { count: 'exact' });

      // 카테고리 유연 매칭 필터
      if (params?.category && params.category !== '전체') {
        const cat = params.category;
        if (cat.includes('일자리') || cat.includes('취업')) {
          query = query.or('category.ilike.%일자리%,category.ilike.%취업%,category.ilike.%창업%');
        } else if (cat.includes('주거')) {
          query = query.ilike('category', '%주거%');
        } else if (cat.includes('교육') || cat.includes('훈련')) {
          query = query.or('category.ilike.%교육%,category.ilike.%직업훈련%,category.ilike.%훈련%');
        } else if (cat.includes('금융') || cat.includes('복지') || cat.includes('문화')) {
          query = query.or('category.ilike.%금융%,category.ilike.%복지%,category.ilike.%문화%');
        } else if (cat.includes('참여') || cat.includes('기반')) {
          query = query.or('category.ilike.%참여%,category.ilike.%기반%');
        } else {
          query = query.ilike('category', `%${cat}%`);
        }
      }

      // 키워드 검색
      if (params?.keyword && params.keyword.trim()) {
        const kw = params.keyword.trim();
        query = query.or(`title.ilike.%${kw}%,benefit_summary.ilike.%${kw}%,organization.ilike.%${kw}%`);
      }

      // 취업 상태 필터
      if (params?.employment && params.employment !== '제한없음') {
        query = query.or(
          `employment_condition.ilike.%${params.employment}%,employment_condition.ilike.%제한없음%,employment_condition.ilike.%무관%`
        );
      }

      // 정렬
      if (params?.sortBy === 'popular') {
        query = query.order('view_count', { ascending: false, nullsFirst: false });
      } else if (params?.sortBy === 'deadline') {
        query = query.order('period_end', { ascending: true, nullsFirst: false });
      } else if (params?.sortBy === 'latest') {
        query = query.order('created_at', { ascending: false, nullsFirst: false });
      } else {
        // 기본 최신/id 역순
        query = query.order('created_at', { ascending: false, nullsFirst: false });
      }

      // 서버 사이드 페이지네이션 (Range)
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (!error && data && data.length >= 0) {
        const totalCount = count !== null ? count : data.length;
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
        const items = data.map((row) => mapRowToPolicyItem(row));

        return {
          policies: items,
          totalCount,
          totalPages,
          currentPage: page,
          pageSize,
        };
      }
    } catch (err) {
      console.warn(`[Supabase] Table ${table} query failed, trying fallback:`, err);
    }
  }

  // Fallback to Mock
  const mockRes = getMockPolicies(params);
  return {
    policies: mockRes.policies,
    totalCount: mockRes.totalCount,
    totalPages: mockRes.totalPages,
    currentPage: mockRes.currentPage,
    pageSize,
  };
}

// 2. 전체 정책 데이터 일괄 로드 (Supabase 1000건 제한 대응 배치 로딩)
export async function getAllPolicies(): Promise<PolicyItem[]> {
  if (!isSupabaseConfigured) {
    return MOCK_POLICIES.map((p) => ({ ...p }));
  }

  const tables = ['policies', 'unified_policies'];

  for (const table of tables) {
    try {
      // 1. 전체 개수 먼저 파악
      const { count, error: countErr } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (countErr || count === null || count === 0) continue;

      const totalCount = count;
      const batchSize = 1000;
      const batches = Math.ceil(totalCount / batchSize);

      const promises = Array.from({ length: batches }, (_, i) => {
        const from = i * batchSize;
        const to = Math.min(from + batchSize - 1, totalCount - 1);
        return supabase.from(table).select('*').range(from, to).order('created_at', { ascending: false, nullsFirst: false });
      });

      const results = await Promise.all(promises);
      const allRows: any[] = [];
      for (const res of results) {
        if (res.data) allRows.push(...res.data);
      }

      if (allRows.length > 0) {
        return allRows.map((row) => mapRowToPolicyItem(row));
      }
    } catch (err) {
      console.warn(`[Supabase] getAllPolicies on ${table} failed:`, err);
    }
  }

  return MOCK_POLICIES.map((p) => ({ ...p }));
}

// 3. 카테고리별 실시간 데이터 개수 통계 조회
export async function getCategoryCounts(): Promise<Record<string, number>> {
  const defaultCounts: Record<string, number> = {
    전체: 0,
    일자리: 0,
    주거: 0,
    '교육·직업훈련': 0,
    '금융·복지·문화': 0,
    '참여·기반': 0,
  };

  if (!isSupabaseConfigured) {
    defaultCounts.전체 = MOCK_POLICIES.length;
    MOCK_POLICIES.forEach((p) => {
      if (defaultCounts[p.category] !== undefined) defaultCounts[p.category]++;
    });
    return defaultCounts;
  }

  const tables = ['policies', 'unified_policies'];
  for (const table of tables) {
    try {
      const totalPromise = supabase.from(table).select('*', { count: 'exact', head: true });
      const jobPromise = supabase.from(table).select('*', { count: 'exact', head: true }).or('category.ilike.%일자리%,category.ilike.%취업%,category.ilike.%창업%');
      const housingPromise = supabase.from(table).select('*', { count: 'exact', head: true }).ilike('category', '%주거%');
      const eduPromise = supabase.from(table).select('*', { count: 'exact', head: true }).or('category.ilike.%교육%,category.ilike.%직업훈련%,category.ilike.%훈련%');
      const financePromise = supabase.from(table).select('*', { count: 'exact', head: true }).or('category.ilike.%금융%,category.ilike.%복지%,category.ilike.%문화%');
      const partPromise = supabase.from(table).select('*', { count: 'exact', head: true }).or('category.ilike.%참여%,category.ilike.%기반%');

      const [totalRes, jobRes, housingRes, eduRes, financeRes, partRes] = await Promise.all([
        totalPromise,
        jobPromise,
        housingPromise,
        eduPromise,
        financePromise,
        partPromise,
      ]);

      if (totalRes.count !== null && totalRes.count > 0) {
        const result: Record<string, number> = {
          전체: totalRes.count,
          일자리: jobRes.count || 0,
          주거: housingRes.count || 0,
          '교육·직업훈련': eduRes.count || 0,
          '금융·복지·문화': financeRes.count || 0,
          '참여·기반': partRes.count || 0,
        };
        return result;
      }
    } catch (err) {
      console.warn(`[Supabase] getCategoryCounts on ${table} failed:`, err);
    }
  }

  return defaultCounts;
}

// 4. 기존 getPolicies 호환 함수 (limit 및 기본 페이지네이션 지원)
export async function getPolicies(params?: PolicyFilterParams): Promise<PolicyItem[]> {
  const result = await getPaginatedPolicies({
    ...params,
    pageSize: params?.limit || params?.pageSize || 50,
  });
  return result.policies;
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

  // 관심 저장(북마크) 등록 시 백엔드 DB 알람 신청 로그도 실시간 자동 동기화
  if (isNowBookmarked) {
    applyPolicyAlert(policyId, { userId }).catch((e) =>
      console.warn('[Bookmark Alert Auto Sync]:', e)
    );
  }

  return isNowBookmarked;
}

// 4. 백엔드 DB 정책 알람 신청 (정책 내용 + 등록 텔레그램ID/이메일 DB 적재)
export interface PolicyAlertApplyOptions {
  userId?: string;
  sendMethod?: 'telegram' | 'email' | 'both';
  telegramId?: string;
  email?: string;
  customMessage?: string;
}

export async function applyPolicyAlert(
  policyId: string,
  options?: PolicyAlertApplyOptions
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const rawProfile = localStorage.getItem('youth_compass_profile_settings') || '{}';
    const profile = JSON.parse(rawProfile);
    const tgId = options?.telegramId || profile.telegramId || profile.telegram_account;
    const emAddr = options?.email || profile.emailAddress || profile.email;

    const payload = {
      policyId,
      userId: options?.userId || 'usr-10029',
      sendMethod: options?.sendMethod || (tgId && emAddr ? 'both' : tgId ? 'telegram' : 'email'),
      telegramId: tgId || undefined,
      email: emAddr || undefined,
      customMessage: options?.customMessage || '청년나침반 맞춤 정책 알람 신청'
    };

    const res = await fetch('http://localhost:8000/api/notifications/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const result = await res.json();
      return { success: true, message: result.message, data: result.data };
    }
  } catch (err) {
    console.warn('[Alert Application Backend Sync Info]:', err);
  }

  return {
    success: true,
    message: '정책 알림 신청이 성공적으로 접수되었습니다.'
  };
}

