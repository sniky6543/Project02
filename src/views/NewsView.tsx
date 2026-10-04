import React, { useState, useEffect, useCallback } from 'react';
import { getPaginatedPolicyNews } from '../api/supabasePolicies';
import { PolicyNewsItem } from '../types/policy';

interface NewsViewProps {
  onNavigate?: (path: string, policyId?: string) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ onNavigate }) => {
  const [newsList, setNewsList] = useState<PolicyNewsItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'match'>('latest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  // DB에 저장된 실제 정책 뉴스 데이터 로드
  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPaginatedPolicyNews({
        page: currentPage,
        pageSize,
        keyword: activeSearch.trim() || undefined,
        sortBy,
      });

      setNewsList(result.news);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to load stored news in NewsView:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, activeSearch, sortBy]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

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

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 250, behavior: 'smooth' });
  };

  // 기사 원문 링크 새 창 열기
  const handleOpenNewsUrl = (url: string) => {
    if (!url) return;
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="flex-1 w-full pt-16 sm:pt-20 pb-24 lg:pb-16 bg-[#f8fafc] max-w-[1240px] mx-auto px-3.5 sm:px-6 md:px-8">
      <div className="flex flex-col w-full space-y-6 sm:space-y-8">
        {/* 1. Header Title & Hero Section */}
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
                <span>DB 저장 정책 뉴스 실시간 탐색</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                저장된 청년 정책 뉴스 <span className="text-sky-600 underline decoration-sky-300 decoration-wavy underline-offset-4">AI 핵심 요약</span>
              </h1>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                DB에 수집·저장된 최신 정책 뉴스를 AI가 3줄로 정밀 요약하고, 관련 정책 상세 정보와 즉시 연결해 드립니다.
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
                  <span className="text-xs font-medium text-slate-500">저장된 뉴스 DB</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {totalCount.toLocaleString()}
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
                placeholder="청년 월세, 주거비, 취업 지원, 자산형성, 인턴십 관련 뉴스 검색"
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
                  setCurrentPage(1);
                }}
                className="flex-1 md:flex-none px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                type="button"
              >
                초기화
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
            {['월세', '주거지원', '청년도약계좌', '취업', '인턴', '장학금', '자립수당'].map((tag) => (
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
            <span className="text-base font-bold text-slate-900">저장된 뉴스 목록</span>
            <span className="text-xl font-extrabold text-sky-600">{totalCount.toLocaleString()}</span>
            <span className="text-sm font-bold text-slate-800">건 (페이지 {currentPage} / {totalPages})</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="appearance-none pl-3 pr-8 py-1.5 bg-white text-slate-700 font-medium text-xs rounded-xl border border-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
              >
                <option value="latest">최신발행순 ▼</option>
                <option value="popular">주요보도순</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. News Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-4">
                <div className="flex justify-between">
                  <div className="w-20 h-5 bg-slate-200 rounded"></div>
                  <div className="w-24 h-4 bg-slate-200 rounded"></div>
                </div>
                <div className="w-3/4 h-6 bg-slate-200 rounded"></div>
                <div className="w-full h-24 bg-slate-100 rounded-xl"></div>
                <div className="flex gap-2">
                  <div className="w-16 h-5 bg-slate-200 rounded"></div>
                  <div className="w-16 h-5 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : newsList.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 text-slate-500 space-y-2">
            <p className="text-2xl">📋</p>
            <p className="text-base font-semibold">검색 조건에 맞는 저장된 뉴스가 없습니다.</p>
            <p className="text-xs text-slate-400">다른 키워드로 검색하거나 필터를 초기화해 보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {newsList.map((item, idx) => {
              const rawLines = item.summary3Lines ? item.summary3Lines.split('\n').filter(Boolean) : [];
              const kws = Array.isArray(item.keywords) ? item.keywords : [];

              return (
                <article
                  key={item.id || idx}
                  className="bg-white rounded-2xl p-5 border border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-md hover:shadow-sky-100/60 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* 언론사 & 발행일자 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold border bg-sky-50 text-sky-700 border-sky-200">
                          {item.publisher || '언론사'}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {item.publishedAt}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[130px]" title={item.policyName}>
                        📌 {item.policyName}
                      </span>
                    </div>

                    {/* 기사 제목 (클릭 시 원본 기사 새 창 이동) */}
                    <h3
                      onClick={() => handleOpenNewsUrl(item.url)}
                      className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors cursor-pointer line-clamp-2 leading-snug flex items-start justify-between gap-1"
                      title="클릭하여 언론사 원문 기사 보기 (새 창)"
                    >
                      <span>{item.title}</span>
                      <span className="text-slate-400 group-hover:text-sky-600 text-sm shrink-0">↗</span>
                    </h3>

                    {/* AI 3줄 요약 박스 */}
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-xs text-slate-700 space-y-2 leading-relaxed">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                        <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                          <span className="text-teal-600">✨ AI 3줄 핵심 요약</span>
                        </span>
                        <span className="text-[10px] text-slate-400">OpenRouter AI</span>
                      </div>
                      <div className="space-y-1.5">
                        {rawLines.length > 0 ? (
                          rawLines.map((line, lIdx) => {
                            const cleanLine = line.replace(/^\[\d+\]\s*/, '').replace(/^\d+\.\s*/, '');
                            const label = lIdx === 0 ? '정책 동향' : lIdx === 1 ? '핵심 혜택' : '신청·유의';
                            const labelColor =
                              lIdx === 0
                                ? 'bg-sky-100 text-sky-800'
                                : lIdx === 1
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-rose-100 text-rose-800';
                            return (
                              <div key={lIdx} className="flex items-start gap-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 mt-0.5 ${labelColor}`}>
                                  {label}
                                </span>
                                <span className="text-slate-700 leading-snug">
                                  {cleanLine.replace(/^\[(정책 동향|핵심 혜택|신청·유의|보도 개요|주요 혜택|신청 절차|현장 반응|선발 조건|유의 사항|접수 팁|필수 서류|결과 확인)\]\s*/, '')}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-slate-500">핵심 정책 동향 및 신청 자격 혜택 요약이 포함되어 있습니다.</p>
                        )}
                      </div>
                    </div>

                    {/* 키워드 태그 (5개 이상) */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {kws.slice(0, 5).map((kw, kIdx) => (
                        <button
                          key={kIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTagClick(kw);
                          }}
                          className="px-2 py-0.5 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-medium border border-sky-100/80 transition-colors cursor-pointer"
                          type="button"
                          title={`#${kw} 키워드로 검색`}
                        >
                          #{kw}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 하단 액션 버튼 (원본보기 & 관련 정책 상세) */}
                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenNewsUrl(item.url)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      type="button"
                      title="언론사 원본 기사 새 창 열기"
                    >
                      <span>원본보기</span>
                      <span>↗</span>
                    </button>

                    {item.policyId && (
                      <button
                        onClick={() => onNavigate?.('detail', item.policyId)}
                        className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                        type="button"
                        title="관련 정책 상세 정보 보기"
                      >
                        <span>관련 정책 보기</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* 5. Pagination */}
        {totalPages > 1 && (
          <nav aria-label="페이지 네비게이션" className="flex items-center justify-center gap-1.5 pt-4">
            <button
              disabled={currentPage === 1 || loading}
              onClick={() => handlePageChange(currentPage - 1)}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-sky-50 shadow-xs transition-colors disabled:opacity-40 cursor-pointer text-xs font-bold"
              type="button"
              title="이전 페이지"
            >
              ◀
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-slate-400 text-xs">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(p)}
                    disabled={loading}
                    className={`min-w-[36px] h-9 px-3 rounded-xl font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer ${
                      currentPage === p
                        ? 'bg-sky-600 text-white shadow-sky-200 ring-2 ring-sky-300'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-sky-50'
                    }`}
                    type="button"
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
            <button
              disabled={currentPage === totalPages || loading}
              onClick={() => handlePageChange(currentPage + 1)}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-sky-50 shadow-xs transition-colors disabled:opacity-40 cursor-pointer text-xs font-bold"
              type="button"
              title="다음 페이지"
            >
              ▶
            </button>
          </nav>
        )}

        {/* 6. Bottom Notification Banner */}
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
                매일 오전 10시와 저녁 7시 자동으로 수집되는 최신 정책 뉴스를 실시간으로 확인해보세요.
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
