import React, { useState, useEffect, useMemo } from 'react';
import { getAllPolicies, getBookmarkedPolicyIds } from '../api/supabasePolicies';
import { PolicyItem } from '../types/policy';
import { usePersonalizedPolicies } from '../utils/policyMatcher';

interface CalendarViewProps {
  onNavigate?: (path: string, policyId?: string) => void;
}

interface ParsedPolicyDate {
  policy: PolicyItem;
  year: number;
  month: number; // 0-indexed
  day: number;
  isDeadline: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onNavigate }) => {
  const [rawPolicies, setRawPolicies] = useState<PolicyItem[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);

  // 사용자 프로필 정보 기반 맞춤 점수 계산 및 우선순위 정렬
  const { policies, profile, hasProfile } = usePersonalizedPolicies(rawPolicies);

  // 화면 보는 당일 기준 캘린더 상태 (오늘 날짜)
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  // Supabase 데이터 및 북마크 로드 (전체 데이터 로드)
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [allPolicies, savedIds] = await Promise.all([
          getAllPolicies(),
          getBookmarkedPolicyIds('guest_user'),
        ]);
        setRawPolicies(allPolicies);
        setBookmarkedIds(new Set(savedIds));
      } catch (err) {
        console.error('Failed to load calendar data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // 북마크 변경 이벤트 구독
    const handleBookmarkUpdate = async () => {
      const savedIds = await getBookmarkedPolicyIds('guest_user');
      setBookmarkedIds(new Set(savedIds));
    };

    window.addEventListener('bookmarks_updated', handleBookmarkUpdate);
    window.addEventListener('storage', handleBookmarkUpdate);
    return () => {
      window.removeEventListener('bookmarks_updated', handleBookmarkUpdate);
      window.removeEventListener('storage', handleBookmarkUpdate);
    };
  }, []);

  // 내가 알람/스크랩 저장한 정책 목록
  const mySavedPolicies = useMemo(() => {
    return policies.filter((p) => bookmarkedIds.has(p.id));
  }, [policies, bookmarkedIds]);

  // 날짜 파싱 유틸리티 (저장된 정책의 마감일/시작일 추출)
  const parsedSavedPolicyDates = useMemo<ParsedPolicyDate[]>(() => {
    const list: ParsedPolicyDate[] = [];

    mySavedPolicies.forEach((p) => {
      const anyP = p as any;
      const dateText = anyP.period_edate || anyP.period_end || p.dDay || '';

      // 1. YYYYMMDD 패턴 추출 (예: 20260930, 20261231)
      const numMatches = dateText.match(/\b(20\d{2})(\d{2})(\d{2})\b/g);
      if (numMatches && numMatches.length > 0) {
        const lastDate = numMatches[numMatches.length - 1];
        const y = parseInt(lastDate.slice(0, 4), 10);
        const m = parseInt(lastDate.slice(4, 6), 10) - 1;
        const d = parseInt(lastDate.slice(6, 8), 10);
        if (y > 2000 && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
          list.push({ policy: p, year: y, month: m, day: d, isDeadline: true });
          return;
        }
      }

      // 2. YYYY-MM-DD 또는 YYYY.MM.DD 패턴 추출
      const match = dateText.match(/(20\d{2})[-./년\s]+(\d{1,2})[-./월\s]+(\d{1,2})/);
      if (match) {
        const y = parseInt(match[1], 10);
        const m = parseInt(match[2], 10) - 1;
        const d = parseInt(match[3], 10);
        if (y > 2000 && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
          list.push({ policy: p, year: y, month: m, day: d, isDeadline: true });
          return;
        }
      }

      // 3. 만약 D-Day가 D-3, D-7 형태인 경우 오늘 날짜 기준으로 가상 계산
      if (p.dDay && p.dDay.startsWith('D-')) {
        const diffDays = parseInt(p.dDay.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(diffDays) && diffDays >= 0) {
          const targetDate = new Date(today.getTime() + diffDays * 24 * 60 * 60 * 1000);
          list.push({
            policy: p,
            year: targetDate.getFullYear(),
            month: targetDate.getMonth(),
            day: targetDate.getDate(),
            isDeadline: true,
          });
        }
      }
    });

    return list;
  }, [mySavedPolicies, today]);

  // 달력 계산 (화면 보는 기준)
  const calendarGrid = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0: 일요일 ~ 6: 토요일
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: {
      type: 'prev' | 'current' | 'next';
      day: number;
      isToday: boolean;
      dateKey: string;
      items: PolicyItem[];
    }[] = [];

    // 1. 이전 달 날짜 채우기
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        type: 'prev',
        day: daysInPrevMonth - i,
        isToday: false,
        dateKey: `prev-${daysInPrevMonth - i}`,
        items: [],
      });
    }

    // 2. 현재 달 날짜 채우기
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        viewYear === today.getFullYear() &&
        viewMonth === today.getMonth() &&
        day === today.getDate();

      // 내가 알람 저장한 정책 중 해당 날짜에 해당하는 정책만 필터링 (미 등록시 없음)
      const dayItems = parsedSavedPolicyDates
        .filter((d) => d.year === viewYear && d.month === viewMonth && d.day === day)
        .map((d) => d.policy);

      cells.push({
        type: 'current',
        day,
        isToday,
        dateKey: `curr-${day}`,
        items: dayItems,
      });
    }

    // 3. 다음 달 날짜 채우기 (7의 배수 맞춤)
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let day = 1; day <= remaining; day++) {
        cells.push({
          type: 'next',
          day,
          isToday: false,
          dateKey: `next-${day}`,
          items: [],
        });
      }
    }

    return cells;
  }, [viewYear, viewMonth, today, parsedSavedPolicyDates]);

  // 월 이동 핸들러
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDay(today.getDate());
  };

  // 오른쪽 마감임박 정책: 내가 알람설정한 값 우선, 없을 시 전체 기준 2개 정보
  const rightRailPolicies = useMemo<PolicyItem[]>(() => {
    if (mySavedPolicies.length > 0) {
      return mySavedPolicies.slice(0, 5);
    }
    // 없을 시, 모든 정책 기준 2개
    return policies.slice(0, 2);
  }, [mySavedPolicies, policies]);

  // 카테고리 뱃지 색상
  const getBadgeBg = (cat: string) => {
    if (cat.includes('주거')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (cat.includes('일자리') || cat.includes('취업')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (cat.includes('교육') || cat.includes('훈련')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (cat.includes('금융') || cat.includes('복지')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-purple-50 text-purple-700 border-purple-200';
  };

  return (
    <main className="flex-1 w-full pt-20 pb-16 bg-[#f8fafc] max-w-[1240px] mx-auto px-4 md:px-8">
      <div className="flex flex-col w-full space-y-6">
        
        {/* Top Title Hero Banner (월별캘린더/칸반 스위치 및 일정추가 버튼 삭제됨) */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-100/70 via-indigo-50/50 to-teal-50/70 p-6 md:p-8 border border-sky-200/60 shadow-sm shadow-sky-100/50 flex flex-col justify-between gap-4">
          <div className="absolute -right-8 -top-10 w-72 h-72 rounded-full bg-teal-200/30 blur-3xl pointer-events-none"></div>
          <div className="absolute left-1/3 -bottom-10 w-64 h-64 rounded-full bg-sky-200/40 blur-3xl pointer-events-none"></div>
          
          <div className="space-y-2 relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/85 border border-sky-200/70 shadow-xs text-sky-800 text-xs font-semibold backdrop-blur-md">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span>신청 일정 트래커 · 스마트 공고 캘린더</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              마감일 캘린더 &amp; 맞춤 알림함 🗓️
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              관심 저장(★) 및 알림 설정한 정책의 마감 일정을 실시간으로 확인하고 놓치지 마세요.
            </p>
          </div>
        </section>

        {/* Status Indicator Bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-white text-slate-700 border border-slate-200/80 shadow-xs text-xs font-semibold">
              ⭐ 내 알림 저장 정책: <strong className="text-sky-600">{mySavedPolicies.length}</strong>건 등록됨
            </span>
            <span className="px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/70 text-xs font-medium">
              오늘: {today.getFullYear()}년 {today.getMonth() + 1}월 {today.getDate()}일
            </span>
          </div>

          {mySavedPolicies.length === 0 && (
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200/80 text-amber-800 shadow-xs">
              <span>💡</span>
              <span>알림 등록된 정책이 없습니다. 정책 탐색에서 관심 정책을 저장(★)해 보세요!</span>
            </div>
          )}
        </div>

        {/* Main Grid Layout (8 cols Calendar + 4 cols Action Panel) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Interactive Calendar Section (8 cols) */}
          <section className="lg:col-span-8 space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-sky-100 shadow-sm space-y-4">
              
              {/* Month Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-sky-100/70">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200/70">
                    <button
                      onClick={handlePrevMonth}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-white hover:text-sky-600 hover:shadow-xs transition-colors cursor-pointer"
                      title="이전 달"
                    >
                      ◀
                    </button>
                    <span className="text-base md:text-lg text-slate-900 px-3 tracking-tight font-extrabold flex items-center gap-1.5">
                      <span>{viewYear}년 {viewMonth + 1}월</span>
                      {viewYear === today.getFullYear() && viewMonth === today.getMonth() && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                          이번 달
                        </span>
                      )}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-white hover:text-sky-600 hover:shadow-xs transition-colors cursor-pointer"
                      title="다음 달"
                    >
                      ▶
                    </button>
                  </div>
                  <button
                    onClick={handleGoToday}
                    className="px-3.5 py-1.5 rounded-xl text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold transition-colors border border-sky-200/60 cursor-pointer"
                  >
                    오늘로 이동
                  </button>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  {mySavedPolicies.length > 0 ? (
                    <span className="text-teal-700 font-bold">
                      ✓ 저장된 내 정책 일정만 달력에 표시됩니다 ({mySavedPolicies.length}건)
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      등록된 알림 정책 없음 (미 등록시 표시 정책 없음)
                    </span>
                  )}
                </div>
              </div>

              {/* Color Legend Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 py-2 px-3.5 bg-gradient-to-r from-sky-50/60 via-slate-50 to-indigo-50/40 rounded-2xl border border-sky-100/60 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 ring-2 ring-sky-100"></span>
                  <span className="font-medium text-slate-700">오늘 ({today.getMonth() + 1}/{today.getDate()})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-100"></span>
                  <span className="font-medium text-slate-700">내 알림 마감일</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 ring-2 ring-teal-100"></span>
                  <span className="font-medium text-slate-700">저장된 관심 정책</span>
                </div>
              </div>

              {/* Calendar Grid Table */}
              <div className="w-full flex flex-col">
                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 text-center text-xs py-2 text-slate-500 bg-slate-50/80 rounded-xl mb-1.5 font-bold">
                  <span className="text-rose-500">일</span>
                  <span>월</span>
                  <span>화</span>
                  <span>수</span>
                  <span>목</span>
                  <span>금</span>
                  <span className="text-sky-600">토</span>
                </div>

                {/* Calendar Cells Grid */}
                <div className="grid grid-cols-7 gap-1.5 pt-1 min-h-[480px]">
                  {calendarGrid.map((cell) => {
                    const isSelected = cell.type === 'current' && cell.day === selectedDay;
                    const hasItems = cell.items.length > 0;

                    if (cell.type !== 'current') {
                      return (
                        <div
                          key={cell.dateKey}
                          className="min-h-[96px] p-2 rounded-2xl bg-slate-50/30 opacity-30 flex flex-col gap-1 border border-transparent select-none"
                        >
                          <span className="text-xs font-semibold text-slate-400">{cell.day}</span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={cell.dateKey}
                        onClick={() => setSelectedDay(cell.day)}
                        className={`min-h-[96px] p-2 rounded-2xl transition-all flex flex-col gap-1 cursor-pointer border ${
                          cell.isToday
                            ? 'bg-sky-50/80 border-sky-400 shadow-xs ring-2 ring-sky-200/50'
                            : isSelected
                            ? 'bg-white border-sky-300 shadow-xs ring-1 ring-sky-200'
                            : 'bg-white border-slate-100 hover:border-sky-200 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold ${
                              cell.isToday
                                ? 'text-sky-700 font-extrabold'
                                : 'text-slate-700'
                            }`}
                          >
                            {cell.day}
                          </span>
                          {cell.isToday && (
                            <span className="text-[10px] bg-sky-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                              오늘
                            </span>
                          )}
                        </div>

                        {/* 정책 아이템 (내가 알람 저장한 정책만 표시, 미 등록시 빈 상태) */}
                        {hasItems ? (
                          <div className="flex flex-col gap-1 pt-0.5">
                            {cell.items.map((p) => (
                              <div
                                key={p.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigate?.('detail', p.id);
                                }}
                                className="bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 px-1.5 py-1 rounded-lg text-[10px] font-bold text-rose-700 truncate flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                title={p.title}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                                <span className="truncate">{p.title}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Empty Guidance Banner if no alarms saved */}
            {mySavedPolicies.length === 0 && (
              <div className="rounded-2xl bg-white p-6 border border-sky-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900">
                    💡 내 알림 정책을 등록하여 마감일을 관리해보세요!
                  </h4>
                  <p className="text-xs text-slate-500">
                    [정책 탐색] 화면에서 마음에 드는 정책의 관심 저장(★) 버튼을 누르면 이 달력에 마감일이 자동으로 등록됩니다.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate?.('explore')}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-all whitespace-nowrap cursor-pointer"
                >
                  정책 탐색 바로가기 →
                </button>
              </div>
            )}
          </section>

          {/* Right Side: D-Day Deadline Action List (4 cols) */}
          <section className="lg:col-span-4 space-y-5">
            
            {/* Section Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-500 text-sm">
                    ⏰
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    {mySavedPolicies.length > 0 ? '내 알림 정책 마감일' : '추천 마감 임박 정책'}
                  </h2>
                </div>
                <span className="text-xs bg-rose-50 border border-rose-200 text-rose-600 px-3 py-1 rounded-full font-bold">
                  {mySavedPolicies.length > 0 ? `알림 저장 (${mySavedPolicies.length}건)` : '기본 추천 (2건)'}
                </span>
              </div>

              {mySavedPolicies.length === 0 && (
                <p className="text-xs text-slate-500">
                  알림 저장된 정책이 없어 전체 정책 중 주요 추천 2건을 안내합니다.
                </p>
              )}
            </div>

            {/* Policy Action Cards */}
            <div className="space-y-3.5">
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-xs">정책 로딩중...</div>
              ) : rightRailPolicies.map((p) => (
                <div
                  key={p.id}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-sky-100 hover:border-sky-300 transition-all flex flex-col gap-3.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getBadgeBg(p.category)}`}>
                          {p.category}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                          {p.organization}
                        </span>
                      </div>
                      <h3
                        onClick={() => onNavigate?.('detail', p.id)}
                        className="font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors pt-1 cursor-pointer line-clamp-1"
                        title={p.title}
                      >
                        {p.title}
                      </h3>
                    </div>
                    <span className="shrink-0 text-xs px-2.5 py-1 rounded-xl bg-rose-500 text-white font-extrabold flex items-center gap-1 shadow-xs">
                      {p.dDay || p.status || '접수중'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {p.benefitSummary}
                  </p>

                  <div className="bg-slate-50 p-2.5 rounded-xl flex items-center justify-between text-xs text-slate-600">
                    <span>지원 대상</span>
                    <span className="font-semibold text-slate-800">{p.targetAge || '연령 무관'}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      onClick={() => onNavigate?.('detail', p.id)}
                      className="w-full py-2 px-3 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-xs transition-colors border border-sky-200 cursor-pointer"
                    >
                      상세보기 →
                    </button>
                    <button
                      onClick={() => onNavigate?.('explore')}
                      className="w-full py-2 px-3 rounded-xl bg-white text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors border border-slate-200 cursor-pointer"
                    >
                      탐색 목록
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Smart Notification Box */}
            <div className="bg-white border border-sky-100 p-5 rounded-2xl shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sky-700 text-xs font-bold">
                <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-xs">
                  💬
                </span>
                <span>스마트 알림톡 &amp; 텔레그램 알림</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                마감 3일 전 및 당일 알림을 받아보실 수 있습니다.
              </p>
              <div className="pt-1 flex items-center justify-between text-slate-500 text-xs border-t border-slate-100">
                <span>알림 채널 연동</span>
                <button
                  onClick={() => onNavigate?.('profile')}
                  className="text-sky-600 hover:underline font-bold cursor-pointer"
                >
                  프로필에서 설정 →
                </button>
              </div>
            </div>

          </section>
        </div>

      </div>
    </main>
  );
};

export default CalendarView;
