import React, { useEffect } from 'react';

interface DetailViewProps {
  onNavigate?: (path: string) => void;
}

export const DetailView: React.FC<DetailViewProps> = ({ onNavigate }) => {
  
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
    <main className="flex-1 w-full pt-20 pb-16 bg-[#f8fafc] max-w-[1240px] mx-auto px-4 md:px-8">
<div className="flex flex-col w-full space-y-6">
{/* Breadcrumb Navigation */}
<div className="flex items-center justify-between text-slate-400 text-xs pt-1">
<nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
<a onClick={(e) => { e.preventDefault(); onNavigate?.('home'); }} data-path="home" className="hover:text-sky-600 transition-colors flex items-center gap-1 text-slate-500 cursor-pointer" href="#">
<span className="material-symbols-outlined text-[15px]">home</span>
<span className="">홈</span>
</a>
<span className="text-slate-300 font-semibold">/</span>
<a onClick={(e) => { e.preventDefault(); onNavigate?.('explore'); }} data-path="explore" className="hover:text-sky-600 transition-colors text-slate-500 cursor-pointer" href="#">주거·금융</a>
<span className="text-slate-300 font-semibold">/</span>
<span className="text-slate-800 font-semibold truncate max-w-[240px] sm:max-w-none">서울 청년 월세 특별지원</span>
</nav>
<div className="flex items-center gap-3 text-slate-500 text-xs">
<span className="inline-flex items-center gap-1">
<span className="material-symbols-outlined text-[15px] text-slate-400">visibility</span>
<span className="">조회 14,280회</span>
</span>
<span className="inline-flex items-center gap-1">
<span className="material-symbols-outlined text-[15px] text-teal-500">verified</span>
<span className="">최종 검증: 2025.04.18</span>
</span>
</div>
</div>
{/* Header Policy Summary Card (Pastel Gradient Screen 4 Style Banner) */}
<div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-100/70 via-indigo-50/50 to-teal-50/70 p-6 md:p-8 border border-sky-200/60 shadow-sm shadow-sky-100/50 space-y-6">
<div className="absolute -right-8 -top-10 w-72 h-72 rounded-full bg-teal-200/25 blur-3xl pointer-events-none"></div>
<div className="absolute left-1/3 -bottom-10 w-64 h-64 rounded-full bg-sky-200/35 blur-3xl pointer-events-none"></div>
<div className="relative z-10 flex flex-col gap-4">
<div className="flex flex-wrap items-center gap-2"><span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-1.5 shadow-xs whitespace-nowrap">
<span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              D-3 마감임박
            </span>
<span className="px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold flex items-center gap-1 shadow-xs whitespace-nowrap">
<span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '\'FILL\' 1' }}>verified</span>
              나와의 매칭률 98%
            </span>
<span className="px-3 py-1 rounded-full bg-white/80 border border-sky-200 text-sky-700 text-xs font-semibold shadow-xs whitespace-nowrap">
              주거·금융
            </span>
<span className="px-3 py-1 rounded-full bg-white/80 border border-slate-200/80 text-slate-600 text-xs shadow-xs whitespace-nowrap">
              현금 직접지급
            </span></div>
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
<div className="space-y-2 max-w-2xl">
<h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                2025년 상반기 서울 청년 월세 한시 특별지원 공고
              </h1>
<p className="text-slate-600 text-sm md:text-base leading-relaxed">
                실제 서울 거주 무주택 청년의 주거비 부담 경감을 위한 월 최대 20만원 지원 (12개월 간 총 최대 240만원 지원)
              </p>
</div>
{/* Pastel 3D Cash/House Metric Highlight Card */}
<div className="flex items-center gap-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-sky-100 shadow-md shadow-sky-100/60 shrink-0 self-start lg:self-auto">
<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-100 via-emerald-50 to-sky-100 border border-teal-200 flex items-center justify-center shadow-inner shrink-0">
<svg className="w-8 h-8 text-teal-600 drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
<path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4H9v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10z" fill="#CCFBF1" stroke="#0D9488"></path>
<circle cx="12" cy="14" fill="#5EEAD4" r="2.5" stroke="#0F766E"></circle>
</svg>
</div>
<div>
<div className="flex items-center gap-1.5 mb-0.5">
<span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500"></span>
<span className="text-xs font-medium text-slate-500">총 지원 한도액</span>
</div>
<div className="flex items-baseline gap-1">
<span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">최대 240만</span>
<span className="text-sm font-bold text-sky-600">원</span>
</div>
</div>
</div>
</div>
{/* 4 Key Value Metric Highlights */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
<div className="p-4 rounded-2xl bg-white/80 border border-sky-100/80 shadow-xs space-y-0.5">
<span className="text-xs text-slate-500 font-medium">지원 규모</span>
<div className="text-lg font-extrabold text-sky-600">
                월 20만 <span className="text-xs font-normal text-slate-500">(최대 240만)</span>
</div>
</div>
<div className="p-4 rounded-2xl bg-white/80 border border-sky-100/80 shadow-xs space-y-0.5">
<span className="text-xs text-slate-500 font-medium">지원 기간</span>
<div className="text-base font-bold text-slate-800">
                최대 12개월 분할지급
              </div>
</div>
<div className="p-4 rounded-2xl bg-white/80 border border-rose-100 shadow-xs space-y-0.5">
<span className="text-xs text-rose-500 font-medium">신청 마감 시각</span>
<div className="text-base font-extrabold text-rose-600">
                04.30(수) 18:00
              </div>
</div>
<div className="p-4 rounded-2xl bg-white/80 border border-sky-100/80 shadow-xs space-y-0.5">
<span className="text-xs text-slate-500 font-medium">주관 및 접수처</span>
<div className="text-base font-bold text-slate-800 truncate">
                청년몽땅정보통
              </div>
</div>
</div>
</div>
</div>
{/* Main Content Layout (8 Cols Left Content + 4 Cols Right Sticky Panel) */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
{/* Left Main Content Column (8 Cols) */}
<div className="lg:col-span-8 space-y-6">
{/* AI 3-Line Core Summary Card */}
<div className="bg-white rounded-2xl p-6 shadow-sm border border-sky-100 shadow-sky-100/40 space-y-5">
<div className="flex items-center justify-between pb-3 border-b border-slate-100">
<div className="flex items-center gap-3">
{/* Pastel AI Briefing Robot/Stars Illustration Icon */}
<div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-100 to-sky-100 border border-indigo-200/70 flex items-center justify-center text-indigo-600 shadow-xs">
<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<rect fill="#EEF2FF" height="15" rx="4" width="16" x="4" y="4.5"></rect>
<circle cx="9" cy="10.5" fill="#6366F1" r="1.5"></circle>
<circle cx="15" cy="10.5" fill="#6366F1" r="1.5"></circle>
<path d="M9 15c1 1 5 1 6 0" stroke="#4F46E5" strokeLinecap="round"></path>
<line stroke="#818CF8" strokeLinecap="round" strokeWidth="2" x1="12" x2="12" y1="1.5" y2="4.5"></line>
</svg>
</div>
<div>
<div className="flex items-center gap-2">
<h2 className="text-lg font-bold text-slate-900 tracking-tight">AI 핵심 3줄 요약</h2>
<span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold">공고문 18페이지 정밀분석</span>
</div>
</div>
</div>
<button className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-600 border border-slate-200/80 transition-colors text-xs font-semibold" id="speak-summary-btn">
<span className="material-symbols-outlined text-[16px] text-sky-600">volume_up</span>
<span className="" id="audio-btn-label">30초 요약 듣기</span>
</button>
</div>
<div className="space-y-3 pt-1">
{/* Item 1: 지원 대상 */}
<div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100/70 flex items-start gap-3.5">
<div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                  1
                </div>
<div className="flex-1 min-w-0 space-y-0.5">
<div className="flex items-center gap-2">
<span className="text-sm font-bold text-sky-700">지원 대상</span>
<span className="text-slate-400 text-xs">• 만 19~39세 무주택 청년</span>
</div>
<p className="text-xs md:text-sm text-slate-700 leading-relaxed">
                    주민등록상 서울 거주 <strong className="text-sky-600 font-semibold">만 19세~39세</strong> 무주택 1인가구 중 기준 중위소득 <strong className="text-slate-900 font-semibold">150% 이하</strong> (건강보험료 부과액 기준)
                  </p>
</div>
</div>
{/* Item 2: 지원 혜택 */}
<div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100/70 flex items-start gap-3.5">
<div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                  2
                </div>
<div className="flex-1 min-w-0 space-y-0.5">
<div className="flex items-center gap-2">
<span className="text-sm font-bold text-teal-800">지원 혜택</span>
<span className="text-slate-400 text-xs">• 현금 직접 지원</span>
</div>
<p className="text-xs md:text-sm text-slate-700 leading-relaxed">
                    실제 납부 월세 기준 <strong className="text-teal-700 font-semibold">월 최대 20만원씩 최대 12개월(총 240만원)</strong> 본인 명의 계좌로 매월 25일 생애 1회 정액 입금
                  </p>
</div>
</div>
{/* Item 3: 핵심 주의사항 */}
<div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100/70 flex items-start gap-3.5">
<div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                  3
                </div>
<div className="flex-1 min-w-0 space-y-0.5">
<div className="flex items-center gap-2">
<span className="text-sm font-bold text-rose-600">핵심 주의사항</span>
<span className="text-slate-400 text-xs">• 자격 탈락 빈발 조건</span>
</div>
<p className="text-xs md:text-sm text-slate-700 leading-relaxed">
<strong className="text-rose-600 font-semibold">부모와 주민등록상 별도 분리 세대 필수</strong>. 주택 기준은 임차보증금 <strong className="font-semibold text-slate-900">5천만원 이하</strong> 및 월세 <strong className="font-semibold text-slate-900">70만원 이하</strong> 건물에 한정됩니다.
                  </p>
</div>
</div>
</div>
<div className="pt-2 flex flex-wrap items-center justify-between text-slate-500 text-xs gap-2">
<span className="flex items-center gap-1.5 text-slate-400">
<span className="material-symbols-outlined text-[15px] text-teal-500">check_circle</span>
                난해한 행정용어 7건(환산보증금 등) 청년 친화 표현 순화 완료
              </span>
<a className="text-sky-600 hover:text-sky-700 hover:underline font-semibold flex items-center gap-0.5" href="https://housing.seoul.go.kr" target="_blank">
                공고문 원문 대조 <span className="material-symbols-outlined text-[14px]">chevron_right</span>
</a>
</div>
</div>
{/* Press Media & AI Article Analysis Section (한국경제, 매일경제, 조선비즈 분석 카드 보존) */}
<div className="bg-white rounded-2xl p-6 shadow-sm border border-sky-100 shadow-sky-100/40 space-y-5">
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
<div className="flex items-center gap-3">
{/* Newspaper / Factcheck Illustrated Icon */}
<div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-100 to-cyan-100 border border-sky-200/70 flex items-center justify-center text-sky-600 shadow-xs">
<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<rect fill="#F0F9FF" height="15" rx="2" stroke="#0284C7" width="18" x="3" y="5"></rect>
<line stroke="#38BDF8" strokeLinecap="round" strokeWidth="1.8" x1="7" x2="11" y1="9" y2="9"></line>
<line stroke="#38BDF8" strokeLinecap="round" strokeWidth="1.8" x1="7" x2="11" y1="12" y2="12"></line>
<rect fill="#BAE6FD" height="6" rx="1" stroke="#0284C7" width="4" x="13" y="9"></rect>
</svg>
</div>
<div>
<div className="flex items-center gap-2">
<h2 className="text-lg font-bold text-slate-900 tracking-tight">언론 보도 &amp; AI 기사 분석 요약</h2>
<span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-[11px] font-bold">실시간 팩트체크 &amp; 주의사항</span>
</div>
</div>
</div>
<span className="text-slate-400 text-xs flex items-center gap-1">
<span className="material-symbols-outlined text-[14px] text-teal-500">verified</span>
                교차 검증 기사 12건 분석
              </span>
</div>
<div className="space-y-3 pt-1">
{/* Article 1: 한국경제 */}
<div className="p-4 rounded-2xl bg-[#f8fafc] hover:bg-sky-50/40 transition-all space-y-2 border border-slate-100 hover:border-sky-200 group">
<div className="flex flex-wrap items-center justify-between gap-1">
<div className="flex items-center gap-2">
<span className="text-xs text-sky-600 font-bold">한국경제</span>
<span className="text-slate-400 text-[11px]">2025.04.15</span>
<span className="text-slate-300">•</span>
<div className="flex items-center gap-1">
<span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 text-[11px] font-semibold">경쟁률 분석</span>
<span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px]">가점 기준</span>
</div>
</div>
<a className="inline-flex items-center gap-0.5 text-sky-600 hover:text-sky-700 hover:underline text-xs font-semibold" href="#">
                    기사 원문 보기 <span className="material-symbols-outlined text-[14px]">open_in_new</span>
</a>
</div>
<h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                  2025 서울 청년월세 첫날 접속자 폭주 대비… 신청 성공 꿀팁
                </h3>
<div className="p-3 rounded-xl bg-white border border-slate-100 text-slate-600 text-xs leading-relaxed shadow-2xs">
<strong className="text-sky-600 font-semibold">[AI 핵심 요약]</strong> 선착순이 아닌 소득·임대료 기준 가점제이므로 마감 전 서류 보완이 핵심. 작년 대비 예산 20% 증액으로 수혜 대상 확대.
                </div>
</div>
{/* Article 2: 매일경제 */}
<div className="p-4 rounded-2xl bg-[#f8fafc] hover:bg-sky-50/40 transition-all space-y-2 border border-slate-100 hover:border-sky-200 group">
<div className="flex flex-wrap items-center justify-between gap-1">
<div className="flex items-center gap-2">
<span className="text-xs text-sky-600 font-bold">매일경제</span>
<span className="text-slate-400 text-[11px]">2025.04.18</span>
<span className="text-slate-300">•</span>
<div className="flex items-center gap-1">
<span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[11px] font-semibold">탈락 방지 팁</span>
<span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px]">환산율 계산</span>
</div>
</div>
<a className="inline-flex items-center gap-0.5 text-sky-600 hover:text-sky-700 hover:underline text-xs font-semibold" href="#">
                    기사 원문 보기 <span className="material-symbols-outlined text-[14px]">open_in_new</span>
</a>
</div>
<h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                  월세 70만원 초과 시 '보증금 월세 환산율' 미계산 주의보
                </h3>
<div className="p-3 rounded-xl bg-white border border-slate-100 text-slate-600 text-xs leading-relaxed shadow-2xs">
<strong className="text-sky-600 font-semibold">[AI 핵심 요약]</strong> 보증금 5,000만원 초과 여부뿐만 아니라 전월세 전환율(5.5%) 적용 후 환산 합산액이 기준을 넘지 않도록 계약서 명시 필요.
                </div>
</div>
{/* Article 3: 조선비즈 */}
<div className="p-4 rounded-2xl bg-[#f8fafc] hover:bg-sky-50/40 transition-all space-y-2 border border-slate-100 hover:border-sky-200 group">
<div className="flex flex-wrap items-center justify-between gap-1">
<div className="flex items-center gap-2">
<span className="text-xs text-sky-600 font-bold">조선비즈</span>
<span className="text-slate-400 text-[11px]">2025.04.12</span>
<span className="text-slate-300">•</span>
<div className="flex items-center gap-1">
<span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[11px] font-semibold">중복수혜 가이드</span>
</div>
</div>
<a className="inline-flex items-center gap-0.5 text-sky-600 hover:text-sky-700 hover:underline text-xs font-semibold" href="#">
                    기사 원문 보기 <span className="material-symbols-outlined text-[14px]">open_in_new</span>
</a>
</div>
<h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                  청년월세 특별지원 2차, 청년도약계좌와 중복 수혜 가능할까?
                </h3>
<div className="p-3 rounded-xl bg-white border border-slate-100 text-slate-600 text-xs leading-relaxed shadow-2xs">
<strong className="text-sky-600 font-semibold">[AI 핵심 요약]</strong> 금융 자산 형성 사업(도약계좌, 청년내일저축)과는 전면 중복 수혜 허용. 단, 지자체 유사 주거 바우처와는 중복 불가.
                </div>
</div>
</div>
{/* News Factcheck Callout Box */}
<div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100 flex items-start gap-2.5">
<span className="material-symbols-outlined text-sky-600 text-[18px] shrink-0 mt-0.5">lightbulb</span>
<p className="text-xs text-slate-600 leading-relaxed">
<strong className="text-slate-900 font-semibold">AI 뉴스 팩트체크:</strong> 본 기사 요약은 네이버·다음 등 공식 언론사 보도 12건을 교차 분석하여 청년 신청자에게 필수적인 정보만 3줄 요약한 내용입니다.
              </p>
</div>
</div>
{/* Timeline and Required Documents 2-Card Layout */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
{/* Timeline Card */}
<div className="bg-white rounded-2xl p-5 shadow-sm border border-sky-100 shadow-sky-100/40 space-y-4 flex flex-col justify-between">
<div className="space-y-3">
<div className="flex items-center gap-2 text-sky-600">
<span className="material-symbols-outlined text-[20px]">calendar_month</span>
<h3 className="font-bold text-sm text-slate-900">추진 일정 &amp; 지급 타임라인</h3>
</div>
<div className="space-y-2 pt-1 text-xs">
<div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/60 border border-rose-100/70">
<span className="font-semibold text-slate-800">신청 접수 마감</span>
<span className="text-rose-600 font-extrabold">2025.04.30 18:00</span>
</div>
<div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
<span className="text-slate-600">자격 심사 &amp; 소득조사</span>
<span className="text-slate-800 font-medium">05.01 ~ 06.15</span>
</div>
<div className="flex items-center justify-between p-2.5 rounded-xl bg-sky-50/60 border border-sky-100/70">
<span className="font-semibold text-slate-800">최종 선정자 발표</span>
<span className="text-sky-600 font-extrabold">2025.06.27 (금)</span>
</div>
<div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
<span className="text-slate-600">1회차 지원금 입금</span>
<span className="text-slate-800 font-medium">2025.07.25 (매월 25일)</span>
</div>
</div>
</div>
<div className="text-slate-400 text-[11px] pt-2 border-t border-slate-100">
                * 선정자 발표는 서울주거포털 마이페이지 및 알림톡 개별 통보
              </div>
</div>
{/* Required Documents Card */}
<div className="bg-white rounded-2xl p-5 shadow-sm border border-sky-100 shadow-sky-100/40 space-y-4 flex flex-col justify-between">
<div className="space-y-3">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2 text-sky-600">
<span className="material-symbols-outlined text-[20px]">description</span>
<h3 className="font-bold text-sm text-slate-900">필수 제출 서류 (3종)</h3>
</div>
<span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">PDF/JPG</span>
</div>
<div className="space-y-2 pt-1 text-xs">
<div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
<div className="flex items-center justify-between">
<span className="font-semibold text-slate-800">1. 확정일자부 임대차계약서</span>
<span className="text-rose-500 text-[11px] font-bold">필수</span>
</div>
<p className="text-slate-500 text-[11px]">공인중개사 날인 및 확정일자 표기된 전체 사본</p>
</div>
<div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
<div className="flex items-center justify-between">
<span className="font-semibold text-slate-800">2. 주민등록등본 (1개월 내)</span>
<span className="text-teal-600 text-[11px] font-bold">정부24 무료</span>
</div>
<p className="text-slate-500 text-[11px]">주민번호 뒷자리 및 세대원 전체 표기 출력분</p>
</div>
<div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
<div className="flex items-center justify-between">
<span className="font-semibold text-slate-800">3. 최근 3개월 월세 이체내역</span>
<span className="text-sky-600 text-[11px] font-bold">은행 증빙</span>
</div>
<p className="text-slate-500 text-[11px]">통장 입금자명·수취인명·월세액 확인 가능한 명세</p>
</div>
</div>
</div>
<div className="text-rose-500 text-[11px] pt-2 border-t border-slate-100">
                * 현금 수기 영수증은 증빙으로 인정되지 않습니다.
              </div>
</div>
</div>
{/* Related Recommendation Banner (Pastel Card Style matching Screen 4) */}
<div className="bg-white rounded-2xl p-6 shadow-sm border border-sky-100 shadow-sky-100/40 space-y-4">
<div className="flex items-center justify-between">
<div className="space-y-0.5">
<h3 className="text-base font-bold text-slate-900">함께 신청하면 유리한 주거·금융 연계 정책</h3>
<p className="text-xs text-slate-500">월세 지원과 중복 수혜가 가능한 저리 대출 및 청약 혜택</p>
</div>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
{/* Related Card 1 */}
<div className="p-4 rounded-2xl bg-[#f8fafc] hover:bg-sky-50/50 transition-all flex flex-col justify-between border border-slate-100 hover:border-sky-200 group">
<div className="space-y-1.5">
<div className="flex items-center justify-between">
<span className="text-slate-400 text-[11px]">서울시 주택정책과</span>
<span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[11px] font-bold">95% 적합</span>
</div>
<h4 className="text-sm font-bold text-slate-800 group-hover:text-sky-600 transition-colors cursor-pointer">
                    서울 청년 임차보증금 이자지원
                  </h4>
<p className="text-xs text-slate-500">
                    최대 7,000만원 대출에 연 2.0% 이차보전 지원
                  </p>
</div>
<div className="pt-4 flex items-center justify-between text-xs">
<span className="text-sky-600 font-semibold">상시 접수</span>
<span className="text-slate-400 group-hover:text-sky-600 flex items-center gap-0.5 cursor-pointer font-medium">상세보기 <span className="material-symbols-outlined text-[14px]">chevron_right</span></span>
</div>
</div>
{/* Related Card 2 */}
<div className="p-4 rounded-2xl bg-[#f8fafc] hover:bg-sky-50/50 transition-all flex flex-col justify-between border border-slate-100 hover:border-sky-200 group">
<div className="space-y-1.5">
<div className="flex items-center justify-between">
<span className="text-slate-400 text-[11px]">서울주택도시공사 (SH)</span>
<span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[11px] font-bold">92% 적합</span>
</div>
<h4 className="text-sm font-bold text-slate-800 group-hover:text-sky-600 transition-colors cursor-pointer">
                    역세권 청년안심주택 공공임대
                  </h4>
<p className="text-xs text-slate-500">
                    시세 대비 30~50% 저렴한 신축 임대 아파트
                  </p>
</div>
<div className="pt-4 flex items-center justify-between text-xs">
<span className="text-rose-600 font-semibold">D-12 마감</span>
<span className="text-slate-400 group-hover:text-sky-600 flex items-center gap-0.5 cursor-pointer font-medium">상세보기 <span className="material-symbols-outlined text-[14px]">chevron_right</span></span>
</div>
</div>
</div>
</div>
</div>
{/* Right Sticky Application Rail Panel (4 Cols) */}
<div className="lg:col-span-4 space-y-5 sticky top-20">
{/* Floating Action Main Card */}
<div className="bg-white rounded-2xl p-5 shadow-sm border border-sky-100 shadow-sky-100/40 space-y-4">
{/* Top Urgency Ribbon */}
<div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
<div className="flex items-center gap-1.5">
<span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
<span className="text-xs font-bold text-rose-600 whitespace-nowrap">접수 마감 D-3</span>
</div>
<span className="text-xs text-slate-400">선착순 아님 (배점순)</span>
</div>
{/* Deadline Box */}
<div className="p-4 rounded-xl bg-rose-50/70 border border-rose-100 space-y-1">
<span className="text-xs text-rose-700 font-semibold block">최종 접수 마감 시각</span>
<div className="text-xl font-extrabold text-rose-600 tracking-tight">
                2025. 04. 30 (수) 18:00
              </div>
<p className="text-[11px] text-rose-600/80">
                * 마감일 접속 폭주 대비 전일 접수를 권장합니다.
              </p>
</div>
{/* Progress Bar Check Counter */}
<div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100 space-y-2">
<div className="flex items-center justify-between text-xs">
<span className="text-slate-600">신청 전 필수 조건 점검</span>
<span className="text-sky-600 font-bold" id="rail-checklist-counter">4개 중 3개 완료</span>
</div>
<div className="w-full h-2 rounded-full bg-sky-100 overflow-hidden">
<div className="h-2 rounded-full bg-sky-500 transition-all duration-300" id="rail-progress-bar" style={{ width: '75%' }}></div>
</div>
<div className="flex justify-between items-center text-[11px] pt-0.5 text-slate-500">
<span className="">예상 선정 확률</span>
<span className="text-teal-600 font-bold">매우 높음 (A등급)</span>
</div>
</div>
{/* Big Direct CTA Buttons */}
<div className="space-y-2 pt-1">
<a className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-sky-200 transition-all text-center" href="https://housing.seoul.go.kr" rel="noopener noreferrer" target="_blank">
<span className="">공식 신청 바로가기 (서울주거포털)</span>
<span className="material-symbols-outlined text-[18px]">open_in_new</span>
</a>
<button className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-sky-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200 shadow-2xs" id="calendar-add-btn">
<span className="material-symbols-outlined text-[17px] text-sky-600">event</span>
<span className="" id="calendar-btn-text">구글/네이버 캘린더에 마감일 등록</span>
</button>
<div className="grid grid-cols-2 gap-2 pt-0.5">
<button className="py-2.5 px-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-sky-600 text-xs flex items-center justify-center gap-1 transition-colors border border-slate-200 shadow-2xs">
<span className="material-symbols-outlined text-[16px] text-slate-400">picture_as_pdf</span>
<span className="">원문 PDF 받기</span>
</button>
<button className="py-2.5 px-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-sky-600 text-xs flex items-center justify-center gap-1 transition-colors border border-slate-200 shadow-2xs" id="scrap-toggle-btn">
<span className="material-symbols-outlined text-[16px] text-slate-400" id="scrap-icon">bookmark_border</span>
<span className="" id="scrap-text">스크랩 보관함</span>
</button>
</div>
</div>
{/* Share and Support */}
<div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-400 text-xs">
<div className="flex items-center gap-3">
<button className="hover:text-sky-600 flex items-center gap-1 transition-colors">
<span className="material-symbols-outlined text-[15px]">share</span>
                  공유
                </button>
<span className="">•</span>
<button className="hover:text-sky-600 flex items-center gap-1 transition-colors">
<span className="material-symbols-outlined text-[15px]">call</span>
                  문의 1877-2030
                </button>
</div>
<span className="text-[11px] text-slate-400">공고 2025-04</span>
</div>
</div>
{/* Self-Eligibility Verification Widget (3/4 충족 상태 보존) */}
<div className="bg-white rounded-2xl p-5 shadow-sm border border-sky-100 shadow-sky-100/40 space-y-3">
<div className="flex items-center justify-between pb-2 border-b border-slate-100">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-sky-600 text-[20px]">checklist_rtl</span>
<h3 className="font-bold text-sm text-slate-900">내 자격 요건 간이 진단</h3>
</div>
<span className="px-2.5 py-0.5 rounded-full text-xs bg-teal-50 border border-teal-200 text-teal-700 font-bold whitespace-nowrap" id="qualification-badge">3 / 4 충족</span>
</div>
<div className="space-y-2">
<div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-teal-500 text-[18px]">check_circle</span>
<span className="font-medium text-slate-800">나이 (만 19~39세)</span>
</div>
<span className="text-teal-600 font-semibold">만 26세 충족</span>
</div>
<div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-teal-500 text-[18px]">check_circle</span>
<span className="font-medium text-slate-800">거주지 (서울 전입)</span>
</div>
<span className="text-teal-600 font-semibold">마포구 충족</span>
</div>
<div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-amber-500 text-[18px]">help_outline</span>
<span className="font-medium text-slate-800">소득 (중위 150% 이하)</span>
</div>
<button className="px-2.5 py-0.5 bg-white text-sky-600 text-[11px] font-bold rounded-lg hover:bg-sky-50 border border-sky-200 inline-flex items-center gap-1 shadow-2xs" type="button">
<span className="material-symbols-outlined text-[12px]">sync</span>확인 필요
                </button>
</div>
<div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-teal-500 text-[18px]">check_circle</span>
<span className="font-medium text-slate-800">주택 (보증 5천/월 70만↓)</span>
</div>
<span className="text-teal-600 font-semibold">2천/55만 충족</span>
</div>
</div>
<div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100 text-slate-600 text-xs flex items-center gap-1.5">
<span className="material-symbols-outlined text-sky-600 text-[16px] shrink-0">info</span>
<span className="">소득 요건만 체크하면 최종 신청 적격 <strong className="text-sky-600 font-semibold">(예상 7분)</strong></span>
</div>
</div>
{/* AI Guidance TIP Box (Screen 4 Style Consultation Card) */}
<div className="rounded-2xl bg-gradient-to-br from-white via-indigo-50/30 to-sky-50/50 p-5 border border-sky-100 shadow-sm space-y-2.5">
<div className="flex items-center gap-2 text-indigo-600">
<span className="material-symbols-outlined text-[20px]">lightbulb</span>
<span className="font-bold text-sm text-slate-900">청년나침반 AI 신청 TIP</span>
</div>
<p className="text-xs text-slate-600 leading-relaxed">
              임대차계약서의 임대인 성명과 월세 입금 통장의 수취인 성명이 다른 경우(예: 가족 대리인), 가족관계증명서나 임대인 위임장을 신청 서류 업로드 시 미리 추가하면 보완 요청 없이 1차 합격됩니다.
            </p>
</div>
</div>
</div>
</div>
</main>
  );
};

export default DetailView;
