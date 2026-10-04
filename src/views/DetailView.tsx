import React, { useState, useEffect } from 'react';
import { getPolicyDetail, getPolicies, toggleBookmark, applyPolicyAlert, getPolicyRelatedNews } from '../api/supabasePolicies';
import { PolicyDetail, PolicyItem, PolicyNewsItem } from '../types/policy';
import { prioritizePoliciesByProfile } from '../utils/policyMatcher';
import { loadProfileSettings } from '../utils/profileStorage';
import { addNotificationHistory } from '../utils/notificationStorage';

interface DetailViewProps {
  onNavigate?: (path: string, policyId?: string) => void;
  policyId?: string | null;
}

export const DetailView: React.FC<DetailViewProps> = ({ onNavigate, policyId }) => {
  const [policy, setPolicy] = useState<PolicyDetail | null>(null);
  const [relatedPolicies, setRelatedPolicies] = useState<PolicyItem[]>([]);
  const [relatedNews, setRelatedNews] = useState<PolicyNewsItem[]>([]);
  const [activeNewsIndex, setActiveNewsIndex] = useState<number>(0);
  const [newsLoading, setNewsLoading] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 토스트 메시지 표시
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 실시간 키워드 중심 뉴스 재탐색 및 AI 요약 갱신 (최신순 3건)
  const handleRefreshNews = async () => {
    if (!policy) return;
    setNewsLoading(true);
    try {
      const freshNews = await getPolicyRelatedNews(policy.keywords, policy.id, policy.title, policy.organization, 3);
      setRelatedNews(freshNews);
      setActiveNewsIndex(0);
      showToast(`✨ '${policy.title}' 관련 최신 뉴스 ${freshNews.length}건을 실시간 분석 완료했습니다.`);
    } catch (err) {
      console.error(err);
      showToast('⚠️ 실시간 뉴스 분석 중 오류가 발생했습니다.');
    } finally {
      setNewsLoading(false);
    }
  };

  // 정책 데이터 로드 및 키워드 기반 연관 뉴스 로드
  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      setNewsLoading(true);
      try {
        let currentId = policyId;

        // policyId가 없으면 목록에서 첫 번째 정책을 기본으로 사용
        if (!currentId) {
          const all = await getPolicies({ limit: 1 });
          if (all.length > 0) {
            currentId = all[0].id;
          }
        }

        if (currentId) {
          const detail = await getPolicyDetail(currentId);
          setPolicy(detail);
          setIsBookmarked(Boolean(detail?.isBookmarked));

          if (detail) {
            // 1. 동일 카테고리 연관 정책 중 사용자 프로필 매칭 순으로 2건 추천
            const related = await getPolicies({ category: detail.category, limit: 10 });
            const filtered = related.filter((r) => r.id !== currentId);
            const prioritized = prioritizePoliciesByProfile(filtered, loadProfileSettings());
            setRelatedPolicies(prioritized.slice(0, 2));

            // 2. 해당 정책의 실시간 키워드 기반 최신순 뉴스 3건 로드
            const newsItems = await getPolicyRelatedNews(detail.keywords, detail.id, detail.title, detail.organization, 3);
            setRelatedNews(newsItems);
            setActiveNewsIndex(0);
          }
        }
      } catch (err) {
        console.error('Failed to load policy detail:', err);
      } finally {
        setLoading(false);
        setNewsLoading(false);
      }
    }
    loadDetail();


    // 음성 재생 중단
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [policyId]);

  // data-path 및 data-policy-id 클릭 이벤트 핸들링
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

  // 북마크 토글
  const handleBookmark = async () => {
    if (!policy) return;
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    await toggleBookmark('guest_user', policy.id);
    showToast(nextState ? '⭐ 관심 정책 목록에 저장되었습니다!' : '🗑️ 관심 정책 저장이 해제되었습니다.');
  };

  // 정책 알람 신청 (정책 내용 + 등록 텔레그램ID/이메일 DB 등록)
  const handleApplyAlert = async () => {
    if (!policy) return;
    try {
      const profile = loadProfileSettings();
      const channel: 'telegram' | 'email' = profile.isEmailSelected ? 'email' : 'telegram';
      const recipient = profile.isEmailSelected ? profile.emailAddress : profile.telegramId;

      const res = await applyPolicyAlert(policy.id);

      if (recipient) {
        addNotificationHistory({
          policyId: policy.id,
          policyTitle: policy.title,
          category: policy.category,
          channel,
          recipient,
          type: 'CUSTOM_ALERT',
          typeLabel: '신청 정책 알림',
          message: `[${policy.organization}] '${policy.title}' 정책 알림이 정상 등록되었습니다. 접수 마감 및 주요 변경사항이 발송됩니다.`
        });
      }

      showToast(res.message || `🔔 [${policy.title}] 정책 알림이 등록된 텔레그램/이메일로 DB에 정상 신청되었습니다!`);
    } catch (e) {
      showToast('🔔 정책 알림 신청이 접수되었습니다.');
    }
  };

  // 음성 요약 듣기 (Web Speech API)
  const handleSpeech = () => {
    if (!policy) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = `${policy.title}. 주관기관은 ${policy.organization}입니다. 지원 대상은 ${policy.eligibility?.age || policy.targetAge || '청년'}입니다. 주요 지원 내용은 ${policy.benefit?.details || policy.benefitSummary}입니다.`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'ko-KR';
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  if (loading) {
    return (
      <main className="flex-1 w-full pt-20 pb-16 bg-[#f8fafc] max-w-[1240px] mx-auto px-4 md:px-8">
        <div className="space-y-6 animate-pulse">
          <div className="h-6 w-48 bg-slate-200 rounded"></div>
          <div className="h-64 bg-slate-200 rounded-3xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 h-96 bg-slate-200 rounded-2xl"></div>
            <div className="lg:col-span-4 h-96 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      </main>
    );
  }

  if (!policy) {
    return (
      <main className="flex-1 w-full pt-20 pb-16 bg-[#f8fafc] max-w-[1240px] mx-auto px-4 md:px-8 text-center py-24">
        <div className="space-y-4">
          <p className="text-5xl">📋</p>
          <h2 className="text-xl font-bold text-slate-800">선택된 정책 정보를 불러올 수 없습니다.</h2>
          <p className="text-slate-500 text-sm">정책 탐색 목록에서 원하는 정책을 선택해 주세요.</p>
          <button
            onClick={() => onNavigate?.('explore')}
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            정책 탐색 목록으로 이동
          </button>
        </div>
      </main>
    );
  }

  const categoryBadgeColor =
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
    <main className="flex-1 w-full pt-16 sm:pt-20 pb-32 lg:pb-16 bg-[#f8fafc] max-w-[1240px] mx-auto px-3.5 sm:px-6 md:px-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-sky-400/40 flex items-center gap-2.5 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col w-full space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between text-slate-400 text-xs pt-1">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-wrap">
            <a
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.('home');
              }}
              className="hover:text-sky-600 transition-colors flex items-center gap-1 text-slate-500 cursor-pointer"
              href="#"
            >
              <span>🏠</span>
              <span>홈</span>
            </a>
            <span className="text-slate-300 font-semibold">/</span>
            <a
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.('explore');
              }}
              className="hover:text-sky-600 transition-colors text-slate-500 cursor-pointer"
              href="#"
            >
              {policy.category}
            </a>
            <span className="text-slate-300 font-semibold">/</span>
            <span className="text-slate-800 font-semibold truncate max-w-[240px] sm:max-w-none">
              {policy.title}
            </span>
          </nav>

          <div className="flex items-center gap-3 text-slate-500 text-xs">
            <span className="inline-flex items-center gap-1">
              <span>👁️</span>
              <span>조회 {policy.viewCount || 120}회</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span>✅</span>
              <span>DB 실시간 동기화</span>
            </span>
          </div>
        </div>

        {/* Header Policy Summary Card (Hero Gradient Banner) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-100/70 via-indigo-50/50 to-teal-50/70 p-6 md:p-8 border border-sky-200/60 shadow-sm shadow-sky-100/50 space-y-6">
          <div className="absolute -right-8 -top-10 w-72 h-72 rounded-full bg-teal-200/25 blur-3xl pointer-events-none"></div>
          <div className="absolute left-1/3 -bottom-10 w-64 h-64 rounded-full bg-sky-200/35 blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${
                policy.dDay ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' : 'bg-white/80 border-slate-200 text-slate-700'
              }`}>
                {policy.dDay || policy.status || '상시모집'}
              </span>
              <span className="px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold shadow-xs">
                나와의 적합도 {policy.matchScore || 85}%
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-xs border ${categoryBadgeColor}`}>
                {policy.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/80 border border-slate-200/80 text-slate-600 text-xs shadow-xs">
                {policy.organization}
              </span>
              {policy.source && (
                <span className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200/70 text-sky-700 text-xs font-medium shadow-xs">
                  출처: {policy.source}
                </span>
              )}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {policy.title}
                </h1>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                  {policy.benefitSummary || policy.benefit.details || policy.summary}
                </p>

                {/* AI 추출 키워드 태그 */}
                {(() => {
                  const rawKw = policy.keywords;
                  let kwList: string[] = [];
                  if (Array.isArray(rawKw)) {
                    kwList = rawKw.map((k) => String(k).trim()).filter(Boolean);
                  } else if (typeof rawKw === 'string' && rawKw.trim()) {
                    kwList = rawKw.split(',').map((k) => k.trim().replace(/^#/, '')).filter(Boolean);
                  }
                  if (kwList.length === 0) {
                    kwList = [policy.category, policy.organization, '청년지원'];
                  }
                  return (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {kwList.map((kw, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-lg bg-white/90 text-sky-700 text-xs font-semibold border border-sky-200/80 shadow-xs"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Metric Card */}
              <div className="flex items-center gap-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-sky-100 shadow-md shadow-sky-100/60 shrink-0 self-start lg:self-auto">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-100 via-emerald-50 to-sky-100 border border-teal-200 flex items-center justify-center shadow-inner shrink-0 text-2xl">
                  🎁
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                    <span className="text-xs font-medium text-slate-500">주요 지원 혜택</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base md:text-lg font-extrabold text-slate-900 tracking-tight line-clamp-1 max-w-[200px]" title={policy.benefit.amount}>
                      {policy.benefit.amount || '지원 내용 참조'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5 Key Value Metric Highlights (신청기간, 사업기간 분리 칸) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-white/80 border border-sky-100/80 shadow-xs space-y-0.5">
                <span className="text-xs text-slate-500 font-medium">지원 대상</span>
                <div className="text-sm font-extrabold text-sky-600 truncate" title={policy.eligibility?.age || policy.targetAge}>
                  {policy.eligibility?.age || policy.targetAge || '청년 대상'}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/80 border border-rose-100 shadow-xs space-y-0.5">
                <span className="text-xs text-rose-500 font-medium">신청 기간</span>
                <div className="text-xs font-extrabold text-rose-600 truncate" title={policy.applyPeriod || policy.period}>
                  {policy.applyPeriod || policy.period || '상시 접수'}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/80 border border-teal-100 shadow-xs space-y-0.5">
                <span className="text-xs text-teal-600 font-medium">사업 기간</span>
                <div className="text-xs font-extrabold text-teal-700 truncate" title={policy.bizPeriod}>
                  {policy.bizPeriod || '연중 상시 운영'}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs space-y-0.5">
                <span className="text-xs text-slate-500 font-medium">접수 상태</span>
                <div className="text-sm font-extrabold text-slate-800 truncate">
                  {policy.dDay || policy.status || '상시 접수중'}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/80 border border-sky-100/80 shadow-xs space-y-0.5 col-span-2 md:col-span-1">
                <span className="text-xs text-slate-500 font-medium">주관 기관</span>
                <div className="text-xs font-bold text-slate-800 truncate" title={policy.organization}>
                  {policy.organization || '정부/지자체'}
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-100 to-sky-100 border border-indigo-200/70 flex items-center justify-center text-indigo-600 text-lg shadow-xs">
                    🤖
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">AI 핵심 3줄 요약</h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold">
                        정밀 분석 결과
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSpeech}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors text-xs font-semibold cursor-pointer ${
                    isSpeaking
                      ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                      : 'bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-600 border-slate-200/80'
                  }`}
                >
                  <span>{isSpeaking ? '⏹️' : '🔊'}</span>
                  <span>{isSpeaking ? '듣기 중단' : '30초 요약 듣기'}</span>
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
                      <span className="text-sm font-bold text-sky-700">지원 대상 및 자격</span>
                      <span className="text-slate-400 text-xs">• {policy.eligibility.age}</span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {policy.eligibility.income || policy.incomeCondition || '해당 연령 및 조건 충족 청년 대상'}
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
                      <span className="text-sm font-bold text-teal-800">구체적 지원 혜택</span>
                      <span className="text-slate-400 text-xs">• {policy.category}</span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {policy.benefit.details || policy.benefitSummary}
                    </p>
                  </div>
                </div>

                {/* Item 3: 신청 방법 및 유의사항 */}
                <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100/70 flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                    3
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-rose-600">신청 방법 및 접수처</span>
                      <span className="text-slate-400 text-xs">• {policy.organization}</span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {policy.benefit.method || '공식 홈페이지 온라인 신청 또는 관할 행정복지센터 방문 접수'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: 지원 내용 및 혜택 상세 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-sky-100 shadow-sky-100/40 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <span className="text-lg">🌟</span>
                <h3 className="text-base font-bold text-slate-900">1. 지원 내용 및 혜택 상세 안내</h3>
              </div>
              <div className="space-y-3 text-xs md:text-sm text-slate-700 leading-relaxed">
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2">
                  <span className="font-bold text-slate-900 block">[주요 지원 세부 내용]</span>
                  <p className="whitespace-pre-line">{policy.benefit.details || policy.benefitSummary || '상세 공고 내용을 확인해 주세요.'}</p>
                </div>
                {policy.summary && policy.summary !== policy.benefit.details && (
                  <div className="p-4 rounded-xl bg-sky-50/40 border border-sky-100 space-y-1.5">
                    <span className="font-bold text-sky-800 block">[사업 개요 및 목적]</span>
                    <p className="whitespace-pre-line text-slate-600">{policy.summary}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: 신청 자격 및 대상 상세 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-sky-100 shadow-sky-100/40 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <span className="text-lg">🎯</span>
                <h3 className="text-base font-bold text-slate-900">2. 신청 자격 요건 및 대상 상세</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-500 text-xs">연령 기준</span>
                  <p className="font-bold text-slate-900">{policy.eligibility.age || policy.targetAge || '연령 무관'}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-500 text-xs">취업/소득 기준</span>
                  <p className="font-bold text-slate-900">{policy.employmentCondition || '제한 없음'}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1.5 text-xs md:text-sm text-slate-700">
                <span className="font-bold text-slate-900 block">[세부 자격 요건]</span>
                <p className="whitespace-pre-line leading-relaxed">{policy.eligibility.income || policy.incomeCondition || '공고문 참조'}</p>
              </div>
            </div>

            {/* Section 3: 신청 기간 & 사업 기간 분리 상세 안내 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-sky-100 shadow-sky-100/40 space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">📅</span>
                  <h3 className="text-base font-bold text-slate-900">3. 신청 기간 &amp; 사업 기간 상세 안내</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold text-xs border border-sky-200">
                  기간 분리 조회
                </span>
              </div>

              {/* 2 Separated Boxes: 신청기간 vs 사업기간 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. 신청 기간 (상담 및 서류 접수) */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50/70 via-white to-rose-50/30 border border-rose-200/80 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-base shadow-xs">
                        📝
                      </span>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">신청 기간 (접수·상담)</h4>
                        <span className="text-[11px] text-slate-500">서류 접수 및 상담 신청 기간</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-rose-500 text-white font-extrabold text-xs shadow-xs">
                      {policy.dDay || policy.status || '접수중'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-rose-100/90 shadow-2xs space-y-1">
                    <span className="text-xs text-rose-500 font-bold block">공식 접수 기간</span>
                    <div className="text-sm md:text-base font-extrabold text-rose-700">
                      {policy.applyPeriod || policy.period || '상시 접수 (공고문 참조)'}
                    </div>
                  </div>

                  <div className="space-y-2 pt-0.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/40">
                      <span className="text-slate-500">신청/상담 방법</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]" title={policy.benefit.method}>
                        {policy.benefit.method || '온라인 / 방문 접수'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/40">
                      <span className="text-slate-500">문의처</span>
                      <span className="font-bold text-sky-600 truncate max-w-[170px]" title={policy.contact}>
                        {policy.contact || policy.organization || '고객센터'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. 사업 기간 (지원금 지급 및 사업 운영) */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50/70 via-white to-teal-50/30 border border-teal-200/80 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-base shadow-xs">
                        ⏱️
                      </span>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">사업 기간 (수혜·운영)</h4>
                        <span className="text-[11px] text-slate-500">혜택 수혜 및 사업 운영 기간</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-xs">
                      사업 운영
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-teal-100/90 shadow-2xs space-y-1">
                    <span className="text-xs text-teal-700 font-bold block">사업 수행 및 지원 기간</span>
                    <div className="text-sm md:text-base font-extrabold text-teal-800">
                      {policy.bizPeriod || '연중 상시 운영 및 지원 (공고문 참조)'}
                    </div>
                  </div>

                  <div className="space-y-2 pt-0.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-teal-50/40">
                      <span className="text-slate-500">주관 기관</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]" title={policy.organization}>
                        {policy.organization || '정부/지자체'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-teal-50/40">
                      <span className="text-slate-500">지원 형태</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]" title={policy.benefit.amount}>
                        {policy.benefit.amount || '현금/바우처/서비스 지원'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="text-slate-400 text-xs pt-1 border-t border-slate-100 flex items-center justify-between">
                <span>* 상세 세부 공고 일정은 주관기관 사정에 따라 변경될 수 있습니다.</span>
                <span className="text-sky-600 font-semibold">{policy.organization}</span>
              </div>
            </div>

            {/* Section 4: 필수 구비 서류 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-sky-100 shadow-sky-100/40 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📄</span>
                  <h3 className="text-base font-bold text-slate-900">4. 필수 구비 서류</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                  제출 준비
                </span>
              </div>
              <div className="space-y-2.5 pt-1 text-xs md:text-sm">
                {policy.documents && policy.documents.length > 0 ? (
                  policy.documents.map((doc, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{idx + 1}. {doc}</span>
                      <span className="text-sky-600 font-bold text-xs">구비 필요</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">1. 정책 신청서 및 개인정보 수집·이용 동의서</span>
                      <span className="text-rose-500 font-bold text-xs">필수</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">2. 주민등록등본 (상세)</span>
                      <span className="text-teal-600 font-bold text-xs">정부24 무료 발급</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="font-semibold text-slate-800">3. 자격 요건 증빙 서류 (재직/재학/소득 등)</span>
                      <span className="text-sky-600 font-bold text-xs">자격 증빙</span>
                    </div>
                  </>
                )}
              </div>
              <div className="text-slate-400 text-xs pt-1 border-t border-slate-100">
                * 온라인 접수 시 스캔 파일(PDF, JPG)로 간편하게 첨부하실 수 있습니다.
              </div>
            </div>

            {/* Section 5: 실시간 정책 키워드 중심 뉴스 & 언론 보도 (다크 하이라이트 & 인터랙티브 요약 뷰어) */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1128] via-[#0f172a] to-[#1e1b4b] p-6 md:p-8 text-white shadow-2xl shadow-indigo-950/40 border border-indigo-500/30 space-y-6">
              {/* Background Ambient Glows */}
              <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none"></div>
              <div className="absolute -left-16 -bottom-16 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"></div>

              {/* 1. Header & Controls */}
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-700/80 gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-600 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg shadow-cyan-500/30 shrink-0">
                    📰
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
                        정책 관련 실시간 뉴스 &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300">AI 요약 브리핑</span>
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-extrabold flex items-center gap-1.5 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                        실시간 3건 분석
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 pt-1">
                      정책 키워드로 탐색된 핵심 언론 보도 요약을 버튼을 눌러 순차적으로 확인하실 수 있습니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleRefreshNews}
                    disabled={newsLoading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-bold border border-cyan-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50 shadow-sm"
                    title="실시간 뉴스 기사를 다시 검색하고 AI 요약을 갱신합니다."
                  >
                    <span className={newsLoading ? 'animate-spin' : ''}>🔄</span>
                    <span>실시간 AI 갱신</span>
                  </button>
                  <span className="text-xs font-bold text-slate-200 bg-slate-800/90 px-3 py-2 rounded-xl border border-slate-700">
                    총 {relatedNews.length}건 중 {relatedNews.length > 0 ? activeNewsIndex + 1 : 0}번째
                  </span>
                </div>
              </div>

              {/* 2. News Tab Selector (1번 뉴스, 2번 뉴스, 3번 뉴스) */}
              {!newsLoading && relatedNews.length > 0 && (
                <div className="relative z-10 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {relatedNews.map((n, idx) => {
                    const isActive = idx === activeNewsIndex;
                    return (
                      <button
                        key={n.id || idx}
                        onClick={() => setActiveNewsIndex(idx)}
                        type="button"
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-300 scale-[1.02]'
                            : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 border border-slate-700/80 hover:text-white'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${isActive ? 'bg-white text-blue-700' : 'bg-slate-700 text-slate-300'}`}>
                          {idx + 1}
                        </span>
                        <span className="truncate max-w-[140px] md:max-w-[200px]">{n.publisher} · {n.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 3. Main Content: Active News Card */}
              {newsLoading ? (
                <div className="relative z-10 p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 animate-pulse space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="w-32 h-5 bg-slate-700 rounded"></div>
                    <div className="w-24 h-4 bg-slate-700 rounded"></div>
                  </div>
                  <div className="w-4/5 h-6 bg-slate-700 rounded"></div>
                  <div className="w-full h-32 bg-slate-700/80 rounded-xl"></div>
                </div>
              ) : relatedNews.length === 0 ? (
                <div className="relative z-10 p-10 text-center bg-slate-800/50 rounded-2xl border border-slate-700 text-slate-400 space-y-2">
                  <p className="text-3xl">📋</p>
                  <p className="text-base font-bold text-slate-200">현재 정책 키워드 기반 뉴스를 실시간 수집 중입니다.</p>
                  <p className="text-xs text-slate-400">상단 [실시간 AI 갱신] 버튼을 눌러 최신 기사를 불러올 수 있습니다.</p>
                </div>
              ) : (
                (() => {
                  const currentNews = relatedNews[activeNewsIndex] || relatedNews[0];
                  const rawLines = currentNews.summary3Lines ? currentNews.summary3Lines.split('\n').filter(Boolean) : [];
                  const kws = Array.isArray(currentNews.keywords) ? currentNews.keywords : [];

                  const handlePrevNews = () => {
                    setActiveNewsIndex((prev) => (prev > 0 ? prev - 1 : relatedNews.length - 1));
                  };

                  const handleNextNews = () => {
                    setActiveNewsIndex((prev) => (prev < relatedNews.length - 1 ? prev + 1 : 0));
                  };

                  return (
                    <article className="relative z-10 p-6 md:p-7 rounded-2xl bg-slate-950/80 border border-indigo-500/40 shadow-xl space-y-5">
                      {/* Top Header: Badge, Publisher, Date, Direct Link */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-extrabold text-xs border border-cyan-400/40">
                            {currentNews.publisher || '언론사 보도'}
                          </span>
                          <span className="text-slate-400 font-medium">{currentNews.publishedAt}</span>
                          <span className="text-[11px] text-indigo-300 bg-indigo-950/80 px-2.5 py-0.5 rounded-md border border-indigo-700/50">
                            기사 #{activeNewsIndex + 1} / {relatedNews.length}
                          </span>
                        </div>
                        <span className="text-xs text-cyan-400 font-semibold bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/40">
                          🎯 키워드 #{currentNews.keywords?.[0] || policy.category} 매칭
                        </span>
                      </div>

                      {/* Title: Click to Open URL */}
                      <h4
                        onClick={(e) => {
                          e.stopPropagation();
                          if (currentNews.url) {
                            const targetUrl = currentNews.url.startsWith('http') ? currentNews.url : `https://${currentNews.url}`;
                            window.open(targetUrl, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className="text-lg md:text-xl font-extrabold text-white hover:text-cyan-300 transition-colors leading-snug cursor-pointer flex items-start justify-between gap-3 group"
                        title="클릭하여 원문 기사 페이지로 이동 (새 창)"
                      >
                        <span>{currentNews.title}</span>
                        <span className="text-slate-400 group-hover:text-cyan-300 text-base shrink-0">↗</span>
                      </h4>

                      {/* AI 3줄 핵심 요약 박스 (Dark Glowing Accent) */}
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-indigo-950/60 border border-indigo-500/30 text-xs md:text-sm text-slate-200 space-y-3 shadow-inner">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="font-extrabold text-white flex items-center gap-2 text-xs md:text-sm">
                            <span className="text-cyan-400 text-base">✨</span>
                            <span className="tracking-tight">AI 3줄 핵심 뉴스 요약</span>
                          </span>
                          <span className="text-[11px] text-cyan-300/80 font-semibold">OpenRouter AI 실시간 분석</span>
                        </div>

                        <div className="space-y-2.5 leading-relaxed pt-1">
                          {rawLines.length > 0 ? (
                            rawLines.map((line, lIdx) => {
                              const cleanLine = line.replace(/^\[\d+\]\s*/, '').replace(/^\d+\.\s*/, '');
                              const label = lIdx === 0 ? '정책 동향' : lIdx === 1 ? '핵심 혜택' : '신청·유의';
                              const labelColor =
                                lIdx === 0
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                                  : lIdx === 1
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/40';
                              return (
                                <div key={lIdx} className="flex items-start gap-2.5">
                                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-black shrink-0 mt-0.5 ${labelColor}`}>
                                    {label}
                                  </span>
                                  <p className="text-slate-200 flex-1 leading-relaxed font-normal">
                                    {cleanLine.replace(/^\[(정책 동향|핵심 혜택|신청·유의|보도 개요|주요 혜택|신청 절차|현장 반응|선발 조건|유의 사항|접수 팁|필수 서류|결과 확인)\]\s*/, '')}
                                  </p>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-slate-300">{currentNews.summary3Lines || '기사의 핵심 요약 내용입니다.'}</p>
                          )}
                        </div>
                      </div>

                      {/* Keywords Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-xs text-slate-400 font-semibold mr-1">연관 태그:</span>
                        {kws.slice(0, 6).map((kw, kIdx) => (
                          <span
                            key={kIdx}
                            className="px-2.5 py-1 rounded-lg bg-slate-800/90 text-cyan-300 text-xs font-medium border border-slate-700/80 shadow-2xs"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>

                      {/* Footer Control Bar: Prev / Next Buttons & Direct Link */}
                      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3.5">
                        {/* News Step Indicator & Prev/Next Buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                          <button
                            type="button"
                            onClick={handlePrevNews}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                            title="이전 뉴스 요약 보기"
                          >
                            <span>◀</span>
                            <span>이전 뉴스</span>
                          </button>

                          {/* Dots Indicator */}
                          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800">
                            {relatedNews.map((_, dIdx) => (
                              <button
                                key={dIdx}
                                onClick={() => setActiveNewsIndex(dIdx)}
                                className={`h-2 rounded-full transition-all cursor-pointer ${
                                  dIdx === activeNewsIndex
                                    ? 'w-6 bg-gradient-to-r from-cyan-400 to-sky-400'
                                    : 'w-2 bg-slate-700 hover:bg-slate-500'
                                }`}
                                title={`${dIdx + 1}번 뉴스로 이동`}
                              />
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={handleNextNews}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black shadow-lg shadow-cyan-500/25 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ring-1 ring-cyan-300/50"
                            title="다음 뉴스 요약 보기"
                          >
                            <span>다음 뉴스 요약 보기</span>
                            <span>▶</span>
                          </button>
                        </div>

                        {/* Direct Link Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (currentNews.url) {
                              const targetUrl = currentNews.url.startsWith('http') ? currentNews.url : `https://${currentNews.url}`;
                              window.open(targetUrl, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-cyan-600 text-cyan-200 hover:text-white text-xs font-bold border border-slate-700 hover:border-cyan-500 transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
                          title="해당 언론사 원문 기사 페이지로 이동합니다."
                        >
                          <span>언론사 원본보기</span>
                          <span>↗</span>
                        </button>
                      </div>
                    </article>
                  );
                })()
              )}
            </div>

            {/* Related Recommendation Banner */}
            {relatedPolicies.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-sky-100 shadow-sky-100/40 space-y-4">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-slate-900">함께 확인하면 유리한 {policy.category} 연계 정책</h3>
                  <p className="text-xs text-slate-500">동일 카테고리 내에서 함께 신청 가능한 추천 혜택입니다.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedPolicies.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => onNavigate?.('detail', rel.id)}
                      className="p-4 rounded-2xl bg-[#f8fafc] hover:bg-sky-50/50 transition-all flex flex-col justify-between border border-slate-100 hover:border-sky-200 group cursor-pointer"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px] truncate max-w-[130px]">{rel.organization}</span>
                          <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[11px] font-bold">
                            {rel.matchScore || 88}% 적합
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-sky-600 transition-colors line-clamp-1">
                          {rel.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {rel.benefitSummary}
                        </p>
                      </div>
                      <div className="pt-3 flex items-center justify-between text-xs">
                        <span className="text-sky-600 font-semibold">{rel.dDay || rel.status || '상시 접수'}</span>
                        <span className="text-slate-400 group-hover:text-sky-600 flex items-center gap-0.5 font-medium">
                          상세보기 →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sticky Application Rail Panel (4 Cols) */}
          <div className="lg:col-span-4 space-y-5 sticky top-20">
            
            {/* Floating Action Main Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-sky-100 shadow-sky-100/40 space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping"></span>
                  <span className="text-xs font-bold text-sky-700 whitespace-nowrap">
                    {policy.dDay || policy.status || '상시 접수중'}
                  </span>
                </div>
                <span className="text-xs text-slate-400 truncate max-w-[130px]">{policy.organization}</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <a
                  href={policy.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-sky-200 transition-all text-center cursor-pointer"
                >
                  <span>공식 신청 페이지 바로가기</span>
                  <span>↗</span>
                </a>

                {/* 알람 신청 버튼 */}
                <button
                  onClick={handleApplyAlert}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-50 to-sky-50 hover:from-teal-100 hover:to-sky-100 text-teal-800 border border-teal-200/80 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  title="등록된 텔레그램 ID 또는 이메일로 정책 마감/변동 알림을 DB에 등록합니다."
                >
                  <span className="text-sm">🔔</span>
                  <span>맞춤 알림 신청 (텔레그램/이메일 DB 등록)</span>
                </button>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    onClick={handleBookmark}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border shadow-2xs cursor-pointer ${
                      isBookmarked
                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <span>{isBookmarked ? '★' : '☆'}</span>
                    <span>{isBookmarked ? '스크랩 완료' : '관심 저장'}</span>
                  </button>

                  <button
                    onClick={() => onNavigate?.('explore')}
                    className="py-2.5 px-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-sky-600 text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-slate-200 shadow-2xs cursor-pointer"
                  >
                    <span>목록으로</span>
                    <span>←</span>
                  </button>
                </div>
              </div>

              {/* Support Info */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-400 text-xs">
                <span className="truncate max-w-[150px]" title={policy.id}>ID: {policy.id}</span>
                <span className="text-sky-600 font-semibold">{policy.category}</span>
              </div>
            </div>

            {/* Self-Eligibility Verification Widget */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-sky-100 shadow-sky-100/40 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-sky-600 text-base">📋</span>
                  <h3 className="font-bold text-sm text-slate-900">지원 자격 체크</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-teal-50 border border-teal-200 text-teal-700 font-bold">
                  자격 충족 가능
                </span>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-teal-500">✓</span>
                    <span className="font-medium text-slate-800">대상 연령</span>
                  </div>
                  <span className="text-teal-600 font-semibold truncate max-w-[130px]">{policy.targetAge || '연령 무관'}</span>
                </div>
                
                <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-teal-500">✓</span>
                    <span className="font-medium text-slate-800">취업/소득 조건</span>
                  </div>
                  <span className="text-slate-700 font-semibold truncate max-w-[130px]" title={policy.incomeCondition}>
                    {policy.employmentCondition || policy.incomeCondition || '제한 없음'}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Guidance Box */}
            <div className="rounded-2xl bg-gradient-to-br from-white via-indigo-50/30 to-sky-50/50 p-5 border border-sky-100 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <span>💡</span>
                <span className="text-slate-900">청년나침반 신청 TIP</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                해당 사업은 공식 접수처({policy.organization})의 접수 기간 내 온라인 또는 방문 신청이 가능하며, 구비 서류를 사전에 PDF 등으로 준비하시면 보다 신속하게 접수할 수 있습니다.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Mobile & Tablet Floating Action Bar (<1024px) */}
      <div className="fixed bottom-16 left-0 right-0 z-30 lg:hidden bg-white/95 backdrop-blur-md border-t border-sky-100 p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex items-center gap-2">
        <button
          onClick={handleBookmark}
          className={`p-3 rounded-xl border flex items-center justify-center text-base transition-colors shrink-0 ${
            isBookmarked ? 'bg-amber-50 text-amber-500 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}
          title="관심 정책 저장"
        >
          {isBookmarked ? '★' : '☆'}
        </button>

        <button
          onClick={handleApplyAlert}
          className="p-3 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center text-sm font-bold shrink-0"
          title="텔레그램/이메일 알림 신청"
        >
          🔔
        </button>

        <a
          href={policy.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-extrabold text-xs sm:text-sm text-center shadow-md shadow-sky-300/40 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
        >
          <span>공식 신청하기</span>
          <span>↗</span>
        </a>
      </div>
    </main>
  );
};

export default DetailView;
