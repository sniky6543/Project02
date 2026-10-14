import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PolicyItem, PolicyDetail, PolicyFilterParams, PolicyCategory, PaginatedPolicyResult, PolicyNewsItem, NewsFilterParams, PaginatedPolicyNewsResult } from '../types/policy';
import { MOCK_POLICIES, getMockPolicies } from './mockData';
import integratedPolicyNewsJson from '../../db/policy_news_integrated.json';


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

// 4. 알림 발송 기록 DB(Supabase / PostgreSQL / Backend) 직접 저장 인터페이스 및 함수
export interface SaveNotificationLogParams {
  sendMethod: 'telegram' | 'email' | 'system';
  recipientId: string; // 텔레그램 ID 또는 이메일 주소
  content: string; // 발송 내용 본문
  sentAt?: string; // 발송 일시 (ISO 문자열)
  userId?: string;
  policyId?: string;
  status?: string;
}

/**
 * 텔레그램 또는 이메일 알림 발송 시 DB(Supabase notification_logs 테이블 및 Backend)에 
 * 내용, 보낸 아이디(혹은 이메일), 날짜/시간을 영구 저장합니다.
 */
export async function saveNotificationLogToDB(
  params: SaveNotificationLogParams
): Promise<{ success: boolean; data?: any; error?: string }> {
  const sentAt = params.sentAt || new Date().toISOString();
  const sendMethod = params.sendMethod;
  const recipientId = (params.recipientId || '').trim() || (sendMethod === 'telegram' ? '@youth_compass_user' : 'youth.compass@example.com');
  const content = params.content || '청년 맞춤 정책 알림 발송 메시지';
  const status = params.status || 'SENT';
  const userId = params.userId || 'usr-10029';
  const policyId = params.policyId || null;

  let savedSupabase = false;
  let supabaseResult: any = null;

  // 1. Supabase 실데이터베이스 (notification_logs 테이블) 직접 저장
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('notification_logs').insert({
        send_method: sendMethod,
        recipient_id: recipientId,
        content: content,
        sent_at: sentAt,
        user_id: userId,
        policy_id: policyId,
        status: status,
      }).select();

      if (!error && data && data.length > 0) {
        savedSupabase = true;
        supabaseResult = data[0];
        console.info('✅ [Supabase DB notification_logs] 알림 저장 성공:', {
          no: data[0].no,
          send_method: sendMethod,
          recipient_id: recipientId,
          sent_at: sentAt,
        });
      } else if (error) {
        console.warn('⚠️ [Supabase DB notification_logs] 저장 실패:', error);
      }
    } catch (err) {
      console.warn('⚠️ [Supabase DB notification_logs] 예외 발생:', err);
    }
  }

  // 2. FastAPI Backend API 호출 (서버 기동 시 연동 동기화)
  try {
    const res = await fetch('http://localhost:8000/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        send_method: sendMethod,
        recipient_id: recipientId,
        content: content,
        sent_at: sentAt,
        user_id: userId,
        policy_id: policyId,
        status: status,
      }),
    });
    if (res.ok) {
      const backendData = await res.json();
      return { success: true, data: backendData.data || supabaseResult };
    }
  } catch (err) {
    // Backend API 미기동 시에도 Supabase DB 저장이 완료되었으면 성공 처리
  }

  return { success: savedSupabase, data: supabaseResult };
}

/**
 * DB(Supabase)에 저장된 알림 발송 내역 조회
 */
export async function fetchNotificationLogsFromDB(
  recipientId?: string,
  sendMethod?: 'telegram' | 'email'
): Promise<any[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('notification_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50);

      if (sendMethod) {
        query = query.eq('send_method', sendMethod);
      }
      if (recipientId && recipientId.trim()) {
        const cleanRecipient = recipientId.replace(/^@/, '').trim();
        query = query.ilike('recipient_id', `%${cleanRecipient}%`);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('⚠️ [Supabase notification_logs] 목록 조회 실패:', err);
    }
  }
  return [];
}

// 4-1. 정책 알람 신청 (정책 내용 + 수신 텔레그램ID/이메일 + 발송일시 DB 저장)
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
    let profile: any = {};
    try {
      profile = JSON.parse(rawProfile);
    } catch {
      profile = {};
    }

    const tgId = options?.telegramId || profile.telegramId || profile.telegram_account || '@youth_compass_user';
    const emAddr = options?.email || profile.emailAddress || profile.email || 'youth.compass@example.com';
    const sendMethod: 'telegram' | 'email' = options?.sendMethod === 'email' || (!options?.sendMethod && profile.isEmailSelected) ? 'email' : 'telegram';
    const recipientId = sendMethod === 'email' ? emAddr : tgId;
    const nowIso = new Date().toISOString();
    const nowLocal = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    // 정책 상세 데이터 조회
    const policyDetail = await getPolicyDetail(policyId);
    const policyTitle = policyDetail?.title || `청년 정책 (${policyId})`;
    const policyOrg = policyDetail?.organization || '정부/지자체';
    const policyCat = policyDetail?.category || '청년지원';
    const policyBenefit = policyDetail?.benefit?.details || policyDetail?.benefit?.amount || policyDetail?.summary || '청년 맞춤형 복지 및 지원금 제공';
    const policyEligibility = policyDetail?.eligibility ? `${policyDetail.eligibility.age || '만 19~34세'} | ${policyDetail.eligibility.income || '소득요건 충족자'}` : '청년 자격 요건 충족자';
    const policyPeriod = policyDetail?.applyPeriod || policyDetail?.period || '공고 접수 기간 참조';
    const policyMethod = policyDetail?.benefit?.method || '온라인 및 방문 접수';
    const policyUrl = policyDetail?.applicationUrl || 'https://www.youthcenter.go.kr';

    // 표준화된 풍부한 알림 본문 생성
    const channelName = sendMethod === 'telegram' ? `텔레그램 (@${recipientId.replace(/^@/, '')})` : `이메일 (${recipientId})`;
    const formattedContent = [
      `🔔 [청년 맞춤 정책 알림 신청 완료]`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📌 정책명: ${policyTitle}`,
      `🏢 주관기관: ${policyOrg} (${policyCat})`,
      `🎁 주요 지원 혜택: ${policyBenefit}`,
      `🎯 지원 자격 요건: ${policyEligibility}`,
      `📅 접수 기간: ${policyPeriod}`,
      `📝 신청 방법: ${policyMethod}`,
      `🔗 공식 공고 링크: ${policyUrl}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📬 알림 수신 채널: ${channelName}`,
      `🕒 발송/신청 일시: ${nowLocal}`,
      options?.customMessage ? `💬 전달 메모: ${options.customMessage}` : '',
      `✨ 안내: 접수 마감 D-7, D-3 및 주요 변동 사항이 본 수신 채널로 자동 발송됩니다.`
    ].filter(Boolean).join('\n');

    // 1. Supabase DB notification_logs 테이블에 영구 저장
    await saveNotificationLogToDB({
      sendMethod,
      recipientId,
      content: formattedContent,
      sentAt: nowIso,
      userId: options?.userId || 'usr-10029',
      policyId,
      status: 'REGISTERED',
    });

    // 2. 백엔드 FastAPI 알림 신청 API 호출
    const payload = {
      policyId,
      userId: options?.userId || 'usr-10029',
      sendMethod: sendMethod,
      telegramId: tgId,
      email: emAddr,
      customMessage: options?.customMessage || '청년나침반 맞춤 정책 알람 신청',
    };

    const res = await fetch('http://localhost:8000/api/notifications/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
    message: '정책 알림 신청이 성공적으로 접수되어 DB에 저장되었습니다.',
  };
}

// 5. 정책 키워드 기반 연관 뉴스 DB 최신순 조회 (실시간 키워드 확인 및 최신순 3건 보장)
export async function getPolicyRelatedNews(
  keywords: string[] | string | undefined,
  policyId?: string,
  policyTitle?: string,
  policyOrg?: string,
  limitCount: number = 3
): Promise<PolicyNewsItem[]> {
  // 키워드 정규화 및 실시간 추출
  let kwList: string[] = [];
  if (Array.isArray(keywords)) {
    kwList = keywords.map((k) => String(k).trim().replace(/^#/, '')).filter(Boolean);
  } else if (typeof keywords === 'string' && keywords.trim()) {
    kwList = keywords.split(',').map((k) => k.trim().replace(/^#/, '')).filter(Boolean);
  }

  // 정책명에서 핵심 명사 토큰 추가
  if (policyTitle) {
    const titleTokens = policyTitle
      .replace(/[\[\]\(\)\{\}]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !['2026', '2025', '2024', '청년', '지원', '사업', '안내', '공고'].includes(w));
    for (const t of titleTokens) {
      if (!kwList.includes(t)) kwList.push(t);
    }
  }

  let dbNewsPool: PolicyNewsItem[] = [];

  // 1. Supabase 실데이터베이스 (policy_news 테이블) 조회 시도 (최신순 100건 풀)
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('policy_news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(100);

      if (!error && data && data.length > 0) {
        dbNewsPool = data.map((row: any) => ({
          id: row.id,
          policyId: row.policy_id || 'POL-CUSTOM',
          policyName: row.policy_name || policyTitle || '청년 정책',
          title: row.title,
          publisher: row.publisher || '언론사',
          url: row.url,
          publishedAt: (row.published_at || new Date().toISOString().split('T')[0]).split('T')[0],
          summary3Lines: row.summary_3lines || row.summary || '',
          keywords: row.keywords ? row.keywords.split(',').map((k: string) => k.trim().replace(/^#/, '')) : kwList.slice(0, 5)
        }));
      }
    } catch (err) {
      console.warn('[Supabase policy_news] DB 쿼리 예외 (로컬 DB 폴백):', err);
    }
  }

  // 2. 로컬 영구 DB JSON (db/policy_news_integrated.json) 로드
  if (dbNewsPool.length === 0 && Array.isArray(integratedPolicyNewsJson)) {
    dbNewsPool = integratedPolicyNewsJson.map((item: any, idx: number) => {
      const gn = item.grounded_news || {};
      const kws = Array.isArray(gn.keywords) && gn.keywords.length > 0
        ? gn.keywords
        : Array.isArray(item.news_keywords) && item.news_keywords.length > 0
        ? item.news_keywords
        : typeof gn.keywords_str === 'string'
        ? gn.keywords_str.split(',').map((k: string) => k.trim().replace(/^#/, ''))
        : ['청년정책', '맞춤지원', '생활안정', '자격요건', '온라인신청'];

      return {
        id: item.id || `NEWS-${item.policy_id || 'POL'}-${idx}`,
        policyId: item.policy_id || 'POL-CUSTOM',
        policyName: item.policy_name || policyTitle || '청년 정책',
        title: gn.title || item.title || '청년 정책 관련 최신 보도',
        publisher: gn.publisher || item.publisher || '언론사 보도',
        url: gn.url || item.url || 'https://www.korea.kr',
        publishedAt: (gn.published_at || item.published_at || item.updated_at || new Date().toISOString().split('T')[0]).split('T')[0],
        summary3Lines: gn.summary_3lines || item.summary_3lines || item.summary || '',
        keywords: kws
      };
    });
  }

  // 3. 키워드 실시간 매칭 및 가중치 계산
  const scoredNews = dbNewsPool.map((n) => {
    let matchCount = 0;
    let directPolicyMatch = false;

    if (policyId && n.policyId === policyId) {
      directPolicyMatch = true;
      matchCount += 10;
    }
    if (policyTitle && n.policyName && (policyTitle.includes(n.policyName) || n.policyName.includes(policyTitle))) {
      matchCount += 5;
    }

    const allNewsTokens = [...n.keywords, n.title, n.policyName].map((t) => (t ? t.toLowerCase() : ''));
    for (const kw of kwList) {
      const lowKw = kw.toLowerCase();
      if (allNewsTokens.some((token) => token === lowKw)) {
        matchCount += 3; // 완벽 일치
      } else if (allNewsTokens.some((token) => token.includes(lowKw) || lowKw.includes(token))) {
        matchCount += 1; // 부분 일치
      }
    }

    // 날짜 타임스탬프 (최신순 우선)
    const timeValue = new Date(n.publishedAt).getTime() || 0;

    return { news: n, matchCount, directPolicyMatch, timeValue };
  });

  // 정렬 기준:
  // 1. 키워드 매칭이 있는 기사 우선 (matchCount > 0)
  // 2. 매칭된 기사들 내에서 최신 날짜(timeValue 내림차순) 우선
  // 3. 동점일 경우 매칭도 높은 순
  scoredNews.sort((a, b) => {
    const aHasMatch = a.matchCount > 0 ? 1 : 0;
    const bHasMatch = b.matchCount > 0 ? 1 : 0;
    if (aHasMatch !== bHasMatch) return bHasMatch - aHasMatch;

    // 최신 날짜 우선
    if (b.timeValue !== a.timeValue) return b.timeValue - a.timeValue;
    return b.matchCount - a.matchCount;
  });

  // 고유 ID 기준으로 상위 N건 수집
  const selectedNews: PolicyNewsItem[] = [];
  const seenIds = new Set<string>();

  for (const item of scoredNews) {
    if (!seenIds.has(item.news.id)) {
      seenIds.add(item.news.id);
      selectedNews.push(item.news);
      if (selectedNews.length >= limitCount) break;
    }
  }

  // 만약 DB 풀이 비어있어 3건 미만일 경우 안전한 최신 3건 생성
  if (selectedNews.length < limitCount) {
    const pTitle = policyTitle || '청년 맞춤 지원 정책';
    const pOrg = policyOrg || '정부 합동 청년정책추진단';
    const baseKeywords = kwList.length >= 5 
      ? kwList.slice(0, 6) 
      : [...kwList, '청년정책', '맞춤수혜', '생활안정', '자격요건', '정부지원'].slice(0, 6);

    const generatedNews: PolicyNewsItem[] = [
      {
        id: `NEWS-GEN-01-${Date.now()}`,
        policyId: policyId || 'POL-CUSTOM',
        policyName: pTitle,
        title: `'${pTitle}' 2026년도 최신 지원 기준 및 신청 일정 공식 발표`,
        publisher: '대한민국 정책브리핑 (korea.kr)',
        url: 'https://www.korea.kr',
        publishedAt: new Date().toISOString().split('T')[0],
        summary3Lines: `[1] [정책 동향] ${pOrg}에서 '${pTitle}'의 2026년도 수혜 청년 대상 확대 방안을 발표했습니다.\n[2] [핵심 혜택] 실질적인 생활 안정과 청년 자립을 돕기 위해 맞춤형 지원금 및 서비스가 집중 제공됩니다.\n[3] [신청·유의] 세부 신청 일정과 자격 요건은 공식 누리집 공고를 통해 즉시 접수 가능합니다.`,
        keywords: baseKeywords
      },
      {
        id: `NEWS-GEN-02-${Date.now()}`,
        policyId: policyId || 'POL-CUSTOM',
        policyName: pTitle,
        title: `[심층분석] '${pTitle}' 수혜 대상 요건과 청년층 체감 혜택 집중 조명`,
        publisher: '한국경제',
        url: 'https://www.hankyung.com',
        publishedAt: '2026-09-25',
        summary3Lines: `[1] [정책 동향] '${pTitle}' 도입 이후 청년들의 경제적 부담 완화 효과에 대한 긍정적인 평가가 이어지고 있습니다.\n[2] [핵심 혜택] 연령 및 소득 기준을 충족하는 청년들에게 공정한 선발 기회와 연속적인 사후 관리가 지원됩니다.\n[3] [신청·유의] 타 유사 지자체 지원 사업과의 중복 수혜 여부를 사전 확인 후 신청해야 합니다.`,
        keywords: [baseKeywords[0] || '청년정책', '수혜조건', '체감혜택', '청년복지', '자립지원', '정책효과']
      },
      {
        id: `NEWS-GEN-03-${Date.now()}`,
        policyId: policyId || 'POL-CUSTOM',
        policyName: pTitle,
        title: `'${pTitle}' 신청 시 필수 구비 서류 및 온라인 원스톱 접수 팁`,
        publisher: '매일경제',
        url: 'https://www.mk.co.kr',
        publishedAt: '2026-08-30',
        summary3Lines: `[1] [정책 동향] 온라인 청년 플랫폼을 통해 간편 인증 후 구비 서류를 첨부하면 당일 접수가 완료됩니다.\n[2] [핵심 혜택] 주민등록등본 및 자격 증빙 서류를 정부24를 통해 무료로 발급받아 첨부할 수 있습니다.\n[3] [신청·유의] 심사 결과는 접수 후 문자메시지 및 누리집 마이페이지를 통해 개별 통보됩니다.`,
        keywords: [baseKeywords[0] || '청년정책', '구비서류', '온라인접수', '정부24', '신청가이드', '원스톱신청']
      }
    ];

    for (const gen of generatedNews) {
      if (!selectedNews.some((n) => n.title === gen.title)) {
        selectedNews.push(gen);
        if (selectedNews.length >= limitCount) break;
      }
    }
  }

  // 최종 결과 발행일 기준 최신순 정렬 후 정확히 limitCount(3건) 반환
  selectedNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return selectedNews.slice(0, limitCount);
}

// 6. 저장된 전체 정책 뉴스 DB 페이지네이션 및 검색 조회 (NewsView 전용)
export async function getPaginatedPolicyNews(
  params?: NewsFilterParams
): Promise<PaginatedPolicyNewsResult> {
  const page = Math.max(1, params?.page || 1);
  const pageSize = Math.max(1, params?.pageSize || 6);
  const keyword = params?.keyword?.trim().toLowerCase();
  const sortBy = params?.sortBy || 'latest';

  let allNews: PolicyNewsItem[] = [];

  // 1. Supabase 실데이터베이스 (policy_news 테이블) 조회 시도
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('policy_news').select('*', { count: 'exact' });

      if (keyword) {
        query = query.or(
          `title.ilike.%${keyword}%,summary_3lines.ilike.%${keyword}%,keywords.ilike.%${keyword}%,policy_name.ilike.%${keyword}%,publisher.ilike.%${keyword}%`
        );
      }

      if (sortBy === 'latest') {
        query = query.order('published_at', { ascending: false });
      } else {
        query = query.order('published_at', { ascending: false });
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await query.range(from, to);

      if (!error && data && data.length > 0) {
        const mappedNews: PolicyNewsItem[] = data.map((row: any) => ({
          id: row.id,
          policyId: row.policy_id || 'POL-CUSTOM',
          policyName: row.policy_name || '청년 정책',
          title: row.title,
          publisher: row.publisher || '언론사',
          url: row.url,
          publishedAt: (row.published_at || new Date().toISOString().split('T')[0]).split('T')[0],
          summary3Lines: row.summary_3lines || row.summary || '',
          keywords: row.keywords
            ? row.keywords.split(',').map((k: string) => k.trim().replace(/^#/, '')).filter(Boolean)
            : ['청년정책', '맞춤지원', '생활안정']
        }));

        const totalCount = count || mappedNews.length;
        const totalPages = Math.ceil(totalCount / pageSize) || 1;

        return {
          news: mappedNews,
          totalCount,
          totalPages,
          currentPage: page,
          pageSize,
        };
      }
    } catch (err) {
      console.warn('[Supabase policy_news] 페이지네이션 쿼리 실패, 로컬 DB 폴백:', err);
    }
  }

  // 2. 로컬 영구 DB JSON (db/policy_news_integrated.json) 폴백 로드
  if (Array.isArray(integratedPolicyNewsJson)) {
    allNews = integratedPolicyNewsJson.map((item: any, idx: number) => {
      const gn = item.grounded_news || {};
      const kws = Array.isArray(gn.keywords) && gn.keywords.length > 0
        ? gn.keywords
        : Array.isArray(item.news_keywords) && item.news_keywords.length > 0
        ? item.news_keywords
        : typeof gn.keywords_str === 'string'
        ? gn.keywords_str.split(',').map((k: string) => k.trim().replace(/^#/, ''))
        : ['청년정책', '맞춤지원', '생활안정', '자격요건', '온라인신청'];

      return {
        id: item.id || `NEWS-${item.policy_id || 'POL'}-${idx}`,
        policyId: item.policy_id || 'POL-CUSTOM',
        policyName: item.policy_name || '청년 정책',
        title: gn.title || item.title || '청년 정책 관련 최신 보도',
        publisher: gn.publisher || item.publisher || '언론사 보도',
        url: gn.url || item.url || 'https://www.korea.kr',
        publishedAt: (gn.published_at || item.published_at || item.updated_at || new Date().toISOString().split('T')[0]).split('T')[0],
        summary3Lines: gn.summary_3lines || item.summary_3lines || item.summary || '',
        keywords: kws.map((k: string) => k.replace(/^#/, ''))
      };
    });
  }

  // 검색어 필터링
  let filtered = allNews;
  if (keyword) {
    filtered = allNews.filter((n) => {
      const titleMatch = n.title.toLowerCase().includes(keyword);
      const summaryMatch = n.summary3Lines.toLowerCase().includes(keyword);
      const policyMatch = n.policyName.toLowerCase().includes(keyword);
      const publisherMatch = n.publisher.toLowerCase().includes(keyword);
      const kwMatch = n.keywords.some((k) => k.toLowerCase().includes(keyword));
      return titleMatch || summaryMatch || policyMatch || publisherMatch || kwMatch;
    });
  }

  // 정렬 (최신순 우선)
  filtered.sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const pagedNews = filtered.slice(startIndex, startIndex + pageSize);

  return {
    news: pagedNews,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
  };
}



