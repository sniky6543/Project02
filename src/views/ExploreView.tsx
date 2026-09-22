import React, { useState, useEffect } from 'react';

interface ExploreViewProps {
  onNavigate?: (path: string) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({ onNavigate }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  useEffect(() => {
    const handleDataPath = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-path]');
      if (target) {
        const path = target.getAttribute('data-path');
        if (path && onNavigate) {
          e.preventDefault();
          onNavigate(path);
        }
      }
    };
    document.addEventListener('click', handleDataPath);
    return () => document.removeEventListener('click', handleDataPath);
  }, [onNavigate]);

  return (
    <main className="w-full pt-16 bg-surface min-h-[calc(100vh-16rem)] mt-5">
      <div className="flex flex-col w-full">
        {/* Subtle Ambient Glow Orbs */}
        <div className="relative w-full max-w-[1200px] mx-auto">
          <div className="absolute top-10 left-1/4 -z-10 w-96 h-96 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-32 right-10 -z-10 w-80 h-80 bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none"></div>

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
                  <span>2025 맞춤 정책 실시간 탐색 완료</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  나에게 꼭 맞는 청년 정책 탐색 <span className="text-sky-600 underline decoration-sky-300 decoration-wavy underline-offset-4">4건</span>
                </h1>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed whitespace-nowrap">
                  소득 수준, 취업 상태 및 거주 지역 기준 자동 필터링 결과, 나에게 가장 유리한 청년 정책을 추천해 드립니다.
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
                    <span className="text-xs font-medium text-slate-500">실시간 매칭 완료</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-medium text-slate-500 mr-1">맞춤 정책</span>
                    <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">42</span>
                    <span className="text-sm font-bold text-sky-600">건</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar with Accordion Filter Toggle */}
          <div className="bg-white p-2.5 rounded-2xl border border-sky-200/70 shadow-sm flex flex-col md:flex-row items-center gap-2 mb-space-md">
            <div className="flex-1 flex items-center w-full px-3.5 py-2 gap-2.5">
              <span className="material-symbols-outlined text-sky-600 text-[24px]">search</span>
              <input className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none" placeholder="키워드나 정책명을 입력하세요 (예: 청년월세, 구직활동지원금, 전세보증금, 디딤돌대출)" type="text" defaultValue="청년 주거 및 취업지원" />
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
                <span className="material-symbols-outlined text-[18px]">tune</span>
                <span>{isFilterOpen ? '상세 필터 닫기' : '상세 필터 열기'}</span>
                <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
              <button className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors cursor-pointer" id="resetFilterBtn" type="button">
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                <span>필터 초기화</span>
              </button>
              <button className="flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer w-full md:w-auto" type="button">
                <span className="material-symbols-outlined text-[18px]">manage_search</span>
                <span>검색</span>
              </button>
            </div>
          </div>

          {/* Multi-dimensional Custom Filter Console (Accordion Format) */}
          <section className="bg-white rounded-2xl shadow-sm mb-space-xl overflow-hidden border border-sky-100 transition-all duration-300">
            {/* Accordion Header */}
            <div
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-between px-6 py-3.5 bg-gradient-to-r from-sky-50/70 to-indigo-50/40 border-b border-sky-100 cursor-pointer select-none hover:bg-sky-50/90 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-600 text-[20px]">filter_alt</span>
                <span className="font-bold text-slate-900 text-sm">맞춤 상세 조건 필터</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[11px] font-bold">8개 항목</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700">
                <span>{isFilterOpen ? '필터 접기' : '필터 펼치기'}</span>
                <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </div>
            </div>

            {/* Accordion Content */}
            {isFilterOpen && (
              <div>
                <div className="px-6 md:px-8 py-2 space-y-1.5 text-sm text-slate-600">
                  {/* 1. Category */}
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-3 pb-1.5 border-b border-dashed border-sky-100">
                    <label className="w-24 font-bold text-slate-900 text-sm flex-shrink-0 pt-1 md:pt-0">카테고리</label>
                    <div className="flex flex-wrap gap-2 flex-1">
                      <button className="border border-sky-600 bg-sky-600 text-white rounded-full px-4 py-1 text-xs font-semibold shadow-xs transition-colors cursor-pointer" type="button">전체 (18)</button>
                      <button className="border border-amber-200 rounded-full px-4 py-1 text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 font-medium transition-colors cursor-pointer" type="button">일자리 (6)</button>
                      <button className="border border-rose-200 rounded-full px-4 py-1 text-xs text-rose-800 bg-rose-50 hover:bg-rose-100 font-medium transition-colors cursor-pointer" type="button">주거 (5)</button>
                      <button className="border border-emerald-200 rounded-full px-4 py-1 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-medium transition-colors cursor-pointer" type="button">교육·직업훈련 (3)</button>
                      <button className="border border-purple-200 rounded-full px-4 py-1 text-xs text-purple-800 bg-purple-50 hover:bg-purple-100 font-medium transition-colors cursor-pointer" type="button">금융·복지·문화 (4)</button>
                      <button className="border border-sky-200 rounded-full px-4 py-1 text-xs text-sky-800 bg-sky-50 hover:bg-sky-100 font-medium transition-colors cursor-pointer" type="button">참여·기반</button>
                    </div>
                  </div>

                  {/* 2. Region & Marital */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-1.5 border-b border-dashed border-sky-100 items-center">
                    <div className="flex items-center gap-3">
                      <label className="w-24 font-bold text-slate-900 text-sm flex-shrink-0">지역</label>
                      <div className="flex items-center gap-2 flex-1 max-w-sm">
                        <div className="relative flex-1">
                          <select className="w-full appearance-none bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-1.5 pr-9 text-xs text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer">
                            <option>선택하세요.</option>
                            <option>서울특별시</option>
                            <option>경기도</option>
                            <option>인천광역시</option>
                            <option>부산광역시</option>
                            <option>대구광역시</option>
                            <option>대전광역시</option>
                            <option>광주광역시</option>
                          </select>
                          <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">expand_more</span>
                        </div>
                        <button className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors flex-shrink-0 cursor-pointer" type="button">선택</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="w-24 font-bold text-slate-900 text-sm flex-shrink-0">혼인여부</label>
                      <div className="relative flex-1 max-w-xs">
                        <select className="w-full appearance-none bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-1.5 pr-9 text-xs text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer">
                          <option>선택하세요.</option>
                          <option>미혼</option>
                          <option>기혼</option>
                          <option>기타</option>
                        </select>
                        <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">expand_more</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Age & Income */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-1.5 border-b border-dashed border-sky-100 items-center">
                    <div className="flex items-center gap-3">
                      <label className="w-24 font-bold text-slate-900 text-sm flex-shrink-0">연령</label>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-600">만</span>
                        <input className="w-24 bg-slate-50/60 border border-slate-200 rounded-xl px-2.5 py-1 text-center text-xs focus:outline-none focus:border-sky-500" placeholder="29" type="number" />
                        <span className="text-slate-600">세</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 flex-shrink-0">
                        <span className="block font-bold text-slate-900 text-sm leading-tight">연소득</span>
                        <span className="block font-medium text-slate-400 text-xs leading-tight">(만원)</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <input className="w-20 bg-slate-50/60 border border-slate-200 rounded-xl px-2 py-1 text-center text-xs focus:outline-none focus:border-sky-500" placeholder="0" type="number" />
                        <span className="text-slate-500">만원 이상 ~</span>
                        <input className="w-20 bg-slate-50/60 border border-slate-200 rounded-xl px-2 py-1 text-center text-xs focus:outline-none focus:border-sky-500" placeholder="3,600" type="number" />
                        <span className="text-slate-500">만원 이하</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Education */}
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-3 pb-1.5 border-b border-dashed border-sky-100">
                    <label className="w-24 font-bold text-slate-900 text-sm flex-shrink-0 pt-1 md:pt-0">학력</label>
                    <div className="flex flex-wrap gap-2 flex-1">
                      <button className="border border-slate-200 rounded-full px-3.5 py-1 text-xs text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">제한없음</button>
                      <button className="border border-slate-200 rounded-full px-3.5 py-1 text-xs text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">고졸 미만</button>
                      <button className="border border-slate-200 rounded-full px-3.5 py-1 text-xs text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">고교 재학</button>
                      <button className="border border-slate-200 rounded-full px-3.5 py-1 text-xs text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">고교 졸업</button>
                      <button className="border border-slate-200 rounded-full px-3.5 py-1 text-xs text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">대학 재학</button>
                      <button className="border border-sky-600 bg-sky-50 text-sky-700 font-semibold rounded-full px-3.5 py-1 text-xs transition-colors cursor-pointer" type="button">대학 졸업</button>
                      <button className="border border-slate-200 rounded-full px-3.5 py-1 text-xs text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">석·박사</button>
                      <button className="border border-slate-200 rounded-full px-3.5 py-1 text-xs text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">기타</button>
                    </div>
                  </div>

                  {/* 5. Employment Status */}
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-3 pb-1.5 border-b border-dashed border-sky-100">
                    <label className="w-24 font-bold text-slate-900 text-sm flex-shrink-0 pt-1 md:pt-0">취업상태</label>
                    <div className="flex flex-wrap gap-2 flex-1">
                      <button className="border border-slate-200 rounded-full px-3.5 py-1 text-xs text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">제한없음</button>
                      <button className="border border-slate-200 rounded-full px-3.5 py-1 text-xs text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">재직자</button>
                      <button className="border border-sky-600 bg-sky-50 text-sky-700 font-semibold rounded-full px-3.5 py-1 text-xs transition-colors cursor-pointer" type="button">미취업자</button>
                      <button className="border border-slate-200 rounded-full px-3.5 py-1 text-xs text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">프리랜서</button>
                      <button className="border border-slate-200 rounded-full px-3.5 py-1 text-xs text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">(예비)창업자</button>
                      <button className="border border-slate-200 rounded-full px-3.5 py-1 text-xs text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">단기근로자</button>
                      <button className="border border-slate-200 rounded-full px-3.5 py-1 text-xs text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">기타</button>
                    </div>
                  </div>

                  {/* 6. Special Criteria */}
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                    <label className="w-24 font-bold text-slate-900 text-sm flex-shrink-0 pt-1 md:pt-0">특화분야</label>
                    <div className="flex flex-wrap gap-2 flex-1">
                      <button className="border border-slate-200 rounded-full px-3.5 py-1 text-xs text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">제한없음</button>
                      <button className="border border-slate-200 rounded-full px-3.5 py-1 text-xs text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">중소기업</button>
                      <button className="border border-slate-200 rounded-full px-3.5 py-1 text-xs text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">청년 1인가구</button>
                      <button className="border border-slate-200 rounded-full px-3.5 py-1 text-xs text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">기초생활수급자</button>
                      <button className="border border-slate-200 rounded-full px-3.5 py-1 text-xs text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">자립준비청년</button>
                      <button className="border border-slate-200 rounded-full px-3.5 py-1 text-xs text-slate-600 bg-white hover:border-sky-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">기타</button>
                    </div>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="bg-sky-50/50 px-6 py-2 border-t border-sky-100 flex items-center justify-center gap-3">
                  <button className="bg-sky-600 hover:bg-sky-700 text-white px-7 py-2 rounded-full font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer" type="button">
                    <span>내 정보 자동입력</span>
                    <span className="material-symbols-outlined text-[18px]">person</span>
                  </button>
                  <button className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-6 py-2 rounded-full font-medium text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer" type="button">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">refresh</span>
                    <span>초기화</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Policy Cards Grid Section */}
          <section className="space-y-space-md pb-space-xl">
            {/* Controls & Sorting Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-xs">
              <div className="flex items-baseline gap-2">
                <span className="font-headline-sm text-headline-sm text-on-surface">검색 결과 정책</span>
                <span className="font-headline-md text-headline-md text-primary font-extrabold">42</span>
                <span className="font-body-md text-body-md text-on-surface-variant">건</span>
              </div>
              <div className="flex items-center gap-space-xs">
                {/* Sort Options */}
                <div className="bg-surface-container-lowest rounded-xl p-1 flex items-center shadow-xs">
                  <button className="px-space-md py-1.5 rounded-lg bg-surface-container-high text-primary font-label-md text-label-md font-bold" type="button">내 매칭률순 ▼</button>
                  <button className="px-space-md py-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant font-label-md text-label-md transition-colors" type="button">마감임박순</button>
                  <button className="px-space-md py-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant font-label-md text-label-md transition-colors" type="button">최신등록순</button>
                  <button className="px-space-md py-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant font-label-md text-label-md transition-colors" type="button">인기조회순</button>
                </div>
              </div>
            </div>

            {/* Policy Cards Grid (Bento-style Rows) */}
            <div className="flex flex-col gap-space-sm">
              {/* Policy Row 1 */}
              <article className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md hover:border-primary/40 border border-transparent transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-space-md group">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary text-[12px] font-bold">주거 🏠</span>
                    <span className="px-2 py-0.5 rounded-full bg-error text-[12px] font-bold animate-pulse">D-3 마감</span>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-low text-primary text-[12px] font-bold">
                      <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                      <span>적합도 98%</span>
                    </div>
                  </div>
                  <h3 onClick={() => onNavigate?.('detail')} data-path="detail" className="text-[20px] font-bold text-on-surface group-hover:text-primary transition-colors tracking-tight cursor-pointer mb-1">
                    2025 서울 청년월세 특별지원 2차
                  </h3>
                  <div className="mb-2">
                    <span className="inline-flex items-center text-primary font-bold text-[14px]">
                      <span className="text-outline mr-1.5 font-normal text-[14px]">핵심 혜택</span>
                      월 20만원 지원 <span className="text-on-surface-variant font-normal text-[14px] ml-1">(최대 12개월 240만원)</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-on-surface-variant">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                      <span>서울시 거주 (보증금 5천만 이하)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">badge</span>
                      <span>만 19세 ~ 39세 무주택 청년</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">account_balance_wallet</span>
                      <span>기준중위소득 150% 이하</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between lg:justify-end gap-space-md pt-space-xs lg:pt-0 border-t lg:border-t-0 border-surface-container-high/40 flex-shrink-0">
                  <div className="flex flex-col text-left lg:text-right">
                    <span className="font-label-sm text-outline">주관 기관</span>
                    <span className="font-label-md text-on-surface font-semibold">서울시 주택정책실</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button aria-label="스크랩 저장" className="bookmark-btn w-9 h-9 rounded-xl hover:bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-colors cursor-pointer" type="button">
                      <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1", color: '#0ea5e9' }}>star</span>
                    </button>
                    <a onClick={(e) => { e.preventDefault(); onNavigate?.('detail'); }} data-path="detail" className="px-space-md py-2 rounded-xl bg-surface-container hover:bg-primary hover:text-on-primary text-primary font-label-md text-label-md transition-all flex items-center gap-1 font-bold whitespace-nowrap cursor-pointer" href="#">
                      <span>상세보기</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </article>

              {/* Policy Row 2 */}
              <article className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md hover:border-primary/40 border border-transparent transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-space-md group">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[12px] font-bold">일자리 💼</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[12px] font-bold">접수중 D-12</span>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-low text-primary text-[12px] font-bold">
                      <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                      <span>적합도 95%</span>
                    </div>
                  </div>
                  <h3 onClick={() => onNavigate?.('detail')} data-path="detail" className="text-[20px] font-bold text-on-surface group-hover:text-primary transition-colors tracking-tight cursor-pointer mb-1">
                    2025 국민취업지원제도 1유형
                  </h3>
                  <div className="mb-2">
                    <span className="inline-flex items-center text-primary font-bold text-[14px]">
                      <span className="text-outline mr-1.5 font-normal text-[14px]">핵심 혜택</span>
                      구직수당 월 50만×6개월 <span className="text-on-surface-variant font-normal text-[14px] ml-1">(취업성공수당 최대 150만원)</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-on-surface-variant">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                      <span>전국 거주 청년 대상</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">badge</span>
                      <span>만 15세 ~ 34세 구직의사 청년</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">work_outline</span>
                      <span>미취업 청년 및 졸업예정자</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between lg:justify-end gap-space-md pt-space-xs lg:pt-0 border-t lg:border-t-0 border-surface-container-high/40 flex-shrink-0">
                  <div className="flex flex-col text-left lg:text-right">
                    <span className="font-label-sm text-outline">주관 기관</span>
                    <span className="font-label-md text-on-surface font-semibold">고용노동부 고용복지플러스</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button aria-label="스크랩 저장" className="bookmark-btn w-9 h-9 rounded-xl hover:bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-colors cursor-pointer" type="button">
                      <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1", color: '#0ea5e9' }}>star</span>
                    </button>
                    <a onClick={(e) => { e.preventDefault(); onNavigate?.('detail'); }} data-path="detail" className="px-space-md py-2 rounded-xl bg-surface-container hover:bg-primary hover:text-on-primary text-primary font-label-md text-label-md transition-all flex items-center gap-1 font-bold whitespace-nowrap cursor-pointer" href="#">
                      <span>상세보기</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </article>

              {/* Policy Row 3 */}
              <article className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md hover:border-primary/40 border border-transparent transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-space-md group">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary text-[12px] font-bold">금융·복지·문화 💰</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#00875a] text-white text-[12px] font-bold">상시모집</span>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-low text-primary text-[12px] font-bold">
                      <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                      <span>적합도 92%</span>
                    </div>
                  </div>
                  <h3 onClick={() => onNavigate?.('detail')} data-path="detail" className="text-[20px] font-bold text-on-surface group-hover:text-primary transition-colors tracking-tight cursor-pointer mb-1">
                    청년 주택드림 청약통장
                  </h3>
                  <div className="mb-2">
                    <span className="inline-flex items-center text-primary font-bold text-[14px]">
                      <span className="text-outline mr-1.5 font-normal text-[14px]">핵심 혜택</span>
                      최고 연 4.5% 우대이율 <span className="text-on-surface-variant font-normal text-[14px] ml-1">(당첨 시 2%대 주담대 연계)</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-on-surface-variant">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                      <span>전국 9개 수탁은행 영업점/앱</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">badge</span>
                      <span>만 19세 ~ 만 34세 무주택 청년</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">savings</span>
                      <span>직전 연소득 5,000만원 이하</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between lg:justify-end gap-space-md pt-space-xs lg:pt-0 border-t lg:border-t-0 border-surface-container-high/40 flex-shrink-0">
                  <div className="flex flex-col text-left lg:text-right">
                    <span className="font-label-sm text-outline">주관 기관</span>
                    <span className="font-label-md text-on-surface font-semibold">국토교통부 주택기금</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button aria-label="스크랩 저장" className="bookmark-btn w-9 h-9 rounded-xl hover:bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-colors cursor-pointer" type="button">
                      <span className="material-symbols-outlined text-[22px]">star</span>
                    </button>
                    <a onClick={(e) => { e.preventDefault(); onNavigate?.('detail'); }} data-path="detail" className="px-space-md py-2 rounded-xl bg-surface-container hover:bg-primary hover:text-on-primary text-primary font-label-md text-label-md transition-all flex items-center gap-1 font-bold whitespace-nowrap cursor-pointer" href="#">
                      <span>상세보기</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </article>

              {/* Policy Row 4 */}
              <article className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md hover:border-primary/40 border border-transparent transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-space-md group">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-primary-container text-[12px] font-bold">교육·직업훈련 🎓</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[12px] font-bold">D-18</span>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-low text-primary text-[12px] font-bold">
                      <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                      <span>적합도 90%</span>
                    </div>
                  </div>
                  <h3 onClick={() => onNavigate?.('detail')} data-path="detail" className="text-[20px] font-bold text-on-surface group-hover:text-primary transition-colors tracking-tight cursor-pointer mb-1">
                    K-디지털 트레이닝 실무형 생성형 AI 청년 개발자 양성과정
                  </h3>
                  <div className="mb-2">
                    <span className="inline-flex items-center text-primary font-bold text-[14px]">
                      <span className="text-outline mr-1.5 font-normal text-[14px]">핵심 혜택</span>
                      교육비 100% 국비 지원 <span className="text-on-surface-variant font-normal text-[14px] ml-1">(훈련장려금 월 31.6만원)</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-on-surface-variant">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                      <span>서울 성수 캠퍼스 및 온라인 병행</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">badge</span>
                      <span>만 19세 ~ 34세 구직자 및 졸업예정자</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">school</span>
                      <span>내일배움카드 발급가능자 (전공 무관)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between lg:justify-end gap-space-md pt-space-xs lg:pt-0 border-t lg:border-t-0 border-surface-container-high/40 flex-shrink-0">
                  <div className="flex flex-col text-left lg:text-right">
                    <span className="font-label-sm text-outline">주관 기관</span>
                    <span className="font-label-md text-on-surface font-semibold">고용노동부 직업능력심사평가원</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button aria-label="스크랩 저장" className="bookmark-btn w-9 h-9 rounded-xl hover:bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-colors cursor-pointer" type="button">
                      <span className="material-symbols-outlined text-[22px]">star</span>
                    </button>
                    <a onClick={(e) => { e.preventDefault(); onNavigate?.('detail'); }} data-path="detail" className="px-space-md py-2 rounded-xl bg-surface-container hover:bg-primary hover:text-on-primary text-primary font-label-md text-label-md transition-all flex items-center gap-1 font-bold whitespace-nowrap cursor-pointer" href="#">
                      <span>상세보기</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </article>

              {/* Policy Row 5 */}
              <article className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md hover:border-primary/40 border border-transparent transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-space-md group">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[12px] font-bold">일자리 💼</span>
                    <span className="px-2 py-0.5 rounded-full bg-error text-[12px] font-bold">D-5</span>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-low text-primary text-[12px] font-bold">
                      <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                      <span>적합도 88%</span>
                    </div>
                  </div>
                  <h3 onClick={() => onNavigate?.('detail')} data-path="detail" className="text-[20px] font-bold text-on-surface group-hover:text-primary transition-colors tracking-tight cursor-pointer mb-1">
                    청년 자격증 응시료 실비 지원사업
                  </h3>
                  <div className="mb-2">
                    <span className="inline-flex items-center text-primary font-bold text-[14px]">
                      <span className="text-outline mr-1.5 font-normal text-[14px]">핵심 혜택</span>
                      연 최대 10만원 실비 지원 <span className="text-on-surface-variant font-normal text-[14px] ml-1">(어학/한국사/국가공인)</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-on-surface-variant">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                      <span>서울시 25개 자치구 거주</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">badge</span>
                      <span>만 19세 ~ 34세 미취업 청년</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">verified</span>
                      <span>신청일 기준 취업 전 시험 응시자</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between lg:justify-end gap-space-md pt-space-xs lg:pt-0 border-t lg:border-t-0 border-surface-container-high/40 flex-shrink-0">
                  <div className="flex flex-col text-left lg:text-right">
                    <span className="font-label-sm text-outline">주관 기관</span>
                    <span className="font-label-md text-on-surface font-semibold">청년몽땅정보통 지원단</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button aria-label="스크랩 저장" className="bookmark-btn w-9 h-9 rounded-xl hover:bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-colors cursor-pointer" type="button">
                      <span className="material-symbols-outlined text-[22px]">star</span>
                    </button>
                    <a onClick={(e) => { e.preventDefault(); onNavigate?.('detail'); }} data-path="detail" className="px-space-md py-2 rounded-xl bg-surface-container hover:bg-primary hover:text-on-primary text-primary font-label-md text-label-md transition-all flex items-center gap-1 font-bold whitespace-nowrap cursor-pointer" href="#">
                      <span>상세보기</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </article>

              {/* Policy Row 6 */}
              <article className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md hover:border-primary/40 border border-transparent transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-space-md group">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[12px] font-bold">참여·기반 🤝</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[12px] font-bold">D-25</span>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-low text-primary text-[12px] font-bold">
                      <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                      <span>적합도 85%</span>
                    </div>
                  </div>
                  <h3 onClick={() => onNavigate?.('detail')} data-path="detail" className="text-[20px] font-bold text-on-surface group-hover:text-primary transition-colors tracking-tight cursor-pointer mb-1">
                    2025 청년도전지원사업 (중장기 이수 프로그램)
                  </h3>
                  <div className="mb-2">
                    <span className="inline-flex items-center text-primary font-bold text-[14px]">
                      <span className="text-outline mr-1.5 font-normal text-[14px]">핵심 혜택</span>
                      최대 300만원 지급 <span className="text-on-surface-variant font-normal text-[14px] ml-1">(참여수당+이수인센티브)</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-on-surface-variant">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                      <span>전국 운영기관 (청년재단 및 지자체)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">badge</span>
                      <span>만 18세 ~ 34세 구직단념청년</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">psychology</span>
                      <span>자립준비청년, 청소년쉼터 입퇴소 청년 우대</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between lg:justify-end gap-space-md pt-space-xs lg:pt-0 border-t lg:border-t-0 border-surface-container-high/40 flex-shrink-0">
                  <div className="flex flex-col text-left lg:text-right">
                    <span className="font-label-sm text-outline">주관 기관</span>
                    <span className="font-label-md text-on-surface font-semibold">고용노동부 청년정책관</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button aria-label="스크랩 저장" className="bookmark-btn w-9 h-9 rounded-xl hover:bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-colors cursor-pointer" type="button">
                      <span className="material-symbols-outlined text-[22px]">star</span>
                    </button>
                    <a onClick={(e) => { e.preventDefault(); onNavigate?.('detail'); }} data-path="detail" className="px-space-md py-2 rounded-xl bg-surface-container hover:bg-primary hover:text-on-primary text-primary font-label-md text-label-md transition-all flex items-center gap-1 font-bold whitespace-nowrap cursor-pointer" href="#">
                      <span>상세보기</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </article>

              {/* Policy Row 7 */}
              <article className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md hover:border-primary/40 border border-transparent transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-space-md group">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary text-[12px] font-bold">금융·복지·문화 💰</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#00875a] text-white text-[12px] font-bold">상시모집</span>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-low text-primary text-[12px] font-bold">
                      <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                      <span>적합도 82%</span>
                    </div>
                  </div>
                  <h3 onClick={() => onNavigate?.('detail')} data-path="detail" className="text-[20px] font-bold text-on-surface group-hover:text-primary transition-colors tracking-tight cursor-pointer mb-1">
                    청년 마음건강 지원사업 (심리상담 바우처)
                  </h3>
                  <div className="mb-2">
                    <span className="inline-flex items-center text-primary font-bold text-[14px]">
                      <span className="text-outline mr-1.5 font-normal text-[14px]">핵심 혜택</span>
                      전문 심리상담료 90% 지원 <span className="text-on-surface-variant font-normal text-[14px] ml-1">(3개월간 회당 6~7만원 지원)</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-on-surface-variant">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                      <span>전국 주민센터 방문 또는 복지로 온라인</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">badge</span>
                      <span>만 19세 ~ 34세 청년 (소득기준 없음)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">favorite</span>
                      <span>심리·정서적 지원이 필요한 청년</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between lg:justify-end gap-space-md pt-space-xs lg:pt-0 border-t lg:border-t-0 border-surface-container-high/40 flex-shrink-0">
                  <div className="flex flex-col text-left lg:text-right">
                    <span className="font-label-sm text-outline">주관 기관</span>
                    <span className="font-label-md text-on-surface font-semibold">보건복지부 인구정책총괄과</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button aria-label="스크랩 저장" className="bookmark-btn w-9 h-9 rounded-xl hover:bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-colors cursor-pointer" type="button">
                      <span className="material-symbols-outlined text-[22px]">star</span>
                    </button>
                    <a onClick={(e) => { e.preventDefault(); onNavigate?.('detail'); }} data-path="detail" className="px-space-md py-2 rounded-xl bg-surface-container hover:bg-primary hover:text-on-primary text-primary font-label-md text-label-md transition-all flex items-center gap-1 font-bold whitespace-nowrap cursor-pointer" href="#">
                      <span>상세보기</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </article>
            </div>

            {/* Pagination Component */}
            <nav aria-label="페이지 네비게이션" className="pt-space-xl flex items-center justify-center gap-space-xs">
              <button className="w-10 h-10 rounded-xl bg-surface-container-lowest text-outline hover:text-primary flex items-center justify-center shadow-xs transition-colors" disabled={true} type="button">
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button className="w-10 h-10 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-sm" type="button">1</button>
              <button className="w-10 h-10 rounded-xl bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container font-label-md text-label-md transition-colors shadow-xs" type="button">2</button>
              <button className="w-10 h-10 rounded-xl bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container font-label-md text-label-md transition-colors shadow-xs" type="button">3</button>
              <button className="w-10 h-10 rounded-xl bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container font-label-md text-label-md transition-colors shadow-xs" type="button">4</button>
              <button className="w-10 h-10 rounded-xl bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container font-label-md text-label-md transition-colors shadow-xs" type="button">5</button>
              <button className="w-10 h-10 rounded-xl bg-surface-container-lowest text-outline hover:text-primary flex items-center justify-center shadow-xs transition-colors" type="button">
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </nav>
          </section>

          {/* Interactive Guide Banner */}
          <section className="mb-space-xl bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-3xl p-space-lg flex flex-col md:flex-row items-center justify-between gap-space-lg shadow-md relative overflow-hidden">
            <div className="space-y-1 relative z-10">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-on-primary/20 text-on-primary font-label-sm text-label-sm font-semibold">청년나침반 AI 알림 서비스</span>
              <h4 className="font-headline-md text-headline-md tracking-tight">새로 신설되는 청년지원사업을 카카오톡으로 가장 먼저 받아보세요!</h4>
              <p className="font-body-sm text-body-sm text-on-primary/90">내 거주지와 자격 조건이 변경될 때마다 적합도 90% 이상인 정책만 선별 발송해 드립니다.</p>
            </div>
            <button onClick={() => onNavigate?.('profile')} data-path="profile" className="relative z-10 px-space-lg py-3 rounded-xl bg-surface-container-lowest text-primary hover:bg-surface-container font-label-lg text-label-lg font-bold shadow-md transition-all whitespace-nowrap cursor-pointer" type="button">
              맞춤 정책 알림 신청하기 🔔
            </button>
          </section>
        </div>
      </div>
    </main>
  );
};

export default ExploreView;
