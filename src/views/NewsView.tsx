import React, { useEffect } from 'react';

interface NewsViewProps {
  onNavigate?: (path: string) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ onNavigate }) => {
  
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
{/* 1. Header Title & Hero Section (Light Pastel Sky-Mint-Cream Gradient Banner) */}
<div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-100/70 via-indigo-50/50 to-teal-50/70 p-6 md:p-8 border border-sky-200/60 shadow-sm shadow-sky-100/50">
<div className="absolute -right-8 -top-10 w-72 h-72 rounded-full bg-teal-200/30 blur-3xl pointer-events-none"></div>
<div className="absolute left-1/3 -bottom-10 w-64 h-64 rounded-full bg-sky-200/40 blur-3xl pointer-events-none"></div>
<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
<div className="space-y-2.5 max-w-2xl">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-sky-200/70 shadow-xs text-sky-800 text-xs font-semibold backdrop-blur-md">
<span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span></span>
<span className="">AI 정책·이슈 실시간 큐레이션</span>
</div>
<h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
  나에게 꼭 맞는 청년 뉴스 <span className="text-sky-600 underline decoration-sky-300 decoration-wavy underline-offset-4">실시간 AI 요약</span>
</h1>
<p className="text-slate-600 text-sm md:text-base leading-relaxed">
  전국 언론 보도와 정책 분석 뉴스를 AI가 핵심만 3줄 요약하고 맞춤 정책과 연결해 드립니다.
</p>
</div>
<div className="flex items-center gap-4 bg-white/90 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-sky-100 shadow-md shadow-sky-100/60 shrink-0 self-start md:self-auto">
<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 via-sky-50 to-teal-100 border border-indigo-200 flex items-center justify-center shadow-inner shrink-0 text-sky-600">
<svg className="w-8 h-8 text-sky-600 drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" strokeLinecap="round" strokeLinejoin="round"></path></svg>
</div>
<div className="pr-1">
<div className="flex items-center gap-1.5 mb-0.5">
<span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
<span className="text-xs font-medium text-slate-500">실시간 분석 완료</span>
</div>
<div className="flex items-baseline gap-1">
<span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">1,842</span>
<span className="text-sm font-bold text-sky-600">건</span>
</div>
</div>
</div>
</div>
</div>
{/* 2. Main Search Bar & Quick Tags */}
<div className="space-y-3">
<div className="bg-white p-2 sm:p-3 rounded-2xl border border-sky-100 shadow-sm flex flex-col md:flex-row items-center gap-2">
<div className="relative flex-1 w-full flex items-center">
<span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px]">search</span>
<input className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40 transition-all" id="news-search-input" placeholder="청년 주거, 일자리, 금융 관련 최신 뉴스 및 정책 분석 검색" type="text" />
</div>
<div className="flex items-center gap-2 w-full md:w-auto">
<button className="flex-1 md:flex-none px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs flex items-center justify-center gap-1 transition-colors" id="btn-reset-search" type="button">
<span className="material-symbols-outlined text-[16px]">restart_alt</span>
필터초기화
</button>
<button className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm shadow-sky-200 flex items-center justify-center gap-1 transition-all active:scale-95" type="button">
<span className="material-symbols-outlined text-[16px]">search</span>
검색
</button>
</div>
</div>
<div className="flex items-center gap-2 flex-wrap px-1">
<span className="text-xs text-slate-500 font-semibold flex items-center gap-1"><span className="material-symbols-outlined text-[15px] text-sky-600">trending_up</span>인기 검색어</span>
<button className="px-3 py-1 rounded-full bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-600 font-medium text-xs border border-slate-200/80 transition-colors" type="button">#청년월세</button>
<button className="px-3 py-1 rounded-full bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-600 font-medium text-xs border border-slate-200/80 transition-colors" type="button">#국민취업지원제도</button>
<button className="px-3 py-1 rounded-full bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-600 font-medium text-xs border border-slate-200/80 transition-colors" type="button">#청년도약계좌</button>
<button className="px-3 py-1 rounded-full bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-600 font-medium text-xs border border-slate-200/80 transition-colors" type="button">#취업지원금</button>
<button className="px-3 py-1 rounded-full bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-600 font-medium text-xs border border-slate-200/80 transition-colors" type="button">#국비무료교육</button>
<button className="px-3 py-1 rounded-full bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-600 font-medium text-xs border border-slate-200/80 transition-colors" type="button">#자격증응시료</button>
</div>
</div>
{/* 3. Results Toolbar */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-200/80">
<div className="flex items-center gap-2">
<span className="text-base font-bold text-slate-900">실시간 큐레이션 뉴스</span>
<span className="text-xl font-extrabold text-sky-600">38</span>
<span className="text-sm font-bold text-slate-800">건</span>
</div>
<div className="flex items-center gap-3 flex-wrap">
<div className="relative">
<select className="appearance-none pl-3 pr-8 py-1.5 bg-white text-slate-700 font-medium text-xs rounded-xl border border-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer">
<option>내 매칭률순 ▼</option>
<option>최신등록순</option>
<option>인기조회순</option>
<option>AI 중요도순</option>
</select>
<span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[16px]">arrow_drop_down</span>
</div>
<div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
<button aria-label="그리드 뷰" className="p-1 rounded-lg bg-sky-600 text-white" type="button"><span className="material-symbols-outlined text-[18px] block">grid_view</span></button>
<button aria-label="리스트 뷰" className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors" type="button"><span className="material-symbols-outlined text-[18px] block">view_list</span></button>
</div>
</div>
</div>
{/* 4. News Cards Grid (Matching SCREEN_60 Pastel Card Style) */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
{/* Card 1 (Housing) */}
<article className="bg-white rounded-2xl p-5 border border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-md hover:shadow-sky-100/60 transition-all flex flex-col justify-between group">
<div className="space-y-3">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[11px] font-bold">주거 🏠</span>
<span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[11px] font-bold">HOT 이슈</span>
</div>
<span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold">98% 일치</span>
</div>
<div className="flex items-center gap-1.5 text-xs text-slate-400">
<span className="">매일경제</span>
<span className="">·</span>
<span className="">2시간 전</span>
</div>
<h2 onClick={() => onNavigate?.('detail')} data-path="detail" className="font-bold text-base text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 cursor-pointer">
  2025 청년월세 특별지원 2차 확대… 보증금 기준 대폭 완화
</h2>
<div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2">
<div className="flex items-center gap-1.5 text-sky-600 font-bold text-xs">
<span className="material-symbols-outlined text-[15px]">psychology</span>
<span className="">AI 3줄 핵심 요약</span>
</div>
<ul className="space-y-1 text-xs text-slate-600 leading-relaxed">
<li className="flex items-start gap-1.5"><span className="text-sky-500 font-bold">•</span><span className="">보증금 5천만원 이하 및 월세 70만원 이하 무주택 청년 대상</span></li>
<li className="flex items-start gap-1.5"><span className="text-sky-500 font-bold">•</span><span className="">실제 납부하는 월세 중 최대 20만원씩 12개월(최대 240만원) 지원</span></li>
<li className="flex items-start gap-1.5"><span className="text-sky-500 font-bold">•</span><span className="">부모와 따로 사는 만 19~34세 청년 가구 소득 기준 완화</span></li>
</ul>
</div>
<a onClick={(e) => { e.preventDefault(); onNavigate?.('detail'); }} data-path="detail" className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100/70 border border-sky-100 text-sky-700 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer" href="#">
<span className="flex items-center gap-1.5 truncate">
<span className="material-symbols-outlined text-[15px]">link</span>
<span className="truncate">연계 정책: [2025 서울 청년월세 특별지원 2차]</span>
</span>
<span className="material-symbols-outlined text-[15px]">arrow_forward</span>
</a>
</div>
<div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
<span className="text-xs text-slate-400 font-medium truncate max-w-[120px]">서울시 주택정책실</span>
<div className="flex items-center gap-2">
<button aria-label="북마크" className="bookmark-btn p-1.5 rounded-lg text-slate-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">
<span className="material-symbols-outlined text-[18px]">bookmark_border</span>
</button>
<button onClick={() => onNavigate?.('detail')} data-path="detail" className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer" type="button">
<span className="">AI 전문보기</span>
<span className="material-symbols-outlined text-[14px]">arrow_forward</span>
</button>
</div>
</div>
</article>
{/* Card 2 (Jobs) */}
<article className="bg-white rounded-2xl p-5 border border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-md hover:shadow-sky-100/60 transition-all flex flex-col justify-between group">
<div className="space-y-3">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold">일자리 💼</span>
<span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-bold">신청 마감임박</span>
</div>
<span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold">95% 일치</span>
</div>
<div className="flex items-center gap-1.5 text-xs text-slate-400">
<span className="">한국경제</span>
<span className="">·</span>
<span className="">4시간 전</span>
</div>
<h2 onClick={() => onNavigate?.('detail')} data-path="detail" className="font-bold text-base text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 cursor-pointer">
  국민취업지원제도 1유형 신청 폭주… 구직촉진수당 300만원 지급
</h2>
<div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2">
<div className="flex items-center gap-1.5 text-sky-600 font-bold text-xs">
<span className="material-symbols-outlined text-[15px]">psychology</span>
<span className="">AI 3줄 핵심 요약</span>
</div>
<ul className="space-y-1 text-xs text-slate-600 leading-relaxed">
<li className="flex items-start gap-1.5"><span className="text-sky-500 font-bold">•</span><span className="">취업 지원 서비스와 함께 월 50만원씩 최대 6개월 구직촉진수당 제공</span></li>
<li className="flex items-start gap-1.5"><span className="text-sky-500 font-bold">•</span><span className="">중위소득 120% 이하 미취업 청년(만 18~34세) 누구나 신청 가능</span></li>
<li className="flex items-start gap-1.5"><span className="text-sky-500 font-bold">•</span><span className="">조기 취업 성공 시 최대 150만원 상당의 취업성공수당 추가 지급</span></li>
</ul>
</div>
<a onClick={(e) => { e.preventDefault(); onNavigate?.('detail'); }} data-path="detail" className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100/70 border border-sky-100 text-sky-700 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer" href="#">
<span className="flex items-center gap-1.5 truncate">
<span className="material-symbols-outlined text-[15px]">link</span>
<span className="truncate">연계 정책: [2025 국민취업지원제도 1유형]</span>
</span>
<span className="material-symbols-outlined text-[15px]">arrow_forward</span>
</a>
</div>
<div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
<span className="text-xs text-slate-400 font-medium truncate max-w-[120px]">고용노동부 청년취업과</span>
<div className="flex items-center gap-2">
<button aria-label="북마크" className="bookmark-btn p-1.5 rounded-lg text-slate-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">
<span className="material-symbols-outlined text-[18px]">bookmark_border</span>
</button>
<button onClick={() => onNavigate?.('detail')} data-path="detail" className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer" type="button">
<span className="">AI 전문보기</span>
<span className="material-symbols-outlined text-[14px]">arrow_forward</span>
</button>
</div>
</div>
</article>
{/* Card 3 (Finance) */}
<article className="bg-white rounded-2xl p-5 border border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-md hover:shadow-sky-100/60 transition-all flex flex-col justify-between group">
<div className="space-y-3">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-bold">금융·복지 💰</span>
<span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[11px] font-bold">금리 혜택</span>
</div>
<span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold">92% 일치</span>
</div>
<div className="flex items-center gap-1.5 text-xs text-slate-400">
<span className="">조선비즈</span>
<span className="">·</span>
<span className="">오늘 오전</span>
</div>
<h2 onClick={() => onNavigate?.('detail')} data-path="detail" className="font-bold text-base text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 cursor-pointer">
  청년 주택드림 청약통장, 출시 1년만 150만 돌파… 대출 연계 가이드
</h2>
<div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2">
<div className="flex items-center gap-1.5 text-sky-600 font-bold text-xs">
<span className="material-symbols-outlined text-[15px]">psychology</span>
<span className="">AI 3줄 핵심 요약</span>
</div>
<ul className="space-y-1 text-xs text-slate-600 leading-relaxed">
<li className="flex items-start gap-1.5"><span className="text-sky-500 font-bold">•</span><span className="">최고 연 4.5% 우대금리와 납입금액 40% 소득공제 비과세 혜택</span></li>
<li className="flex items-start gap-1.5"><span className="text-sky-500 font-bold">•</span><span className="">1년 이상 납입 후 청약 당첨 시 최저 연 2.2% 주택드림대출 연계</span></li>
<li className="flex items-start gap-1.5"><span className="text-sky-500 font-bold">•</span><span className="">만 19~34세 연소득 5,000만원 이하 무주택 청년 대상</span></li>
</ul>
</div>
<a onClick={(e) => { e.preventDefault(); onNavigate?.('detail'); }} data-path="detail" className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100/70 border border-sky-100 text-sky-700 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer" href="#">
<span className="flex items-center gap-1.5 truncate">
<span className="material-symbols-outlined text-[15px]">link</span>
<span className="truncate">연계 정책: [청년 주택드림 청약통장]</span>
</span>
<span className="material-symbols-outlined text-[15px]">arrow_forward</span>
</a>
</div>
<div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
<span className="text-xs text-slate-400 font-medium truncate max-w-[120px]">국토교통부 / IBK기업은행</span>
<div className="flex items-center gap-2">
<button aria-label="북마크" className="bookmark-btn p-1.5 rounded-lg text-slate-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">
<span className="material-symbols-outlined text-[18px]">bookmark_border</span>
</button>
<button onClick={() => onNavigate?.('detail')} data-path="detail" className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer" type="button">
<span className="">AI 전문보기</span>
<span className="material-symbols-outlined text-[14px]">arrow_forward</span>
</button>
</div>
</div>
</article>
{/* Card 4 (Education) */}
<article className="bg-white rounded-2xl p-5 border border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-md hover:shadow-sky-100/60 transition-all flex flex-col justify-between group">
<div className="space-y-3">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-bold">교육·직업훈련 🎓</span>
<span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold">국비 무료</span>
</div>
<span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold">90% 일치</span>
</div>
<div className="flex items-center gap-1.5 text-xs text-slate-400">
<span className="">전자신문</span>
<span className="">·</span>
<span className="">1일 전</span>
</div>
<h2 onClick={() => onNavigate?.('detail')} data-path="detail" className="font-bold text-base text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 cursor-pointer">
  K-디지털 트레이닝 '생성형 AI' 과정 신설… 전액 국비지원에 훈련수당까지
</h2>
<div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2">
<div className="flex items-center gap-1.5 text-sky-600 font-bold text-xs">
<span className="material-symbols-outlined text-[15px]">psychology</span>
<span className="">AI 3줄 핵심 요약</span>
</div>
<ul className="space-y-1 text-xs text-slate-600 leading-relaxed">
<li className="flex items-start gap-1.5"><span className="text-sky-500 font-bold">•</span><span className="">비전공자도 가능한 생성형 AI 실무형 개발자 풀타임 부트캠프</span></li>
<li className="flex items-start gap-1.5"><span className="text-sky-500 font-bold">•</span><span className="">1인당 최대 1,700만원 상당 교육비 전액 정부 지원</span></li>
<li className="flex items-start gap-1.5"><span className="text-sky-500 font-bold">•</span><span className="">매월 출석률 80% 이상 시 훈련장려금 월 31.6만원 별도 지급</span></li>
</ul>
</div>
<a onClick={(e) => { e.preventDefault(); onNavigate?.('detail'); }} data-path="detail" className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100/70 border border-sky-100 text-sky-700 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer" href="#">
<span className="flex items-center gap-1.5 truncate">
<span className="material-symbols-outlined text-[15px]">link</span>
<span className="truncate">연계 정책: [K-디지털 트레이닝 AI 실무과정]</span>
</span>
<span className="material-symbols-outlined text-[15px]">arrow_forward</span>
</a>
</div>
<div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
<span className="text-xs text-slate-400 font-medium truncate max-w-[120px]">고용노동부 직업능력평가원</span>
<div className="flex items-center gap-2">
<button aria-label="북마크" className="bookmark-btn p-1.5 rounded-lg text-slate-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">
<span className="material-symbols-outlined text-[18px]">bookmark_border</span>
</button>
<button onClick={() => onNavigate?.('detail')} data-path="detail" className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer" type="button">
<span className="">AI 전문보기</span>
<span className="material-symbols-outlined text-[14px]">arrow_forward</span>
</button>
</div>
</div>
</article>
{/* Card 5 (Refund) */}
<article className="bg-white rounded-2xl p-5 border border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-md hover:shadow-sky-100/60 transition-all flex flex-col justify-between group">
<div className="space-y-3">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold">일자리 📝</span>
<span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">실비 환급</span>
</div>
<span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold">88% 일치</span>
</div>
<div className="flex items-center gap-1.5 text-xs text-slate-400">
<span className="">연합뉴스</span>
<span className="">·</span>
<span className="">1일 전</span>
</div>
<h2 onClick={() => onNavigate?.('detail')} data-path="detail" className="font-bold text-base text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 cursor-pointer">
  청년 자격증 응시료 지원 예산 조기 마감 주의… 토익·기사 실비 청구법
</h2>
<div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2">
<div className="flex items-center gap-1.5 text-sky-600 font-bold text-xs">
<span className="material-symbols-outlined text-[15px]">psychology</span>
<span className="">AI 3줄 핵심 요약</span>
</div>
<ul className="space-y-1 text-xs text-slate-600 leading-relaxed">
<li className="flex items-start gap-1.5"><span className="text-sky-500 font-bold">•</span><span className="">어학, 한국사, 국가공인 자격증 시험 응시료 연 최대 10만원 실비 지원</span></li>
<li className="flex items-start gap-1.5"><span className="text-sky-500 font-bold">•</span><span className="">서울 및 주요 지자체별 선착순 예산 소진 시 조기 마감 유의</span></li>
<li className="flex items-start gap-1.5"><span className="text-sky-500 font-bold">•</span><span className="">신청일 기준 주민등록 거주 미취업 청년 대상 영수증 증빙 제출</span></li>
</ul>
</div>
<a onClick={(e) => { e.preventDefault(); onNavigate?.('detail'); }} data-path="detail" className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100/70 border border-sky-100 text-sky-700 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer" href="#">
<span className="flex items-center gap-1.5 truncate">
<span className="material-symbols-outlined text-[15px]">link</span>
<span className="truncate">연계 정책: [청년 자격증 응시료 실비 지원]</span>
</span>
<span className="material-symbols-outlined text-[15px]">arrow_forward</span>
</a>
</div>
<div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
<span className="text-xs text-slate-400 font-medium truncate max-w-[120px]">청년몽땅정보통 지원단</span>
<div className="flex items-center gap-2">
<button aria-label="북마크" className="bookmark-btn p-1.5 rounded-lg text-slate-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">
<span className="material-symbols-outlined text-[18px]">bookmark_border</span>
</button>
<button onClick={() => onNavigate?.('detail')} data-path="detail" className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer" type="button">
<span className="">AI 전문보기</span>
<span className="material-symbols-outlined text-[14px]">arrow_forward</span>
</button>
</div>
</div>
</article>
{/* Card 6 (Participation) */}
<article className="bg-white rounded-2xl p-5 border border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-md hover:shadow-sky-100/60 transition-all flex flex-col justify-between group">
<div className="space-y-3">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[11px] font-bold">참여·기반 🤝</span>
<span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold">도전 수당</span>
</div>
<span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold">85% 일치</span>
</div>
<div className="flex items-center gap-1.5 text-xs text-slate-400">
<span className="">동아일보</span>
<span className="">·</span>
<span className="">2일 전</span>
</div>
<h2 onClick={() => onNavigate?.('detail')} data-path="detail" className="font-bold text-base text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 cursor-pointer">
  구직단념 청년 사회 복귀 돕는 '청년도전지원사업' 300만원 인센티브
</h2>
<div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2">
<div className="flex items-center gap-1.5 text-sky-600 font-bold text-xs">
<span className="material-symbols-outlined text-[15px]">psychology</span>
<span className="">AI 3줄 핵심 요약</span>
</div>
<ul className="space-y-1 text-xs text-slate-600 leading-relaxed">
<li className="flex items-start gap-1.5"><span className="text-sky-500 font-bold">•</span><span className="">최근 6개월 이상 미취업 청년 대상 5개월 맞춤형 심리·역량 강화 프로그램</span></li>
<li className="flex items-start gap-1.5"><span className="text-sky-500 font-bold">•</span><span className="">프로그램 이수 시 참여수당 및 이수 인센티브 총 300만원 지급</span></li>
<li className="flex items-start gap-1.5"><span className="text-sky-500 font-bold">•</span><span className="">지자체 청년재단 및 청년센터 연계 1:1 진로 멘토링 제공</span></li>
</ul>
</div>
<a onClick={(e) => { e.preventDefault(); onNavigate?.('detail'); }} data-path="detail" className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100/70 border border-sky-100 text-sky-700 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer" href="#">
<span className="flex items-center gap-1.5 truncate">
<span className="material-symbols-outlined text-[15px]">link</span>
<span className="truncate">연계 정책: [2025 청년도전지원사업]</span>
</span>
<span className="material-symbols-outlined text-[15px]">arrow_forward</span>
</a>
</div>
<div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
<span className="text-xs text-slate-400 font-medium truncate max-w-[120px]">고용노동부 청년정책관</span>
<div className="flex items-center gap-2">
<button aria-label="북마크" className="bookmark-btn p-1.5 rounded-lg text-slate-400 hover:text-sky-600 transition-colors cursor-pointer" type="button">
<span className="material-symbols-outlined text-[18px]">bookmark_border</span>
</button>
<button onClick={() => onNavigate?.('detail')} data-path="detail" className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer" type="button">
<span className="">AI 전문보기</span>
<span className="material-symbols-outlined text-[14px]">arrow_forward</span>
</button>
</div>
</div>
</article>
</div>
{/* 5. Pagination */}
<div className="flex items-center justify-center gap-2 pt-2">
<button aria-label="이전 페이지" className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-sky-50 shadow-xs transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">chevron_left</span>
</button>
<button className="w-9 h-9 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center justify-center shadow-sm" type="button">1</button>
<button className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-xs flex items-center justify-center hover:bg-sky-50 shadow-xs transition-colors" type="button">2</button>
<button className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-xs flex items-center justify-center hover:bg-sky-50 shadow-xs transition-colors" type="button">3</button>
<button className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-xs flex items-center justify-center hover:bg-sky-50 shadow-xs transition-colors" type="button">4</button>
<button className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-xs flex items-center justify-center hover:bg-sky-50 shadow-xs transition-colors" type="button">5</button>
<button aria-label="다음 페이지" className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-sky-50 shadow-xs transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">chevron_right</span>
</button>
</div>
{/* 6. Bottom Kakao Notification Banner (Warm pastel sky theme) */}
<div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-50 via-white to-teal-50/50 p-6 md:p-8 border border-sky-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
<div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-sky-200/20 blur-3xl pointer-events-none"></div>
<div className="flex items-center gap-4 z-10">
<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
<span className="material-symbols-outlined text-[28px]">chat</span>
</div>
<div className="flex flex-col gap-1">
<div className="flex items-center gap-2">
<span className="font-bold text-base text-slate-900">청년나침반 AI 뉴스 브리핑 서비스</span>
<span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-bold text-xs">무료 알림</span>
</div>
<p className="text-xs md:text-sm text-slate-600">
내게 꼭 맞는 핵심 정책 뉴스를 매일 아침 카카오톡으로 요약 받아보세요!
</p>
</div>
</div>
<button className="z-10 flex-shrink-0 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm shadow-sky-200 flex items-center gap-2 transition-all active:scale-95" type="button">
<span className="">맞춤 뉴스 알림 신청하기</span>
<span className="material-symbols-outlined text-[18px]">notifications_active</span>
</button>
</div>
</div>
</main>
  );
};

export default NewsView;
