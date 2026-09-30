import React, { useEffect } from 'react';

interface HomeViewProps {
  onNavigate?: (path: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  
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
    <main className="flex-1 w-full pt-20 pb-16 bg-[#f8fafc] max-w-[1240px] mx-auto px-4 md:px-8"><div className="flex flex-col w-full space-y-8">
{/* Top Personalized Hero Widget (Light Pastel Sky-Mint-Cream Gradient Banner) */}
<div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-100/70 via-indigo-50/50 to-teal-50/70 p-6 md:p-8 border border-sky-200/60 shadow-sm shadow-sky-100/50">
{/* Soft ambient blurs */}
<div className="absolute -right-8 -top-10 w-72 h-72 rounded-full bg-teal-200/30 blur-3xl pointer-events-none"></div>
<div className="absolute left-1/3 -bottom-10 w-64 h-64 rounded-full bg-sky-200/40 blur-3xl pointer-events-none"></div>
<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
<div className="space-y-2.5 max-w-2xl">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-sky-200/70 shadow-xs text-sky-800 text-xs font-semibold backdrop-blur-md">
<span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span></span>
<span className="">2025 청년 자립 특별 플랜 분석 완료</span>
</div>
<h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            김민우님을 위한 맞춤 정책 <span className="text-sky-600 underline decoration-sky-300 decoration-wavy underline-offset-4">18건</span>이 준비되었습니다
          </h1>
<p className="text-slate-600 text-sm md:text-base leading-relaxed">
            소득 수준 및 무주택 단독 세대주 기준 자동 산출 결과, 올 한 해 최대 혜택을 설계해 드립니다.
          </p>
</div>
{/* Graphic & Metric Badge Card */}
<div className="flex items-center gap-4 bg-white/90 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-sky-100 shadow-md shadow-sky-100/60 shrink-0 self-start md:self-auto">
{/* Colorful 3D-Style Illustration Graphic: Piggy Bank / Coin Wallet */}
<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 border border-amber-200 flex items-center justify-center shadow-inner shrink-0">
<svg className="w-8 h-8 text-amber-500 drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
<rect fill="#FEF3C7" height="12" rx="3" stroke="#F59E0B" width="20" x="2" y="6"></rect>
<circle cx="16" cy="12" fill="#FBBF24" r="2.5" stroke="#D97706"></circle>
<path d="M6 10h3M6 14h2" stroke="#D97706" strokeLinecap="round"></path>
</svg>
</div>
<div className="pr-1">
<div className="flex items-center gap-1.5 mb-0.5">
<span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
<span className="text-xs font-medium text-slate-500">연간 수혜 예상액</span>
</div>
<div className="flex items-baseline gap-1">
<span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">최대 360만</span>
<span className="text-sm font-bold text-sky-600">원</span>
</div>
</div>
</div>
</div>
</div>
{/* Quick Category Navigation Filters with Colorful Illustrated Badges */}
<div className="flex items-center justify-between gap-4 flex-wrap">
<div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" id="category-tabs">
{/* All Tab */}
<button onClick={() => onNavigate?.('explore')} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-sm transition-all shadow-sm bg-sky-600 text-white border border-sky-600 cursor-pointer">
<span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center text-xs">✨</span>
<span className="">전체 (18)</span>
</button>
{/* Job Tab */}
<button onClick={() => onNavigate?.('explore')} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-sm transition-all bg-white text-slate-700 hover:bg-amber-50/70 border border-slate-200/80 hover:border-amber-200 shadow-xs cursor-pointer">
<span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">💼</span>
<span className="">일자리 (6)</span>
</button>
{/* Housing Tab */}
<button onClick={() => onNavigate?.('explore')} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-sm transition-all bg-white text-slate-700 hover:bg-rose-50/70 border border-slate-200/80 hover:border-rose-200 shadow-xs cursor-pointer">
<span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs">🏡</span>
<span className="">주거 (5)</span>
</button>
{/* Education Tab */}
<button onClick={() => onNavigate?.('explore')} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-sm transition-all bg-white text-slate-700 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-200 shadow-xs cursor-pointer">
<span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">🎓</span>
<span className="">교육·직업훈련 (3)</span>
</button>
{/* Finance Tab */}
<button onClick={() => onNavigate?.('explore')} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-sm transition-all bg-white text-slate-700 hover:bg-purple-50/70 border border-slate-200/80 hover:border-purple-200 shadow-xs cursor-pointer">
<span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs">🪙</span>
<span className="">금융·복지·문화 (4)</span>
</button>
{/* Engagement Tab */}
<button onClick={() => onNavigate?.('explore')} className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-sm transition-all bg-white text-slate-700 hover:bg-sky-50 border border-slate-200/80 hover:border-sky-200 shadow-xs cursor-pointer">
<span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs">💬</span>
<span className="">참여·기반</span>
</button>
</div>
{/* Live Sort Indicator */}
<div className="flex items-center gap-2 text-slate-500 text-xs font-medium bg-white px-3 py-1.5 rounded-full border border-slate-200/70 shadow-xs">
<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
<span className="">실시간 정책 공고 데이터 동기화됨</span>
</div>
</div>
{/* Main Content Layout: 8 cols Policy Cards + 4 cols Side Widgets */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
{/* Primary Policy Grid (8 Cols) */}
<div className="lg:col-span-8 space-y-6">
<div className="flex items-center justify-between">
<div className="space-y-0.5">
<h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
<span className="">추천 핵심 정책</span>
<span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-semibold">적합도 90%+</span>
</h2>
<p className="text-xs text-slate-500">지원 적합도 90% 이상 선별된 프로그램</p>
</div>
<a onClick={(e) => { e.preventDefault(); onNavigate?.('explore'); }} data-path="explore" className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer hover:underline" href="#">전체보기 (18) <span className="material-symbols-outlined text-[14px]">arrow_forward</span></a>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
{/* Policy Card 1 (Housing) */}
<div className="bg-white rounded-2xl p-5 border border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-md hover:shadow-sky-100/60 transition-all flex flex-col justify-between group">
<div className="space-y-3">
{/* Card Header with Colorful Illustration & Badges */}
<div className="flex items-center justify-between">
<div className="flex items-center gap-2.5">
<div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-100 to-rose-50 border border-rose-200/60 flex items-center justify-center shadow-xs">
{/* Colorful House SVG */}
<svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4H9v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10z" fill="#FFE4E6" stroke="#F43F5E"></path>
<rect fill="#FDA4AF" height="4" stroke="#E11D48" width="4" x="10" y="10"></rect>
</svg>
</div>
<div>
<span className="inline-block px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[11px] font-bold">주거</span>
</div>
</div>
<span className="px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
      D-5 마감임박
    </span>
</div>
<div>
<h3 onClick={() => onNavigate?.('detail')} data-path="detail" className="font-bold text-base text-slate-900 group-hover:text-sky-600 transition-colors cursor-pointer">
      청년 주택 드림 청약통장
    </h3>
<p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-1 truncate">
      연 최대 4.5% 우대금리 및 주택 분양 시 2%대 저리대출 연계 지원
    </p>
</div>
</div>
<div className="mt-5 pt-3.5 space-y-2.5 bg-gradient-to-b from-slate-50/70 to-sky-50/40 -mx-5 -mb-5 p-5 rounded-b-2xl border-t border-slate-100">
<div className="flex justify-between items-center text-xs">
<span className="text-slate-500">지원 대상</span>
<span className="font-semibold text-slate-800">만 19~34세 무주택자</span>
</div>
<div className="flex justify-between items-center text-xs">
<span className="text-slate-500">주요 혜택</span>
<span className="text-sm font-extrabold text-sky-600">연 4.5% + 소득공제</span>
</div>
<a onClick={(e) => { e.preventDefault(); onNavigate?.('detail'); }} data-path="detail" className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold text-xs text-center flex items-center justify-center gap-1.5 shadow-sm shadow-sky-200 transition-all cursor-pointer" href="#">
<span className="">즉시 신청자격 검토</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</a>
</div>
</div>
{/* Policy Card 2 (Employment) */}
<div className="bg-white rounded-2xl p-5 border border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-md hover:shadow-sky-100/60 transition-all flex flex-col justify-between group">
<div className="space-y-3">
{/* Card Header with Colorful Illustration & Badges */}
<div className="flex items-center justify-between">
<div className="flex items-center gap-2.5">
<div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-100 to-amber-50 border border-amber-200/60 flex items-center justify-center shadow-xs">
{/* Colorful Briefcase SVG */}
<svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<rect fill="#FEF3C7" height="13" rx="2" stroke="#F59E0B" width="18" x="3" y="7"></rect>
<path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#D97706"></path>
<circle cx="12" cy="13" fill="#D97706" r="1.5"></circle>
</svg>
</div>
<div>
<span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold">일자리</span>
</div>
</div>
<span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
      상시모집
    </span>
</div>
<div>
<h3 onClick={() => onNavigate?.('detail')} data-path="detail" className="font-bold text-base text-slate-900 group-hover:text-sky-600 transition-colors cursor-pointer">
      국민취업지원제도 1유형
    </h3>
<p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-1 truncate">
      구직 활동 기간 동안 안정적인 취업지원 서비스 및 구직촉진수당 제공
    </p>
</div>
</div>
<div className="mt-5 pt-3.5 space-y-2.5 bg-gradient-to-b from-slate-50/70 to-sky-50/40 -mx-5 -mb-5 p-5 rounded-b-2xl border-t border-slate-100">
<div className="flex justify-between items-center text-xs">
<span className="text-slate-500">소득 요건</span>
<span className="font-semibold text-slate-800">중위소득 60% 이하</span>
</div>
<div className="flex justify-between items-center text-xs">
<span className="text-slate-500">지원 금액</span>
<span className="text-sm font-extrabold text-sky-600">월 50만원 (6개월)</span>
</div>
<a onClick={(e) => { e.preventDefault(); onNavigate?.('detail'); }} data-path="detail" className="w-full mt-2 py-2.5 px-4 rounded-xl bg-white hover:bg-sky-50 text-sky-700 font-semibold text-xs text-center flex items-center justify-center gap-1.5 border border-sky-200 shadow-xs transition-all cursor-pointer" href="#">
<span className="">상세 요건 확인</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</a>
</div>
</div>
{/* Policy Card 3 (Monthly Rent) */}
<div className="bg-white rounded-2xl p-5 border border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-md hover:shadow-sky-100/60 transition-all flex flex-col justify-between group">
<div className="space-y-3">
{/* Card Header with Colorful Illustration & Badges */}
<div className="flex items-center justify-between">
<div className="flex items-center gap-2.5">
<div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-100 to-teal-50 border border-teal-200/60 flex items-center justify-center shadow-xs">
{/* Colorful Key/Door SVG */}
<svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<circle cx="9" cy="12" fill="#CCFBF1" r="4" stroke="#0D9488"></circle>
<path d="M13 12h8m-3-3v3m-3 0v3" stroke="#0F766E" strokeLinecap="round"></path>
</svg>
</div>
<div>
<span className="inline-block px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[11px] font-bold">주거</span>
</div>
</div>
<span className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold">
      D-12
    </span>
</div>
<div>
<h3 onClick={() => onNavigate?.('detail')} data-path="detail" className="font-bold text-base text-slate-900 group-hover:text-sky-600 transition-colors cursor-pointer">
      청년월세 한시 특별지원 2차
    </h3>
<p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-1 truncate">
      실제 납부하는 임차료 범위 내에서 매월 최대 20만원씩 12개월 분할 지원
    </p>
</div>
</div>
<div className="mt-5 pt-3.5 space-y-2.5 bg-gradient-to-b from-slate-50/70 to-sky-50/40 -mx-5 -mb-5 p-5 rounded-b-2xl border-t border-slate-100">
<div className="flex justify-between items-center text-xs">
<span className="text-slate-500">대상 구분</span>
<span className="font-semibold text-slate-800">부모 별도 거주 무주택 청년</span>
</div>
<div className="flex justify-between items-center text-xs">
<span className="text-slate-500">총 혜택</span>
<span className="text-sm font-extrabold text-sky-600">총 240만원 지원</span>
</div>
<a onClick={(e) => { e.preventDefault(); onNavigate?.('detail'); }} data-path="detail" className="w-full mt-2 py-2.5 px-4 rounded-xl bg-white hover:bg-sky-50 text-sky-700 font-semibold text-xs text-center flex items-center justify-center gap-1.5 border border-sky-200 shadow-xs transition-all cursor-pointer" href="#">
<span className="">서류 간편 확인</span>
<span className="material-symbols-outlined text-[16px]">arrow_forward</span>
</a>
</div>
</div>
{/* Policy Card 4 (Education / Bootcamp) */}
<div className="bg-white rounded-2xl p-5 border border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-md hover:shadow-sky-100/60 transition-all flex flex-col justify-between group">
<div className="space-y-3">
{/* Card Header with Colorful Illustration & Badges */}
<div className="flex items-center justify-between">
<div className="flex items-center gap-2.5">
<div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-100 to-indigo-50 border border-purple-200/60 flex items-center justify-center shadow-xs">
{/* Colorful Graduation Cap SVG */}
<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<path d="M2 9l10-5 10 5-10 5L2 9z" fill="#EDE9FE" stroke="#8B5CF6"></path>
<path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" stroke="#7C3AED"></path>
<line stroke="#7C3AED" x1="22" x2="22" y1="10" y2="15"></line>
</svg>
</div>
<div>
<span className="inline-block px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-bold">교육·직업훈련</span>
</div>
</div>
<span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
      모집예정
    </span>
</div>
<div>
<h3 onClick={() => onNavigate?.('detail')} data-path="detail" className="font-bold text-base text-slate-900 group-hover:text-sky-600 transition-colors cursor-pointer">
      K-디지털 트레이닝 부트캠프
    </h3>
<p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-1 truncate">
      기업 주도형 실무 프로젝트 기반 전액 국비지원 첨단 IT·AI 직무 교육
    </p>
</div>
</div>
<div className="mt-5 pt-3.5 space-y-2.5 bg-gradient-to-b from-slate-50/70 to-sky-50/40 -mx-5 -mb-5 p-5 rounded-b-2xl border-t border-slate-100">
<div className="flex justify-between items-center text-xs">
<span className="text-slate-500">참여 자격</span>
<span className="font-semibold text-slate-800">내일배움카드 발급 청년</span>
</div>
<div className="flex justify-between items-center text-xs">
<span className="text-slate-500">국비 지원</span>
<span className="text-sm font-extrabold text-sky-600">교육비 100% 전액</span>
</div>
<a onClick={(e) => { e.preventDefault(); onNavigate?.('detail'); }} data-path="detail" className="w-full mt-2 py-2.5 px-4 rounded-xl bg-white hover:bg-sky-50 text-sky-700 font-semibold text-xs text-center flex items-center justify-center gap-1.5 border border-sky-200 shadow-xs transition-all cursor-pointer" href="#">
<span className="">알림 신청하기</span>
<span className="material-symbols-outlined text-[16px]">notifications_active</span>
</a>
</div>
</div>
</div>
{/* Inline Visual Curation Banner (Soft Pastel Card) */}
<div className="rounded-2xl bg-gradient-to-r from-sky-50 via-white to-indigo-50/40 p-5 border border-sky-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
<div className="flex items-center gap-3.5">
<div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-teal-200 shrink-0">
<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
</svg>
</div>
<div>
<h4 className="font-bold text-sm text-slate-900">복잡한 조건, 1분 간편 자가진단</h4>
<p className="text-xs text-slate-500">주민등록등본 및 소득증명원 없이도 즉시 가능 여부 확인</p>
</div>
</div>
<button onClick={() => onNavigate?.('profile')} data-path="profile" className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs whitespace-nowrap shadow-sm shadow-sky-200 transition-all cursor-pointer">
  자가진단 시작
</button>
</div>
</div>
{/* Right Column: D-Day Calendar & AI 3-Line Briefing (4 Cols) */}
<div className="lg:col-span-4 space-y-5">
{/* AI 3-Line Briefing Box with Cheerful Pastel AI Graphic */}
<div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-sm shadow-sky-100/40 space-y-4 relative overflow-hidden">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2.5">
<div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<rect fill="#EEF2FF" height="16" rx="4" width="16" x="4" y="4"></rect>
<circle cx="9" cy="10" fill="#6366F1" r="1.5"></circle>
<circle cx="15" cy="10" fill="#6366F1" r="1.5"></circle>
<path d="M9 15c1 1 5 1 6 0" stroke="#4F46E5" strokeLinecap="round"></path>
</svg>
</div>
<h3 onClick={() => onNavigate?.('news')} data-path="news" className="font-bold text-sm text-slate-900 cursor-pointer hover:text-sky-600 transition-colors">AI 정책 3줄 요약 브리핑</h3>
</div>
<span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">오늘자</span>
</div>
<div className="space-y-2.5 pt-1">
<div onClick={() => onNavigate?.('news')} data-path="news" className="p-3 rounded-xl bg-slate-50/80 border border-slate-100/80 flex gap-2.5 items-start cursor-pointer hover:bg-sky-50/40 transition-colors">
<span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-xs">1</span>
<p className="text-xs text-slate-600 leading-relaxed">
<strong className="text-slate-800 font-semibold">청년도약계좌 기여금 매칭비율</strong>이 이달부터 대폭 확대되어 월 실납입 효과가 상승했습니다.
</p>
</div>
<div onClick={() => onNavigate?.('news')} data-path="news" className="p-3 rounded-xl bg-slate-50/80 border border-slate-100/80 flex gap-2.5 items-start cursor-pointer hover:bg-sky-50/40 transition-colors">
<span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-xs">2</span>
<p className="text-xs text-slate-600 leading-relaxed">
<strong className="text-slate-800 font-semibold">수도권 청년 보증부 월세대출</strong> 대상 전세보증금 기준이 1억원까지 완화되었습니다.
</p>
</div>
<div onClick={() => onNavigate?.('news')} data-path="news" className="p-3 rounded-xl bg-slate-50/80 border border-slate-100/80 flex gap-2.5 items-start cursor-pointer hover:bg-sky-50/40 transition-colors">
<span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-xs">3</span>
<p className="text-xs text-slate-600 leading-relaxed">
  구직촉진수당 참여자는 취업성공수당 최대 150만원을 추가로 지급받을 수 있습니다.
</p>
</div>
</div>
</div><div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-sm shadow-sky-100/40 space-y-3.5 relative overflow-hidden">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2.5">
<div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-600 shadow-xs">
<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
<path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" strokeLinecap="round" strokeLinejoin="round"></path>
</svg>
</div>
<h3 onClick={() => onNavigate?.('news')} data-path="news" className="font-bold text-sm text-slate-900 cursor-pointer hover:text-sky-600 transition-colors">오늘의 관련 뉴스</h3>
</div>
<span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold text-[11px] border border-teal-200">실시간 팩트체크</span>
</div>
<div className="space-y-2.5 pt-0.5">
<div onClick={() => onNavigate?.('news')} data-path="news" className="p-3 rounded-xl bg-slate-50/80 border border-slate-100/80 space-y-1.5 hover:bg-sky-50/50 hover:border-sky-100 transition-colors group cursor-pointer">
<div className="flex items-center justify-between">
<span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 font-bold text-[11px]">한국경제</span>
<a onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNavigate?.('news'); }} data-path="news" className="text-[11px] text-slate-400 group-hover:text-sky-600 flex items-center gap-0.5 font-medium transition-colors" href="#">
          원문보기 <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
</a>
</div>
<h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-sky-700 transition-colors">
        2025 서울 청년월세 첫날 접속폭주 대비... 서류 사전 준비 꿀팁
      </h4>
<p className="text-[11px] text-slate-500 leading-snug line-clamp-1 truncate">
        선착순 아닌 정량평가, 보증금 요건과 주민등록등본 꼼꼼 체크 필요
      </p>
</div>
<div onClick={() => onNavigate?.('news')} data-path="news" className="p-3 rounded-xl bg-slate-50/80 border border-slate-100/80 space-y-1.5 hover:bg-sky-50/50 hover:border-sky-100 transition-colors group cursor-pointer">
<div className="flex items-center justify-between">
<span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 font-bold text-[11px]">매일경제</span>
<a onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNavigate?.('news'); }} data-path="news" className="text-[11px] text-slate-400 group-hover:text-sky-600 flex items-center gap-0.5 font-medium transition-colors" href="#">
          원문보기 <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
</a>
</div>
<h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-sky-700 transition-colors">
        청년도약계좌 기여금 매칭 비율 상향... "만기 시 최대 5천만원 목돈"
      </h4>
<p className="text-[11px] text-slate-500 leading-snug line-clamp-1 truncate">
        정부 기여 매칭 비율 확대 발표로 청년 자산 형성 효과 실질적 제고
      </p>
</div>
<div onClick={() => onNavigate?.('news')} data-path="news" className="p-3 rounded-xl bg-slate-50/80 border border-slate-100/80 space-y-1.5 hover:bg-sky-50/50 hover:border-sky-100 transition-colors group cursor-pointer">
<div className="flex items-center justify-between">
<span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 font-bold text-[11px]">조선비즈</span>
<a onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNavigate?.('news'); }} data-path="news" className="text-[11px] text-slate-400 group-hover:text-sky-600 flex items-center gap-0.5 font-medium transition-colors" href="#">
          원문보기 <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
</a>
</div>
<h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-sky-700 transition-colors">
        상반기 K-디지털 청년 AI 부트캠프 모집 개시
      </h4>
<p className="text-[11px] text-slate-500 leading-snug line-clamp-1 truncate">
        기업 주도 실무 프로젝트 전액 무료 참여 및 훈련장려금 월 31.6만원 추가 지급
      </p>
</div>
</div>
</div>
{/* D-Day Urgent Deadline Tracker Widget with Colorful Clock Graphic */}
<div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-sm shadow-sky-100/40 space-y-4">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2.5">
<div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<circle cx="12" cy="12" fill="#FEF3C7" r="9"></circle>
<polyline points="12 7 12 12 15 15" stroke="#D97706"></polyline>
</svg>
</div>
<h3 onClick={() => onNavigate?.('kanban')} data-path="kanban" className="font-bold text-sm text-slate-900 cursor-pointer hover:text-sky-600 transition-colors">마감 임박 캘린더</h3>
</div>
<a onClick={(e) => { e.preventDefault(); onNavigate?.('kanban'); }} data-path="kanban" className="text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer hover:underline" href="#">전체일정</a>
</div>
<div className="space-y-2">
<div onClick={() => onNavigate?.('detail')} data-path="detail" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-sky-50/50 transition-colors border border-transparent hover:border-sky-100 cursor-pointer">
<div className="space-y-0.5">
<span className="font-medium text-xs text-slate-800 line-clamp-1">서울시 청년 대중교통비 지원</span>
<span className="text-[11px] text-slate-400">3월 15일 18:00 마감</span>
</div>
<span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold shrink-0">
  D-2
</span>
</div>
<div onClick={() => onNavigate?.('detail')} data-path="detail" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-sky-50/50 transition-colors border border-transparent hover:border-sky-100 cursor-pointer">
<div className="space-y-0.5">
<span className="font-medium text-xs text-slate-800 line-clamp-1">청년내일채움공제 기업매칭</span>
<span className="text-[11px] text-slate-400">3월 18일 접수종료</span>
</div>
<span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-600 text-xs font-bold shrink-0">
  D-5
</span>
</div>
<div onClick={() => onNavigate?.('detail')} data-path="detail" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-sky-50/50 transition-colors border border-transparent hover:border-sky-100 cursor-pointer">
<div className="space-y-0.5">
<span className="font-medium text-xs text-slate-800 line-clamp-1">중소기업 청년 전세자금대출</span>
<span className="text-[11px] text-slate-400">1분기 예산 소진 시까지</span>
</div>
<span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold shrink-0">
  D-14
</span>
</div>
</div>
{/* Quick Reminder SMS Toggle */}
<div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100 flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold">💬</span>
<span className="text-xs font-medium text-slate-700">마감 3일 전 카카오 알림톡</span>
</div>
<label className="relative inline-flex items-center cursor-pointer">
<input defaultChecked={true} className="sr-only peer" type="checkbox" />
<div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
</label>
</div>
</div>
{/* Consultation Floating Banner (Pastel Card Aesthetic) */}
<div className="rounded-2xl bg-gradient-to-br from-white via-teal-50/30 to-sky-50/50 p-5 border border-sky-100 shadow-sm space-y-3">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0 shadow-xs">
<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<path d="M19 11a7 7 0 0 1-7 7m0 0a7 7 0 0 1-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" strokeLinecap="round"></path>
</svg>
</div>
<div>
<span className="font-bold text-sm text-slate-900">전담 정책 설계사 상담</span>
<p className="text-xs text-slate-500">어려운 서류 심사 무료 동행 지원</p>
</div>
</div>
<button onClick={() => onNavigate?.('profile')} data-path="profile" className="w-full py-2 rounded-xl bg-white hover:bg-sky-50 text-sky-700 font-semibold text-xs border border-sky-200 hover:border-sky-300 transition-all shadow-xs cursor-pointer">
  온라인 1:1 상담 예약
</button>
</div>
</div>
</div>
</div>
</main>
  );
};

export default HomeView;
