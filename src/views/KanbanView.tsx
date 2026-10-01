import React, { useState, useEffect, useMemo } from 'react';
import { getAllPolicies } from '../api/supabasePolicies';
import { PolicyItem } from '../types/policy';
import { usePersonalizedPolicies } from '../utils/policyMatcher';

interface KanbanViewProps {
  onNavigate?: (path: string, policyId?: string) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({ onNavigate }) => {
  const [rawPolicies, setRawPolicies] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  // 사용자 프로필 정보 기반 맞춤 점수 계산 및 우선순위 정렬
  const { policies, profile, hasProfile } = usePersonalizedPolicies(rawPolicies);

  // Supabase 정책 데이터 로드 (전체 데이터 로드)
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getAllPolicies();
        setRawPolicies(data);
      } catch (err) {
        console.error('Failed to load policies in KanbanView:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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
      const calBtn = (e.target as HTMLElement).closest('#viewToggleCal');
      if (calBtn && onNavigate) {
        e.preventDefault();
        onNavigate('deadline-calendar-month');
      }
    };
    document.addEventListener('click', handleDataPath);
    return () => document.removeEventListener('click', handleDataPath);
  }, [onNavigate]);

  const filteredPolicies = React.useMemo(() => {
    if (selectedCategory === '전체') return policies;
    return policies.filter((p) => p.category === selectedCategory);
  }, [policies, selectedCategory]);

  const activeApplying = React.useMemo(() => {
    return filteredPolicies.filter((p) => p.dDay || p.status === '접수중' || p.status === '마감임박');
  }, [filteredPolicies]);

  const regularPolicies = React.useMemo(() => {
    return filteredPolicies.filter((p) => !p.dDay && p.status !== '접수중');
  }, [filteredPolicies]);

  return (
    <main className="flex-1 w-full pt-20 pb-16 bg-[#f8fafc] max-w-[1240px] mx-auto px-4 md:px-8">
      <div className="flex flex-col w-full gap-8">
        {/* Top Header & View Mode Switcher */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-100/70 via-indigo-50/50 to-teal-50/70 p-6 md:p-8 border border-sky-200/60 shadow-sm shadow-sky-100/50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/85 border border-sky-200/70 shadow-xs text-sky-800 text-xs font-semibold backdrop-blur-md">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span>신청 일정 트래커 · 스마트 공고 관리</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              마감일 캘린더 &amp; 맞춤 알림함 🗓️
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              스크랩한 맞춤 정책의 마감일과 준비 서류 일정을 한눈에 점검하고 상세 정보를 확인하세요.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
            <div className="inline-flex bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-sky-100 shadow-sm">
              <button
                onClick={() => onNavigate?.('calendar')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-sky-600 transition-all cursor-pointer"
                id="viewToggleCal"
                type="button"
              >
                <span>📅</span>
                <span>월별 캘린더</span>
              </button>
              <button
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500 text-white shadow-sm transition-all"
                id="viewToggleKanban"
                type="button"
              >
                <span>📊</span>
                <span>상태별 칸반</span>
              </button>
            </div>
            <button
              onClick={() => onNavigate?.('explore')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold text-xs shadow-sm shadow-sky-200 transition-all cursor-pointer"
              type="button"
            >
              <span>+ 새 정책 추가</span>
            </button>
          </div>
        </section>

        {/* Category Filters */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" id="category-filter-chips">
            {['전체', '일자리', '주거', '교육·직업훈련', '금융·복지·문화', '참여·기반'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold text-xs transition-all shadow-xs shrink-0 select-none cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white border border-sky-600'
                    : 'bg-white text-slate-700 hover:bg-sky-50 border border-slate-200/80'
                }`}
                style={{ whiteSpace: 'nowrap' }}
              >
                <span>{cat}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium bg-white px-3 py-1.5 rounded-full border border-slate-200/70 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>총 {policies.length}건 등록됨</span>
          </div>
        </div>

        {/* 2-Column Kanban Board */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Column 1: 접수중 & 마감 임박 */}
          <div className="flex flex-col gap-3.5 p-5 rounded-2xl bg-white/70 border border-slate-200/70 shadow-sm">
            <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-100"></span>
                <span className="text-[16px] text-slate-900 font-bold">접수중 · 마감임박</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold text-xs border border-rose-100/60">
                {activeApplying.length}건
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">정책을 불러오는 중...</div>
            ) : activeApplying.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">해당 상태의 정책이 없습니다.</div>
            ) : (
              activeApplying.slice(0, 5).map((p) => (
                <article
                  key={p.id}
                  onClick={() => onNavigate?.('detail', p.id)}
                  className="p-4 rounded-xl bg-white border border-sky-100/80 shadow-sm hover:shadow-md hover:border-sky-300 transition-all flex flex-col gap-3 cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-medium border border-rose-100">
                      {p.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-xs font-bold flex items-center gap-1 border border-rose-100 animate-pulse">
                      {p.dDay || p.status || '접수중'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-[15px] text-slate-900 font-bold group-hover:text-sky-600 transition-colors line-clamp-1">
                      {p.title}
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {p.benefitSummary}
                    </p>
                  </div>
                  <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
                    <span className="truncate max-w-[150px]">{p.organization}</span>
                    <span className="text-sky-600 font-semibold group-hover:underline">상세보기 →</span>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Column 2: 상시 모집 및 탐색 */}
          <div className="flex flex-col gap-3.5 p-5 rounded-2xl bg-white/70 border border-slate-200/70 shadow-sm">
            <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <span className="text-[16px] text-slate-900 font-bold">상시 접수 · 전체 정책</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-600 font-bold text-xs">
                {regularPolicies.length}건
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">정책을 불러오는 중...</div>
            ) : regularPolicies.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">해당 정책이 없습니다.</div>
            ) : (
              regularPolicies.slice(0, 5).map((p) => (
                <article
                  key={p.id}
                  onClick={() => onNavigate?.('detail', p.id)}
                  className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-sky-300 transition-all flex flex-col gap-3 cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-medium border border-sky-100">
                      {p.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                      {p.status || '상시접수'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-[15px] text-slate-900 font-bold group-hover:text-sky-600 transition-colors line-clamp-1">
                      {p.title}
                    </h2>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {p.benefitSummary}
                    </p>
                  </div>
                  <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
                    <span className="truncate max-w-[150px]">{p.organization}</span>
                    <span className="text-sky-600 font-semibold group-hover:underline">상세보기 →</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default KanbanView;
