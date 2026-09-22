import React, { useEffect } from 'react';

interface CalendarViewProps {
  onNavigate?: (path: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onNavigate }) => {
  
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
      const kanbanBtn = (e.target as HTMLElement).closest('#viewToggleKanban');
      if (kanbanBtn && onNavigate) {
        e.preventDefault();
        onNavigate('deadline-calendar');
      }
    };
    document.addEventListener('click', handleDataPath);
    return () => document.removeEventListener('click', handleDataPath);
  }, [onNavigate]);


  return (
    <main className="flex-1 w-full pt-20 pb-16 bg-[#f8fafc] max-w-[1240px] mx-auto px-4 md:px-8"><div className="flex flex-col w-full space-y-6">
{/* Top Title & Controls Hero (Pastel Sky-Lavender Gradient) */}
<section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-100/70 via-indigo-50/50 to-teal-50/70 p-6 md:p-8 border border-sky-200/60 shadow-sm shadow-sky-100/50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
<div className="absolute -right-8 -top-10 w-72 h-72 rounded-full bg-teal-200/30 blur-3xl pointer-events-none"></div>
<div className="absolute left-1/3 -bottom-10 w-64 h-64 rounded-full bg-sky-200/40 blur-3xl pointer-events-none"></div>
<div className="space-y-2 relative z-10 max-w-2xl">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/85 border border-sky-200/70 shadow-xs text-sky-800 text-xs font-semibold backdrop-blur-md">
<span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span></span>
<span className="">신청 일정 트래커 · 스마트 공고 관리</span>
</div>
<h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
      마감일 캘린더 &amp; 맞춤 알림함 🗓️
    </h1>
<p className="text-slate-600 text-sm leading-relaxed">
      스크랩한 맞춤 정책의 마감일과 준비 서류 일정을 한눈에 점검하고 놓치지 마세요.
    </p>
</div>
<div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
<div className="inline-flex bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-sky-100 shadow-sm">
<button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500 text-white shadow-sm transition-all" id="viewToggleCal">
<span className="material-symbols-outlined text-[17px]">calendar_month</span>
<span className="">월별 캘린더</span>
</button>
<button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-sky-600 transition-all" id="viewToggleKanban">
<span className="material-symbols-outlined text-[17px]">view_kanban</span>
<span className="">상태별 칸반</span>
</button>
</div>
<button className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold text-xs shadow-sm shadow-sky-200 transition-all">
<span className="material-symbols-outlined text-[17px]">add_task</span>
<span className="">내 정책 일정 추가</span>
</button>
</div>
</section>
{/* Category Badges Bar (Illustrative Pastel 5 Domains) */}
<div className="flex items-center justify-between gap-4 flex-wrap">
<div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" id="category-filter-chips"><button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold text-xs transition-all shadow-xs bg-sky-600 text-white border border-sky-600 shrink-0 select-none" style={{ whiteSpace: 'nowrap' }}><span className="">✨ 전체 (8)</span></button><button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold text-xs transition-all bg-white text-slate-700 hover:bg-amber-50 border border-slate-200/80 shadow-xs shrink-0 select-none" style={{ whiteSpace: 'nowrap' }}><span className="w-4 h-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px]">💼</span><span className="">일자리</span></button><button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold text-xs transition-all bg-white text-slate-700 hover:bg-rose-50 border border-slate-200/80 shadow-xs shrink-0 select-none" style={{ whiteSpace: 'nowrap' }}><span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[10px]">🏡</span><span className="">주거</span></button><button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold text-xs transition-all bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200/80 shadow-xs shrink-0 select-none" style={{ whiteSpace: 'nowrap' }}><span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px]">🎓</span><span className="">교육·직업훈련</span></button><button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold text-xs transition-all bg-white text-slate-700 hover:bg-purple-50 border border-slate-200/80 shadow-xs shrink-0 select-none" style={{ whiteSpace: 'nowrap' }}><span className="w-4 h-4 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px]">🪙</span><span className="">금융·복지·문화</span></button><button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold text-xs transition-all bg-white text-slate-700 hover:bg-sky-50 border border-slate-200/80 shadow-xs shrink-0 select-none" style={{ whiteSpace: 'nowrap' }}><span className="w-4 h-4 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-[10px]">💬</span><span className="">참여·기반</span></button></div>
<div className="flex items-center gap-2 text-slate-500 text-xs font-medium bg-white px-3 py-1.5 rounded-full border border-slate-200/70 shadow-xs">
<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
<span className="">4월 30일 마감 4건 집중 관리 중</span>
</div>
</div>
{/* Main Grid Layout (8 cols Calendar + 4 cols Action Panel) */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
{/* Left & Center: Interactive Calendar Section (8 cols) */}
<section className="lg:col-span-8 space-y-5">
{/* Calendar Card */}
<div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-sm space-y-4">
{/* Month Header & Filters */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-sky-100/70">
<div className="flex items-center gap-2.5">
<div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200/70">
<button className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-white hover:text-sky-600 hover:shadow-xs transition-colors">
<span className="material-symbols-outlined text-[20px]">chevron_left</span>
</button>
<span className="text-base md:text-lg text-slate-900 px-2 tracking-tight font-extrabold flex items-center gap-1.5">
<span className="">2025년 4월</span>
<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">Spring</span>
</span>
<button className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-white hover:text-sky-600 hover:shadow-xs transition-colors">
<span className="material-symbols-outlined text-[20px]">chevron_right</span>
</button>
</div>
<button className="px-3 py-1.5 rounded-xl text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold transition-colors border border-sky-200/60">오늘</button>
</div>
{/* Filter Checkboxes */}
<div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
<label className="inline-flex items-center gap-1.5 cursor-pointer select-none hover:text-sky-700 bg-slate-50 hover:bg-sky-50/60 px-2.5 py-1 rounded-xl border border-slate-200/60 transition-colors">
<input defaultChecked={true} className="w-3.5 h-3.5 rounded text-sky-600 accent-sky-600 cursor-pointer" type="checkbox" />
<span className="font-bold text-sky-700">내 스크랩 정책만</span>
</label>
<label className="inline-flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-900 px-2 py-1">
<input defaultChecked={true} className="w-3.5 h-3.5 rounded text-sky-600 accent-sky-600 cursor-pointer" type="checkbox" />
<span className="">신청 준비 중</span>
</label>
<label className="inline-flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-900 px-2 py-1">
<input className="w-3.5 h-3.5 rounded text-sky-600 accent-sky-600 cursor-pointer" type="checkbox" />
<span className="">결과 발표 일정</span>
</label>
</div>
</div>
{/* Color Legend Strip (Pastel illustrated badges) */}
<div className="flex flex-wrap items-center justify-between gap-2 py-2 px-3.5 bg-gradient-to-r from-sky-50/60 via-slate-50 to-indigo-50/40 rounded-2xl border border-sky-100/60 text-xs text-slate-600" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>
<div className="flex items-center gap-1.5">
<span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs ring-2 ring-rose-100"></span>
<span className="font-medium text-slate-700">D-Day 당일 마감</span>
</div>
<div className="flex items-center gap-1.5">
<span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs ring-2 ring-sky-100"></span>
<span className="font-medium text-slate-700">마감 임박 (D-7 이내)</span>
</div>
<div className="flex items-center gap-1.5">
<span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-xs ring-2 ring-teal-100"></span>
<span className="font-medium text-slate-700">접수 중 (D-30 이내)</span>
</div>
<div className="flex items-center gap-1.5">
<span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs ring-2 ring-amber-100"></span>
<span className="font-medium text-slate-700">사전공고 / 상시</span>
</div>
</div>
{/* Calendar Grid Table */}
<div className="w-full flex flex-col">
{/* Day of Week Headers */}
<div className="grid grid-cols-7 text-center text-xs py-2 text-slate-500 bg-slate-50/80 rounded-xl mb-1.5 font-bold">
<span className="text-rose-500">일</span>
<span className="">월</span>
<span className="">화</span>
<span className="">수</span>
<span className="">목</span>
<span className="">금</span>
<span className="text-sky-600">토</span>
</div>
{/* Calendar Cells Grid */}
<div className="grid grid-cols-7 gap-1.5 pt-1 min-h-[500px]">
{/* Week 1 */}
<div className="min-h-[96px] p-2 rounded-2xl bg-slate-50/40 opacity-40 flex flex-col gap-1 border border-transparent">
<span className="text-xs font-semibold text-slate-400">30</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-slate-50/40 opacity-40 flex flex-col gap-1 border border-transparent">
<span className="text-xs font-semibold text-slate-400">31</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-semibold text-slate-700">1</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-semibold text-slate-700">2</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-semibold text-slate-700">3</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-semibold text-slate-700">4</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-bold text-sky-600">5</span>
</div>
{/* Week 2 */}
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-bold text-rose-500">6</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-semibold text-slate-700">7</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-semibold text-slate-700">8</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-semibold text-slate-700">9</span>
</div>
{/* Apr 10: Event */}
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-semibold text-slate-700">10</span>
<div className="bg-purple-50 border border-purple-200/80 px-1.5 py-1 rounded-lg text-[10px] font-semibold text-purple-700 truncate flex items-center gap-1 shadow-2xs">
<span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
<span className="truncate">지자체 학자금대출 지원</span>
</div>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-semibold text-slate-700">11</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-bold text-sky-600">12</span>
</div>
{/* Week 3 */}
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-bold text-rose-500">13</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-semibold text-slate-700">14</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-semibold text-slate-700">15</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-semibold text-slate-700">16</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-semibold text-slate-700">17</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-semibold text-slate-700">18</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-bold text-sky-600">19</span>
</div>
{/* Week 4 */}
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-bold text-rose-500">20</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-semibold text-slate-700">21</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-semibold text-slate-700">22</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-semibold text-slate-700">23</span>
</div>
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-semibold text-slate-700">24</span>
</div>
{/* Apr 25: Pastel Coral D-Day */}
<div className="min-h-[96px] p-2 rounded-2xl bg-rose-50/70 border border-rose-200/90 flex flex-col gap-1 shadow-xs">
<div className="flex items-center justify-between">
<span className="text-xs font-extrabold text-rose-600">25</span>
<span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-bold">오늘 마감</span>
</div>
<div className="bg-white/90 p-1.5 rounded-xl border border-rose-200/80 shadow-2xs flex flex-col gap-0.5">
<span className="text-rose-600 text-[11px] font-bold truncate">청년 자격증 응시료</span>
<span className="text-slate-400 text-[10px]">18:00 접수마감</span>
</div>
</div>
{/* Apr 26 */}
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-bold text-sky-600">26</span>
</div>
{/* Week 5 */}
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-bold text-rose-500">27</span>
</div>
{/* Apr 28: D-3 Sky Pastel */}
<div className="min-h-[96px] p-2 rounded-2xl bg-sky-50/80 border border-sky-200/90 flex flex-col gap-1 shadow-xs">
<div className="flex items-center justify-between">
<span className="text-xs font-extrabold text-sky-700">28</span>
<span className="text-[10px] bg-sky-500 text-white px-1.5 py-0.5 rounded-full font-bold">D-3</span>
</div>
<div className="bg-white/90 p-1.5 rounded-xl border border-sky-200/70 shadow-2xs flex flex-col gap-0.5">
<span className="text-sky-700 text-[11px] font-bold truncate">서울 청년 월세지원</span>
<span className="text-slate-400 text-[10px]">서울주거포털</span>
</div>
</div>
{/* Apr 29 */}
<div className="min-h-[96px] p-2 rounded-2xl bg-white border border-slate-100 hover:border-sky-200 hover:shadow-xs transition-colors flex flex-col gap-1">
<span className="text-xs font-semibold text-slate-700">29</span>
</div>
{/* Apr 30: Focused Multi-Deadline Date with Popover */}
<div className="min-h-[96px] p-1.5 rounded-2xl bg-gradient-to-b from-sky-50/90 to-indigo-50/50 border-2 border-sky-400 relative flex flex-col gap-1 shadow-md shadow-sky-100 ring-2 ring-sky-200/50 z-10 group cursor-pointer"><div className="flex items-center justify-between"><div className="flex items-center gap-1"><span className="text-xs font-extrabold text-sky-800">30</span><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span></div><span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold shadow-xs shrink-0" style={{ whiteSpace: 'nowrap' }}>4건 마감</span></div><div className="flex flex-col gap-1"><div className="bg-white/90 border border-rose-200 text-rose-600 px-1.5 py-0.5 rounded-lg text-[10px] font-bold truncate flex items-center gap-1 shadow-2xs"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span><span className="truncate">[18:00] 취업도약 응시료</span></div><div className="bg-white/90 border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded-lg text-[10px] font-bold truncate flex items-center gap-1 shadow-2xs"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span><span className="truncate">[23:59] 서울 청년월세 2차</span></div><div className="bg-sky-100/70 border border-sky-200 hover:bg-sky-100 text-sky-700 font-bold px-1.5 py-0.5 rounded-lg text-[10px] flex items-center justify-between transition-colors" style={{ whiteSpace: 'nowrap' }}><span className="">+ 2건 더보기</span><span className="text-[9px] text-sky-600/80 font-semibold ml-1 shrink-0">총 4건</span></div></div><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-white/95 rounded-2xl shadow-xl border border-sky-100 p-4 hidden group-hover:flex flex-col gap-2.5 z-50 pointer-events-auto backdrop-blur-xl"><div className="flex items-center justify-between border-b border-sky-100 pb-2"><div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[17px] text-sky-600">event_available</span><span className="text-xs text-slate-900 font-extrabold" style={{ whiteSpace: 'nowrap' }}>4월 30일(수) 마감 정책 (총 4건)</span></div><span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-bold shrink-0" style={{ whiteSpace: 'nowrap' }}>선택일정</span></div><div className="space-y-1.5 text-[11px]"><div className="p-2 rounded-xl bg-rose-50/70 flex items-center justify-between border-l-3 border-rose-500"><div className="flex flex-col pr-1"><span className="font-bold text-slate-900">청년취업도약 응시료 지원</span><span className="text-[10px] text-slate-500">한국산업인력공단 · 어학/자격증</span></div><span className="font-bold text-rose-600 shrink-0" style={{ whiteSpace: 'nowrap' }}>18:00 (D-Day)</span></div><div className="p-2 rounded-xl bg-amber-50/70 flex items-center justify-between border-l-3 border-amber-500"><div className="flex flex-col pr-1"><span className="font-bold text-slate-900">서울 청년월세 특별지원</span><span className="text-[10px] text-slate-500">서울주거포털 · 최대 240만</span></div><span className="font-bold text-amber-600 shrink-0" style={{ whiteSpace: 'nowrap' }}>23:59 (D-Day)</span></div><div className="p-2 rounded-xl bg-purple-50/70 flex items-center justify-between border-l-3 border-purple-500"><div className="flex flex-col pr-1"><span className="font-semibold text-slate-900">K-디지털 IT 직무부트캠프</span><span className="text-[10px] text-slate-500">고용노동부 · 국비전액</span></div><span className="font-bold text-purple-600 shrink-0" style={{ whiteSpace: 'nowrap' }}>23:59</span></div><div className="p-2 rounded-xl bg-teal-50/70 flex items-center justify-between border-l-3 border-teal-500"><div className="flex flex-col pr-1"><span className="font-semibold text-slate-900">청년내일저축계좌 1차 모집</span><span className="text-[10px] text-slate-500">복지로 · 자산형성 매칭</span></div><span className="font-bold text-teal-600 shrink-0" style={{ whiteSpace: 'nowrap' }}>24:00</span></div></div><div className="pt-1.5 border-t border-sky-100 flex items-center justify-between text-[10px] text-slate-500"><span className="" style={{ whiteSpace: 'nowrap' }}>우측 패널에서 상세 서류 확인</span><span className="text-sky-600 font-bold flex items-center gap-0.5 shrink-0" style={{ whiteSpace: 'nowrap' }}>우측 패널 보기 <span className="material-symbols-outlined text-[12px]">arrow_forward</span></span></div></div></div>
{/* May 1 (Next Month) */}
<div className="min-h-[96px] p-2 rounded-2xl bg-slate-50/40 flex flex-col gap-1 border border-transparent">
<span className="text-xs font-semibold text-slate-400">5/1</span>
</div>
{/* May 2: D-7 Teal Pastel */}
<div className="min-h-[96px] p-2 rounded-2xl bg-teal-50/80 border border-teal-200/90 flex flex-col gap-1 shadow-xs">
<div className="flex items-center justify-between">
<span className="text-xs font-extrabold text-teal-700">5/2</span>
<span className="text-[10px] bg-teal-600 text-white px-1.5 py-0.5 rounded-full font-bold">D-7</span>
</div>
<div className="bg-white/90 p-1.5 rounded-xl border border-teal-200/70 shadow-2xs flex flex-col gap-0.5">
<span className="text-teal-700 text-[11px] font-bold truncate">청년도약계좌 신청</span>
<span className="text-slate-400 text-[10px]">서민금융진흥원</span>
</div>
</div>
{/* May 3 */}
<div className="min-h-[96px] p-2 rounded-2xl bg-slate-50/40 flex flex-col gap-1 border border-transparent">
<span className="text-xs font-semibold text-slate-400">5/3</span>
</div>
{/* Scheduled Highlight Snippet Strip */}
<div className="col-span-7 mt-1 p-3.5 bg-gradient-to-r from-sky-50 via-indigo-50/40 to-teal-50/50 rounded-2xl flex items-center justify-between gap-3 border border-sky-100">
<div className="flex items-center gap-2.5">
<span className="text-xs bg-white text-sky-700 font-bold px-3 py-1 rounded-full border border-sky-200/80 shadow-2xs">5월 15일 예정 · D-20</span>
<span className="text-xs text-slate-700 font-medium">국민취업지원제도 청년특화형 구직수당 정기 집중 접수 개시</span>
</div>
<button className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 hover:underline shrink-0">
<span className="">미리 알림 등록</span>
<span className="material-symbols-outlined text-[16px]">notifications_active</span>
</button>
</div>
</div>
</div>
</div>
{/* Kanban View Placeholder (Hidden Toggle) */}
<div className="hidden grid grid-cols-1 md:grid-cols-3 gap-4" id="kanbanBoardView">
<div className="bg-white p-4 rounded-2xl flex flex-col gap-3 border border-slate-200/80 shadow-xs">
<div className="flex items-center justify-between text-xs text-slate-900 pb-2 border-b border-slate-100">
<span className="flex items-center gap-1.5 font-bold"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> 관심 및 탐색 중</span>
<span className="text-slate-400 font-semibold">2건</span>
</div>
<div className="bg-slate-50 p-3 rounded-xl flex flex-col gap-1">
<span className="text-xs text-slate-900 font-bold">청년 주택청약 특별공급</span>
<p className="text-[11px] text-slate-500">자격 조건 확인 완료 · 6월 공고 대기</p>
</div>
<div className="bg-slate-50 p-3 rounded-xl flex flex-col gap-1">
<span className="text-xs text-slate-900 font-bold">청년 문화예술패스 2차</span>
<p className="text-[11px] text-slate-500">신청 사이트 사전 계정 확인 필요</p>
</div>
</div>
<div className="bg-white p-4 rounded-2xl flex flex-col gap-3 border border-sky-200 shadow-xs">
<div className="flex items-center justify-between text-xs text-slate-900 pb-2 border-b border-sky-100">
<span className="flex items-center gap-1.5 font-bold"><span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> 서류 준비 중</span>
<span className="text-sky-600 font-bold">1건</span>
</div>
<div className="bg-sky-50/60 p-3 rounded-xl flex flex-col gap-1 border border-sky-100">
<span className="text-xs text-slate-900 font-bold">서울시 청년 월세지원</span>
<p className="text-[11px] text-slate-500">확정일자 임대차계약서 업로드 대기</p>
</div>
</div>
<div className="bg-white p-4 rounded-2xl flex flex-col gap-3 border border-teal-200 shadow-xs">
<div className="flex items-center justify-between text-xs text-slate-900 pb-2 border-b border-teal-100">
<span className="flex items-center gap-1.5 font-bold"><span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> 신청 완료 / 심사 중</span>
<span className="text-teal-600 font-bold">1건</span>
</div>
<div className="bg-teal-50/60 p-3 rounded-xl flex flex-col gap-1 border border-teal-100">
<span className="text-xs text-slate-900 font-bold">K-디지털 트레이닝 바우처</span>
<p className="text-[11px] text-slate-500">고용센터 자격 확인 서류 통과 완료</p>
</div>
</div>
</div>
{/* Integrated Application Progress Visualizer Card (Pastel Illustrated) */}
<div className="rounded-3xl bg-white p-6 border border-sky-100 shadow-sm flex flex-col sm:flex-row items-center gap-6">
<div className="w-24 h-24 relative flex items-center justify-center shrink-0">
<svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
<path className="text-sky-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
<path className="text-sky-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="75, 100" strokeLinecap="round" strokeWidth="3.5"></path>
</svg>
<div className="absolute flex flex-col items-center">
<span className="text-xl font-extrabold text-sky-600">75%</span>
<span className="text-[11px] text-slate-400 font-semibold">준비율</span>
</div>
</div>
<div className="flex flex-col gap-1.5 flex-1" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>
<div className="flex items-center gap-2">
<span className="text-base font-bold text-slate-900">이번 주 마감 서류 1건 대기 중</span>
<span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 font-bold">긴급</span>
</div>
<p className="text-xs text-slate-600 leading-relaxed">
      스크랩한 총 4개 정책 중 2건은 온라인 접수 단계이며, [서울 청년 월세지원]은 임대차 계약서 사본 제출이 완료되면 바로 접수 가능합니다.
    </p>
<div className="flex items-center gap-4 pt-1 text-slate-500 text-xs">
<span className="flex items-center gap-1.5 font-medium text-sky-700"><span className="material-symbols-outlined text-[16px] text-sky-500">check_circle</span> 온라인 제출 3건</span>
<span className="flex items-center gap-1.5 font-medium text-teal-700"><span className="material-symbols-outlined text-[16px] text-teal-500">help</span> 오프라인 방문 0건</span>
</div>
</div>
</div>
</section>
{/* Right Side: D-Day Deadline Action List & Notification Settings (4 cols) */}
<section className="lg:col-span-4 space-y-5">
{/* Section Header & Selected Date Subhead */}
<div className="space-y-2">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-500">
<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<circle cx="12" cy="12" fill="#FFE4E6" r="9"></circle>
<polyline points="12 7 12 12 15 15" stroke="#F43F5E"></polyline>
</svg>
</div>
<h2 className="text-base font-bold text-slate-900">마감 임박 정책</h2>
</div>
<span className="text-xs bg-rose-50 border border-rose-200 text-rose-600 px-3 py-1 rounded-full font-bold animate-pulse">4월 30일 당일 마감</span>
</div>
{/* Date Selection Banner & Sort Control */}
<div className="p-3 bg-gradient-to-r from-sky-50 to-indigo-50/60 rounded-2xl border border-sky-200/70 flex items-center justify-between shadow-2xs" style={{ whiteSpace: 'nowrap' }}>
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-sky-600 text-[18px]">calendar_today</span>
<span className="text-xs text-sky-800 font-extrabold">4월 30일(수) 선택 정책</span>
<span className="text-[10px] bg-sky-500 text-white px-2 py-0.5 rounded-full font-bold">총 4건</span>
</div>
<span className="text-[11px] text-slate-500 flex items-center gap-0.5 font-medium">
        마감시각순
        <span className="material-symbols-outlined text-[13px]">swap_vert</span>
</span>
</div>
</div>
{/* Action Card 1: 청년 취업도약 응시료 지원 (18:00 마감 - 1순위) */}
<div className="bg-white p-5 rounded-2xl shadow-sm border border-rose-200 hover:border-rose-300 transition-all flex flex-col gap-4 group">
<div className="flex items-start justify-between gap-2">
<div className="flex flex-col gap-1">
<div className="flex items-center gap-2">
<div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<rect fill="#FEF3C7" height="13" rx="2" stroke="#F59E0B" width="18" x="3" y="7"></rect>
<path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#D97706"></path>
</svg>
</div>
<div>
<span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold">일자리</span>
<span className="inline-block ml-1 px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-bold">준비율 100%</span>
</div>
</div>
<h3 className="font-bold text-base text-slate-900 group-hover:text-sky-600 transition-colors pt-1">
          청년 취업도약 응시료 지원
        </h3>
</div>
<span className="shrink-0 text-xs px-2.5 py-1 rounded-xl bg-rose-500 text-white font-extrabold flex items-center gap-1 shadow-xs">
<span className="material-symbols-outlined text-[14px]">alarm</span>
        18:00 마감
      </span>
</div>
{/* Meta Info */}
<div className="bg-slate-50 p-3 rounded-xl flex flex-col gap-1.5 text-xs">
<div className="flex items-center justify-between">
<span className="text-slate-500">마감 기한</span>
<span className="text-rose-600 font-bold">오늘 18:00 마감 (D-Day)</span>
</div>
<div className="flex items-center justify-between">
<span className="text-slate-500">지원 내용</span>
<span className="text-slate-800 font-semibold">어학·국가자격시험 응시료 80% 지원</span>
</div>
</div>
{/* Checklist Quick Ready Notice */}
<div className="bg-teal-50 border border-teal-200/80 p-2.5 rounded-xl flex items-center justify-between text-xs">
<div className="flex items-center gap-1.5 text-teal-700 font-semibold">
<span className="material-symbols-outlined text-[16px] text-teal-600">task_alt</span>
<span className="">제출 서류 2/2건 완비 (즉시 전송 가능)</span>
</div>
<span className="text-[10px] text-teal-600/70">응시확인서 첨부됨</span>
</div>
{/* Action CTAs */}
<div className="grid grid-cols-2 gap-2 pt-1">
<button className="px-3 py-2.5 rounded-xl bg-slate-50 text-slate-700 text-xs hover:bg-sky-50 hover:text-sky-700 font-bold transition-colors flex items-center justify-center gap-1 border border-slate-200">
<span className="material-symbols-outlined text-[16px]">visibility</span>
<span className="">서류 미리보기</span>
</button>
<a className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm shadow-rose-200" href="#">
<span className="">즉시 접수 신청</span>
<span className="material-symbols-outlined text-[16px]">bolt</span>
</a>
</div>
</div>
{/* Action Card 2: 서울시 청년 월세 특별지원 (23:59 마감 - 2순위) */}
<div className="bg-white p-5 rounded-2xl shadow-sm border border-sky-100 hover:border-sky-300 transition-all flex flex-col gap-4 group">
<div className="flex items-start justify-between gap-2">
<div className="flex flex-col gap-1">
<div className="flex items-center gap-2">
<div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500">
<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4H9v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10z" fill="#FFE4E6" stroke="#F43F5E"></path>
</svg>
</div>
<div>
<span className="inline-block px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[11px] font-bold">주거</span>
<span className="inline-block ml-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold">서류 1건 대기</span>
</div>
</div>
<h3 className="font-bold text-base text-slate-900 group-hover:text-sky-600 transition-colors pt-1">
          서울 청년월세 특별지원 (2차)
        </h3>
</div>
<span className="shrink-0 text-xs px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-extrabold flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">alarm</span>
        23:59 마감
      </span>
</div>
{/* Meta Info */}
<div className="bg-slate-50 p-3 rounded-xl flex flex-col gap-1.5 text-xs">
<div className="flex items-center justify-between">
<span className="text-slate-500">마감 기한</span>
<span className="text-amber-600 font-bold">오늘 23:59 접수 종료</span>
</div>
<div className="flex items-center justify-between">
<span className="text-slate-500">지원 규모</span>
<span className="text-slate-800 font-semibold">월 20만원 (최대 12개월 240만원)</span>
</div>
</div>
{/* Document Checklist Progress */}
<div className="flex flex-col gap-2 bg-sky-50/50 p-3.5 rounded-xl border border-sky-100">
<div className="flex items-center justify-between text-xs">
<span className="text-slate-700 font-bold">서류 준비 상태</span>
<span className="text-sky-600 font-extrabold">2 / 3개 등록완료</span>
</div>
<div className="w-full bg-sky-100 h-2 rounded-full overflow-hidden">
<div className="bg-sky-500 h-full rounded-full transition-all" style={{ width: '66.6%' }}></div>
</div>
<div className="flex flex-col gap-1 pt-1 text-[11px] text-slate-600">
<div className="flex items-center gap-1.5 text-sky-700 font-medium">
<span className="material-symbols-outlined text-[15px] text-sky-600">check_box</span>
<span className="">주민등록등본 발급 (전자문서함 완료)</span>
</div>
<div className="flex items-center gap-1.5 text-rose-600 font-semibold">
<span className="material-symbols-outlined text-[15px] text-rose-500">check_box_outline_blank</span>
<span className="">확정일자부 임대차계약서 사본 (미등록)</span>
</div>
</div>
</div>
{/* Action CTAs */}
<div className="grid grid-cols-2 gap-2 pt-1">
<button className="px-3 py-2.5 rounded-xl bg-sky-50 text-sky-700 text-xs hover:bg-sky-100 font-bold transition-colors flex items-center justify-center gap-1 border border-sky-200/80">
<span className="material-symbols-outlined text-[16px]">upload_file</span>
<span className="">계약서 업로드</span>
</button>
<a className="px-3 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm shadow-sky-200" href="https://housing.seoul.go.kr" target="_blank">
<span className="">접수처 바로가기</span>
<span className="material-symbols-outlined text-[16px]">open_in_new</span>
</a>
</div>
</div>
{/* Accordion / Mini Preview for Remaining 2 Policies on 4/30 */}
<div className="bg-white rounded-2xl border border-sky-100 p-4 shadow-sm space-y-2.5">
<div className="flex items-center justify-between pb-1.5 border-b border-sky-100/70">
<span className="text-xs text-slate-900 font-extrabold flex items-center gap-1.5">
<span className="material-symbols-outlined text-[16px] text-teal-600">schedule</span>
        동일 마감일 추가 정책 (2건)
      </span>
<span className="text-[11px] text-sky-600 cursor-pointer hover:underline font-bold">전체 펼치기</span>
</div>
<div className="space-y-2">
<div className="p-2.5 rounded-xl bg-purple-50/50 hover:bg-purple-50 border border-purple-100/80 transition-colors flex items-center justify-between cursor-pointer">
<div className="flex flex-col gap-0.5">
<div className="flex items-center gap-1.5">
<span className="text-xs text-slate-900 font-bold">K-디지털 IT 직무부트캠프</span>
<span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-semibold">교육</span>
</div>
<span className="text-[11px] text-slate-500">국비 전액 지원 + 훈련장려금 월 31.6만원</span>
</div>
<span className="text-[11px] text-purple-700 font-bold px-2 py-1 bg-white rounded-lg border border-purple-200 shrink-0">23:59 마감</span>
</div>
<div className="p-2.5 rounded-xl bg-teal-50/50 hover:bg-teal-50 border border-teal-100/80 transition-colors flex items-center justify-between cursor-pointer">
<div className="flex flex-col gap-0.5">
<div className="flex items-center gap-1.5">
<span className="text-xs text-slate-900 font-bold">청년내일저축계좌 1차 모집</span>
<span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.2 rounded font-semibold">금융</span>
</div>
<span className="text-[11px] text-slate-500">정부매칭 최대 3배 지원 (복지로 접수)</span>
</div>
<span className="text-[11px] text-teal-700 font-bold px-2 py-1 bg-white rounded-lg border border-teal-200 shrink-0">24:00 마감</span>
</div>
</div>
</div>
{/* Smart Notification Kakao Banner (Pastel Illustrated) */}
<div className="bg-white border border-sky-100 p-5 rounded-2xl shadow-sm flex flex-col gap-3.5">
<div className="flex items-center gap-2 text-sky-700 text-xs font-bold">
<div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-xs">💬</div>
<span className="">스마트 알림톡 서비스</span>
</div>
<div className="flex flex-col gap-0.5">
<h4 className="text-sm text-slate-900 font-bold">마감일 놓치지 않게, 카카오톡 알림톡</h4>
<p className="text-xs text-slate-500 leading-relaxed">
        오늘 18:00 및 23:59 마감 1시간 전 긴급 리마인드 알림톡이 전송됩니다.
      </p>
</div>
<div className="bg-gradient-to-br from-sky-50/60 to-slate-50 p-3.5 rounded-xl border border-sky-100 flex flex-col gap-3">
<div className="flex items-center justify-between">
<span className="text-xs text-slate-700 font-bold">알림톡 수신 설정</span>
<label className="relative inline-flex items-center cursor-pointer">
<input defaultChecked={true} className="sr-only peer" id="alarmToggle" type="checkbox" />
<div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
</label>
</div>
<div className="flex items-center gap-2">
<input className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-800 flex-1 outline-none font-medium" readOnly={true} type="tel" defaultValue="010-82**-4912" />
<button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-2xs">변경</button>
</div>
<div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] text-slate-500">
<span className="bg-white border border-sky-200 px-2 py-0.5 rounded-md text-sky-700 font-medium">D-7 사전안내</span>
<span className="bg-white border border-sky-200 px-2 py-0.5 rounded-md text-sky-700 font-medium">D-3 서류점검</span>
<span className="bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md text-rose-600 font-bold">D-Day 당일 집중알림</span>
</div>
</div>
</div>
</section>
</div>
{/* Modal Drawer for Document Quick Inspection */}
<div className="hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-8" id="docDrawer">
<div className="bg-white max-w-lg w-full rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-4 border border-sky-100">
<div className="flex items-center justify-between pb-2 border-b border-sky-100">
<div className="flex items-center gap-2">
<div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
<span className="material-symbols-outlined text-[20px]">assignment</span>
</div>
<h3 className="text-base font-bold text-slate-900">서울시 청년 월세지원 제출 서류</h3>
</div>
<button className="p-1 rounded-full hover:bg-slate-100 transition-colors text-slate-400">
<span className="material-symbols-outlined text-[20px]">close</span>
</button>
</div>
<p className="text-xs text-slate-500 leading-relaxed">
  제출 서류는 모두 주민등록번호 뒷자리가 가려진 PDF 또는 선명한 JPG 파일이어야 심사에서 반려되지 않습니다.
</p>
<div className="flex flex-col gap-2.5">
<div className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
<div className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-sky-600 text-[20px]">check_circle</span>
<div className="flex flex-col">
<span className="text-xs text-slate-900 font-bold">확정일자부 임대차계약서 1부</span>
<span className="text-slate-400 text-[11px]">확정일자 번호와 공인중개사 날인 필수</span>
</div>
</div>
<button className="px-3 py-1.5 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-700 shadow-sm shadow-sky-200">업로드</button>
</div>
<div className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
<div className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-teal-600 text-[20px]">check_circle</span>
<div className="flex flex-col">
<span className="text-xs text-slate-900 font-bold">최근 3개월 월세 이체 확인증</span>
<span className="text-slate-400 text-[11px]">은행 모바일 앱 발급 송금내역서</span>
</div>
</div>
<span className="text-xs text-teal-600 font-bold">등록완료</span>
</div>
<div className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
<div className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-teal-600 text-[20px]">check_circle</span>
<div className="flex flex-col">
<span className="text-xs text-slate-900 font-bold">가족관계증명서 (상세)</span>
<span className="text-slate-400 text-[11px]">본인 단독 기준 1개월 이내 발급본</span>
</div>
</div>
<span className="text-xs text-teal-600 font-bold">등록완료</span>
</div>
</div>
<div className="pt-2 flex justify-end gap-2">
<button className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors">
    닫기
  </button>
<a className="px-4 py-2.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition-all shadow-sm shadow-sky-200" href="https://housing.seoul.go.kr" target="_blank">
    공식 접수창 이동
  </a>
</div>
</div>
</div>
</div>
</main>
  );
};

export default CalendarView;
