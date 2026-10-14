import React, { useState, useEffect, useMemo } from 'react';
import { useProfileNickname } from '../utils/profileStorage';
import { getAllPolicies, getCategoryCounts } from '../api/supabasePolicies';
import { PolicyItem, PolicyCategory } from '../types/policy';
import { usePersonalizedPolicies } from '../utils/policyMatcher';

interface HomeViewProps {
  onNavigate?: (
    path: string,
    policyId?: string,
    extraParams?: { category?: string; keyword?: string; employment?: string; [key: string]: any }
  ) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const nickname = useProfileNickname('');
  const hasNickname = Boolean(nickname && nickname.trim());

  const [rawPolicies, setRawPolicies] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  // Supabase 실데이터 조회 (전체 데이터 로드)
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getAllPolicies();
        setRawPolicies(data);
      } catch (err) {
        console.error('Failed to load policies in HomeView:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 사용자 프로필 정보 기반: 자격 부합 정책만 선별 (자격 미부합 공고 완전 제외)
  const { policies, profile, hasProfile } = usePersonalizedPolicies(rawPolicies, true);

  // 카테고리별 개수 계산 (자격 부합 정책 기준)
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      전체: policies.length,
      일자리: 0,
      주거: 0,
      '교육·직업훈련': 0,
      '금융·복지·문화': 0,
      '참여·기반': 0,
    };
    policies.forEach((p) => {
      if (counts[p.category] !== undefined) {
        counts[p.category] += 1;
      }
    });
    return counts;
  }, [policies]);

  // 선택된 카테고리 필터링
  const filteredPolicies = React.useMemo(() => {
    if (selectedCategory === '전체') return policies;
    return policies.filter((p) => p.category === selectedCategory);
  }, [policies, selectedCategory]);

  // 마감 임박 정책 (D-Day가 있거나 상위 3건 - 프로필 매칭 높은 순 우선)
  const urgentPolicies = React.useMemo(() => {
    const withDDay = policies.filter((p) => p.dDay);
    return withDDay.length > 0 ? withDDay.slice(0, 3) : policies.slice(0, 3);
  }, [policies]);

  // data-path 클릭 이벤트 핸들링
  useEffect(() => {
    const handleDataPath = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-path]');
      if (target) {
        const path = target.getAttribute('data-path');
        const pId = target.getAttribute('data-policy-id');
        const cat = target.getAttribute('data-category');
        if (path && onNavigate) {
          e.preventDefault();
          onNavigate(path, pId || undefined, cat ? { category: cat } : undefined);
        }
      }
    };
    document.addEventListener('click', handleDataPath);
    return () => document.removeEventListener('click', handleDataPath);
  }, [onNavigate]);

  const categories: { key: string; label: string; icon: string; count: number }[] = [
    { key: '전체', label: '전체', icon: '✨', count: categoryCounts['전체'] || 0 },
    { key: '일자리', label: '일자리', icon: '💼', count: categoryCounts['일자리'] || 0 },
    { key: '주거', label: '주거', icon: '🏡', count: categoryCounts['주거'] || 0 },
    { key: '교육·직업훈련', label: '교육·직업훈련', icon: '🎓', count: categoryCounts['교육·직업훈련'] || 0 },
    { key: '금융·복지·문화', label: '금융·복지·문화', icon: '🪙', count: categoryCounts['금융·복지·문화'] || 0 },
    { key: '참여·기반', label: '참여·기반', icon: '💬', count: categoryCounts['참여·기반'] || 0 },
  ];

  return (
    <main className="flex-1 w-full pt-16 sm:pt-20 pb-24 lg:pb-16 bg-[#f8fafc] max-w-[1240px] mx-auto px-3.5 sm:px-6 md:px-8">
      <div className="flex flex-col w-full space-y-6 sm:space-y-8">
        
        {/* Top Personalized Hero Widget */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-sky-100/70 via-indigo-50/50 to-teal-50/70 p-4 sm:p-6 md:p-8 border border-sky-200/60 shadow-sm shadow-sky-100/50">
          <div className="absolute -right-8 -top-10 w-72 h-72 rounded-full bg-teal-200/30 blur-3xl pointer-events-none"></div>
          <div className="absolute left-1/3 -bottom-10 w-64 h-64 rounded-full bg-sky-200/40 blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-sky-200/70 shadow-xs text-sky-800 text-xs font-semibold backdrop-blur-md">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                <span>
                  {hasProfile
                    ? `⭐ 내 프로필(${profile.regionCity ? profile.regionCity.slice(0, 2) : '전국'} · ${profile.employmentStatus || '청년'}${profile.interests && profile.interests.length > 0 ? ` · ${profile.interests.join('/')}` : ''}) 자격 일치 정책만 표시 중`
                    : 'Supabase 실데이터 실시간 동기화 완료'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {hasNickname ? (
                  <>
                    <span className="text-sky-600">{nickname}</span>님 자격 맞춤 정책{' '}
                    <span className="text-sky-600 underline decoration-sky-300 decoration-wavy underline-offset-4">
                      {policies.length > 0 ? `${policies.length}건` : loading ? '조회중...' : '0건'}
                    </span>
                    이 준비되었습니다
                  </>
                ) : (
                  <>
                    청년나침반에서 수집된{' '}
                    <span className="text-sky-600 underline decoration-sky-300 decoration-wavy underline-offset-4">
                      {policies.length > 0 ? `총 ${policies.length}건` : '실시간 정책'}
                    </span>
                    의 혜택을 확인해보세요
                  </>
                )}
              </h1>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                {hasProfile
                  ? `[내 정보 설정]에 입력하신 자격 요건(관심분야 ${profile.interests && profile.interests.length > 0 ? `[${profile.interests.join(', ')}]` : '전체'}, ${profile.regionCity || '거주지역'}, ${profile.employmentStatus || '취업상태'})에 부합하는 정책만 선별되었습니다.`
                  : '온통청년 및 공공데이터포털 복지로 API로부터 수집된 실시간 검증 정책을 편리하게 탐색할 수 있습니다.'}
              </p>
            </div>

            {/* Graphic & Metric Badge Card */}
            <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-sky-100 shadow-md shadow-sky-100/60 shrink-0 self-start md:self-auto">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 border border-amber-200 flex items-center justify-center shadow-inner shrink-0">
                <svg className="w-8 h-8 text-amber-500 drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <rect fill="#FEF3C7" height="12" rx="3" stroke="#F59E0B" width="20" x="2" y="6"></rect>
                  <circle cx="16" cy="12" fill="#FBBF24" r="2.5" stroke="#D97706"></circle>
                  <path d="M6 10h3M6 14h2" stroke="#D97706" strokeLinecap="round"></path>
                </svg>
              </div>
              <div className="pr-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${hasProfile ? 'bg-emerald-500' : 'bg-sky-500'}`}></span>
                  <span className="text-xs font-medium text-slate-500">
                    {hasProfile ? '자격 부합 필터' : 'DB 실시간 연동'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {policies.length}
                  </span>
                  <span className="text-xs font-bold text-sky-600">
                    {hasProfile ? `건 / DB ${rawPolicies.length}건` : '건 등록됨'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Category Navigation Filters */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" id="category-tabs">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-sm transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? 'bg-sky-600 text-white border border-sky-600 shadow-sm shadow-sky-300/50'
                      : 'bg-white text-slate-700 hover:bg-sky-50/70 border border-slate-200/80 hover:border-sky-200'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {cat.icon}
                  </span>
                  <span>{cat.label} ({cat.count})</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium bg-white px-3 py-1.5 rounded-full border border-slate-200/70 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Supabase DB 실시간 동기화</span>
          </div>
        </div>

        {/* Main Content Layout: 8 cols Policy Cards + 4 cols Side Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Primary Policy Grid (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{hasProfile ? '나의 자격 맞춤 추천 정책' : '추천 핵심 정책'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-semibold">
                    {selectedCategory === '전체' ? '전체 분야' : selectedCategory} ({filteredPolicies.length}건)
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  {hasProfile
                    ? '설정하신 프로필 자격 조건과 일치하는 공고만 엄격히 선별되었습니다'
                    : '실제 Supabase DB에서 조회된 청년 지원 정책입니다'}
                </p>
              </div>
              <button
                onClick={() => onNavigate?.('explore', undefined, { category: selectedCategory })}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer hover:underline"
              >
                전체보기 ({filteredPolicies.length > 0 ? `${filteredPolicies.length}건` : `${policies.length}건`}) →
              </button>
            </div>

            {/* Loading Skeleton */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="w-20 h-6 bg-slate-200 rounded-md"></div>
                      <div className="w-14 h-5 bg-slate-200 rounded-full"></div>
                    </div>
                    <div className="w-3/4 h-5 bg-slate-200 rounded"></div>
                    <div className="w-full h-12 bg-slate-100 rounded"></div>
                    <div className="w-full h-8 bg-slate-200 rounded-xl mt-4"></div>
                  </div>
                ))}
              </div>
            ) : filteredPolicies.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200 text-slate-500 space-y-3">
                <span className="text-3xl">🔍</span>
                <p className="text-base font-bold text-slate-800">
                  {hasProfile
                    ? `선택하신 [${selectedCategory}] 분야에 설정 자격과 일치하는 정책이 없습니다.`
                    : '해당 카테고리의 정책이 없습니다.'}
                </p>
                <p className="text-xs text-slate-400">
                  {hasProfile
                    ? '관심 분야나 연령, 거주지 등 프로필 설정 조건을 조정해보세요.'
                    : '다른 카테고리를 선택해 보세요.'}
                </p>
                {hasProfile && (
                  <button
                    onClick={() => onNavigate?.('profile')}
                    className="mt-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
                  >
                    내 정보 설정 변경하기 →
                  </button>
                )}
              </div>
            ) : (
              /* Policy Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredPolicies.slice(0, 6).map((policy) => {
                  const badgeBg =
                    policy.category === '주거'
                      ? 'bg-rose-50 text-rose-600 border-rose-200'
                      : policy.category === '일자리'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : policy.category === '교육·직업훈련'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : policy.category === '금융·복지·문화'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-purple-50 text-purple-700 border-purple-200';

                  return (
                    <div
                      key={policy.id}
                      className="bg-white rounded-2xl p-5 border border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-md hover:shadow-sky-100/60 transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        {/* Card Header with Badges */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${badgeBg}`}>
                              {policy.category}
                            </span>
                            {policy.matchScore && policy.matchScore >= 80 && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
                                🎯 {policy.matchScore}% 일치
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 truncate max-w-[100px]">
                              {policy.organization}
                            </span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            policy.dDay
                              ? 'bg-rose-50 border border-rose-200 text-rose-600'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {policy.dDay || policy.status || '상시모집'}
                          </span>
                        </div>

                        {/* Title & Summary */}
                        <div>
                          <h3
                            onClick={() => onNavigate?.('detail', policy.id)}
                            className="font-bold text-base text-slate-900 group-hover:text-sky-600 transition-colors cursor-pointer line-clamp-1"
                            title={policy.title}
                          >
                            {policy.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2 min-h-[32px]">
                            {policy.benefitSummary || '지원 조건 및 혜택 내용을 확인해 보세요.'}
                          </p>
                        </div>
                      </div>

                      {/* Card Bottom Meta Box */}
                      <div className="mt-5 pt-3.5 space-y-2 bg-gradient-to-b from-slate-50/70 to-sky-50/40 -mx-5 -mb-5 p-5 rounded-b-2xl border-t border-slate-100">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">지원 대상</span>
                          <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                            {policy.targetAge || '연령 무관'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">자격 요건</span>
                          <span className="font-semibold text-slate-700 truncate max-w-[170px]">
                            {policy.incomeCondition || '제한 없음'}
                          </span>
                        </div>

                        <button
                          onClick={() => onNavigate?.('detail', policy.id)}
                          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold text-xs text-center flex items-center justify-center gap-1.5 shadow-sm shadow-sky-200 transition-all cursor-pointer"
                        >
                          <span>상세 정보 및 신청 방법 확인</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Inline Visual Curation Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-sky-50 via-white to-indigo-50/40 p-5 border border-sky-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-teal-200 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">맞춤 정책 실시간 검색 & 필터링</h4>
                  <p className="text-xs text-slate-500">총 {policies.length}건의 청년 정책 중 나에게 딱 맞는 혜택을 찾아보세요</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate?.('explore', undefined, { category: selectedCategory !== '전체' ? selectedCategory : undefined })}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs whitespace-nowrap shadow-sm shadow-sky-200 transition-all cursor-pointer"
              >
                전체 정책 탐색하기
              </button>
            </div>
          </div>

          {/* Right Column: D-Day Calendar & AI Briefing (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* AI 3-Line Briefing Box */}
            <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-sm shadow-sky-100/40 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    🤖
                  </div>
                  <h3
                    onClick={() => onNavigate?.('news')}
                    className="font-bold text-sm text-slate-900 cursor-pointer hover:text-sky-600 transition-colors"
                  >
                    AI 정책 3줄 요약 브리핑
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">
                  실시간
                </span>
              </div>
              
              <div className="space-y-2.5 pt-1">
                <div
                  onClick={() => onNavigate?.('news')}
                  className="p-3 rounded-xl bg-slate-50/80 border border-slate-100/80 flex gap-2.5 items-start cursor-pointer hover:bg-sky-50/40 transition-colors"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-xs">
                    1
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-800 font-semibold">청년 주거 지원</strong>: 월세 특별지원 및 저금리 버팀목 대출 지원이 확대 운영 중입니다.
                  </p>
                </div>
                <div
                  onClick={() => onNavigate?.('news')}
                  className="p-3 rounded-xl bg-slate-50/80 border border-slate-100/80 flex gap-2.5 items-start cursor-pointer hover:bg-sky-50/40 transition-colors"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-xs">
                    2
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-800 font-semibold">일자리 & 교육</strong>: K-디지털 트레이닝 및 청년도전지원사업 인센티브가 지급됩니다.
                  </p>
                </div>
                <div
                  onClick={() => onNavigate?.('news')}
                  className="p-3 rounded-xl bg-slate-50/80 border border-slate-100/80 flex gap-2.5 items-start cursor-pointer hover:bg-sky-50/40 transition-colors"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-xs">
                    3
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-800 font-semibold">자산형성</strong>: 청년도약계좌 기여금 매칭과 이자 비과세 혜택을 신청할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* D-Day Urgent Tracker Widget */}
            <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-sm shadow-sky-100/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                    ⏰
                  </div>
                  <h3
                    onClick={() => onNavigate?.('calendar')}
                    className="font-bold text-sm text-slate-900 cursor-pointer hover:text-sky-600 transition-colors"
                  >
                    마감 임박 & 핵심 일정
                  </h3>
                </div>
                <button
                  onClick={() => onNavigate?.('calendar')}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer hover:underline"
                >
                  전체일정 →
                </button>
              </div>

              <div className="space-y-2">
                {urgentPolicies.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onNavigate?.('detail', p.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-sky-50/50 transition-colors border border-transparent hover:border-sky-100 cursor-pointer"
                  >
                    <div className="space-y-0.5 max-w-[190px]">
                      <span className="font-medium text-xs text-slate-800 line-clamp-1">
                        {p.title}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {p.organization}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold shrink-0">
                      {p.dDay || '진행중'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick Reminder Toggle */}
              <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold">
                    💬
                  </span>
                  <span className="text-xs font-medium text-slate-700">마감 3일 전 텔레그램/알림톡</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input defaultChecked={true} className="sr-only peer" type="checkbox" />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                </label>
              </div>
            </div>

            {/* Consultation Floating Banner */}
            <div className="rounded-2xl bg-gradient-to-br from-white via-teal-50/30 to-sky-50/50 p-5 border border-sky-100 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0 shadow-xs">
                  🧑‍💼
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900">전담 정책 설계사 상담</span>
                  <p className="text-xs text-slate-500">어려운 서류 심사 무료 동행 지원</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate?.('profile')}
                className="w-full py-2 rounded-xl bg-white hover:bg-sky-50 text-sky-700 font-semibold text-xs border border-sky-200 hover:border-sky-300 transition-all shadow-xs cursor-pointer"
              >
                내 맞춤 프로필 진단하기
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
};

export default HomeView;
