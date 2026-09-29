import React, { useState, useEffect, useMemo } from 'react';
import { getPolicies } from '../api/supabasePolicies';
import { PolicyItem } from '../types/policy';
import { usePersonalizedPolicies } from '../utils/policyMatcher';

interface NewsViewProps {
  onNavigate?: (path: string, policyId?: string) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ onNavigate }) => {
  const [rawPolicies, setRawPolicies] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'match' | 'latest' | 'popular'>('match');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  // 사용자 프로필 정보 기반 맞춤 점수 계산 및 우선순위 정렬
  const { policies, profile, hasProfile } = usePersonalizedPolicies(rawPolicies);

  // Supabase 실데이터 로드
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getPolicies({ limit: 100 });
        setRawPolicies(data);
      } catch (err) {
        console.error('Failed to load policies in NewsView:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // data-path 이벤트 처리
  useEffect(() => {
    const handleDataPath = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-path]');
      if (target) {
        const path = target.getAttribute('data-path');
        const pId = target.getAttribute('data-policy-id');
        if (path && onNavigate) {
          e.preventDefault();
          onNavigate(path, pId || undefined);
        }
      }
    };
    document.addEventListener('click', handleDataPath);
    return () => document.removeEventListener('click', handleDataPath);
  }, [onNavigate]);

  // 검색 및 정렬 필터링
  const filteredPolicies = useMemo(() => {
    let list = [...policies];
    if (activeSearch.trim()) {
      const q = activeSearch.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.benefitSummary.toLowerCase().includes(q) ||
          p.organization.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'popular') {
      list.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    } else if (sortBy === 'match') {
      list.sort((a, b) => (b.matchScore || 85) - (a.matchScore || 85));
    }
    return list;
  }, [policies, activeSearch, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredPolicies.length / pageSize));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPolicies.slice(start, start + pageSize);
  }, [filteredPolicies, currentPage, pageSize]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveSearch(searchTerm);
    setCurrentPage(1);
  };

  const handleTagClick = (tag: string) => {
    setSearchTerm(tag);
    setActiveSearch(tag);
    setCurrentPage(1);
  };

  return (
    <main className="flex-1 w-full pt-20 pb-16 bg-[#f8fafc] max-w-[1240px] mx-auto px-4 md:px-8">
      <div className="flex flex-col w-full space-y-8">
        {/* 1. Header Title & Hero Section (Light Pastel Sky-Mint-Cream Gradient Banner) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-100/70 via-indigo-50/50 to-teal-50/70 p-6 md:p-8 border border-sky-200/60 shadow-sm shadow-sky-100/50">
          <div className="absolute -right-8 -top-10 w-72 h-72 rounded-full bg-teal-200/30 blur-3xl pointer-events-none"></div>
          <div className="absolute left-1/3 -bottom-10 w-64 h-64 rounded-full bg-sky-200/40 blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-sky-200/70 shadow-xs text-sky-800 text-xs font-semibold backdrop-blur-md">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                <span>AI 정책·이슈 실시간 큐레이션</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                나에게 꼭 맞는 청년 뉴스 <span className="text-sky-600 underline decoration-sky-300 decoration-wavy underline-offset-4">실시간 AI 요약</span>
              </h1>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                전국 정책 데이터베이스로부터 AI가 핵심만 3줄 요약하고 맞춤 정책 상세 정보와 즉시 연결해 드립니다.
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-sky-100 shadow-md shadow-sky-100/60 shrink-0 self-start md:self-auto">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 via-sky-50 to-teal-100 border border-indigo-200 flex items-center justify-center shadow-inner shrink-0 text-sky-600">
                <svg className="w-8 h-8 text-sky-600 drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
              <div className="pr-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-medium text-slate-500">실시간 분석 완료</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {policies.length}
                  </span>
                  <span className="text-sm font-bold text-sky-600">건</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Main Search Bar & Quick Tags */}
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="bg-white p-2 sm:p-3 rounded-2xl border border-sky-100 shadow-sm flex flex-col md:flex-row items-center gap-2">
            <div className="relative flex-1 w-full flex items-center">
              <span className="text-slate-400 absolute left-3.5 text-base">🔍</span>
              <input
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40 transition-all"
                id="news-search-input"
                placeholder="청년 주거, 일자리, 금융, 교육 관련 최신 정책 및 혜택 뉴스 검색"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActiveSearch('');
                }}
                className="flex-1 md:flex-none px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                type="button"
              >
                필터초기화
              </button>
              <button
                type="submit"
                className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm shadow-sky-200 flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
              >
                검색
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap px-1">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
              🔥 인기 키워드:
            </span>
            {['월세', '취업', '자산', '인턴', '교육', '장학'].map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="px-3 py-1 rounded-full bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-600 font-medium text-xs border border-slate-200/80 transition-colors cursor-pointer"
                type="button"
              >
                #{tag}
              </button>
            ))}
          </div>
        </form>

        {/* 3. Results Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-200/80">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900">실시간 큐레이션 뉴스 &amp; 정책</span>
            <span className="text-xl font-extrabold text-sky-600">{filteredPolicies.length}</span>
            <span className="text-sm font-bold text-slate-800">건</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-3 pr-8 py-1.5 bg-white text-slate-700 font-medium text-xs rounded-xl border border-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
              >
                <option value="match">내 매칭률순 ▼</option>
                <option value="popular">인기조회순</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. News Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-4">
                <div className="w-20 h-5 bg-slate-200 rounded"></div>
                <div className="w-3/4 h-6 bg-slate-200 rounded"></div>
                <div className="w-full h-16 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : paginatedList.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 text-slate-500">
            <p className="text-base font-semibold">검색 조건에 맞는 뉴스가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedList.map((item) => {
              const badgeBg =
                item.category === '주거'
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : item.category === '일자리'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : item.category === '교육·직업훈련'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : item.category === '금융·복지·문화'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200';

              return (
                <article
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-md hover:shadow-sky-100/60 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeBg}`}>
                          {item.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[11px] font-bold">
                          {item.dDay || item.status || '진행중'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold">
                        {item.matchScore || 88}% 일치
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="truncate max-w-[150px]">{item.organization}</span>
                      <span>·</span>
                      <span>실시간 분석</span>
                    </div>

                    <h2
                      onClick={() => onNavigate?.('detail', item.id)}
                      className="font-bold text-base text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 cursor-pointer"
                      title={item.title}
                    >
                      {item.title}
                    </h2>

                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2">
                      <div className="flex items-center gap-1.5 text-sky-600 font-bold text-xs">
                        <span>🤖</span>
                        <span>AI 핵심 요약</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {item.benefitSummary || '지원 조건과 상세 혜택을 확인해 보세요.'}
                      </p>
                    </div>

                    <div
                      onClick={() => onNavigate?.('detail', item.id)}
                      className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100/70 border border-sky-100 text-sky-700 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="truncate">연계 정책 상세 보기</span>
                      <span>→</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium truncate max-w-[120px]">
                      {item.organization}
                    </span>
                    <button
                      onClick={() => onNavigate?.('detail', item.id)}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer"
                      type="button"
                    >
                      <span>상세 정보 보기</span>
                      <span>→</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* 5. Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-sky-50 shadow-xs transition-colors disabled:opacity-40 cursor-pointer"
              type="button"
            >
              ◀
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shadow-sm cursor-pointer ${
                  currentPage === p
                    ? 'bg-sky-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-sky-50'
                }`}
                type="button"
              >
                {p}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-sky-50 shadow-xs transition-colors disabled:opacity-40 cursor-pointer"
              type="button"
            >
              ▶
            </button>
          </div>
        )}

        {/* 6. Bottom Kakao Notification Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-50 via-white to-teal-50/50 p-6 md:p-8 border border-sky-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-sky-200/20 blur-3xl pointer-events-none"></div>
          <div className="flex items-center gap-4 z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-sm flex-shrink-0 text-2xl">
              💬
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900">청년나침반 AI 뉴스 브리핑 서비스</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-bold text-xs">무료 알림</span>
              </div>
              <p className="text-xs md:text-sm text-slate-600">
                내게 꼭 맞는 핵심 정책 뉴스를 매일 아침 카카오톡 / 텔레그램으로 요약 받아보세요!
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('profile')}
            className="z-10 flex-shrink-0 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm shadow-sky-200 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            type="button"
          >
            <span>맞춤 뉴스 알림 신청하기 🔔</span>
          </button>
        </div>
      </div>
    </main>
  );
};

export default NewsView;
