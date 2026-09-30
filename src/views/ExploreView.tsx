import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getPaginatedPolicies, getCategoryCounts, toggleBookmark, getLocalBookmarkedIds } from '../api/supabasePolicies';
import { PolicyItem, PolicyCategory } from '../types/policy';
import { usePersonalizedPolicies } from '../utils/policyMatcher';

interface ExploreViewProps {
  onNavigate?: (path: string, policyId?: string) => void;
}

type SortOption = 'matchScore' | 'deadline' | 'latest' | 'popular';

export const ExploreView: React.FC<ExploreViewProps> = ({ onNavigate }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // DB 데이터 및 서버 사이드 페이지네이션 상태
  const [rawPolicies, setRawPolicies] = useState<PolicyItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // 카테고리별 전체 통계 (1593건 등 실제 DB 통계)
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({
    전체: 0,
    일자리: 0,
    주거: 0,
    '교육·직업훈련': 0,
    '금융·복지·문화': 0,
    '참여·기반': 0,
  });

  // 검색 & 필터 상태
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [ageInput, setAgeInput] = useState<string>('');
  const [selectedEmployment, setSelectedEmployment] = useState<string>('제한없음');
  const [selectedSpecial, setSelectedSpecial] = useState<string>('제한없음');
  const [sortBy, setSortBy] = useState<SortOption>('latest');

  // 북마크 상태 관리 (로컬 Set)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => new Set(getLocalBookmarkedIds()));

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // 1. 카테고리별 전체 카운트 로드 (마운트 시 1회)
  useEffect(() => {
    async function loadCounts() {
      try {
        const counts = await getCategoryCounts();
        setCategoryCounts(counts);
      } catch (err) {
        console.error('Failed to load category counts:', err);
      }
    }
    loadCounts();
  }, []);

  // 2. 서버 사이드 페이지네이션 데이터 로드
  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPaginatedPolicies({
        page: currentPage,
        pageSize,
        category: selectedCategory !== '전체' ? selectedCategory : undefined,
        keyword: activeSearch.trim() || undefined,
        employment: selectedEmployment !== '제한없음' ? selectedEmployment : undefined,
        sortBy,
      });

      setRawPolicies(result.policies);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to load paginated policies in ExploreView:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, selectedCategory, activeSearch, selectedEmployment, sortBy]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // 사용자 프로필 정보 기반 맞춤 점수 계산
  const { policies, profile, hasProfile } = usePersonalizedPolicies(rawPolicies);

  // data-path 클릭 이벤트 핸들링
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

  // 검색 실행 핸들러
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveSearch(searchTerm);
    setCurrentPage(1);
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchTerm('');
    setActiveSearch('');
    setSelectedCategory('전체');
    setSelectedRegion('');
    setAgeInput('');
    setSelectedEmployment('제한없음');
    setSelectedSpecial('제한없음');
    setSortBy('latest');
    setCurrentPage(1);
  };

  // 북마크 클릭
  const handleBookmarkToggle = async (policyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyBookmarked = bookmarkedIds.has(policyId);

    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyBookmarked) {
        next.delete(policyId);
      } else {
        next.add(policyId);
      }
      return next;
    });

    await toggleBookmark('guest_user', policyId);
  };

  // 페이지 변경 핸들러 (상단 스크롤)
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    const container = document.getElementById('policy-list-top');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  const categories = [
    { key: '전체', label: '전체', icon: '✨', count: categoryCounts['전체'] || 0 },
    { key: '일자리', label: '일자리', icon: '💼', count: categoryCounts['일자리'] || 0 },
    { key: '주거', label: '주거', icon: '🏡', count: categoryCounts['주거'] || 0 },
    { key: '교육·직업훈련', label: '교육·직업훈련', icon: '🎓', count: categoryCounts['교육·직업훈련'] || 0 },
    { key: '금융·복지·문화', label: '금융·복지·문화', icon: '🪙', count: categoryCounts['금융·복지·문화'] || 0 },
    { key: '참여·기반', label: '참여·기반', icon: '💬', count: categoryCounts['참여·기반'] || 0 },
  ];

  return (
    <main className="w-full pt-16 bg-surface min-h-[calc(100vh-16rem)] mt-5">
      <div className="flex flex-col w-full">
        {/* Subtle Ambient Glow Orbs */}
        <div className="relative w-full max-w-[1200px] mx-auto px-4 md:px-0">
          <div className="absolute top-10 left-1/4 -z-10 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-32 right-10 -z-10 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-100/70 via-indigo-50/50 to-teal-50/70 p-6 md:p-8 border border-sky-200/60 shadow-sm shadow-sky-100/50 mb-space-lg">
            <div className="absolute -right-8 -top-10 w-72 h-72 rounded-full bg-teal-200/30 blur-3xl pointer-events-none"></div>
            <div className="absolute left-1/3 -bottom-10 w-64 h-64 rounded-full bg-sky-200/40 blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-sky-200/70 shadow-xs text-sky-800 text-xs font-semibold backdrop-blur-md">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                  </span>
                  <span>Supabase 실시간 서버 사이드 페이지네이션 시스템</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  나에게 꼭 맞는 청년 정책 탐색{' '}
                  <span className="text-sky-600 underline decoration-sky-300 decoration-wavy underline-offset-4">
                    {loading ? '조회중...' : `총 ${totalCount.toLocaleString()}건`}
                  </span>
                </h1>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  온통청년 및 공공데이터포털 복지로 API에서 동기화된 전체 {categoryCounts['전체'] > 0 ? categoryCounts['전체'].toLocaleString() : totalCount.toLocaleString()}건의 실시간 정책을 검색·페이지네이션으로 빠르게 탐색합니다.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-sky-100 shadow-md shadow-sky-100/60 shrink-0 self-start md:self-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shadow-inner shrink-0 text-amber-500">
                  <svg className="w-8 h-8 text-amber-500 drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"></circle>
                    <polygon fill="#FEF3C7" points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" stroke="#F59E0B"></polygon>
                  </svg>
                </div>
                <div className="pr-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-medium text-slate-500">
                      {selectedCategory !== '전체' ? `${selectedCategory} 정책` : '전체 정책'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-medium text-slate-500 mr-1">검색 결과</span>
                    <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {totalCount.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-sky-600">건</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar with Accordion Filter Toggle */}
          <form onSubmit={handleSearch} className="bg-white p-2.5 rounded-2xl border border-sky-200/70 shadow-sm flex flex-col md:flex-row items-center gap-2 mb-space-md">
            <div className="flex-1 flex items-center w-full px-3.5 py-2 gap-2.5">
              <span className="text-sky-600 text-lg">🔍</span>
              <input
                className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none"
                placeholder="키워드나 정책명을 입력하세요 (예: 월세, 인턴십, 저작권, AI, 자산형성, 부트캠프)"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setActiveSearch('');
                    setCurrentPage(1);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer border shadow-xs ${isFilterOpen
                  ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                type="button"
              >
                <span>⚙️</span>
                <span>{isFilterOpen ? '상세 필터 닫기' : '상세 필터 열기'}</span>
                <span className={`text-xs transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
                type="button"
              >
                <span>🔄</span>
                <span>초기화</span>
              </button>

              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer w-full md:w-auto"
              >
                <span>검색</span>
              </button>
            </div>
          </form>

          {/* Multi-dimensional Custom Filter Console (Accordion Format) */}
          <section className="bg-white rounded-2xl shadow-sm mb-space-xl overflow-hidden border border-sky-100 transition-all duration-300">
            {/* Accordion Header */}
            <div
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-between px-6 py-3.5 bg-gradient-to-r from-sky-50/70 to-indigo-50/40 border-b border-sky-100 cursor-pointer select-none hover:bg-sky-50/90 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sky-600">🎯</span>
                <span className="font-bold text-slate-900 text-sm">분야 및 맞춤 조건 필터</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[11px] font-bold">
                  {selectedCategory !== '전체' ? `${selectedCategory} 선택됨` : '전체 분야'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700">
                <span>{isFilterOpen ? '필터 접기' : '필터 펼치기'}</span>
                <span className={`text-xs transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </div>
            </div>

            {/* Accordion Content */}
            {isFilterOpen && (
              <div>
                <div className="px-6 md:px-8 py-4 space-y-3 text-sm text-slate-600">
                  {/* 1. Category Tabs */}
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-3 pb-2.5 border-b border-dashed border-sky-100">
                    <label className="w-24 font-bold text-slate-900 text-sm flex-shrink-0 pt-1 md:pt-0">카테고리</label>
                    <div className="flex flex-wrap gap-2 flex-1">
                      {categories.map((cat) => {
                        const isSelected = selectedCategory === cat.key;
                        return (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat.key);
                              setCurrentPage(1);
                            }}
                            className={`rounded-full px-4 py-1 text-xs font-semibold shadow-xs transition-colors cursor-pointer ${isSelected
                              ? 'bg-sky-600 text-white border border-sky-600'
                              : 'border border-slate-200 bg-white hover:bg-sky-50 text-slate-700'
                              }`}
                          >
                            {cat.icon} {cat.label} ({cat.count > 0 ? cat.count.toLocaleString() : '-'})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Employment Status */}
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                    <label className="w-24 font-bold text-slate-900 text-sm flex-shrink-0">취업상태</label>
                    <div className="flex flex-wrap gap-2 flex-1">
                      {['제한없음', '재직자', '미취업자', '프리랜서', '(예비)창업자', '대학생/졸업예정자'].map((status) => {
                        const isSelected = selectedEmployment === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              setSelectedEmployment(status);
                              setCurrentPage(1);
                            }}
                            className={`rounded-full px-3.5 py-1 text-xs transition-colors cursor-pointer border ${isSelected
                              ? 'border-sky-600 bg-sky-50 text-sky-700 font-semibold'
                              : 'border-slate-200 text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600'
                              }`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="bg-sky-50/50 px-6 py-2.5 border-t border-sky-100 flex items-center justify-center gap-3">
                  <button
                    onClick={handleResetFilters}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-6 py-1.5 rounded-full font-medium text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                    type="button"
                  >
                    <span>필터 전체 초기화</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Policy Cards Grid Section */}
          <section id="policy-list-top" className="space-y-space-md pb-space-xl">
            {/* Controls & Sorting Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-slate-700">검색 결과 정책</span>
                <span className="text-xl font-extrabold text-sky-600">{totalCount.toLocaleString()}</span>
                <span className="text-xs text-slate-500">건 (페이지 {currentPage} / {totalPages})</span>
              </div>

              {/* Sort Options */}
              <div className="bg-white rounded-xl p-1 flex items-center shadow-xs border border-slate-200 text-xs">
                <button
                  onClick={() => {
                    setSortBy('latest');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${sortBy === 'latest' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  type="button"
                >
                  최신순
                </button>
                <button
                  onClick={() => {
                    setSortBy('matchScore');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${sortBy === 'matchScore' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  type="button"
                >
                  적합도순
                </button>
                <button
                  onClick={() => {
                    setSortBy('deadline');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${sortBy === 'deadline' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  type="button"
                >
                  마감임박순
                </button>
                <button
                  onClick={() => {
                    setSortBy('popular');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${sortBy === 'popular' ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  type="button"
                >
                  조회순
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-3">
                    <div className="flex gap-2">
                      <div className="w-16 h-5 bg-slate-200 rounded"></div>
                      <div className="w-24 h-5 bg-slate-200 rounded"></div>
                    </div>
                    <div className="w-2/3 h-6 bg-slate-200 rounded"></div>
                    <div className="w-full h-10 bg-slate-100 rounded"></div>
                  </div>
                ))}
              </div>
            ) : policies.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 text-slate-500 space-y-3">
                <p className="text-3xl">🔍</p>
                <p className="text-base font-bold text-slate-800">일치하는 정책이 없습니다</p>
                <p className="text-xs text-slate-500">검색어나 선택된 상세 필터 조건을 변경해 보세요.</p>
                <button
                  onClick={handleResetFilters}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                >
                  필터 전체 초기화
                </button>
              </div>
            ) : (
              /* Policy Cards Rows */
              <div className="flex flex-col gap-4">
                {policies.map((policy) => {
                  const isBookmarked = bookmarkedIds.has(policy.id);
                  const badgeColor =
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
                    <article
                      key={policy.id}
                      className="bg-white rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-sky-300 border border-slate-200/80 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
                    >
                      <div className="flex-1 min-w-0">
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-bold border ${badgeColor}`}>
                            {policy.category}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-bold ${policy.dDay
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                            }`}>
                            {policy.dDay || policy.status || '상시모집'}
                          </span>
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[12px] font-extrabold border border-sky-200">
                            <span>🎯</span>
                            <span>적합도 {policy.matchScore || 85}%</span>
                          </div>
                          {(policy as any).aiMatchReason && (
                            <span className="text-[11px] text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/70 font-semibold">
                              {(policy as any).aiMatchReason}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3
                          onClick={() => onNavigate?.('detail', policy.id)}
                          className="text-lg md:text-[19px] font-bold text-slate-900 group-hover:text-sky-600 transition-colors tracking-tight cursor-pointer mb-1.5"
                        >
                          {policy.title}
                        </h3>

                        {/* Summary / Benefit */}
                        <div className="mb-3">
                          <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                            <span className="font-bold text-sky-700 mr-2">[혜택 및 요약]</span>
                            {policy.benefitSummary || '지원 세부 사항을 확인해 보세요.'}
                          </p>
                        </div>

                        {/* Meta Tags */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <span>🏛️</span>
                            <span>{policy.organization}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>👤</span>
                            <span>{policy.targetAge || '연령 무관'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>📋</span>
                            <span className="truncate max-w-[200px]">{policy.incomeCondition || '제한 없음'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action Box */}
                      <div className="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex-shrink-0">
                        <button
                          aria-label="북마크 저장"
                          onClick={(e) => handleBookmarkToggle(policy.id, e)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer border ${isBookmarked
                            ? 'bg-amber-50 text-amber-500 border-amber-200'
                            : 'bg-slate-50 text-slate-400 hover:text-amber-500 border-slate-200'
                            }`}
                          type="button"
                        >
                          <span className="text-lg">{isBookmarked ? '★' : '☆'}</span>
                        </button>

                        <button
                          onClick={() => onNavigate?.('detail', policy.id)}
                          className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                        >
                          <span>상세보기</span>
                          <span>→</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Server-side Pagination Component */}
            {totalPages > 1 && (
              <nav aria-label="페이지 네비게이션" className="pt-8 pb-4 flex flex-wrap items-center justify-center gap-1.5 select-none">
                {/* First Page */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || loading}
                  className="px-2.5 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shadow-xs transition-colors cursor-pointer text-xs font-bold"
                  type="button"
                  title="첫 페이지로"
                >
                  ⏮
                </button>

                {/* Prev Page */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="px-3 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shadow-xs transition-colors cursor-pointer text-xs font-bold"
                  type="button"
                  title="이전 페이지"
                >
                  ◀ 이전
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .map((page, idx, arr) => (
                    <React.Fragment key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className="px-2 text-slate-400 font-bold">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        disabled={loading}
                        className={`min-w-[36px] h-9 px-3 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${currentPage === page
                          ? 'bg-sky-600 text-white shadow-sky-300 ring-2 ring-sky-300'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        type="button"
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}

                {/* Next Page */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="px-3 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shadow-xs transition-colors cursor-pointer text-xs font-bold"
                  type="button"
                  title="다음 페이지"
                >
                  다음 ▶
                </button>

                {/* Last Page */}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages || loading}
                  className="px-2.5 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shadow-xs transition-colors cursor-pointer text-xs font-bold"
                  type="button"
                  title="마지막 페이지로"
                >
                  ⏭
                </button>
              </nav>
            )}
          </section>

          {/* Interactive Guide Banner */}
          <section className="mb-space-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md relative overflow-hidden">
            <div className="space-y-1.5 relative z-10">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">
                청년나침반 AI 알림 서비스
              </span>
              <h4 className="text-xl md:text-2xl font-bold tracking-tight">
                나에게 맞는 청년지원사업을 텔레그램 / 이메일로 받아보세요!
              </h4>
              <p className="text-xs md:text-sm text-sky-100 leading-relaxed">
                자신이 선택한 정책만 쏙쏙! 뽑아 푸시 알림해 드립니다.
              </p>
            </div>
            <button
              onClick={() => onNavigate?.('profile')}
              className="relative z-10 px-6 py-3 rounded-xl bg-white text-sky-700 hover:bg-sky-50 font-bold text-xs shadow-md transition-all whitespace-nowrap cursor-pointer"
              type="button"
            >
              맞춤 정책 알림 신청하기 🔔
            </button>
          </section>
        </div>
      </div>
    </main>
  );
};

export default ExploreView;
