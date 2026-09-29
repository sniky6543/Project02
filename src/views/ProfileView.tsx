import React, { useState, useEffect, useMemo } from 'react';
import {
  ProfileSettingsData,
  loadProfileSettings,
  saveProfileSettings,
  clearProfileSettings,
  EMPTY_PROFILE_SETTINGS,
  DEMO_PROFILE_SETTINGS,
} from '../utils/profileStorage';
import { getPolicies } from '../api/supabasePolicies';
import { PolicyItem } from '../types/policy';
import { calculatePolicyMatch } from '../utils/policyMatcher';
import { KOREA_REGIONS, KOREA_CITIES } from '../utils/regionData';

interface ProfileViewProps {
  onNavigate?: (path: string, policyId?: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate }) => {
  // 1. 로컬스토리지에서 저장된 초기 설정 불러오기 (NULL-Safe)
  const [initialData] = useState<ProfileSettingsData>(() => loadProfileSettings());

  // Supabase 실데이터 공고 목록
  const [rawPolicies, setRawPolicies] = useState<PolicyItem[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setPoliciesLoading(true);
      try {
        const data = await getPolicies({ limit: 100 });
        setRawPolicies(data);
      } catch (err) {
        console.error('Failed to load policies in ProfileView:', err);
      } finally {
        setPoliciesLoading(false);
      }
    }
    loadData();
  }, []);

  // SECTION 01: 기본 인적사항
  const [nickname, setNickname] = useState<string>(initialData.nickname || '');
  const [birthDate, setBirthDate] = useState<string>(initialData.birthDate || '');
  const [householdType, setHouseholdType] = useState<string>(initialData.householdType || '');
  const [regionCity, setRegionCity] = useState<string>(initialData.regionCity || '서울특별시');
  const [regionDistrict, setRegionDistrict] = useState<string>(initialData.regionDistrict || '마포구 (서교동/상수동)');
  const [aiProvider, setAiProvider] = useState<'OPENAI' | 'OLLAMA' | 'Router API'>(initialData.aiProvider || 'OPENAI');
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>(initialData.apiKeys || { OPENAI: '', OLLAMA: '', 'Router API': '' });
  const [showKey, setShowKey] = useState<boolean>(false);

  // SECTION 02: 학력 및 취업 · 구직 상태
  const [employmentStatus, setEmploymentStatus] = useState<string>(initialData.employmentStatus || '');
  const [education, setEducation] = useState<string>(initialData.education || '');
  const [targetJob, setTargetJob] = useState<string>(initialData.targetJob || '');

  // SECTION 03: 소득 구간 & 주거 형태
  const [housingType, setHousingType] = useState<string>(initialData.housingType || '');
  const [annualIncome, setAnnualIncome] = useState<string>(initialData.annualIncome || '');

  // SECTION 04: 관심 분야 & 정책 키워드
  const [interests, setInterests] = useState<string[]>(initialData.interests || []);

  // SECTION 05: 알림 및 추천 수신 설정
  const [notifyNewPolicy, setNotifyNewPolicy] = useState<boolean>(Boolean(initialData.notifyNewPolicy));
  const [notifyDeadline, setNotifyDeadline] = useState<boolean>(Boolean(initialData.notifyDeadline));
  const [isTelegramSelected, setIsTelegramSelected] = useState<boolean>(Boolean(initialData.isTelegramSelected));
  const [telegramId, setTelegramId] = useState<string>(initialData.telegramId || '');
  const [isEmailSelected, setIsEmailSelected] = useState<boolean>(Boolean(initialData.isEmailSelected));
  const [emailAddress, setEmailAddress] = useState<string>(initialData.emailAddress || '');

  // 텔레그램 봇 설정 가이드 팝업 상태
  const [showTelegramGuide, setShowTelegramGuide] = useState<boolean>(false);
  const [copiedBotId, setCopiedBotId] = useState<boolean>(false);
  const [testAlertSent, setTestAlertSent] = useState<boolean>(false);

  // UI 피드백 상태 (저장 알림 토스트 & 최종 저장 시각)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>('방금 전');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'ready'>('saved');

  // 시/도 변경 시 해당 도시의 첫 번째 시/군/구로 자동 동기화
  const handleCityChange = (newCity: string) => {
    setRegionCity(newCity);
    const districts = KOREA_REGIONS[newCity] || [];
    if (districts.length > 0) {
      setRegionDistrict(districts[0]);
    } else {
      setRegionDistrict('');
    }
  };

  // 텔레그램 봇 아이디 복사 핸들러
  const handleCopyBotUsername = () => {
    navigator.clipboard.writeText('@youth_compass_bot');
    setCopiedBotId(true);
    showToast('📋 텔레그램 봇 아이디(@youth_compass_bot)가 복사되었습니다.');
    setTimeout(() => setCopiedBotId(false), 2500);
  };

  // 텔레그램 테스트 알림 시뮬레이션
  const handleSendTestTelegramAlert = () => {
    setTestAlertSent(true);
    showToast('🔔 [테스트] 청년나침반 봇: 회원님의 맞춤 정책 알림이 정상 수신되었습니다!');
    setTimeout(() => setTestAlertSent(false), 3000);
  };

  // 만 나이 자동 계산 (NULL Safe)
  const calculatedAge = useMemo(() => {
    if (!birthDate || !birthDate.trim()) return null;
    try {
      const cleaned = birthDate.replace(/[^0-9]/g, '');
      if (cleaned.length === 8) {
        const year = parseInt(cleaned.substring(0, 4), 10);
        const month = parseInt(cleaned.substring(4, 6), 10) - 1;
        const day = parseInt(cleaned.substring(6, 8), 10);
        const birth = new Date(year, month, day);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        return age >= 0 && age < 120 ? age : null;
      }
    } catch {
      // fallback
    }
    return null;
  }, [birthDate]);

  // 프로필 완성도 계산 (0% ~ 100% 완전 동적 계산)
  const profileCompletion = useMemo(() => {
    let score = 0;
    if (nickname && nickname.trim()) score += 15;
    if (birthDate && birthDate.trim()) score += 15;
    if (householdType) score += 10;
    if (employmentStatus) score += 15;
    if (targetJob && targetJob.trim()) score += 15;
    if (housingType) score += 10;
    if (annualIncome && annualIncome.trim()) score += 10;
    if (interests.length > 0) score += 10;
    return Math.min(score, 100);
  }, [nickname, birthDate, householdType, employmentStatus, targetJob, housingType, annualIncome, interests]);

  // 프로필 데이터 존재 여부 판단 (초기화/NULL 상태 감지)
  const hasProfileData = useMemo(() => {
    return Boolean(
      (nickname && nickname.trim()) ||
      (birthDate && birthDate.trim()) ||
      householdType ||
      employmentStatus ||
      (targetJob && targetJob.trim()) ||
      housingType ||
      (annualIncome && annualIncome.trim()) ||
      interests.length > 0
    );
  }, [nickname, birthDate, householdType, employmentStatus, targetJob, housingType, annualIncome, interests]);

  // 전체 프로필 상태 객체 생성
  const currentProfileData: ProfileSettingsData = useMemo(() => ({
    nickname,
    birthDate,
    householdType,
    regionCity,
    regionDistrict,
    aiProvider,
    apiKeys: {
      OPENAI: apiKeys.OPENAI || '',
      OLLAMA: apiKeys.OLLAMA || '',
      'Router API': apiKeys['Router API'] || '',
    },
    employmentStatus,
    education,
    targetJob,
    housingType,
    annualIncome,
    interests,
    notifyNewPolicy,
    notifyDeadline,
    isTelegramSelected,
    telegramId,
    isEmailSelected,
    emailAddress,
  }), [
    nickname, birthDate, householdType, regionCity, regionDistrict, aiProvider, apiKeys,
    employmentStatus, education, targetJob, housingType, annualIncome, interests,
    notifyNewPolicy, notifyDeadline, isTelegramSelected, telegramId, isEmailSelected, emailAddress
  ]);

  // 마감 임박 정렬 헬퍼 (전체 공고 기준 D-Day 우선 정렬)
  const deadlineSortedPolicies = useMemo(() => {
    return [...rawPolicies].sort((a, b) => {
      const getDays = (item: PolicyItem) => {
        if (!item.dDay) return 9999;
        if (item.dDay === 'D-Day') return 0;
        const num = parseInt(item.dDay.replace(/[^0-9]/g, ''), 10);
        return isNaN(num) ? 9998 : num;
      };
      const daysA = getDays(a);
      const daysB = getDays(b);
      if (daysA !== daysB) {
        return daysA - daysB;
      }
      if (a.status === '접수중' && b.status !== '접수중') return -1;
      if (b.status === '접수중' && a.status !== '접수중') return 1;
      return 0;
    });
  }, [rawPolicies]);

  // 나의 설정에 맞는 공고만 리스트에 보이게 설정 (미설정 시 전체 공고 마감 임박순)
  const displayedPolicies = useMemo(() => {
    if (!rawPolicies || rawPolicies.length === 0) return [];

    if (hasProfileData) {
      // 내 설정(관심분야, 거주지역, 연령, 취업상태 등)에 부합하는 공고만 엄격 선별
      const scored = rawPolicies
        .map((p) => {
          const match = calculatePolicyMatch(p, currentProfileData);
          return {
            ...p,
            matchScore: match.score,
            aiMatchReason: match.matchReasons.join(' · '),
            isMatched: match.isMatched,
          };
        })
        .filter((p) => p.isMatched && (p.matchScore || 0) >= 75); // 실제 DB 조건과 일치하는 공고만 선별

      return scored.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    } else {
      // 프로필에 내설정이 되어있지 않으면 전체 공고가 공고마감 임박순으로 설정
      return deadlineSortedPolicies;
    }
  }, [rawPolicies, hasProfileData, currentProfileData, deadlineSortedPolicies]);

  // 실시간 적합 매칭 건수 (DB 조건 일치 기준)
  const matchCount = useMemo(() => {
    return displayedPolicies.length;
  }, [displayedPolicies]);

  // 변경 시 로컬스토리지 자동 임시저장 (Auto-save)
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      const success = saveProfileSettings(currentProfileData);
      if (success) {
        setSaveStatus('saved');
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        setLastSavedTime(timeStr);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [currentProfileData]);

  // 관심 분야 토글 핸들러
  const handleToggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  // 토스트 메시지 표시 유틸리티
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // 명시적 저장 버튼 핸들러
  const handleExplicitSave = () => {
    const success = saveProfileSettings(currentProfileData);
    if (success) {
      showToast('✅ 프로필 설정이 완료되었습니다! 모든 화면에서 맞춤 정책이 1순위로 우선 노출됩니다.');
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('home');
        }
      }, 900);
    } else {
      showToast('❌ 프로필 저장 중 오류가 발생했습니다.');
    }
  };

  // 완전 초기화 (모든 사용자 입력값 NULL/공백 처리)
  const handleResetSettings = () => {
    if (window.confirm('모든 프로필 입력값을 완전히 비우고 초기화(NULL/공백)하시겠습니까?')) {
      clearProfileSettings();
      setNickname(EMPTY_PROFILE_SETTINGS.nickname);
      setBirthDate(EMPTY_PROFILE_SETTINGS.birthDate);
      setHouseholdType(EMPTY_PROFILE_SETTINGS.householdType);
      setRegionCity(EMPTY_PROFILE_SETTINGS.regionCity);
      setRegionDistrict(EMPTY_PROFILE_SETTINGS.regionDistrict);
      setAiProvider(EMPTY_PROFILE_SETTINGS.aiProvider);
      setApiKeys(EMPTY_PROFILE_SETTINGS.apiKeys);
      setEmploymentStatus(EMPTY_PROFILE_SETTINGS.employmentStatus);
      setEducation(EMPTY_PROFILE_SETTINGS.education);
      setTargetJob(EMPTY_PROFILE_SETTINGS.targetJob);
      setHousingType(EMPTY_PROFILE_SETTINGS.housingType);
      setAnnualIncome(EMPTY_PROFILE_SETTINGS.annualIncome);
      setInterests(EMPTY_PROFILE_SETTINGS.interests);
      setNotifyNewPolicy(EMPTY_PROFILE_SETTINGS.notifyNewPolicy);
      setNotifyDeadline(EMPTY_PROFILE_SETTINGS.notifyDeadline);
      setIsTelegramSelected(EMPTY_PROFILE_SETTINGS.isTelegramSelected);
      setTelegramId(EMPTY_PROFILE_SETTINGS.telegramId);
      setIsEmailSelected(EMPTY_PROFILE_SETTINGS.isEmailSelected);
      setEmailAddress(EMPTY_PROFILE_SETTINGS.emailAddress);
      showToast('🔄 모든 프로필 입력값이 완전 초기화(NULL/공백)되었습니다.');
    }
  };

  // 데모 샘플 데이터 채우기 (테스트 편의 기능)
  const handleFillDemoData = () => {
    setNickname(DEMO_PROFILE_SETTINGS.nickname);
    setBirthDate(DEMO_PROFILE_SETTINGS.birthDate);
    setHouseholdType(DEMO_PROFILE_SETTINGS.householdType);
    setRegionCity(DEMO_PROFILE_SETTINGS.regionCity);
    setRegionDistrict(DEMO_PROFILE_SETTINGS.regionDistrict);
    setAiProvider(DEMO_PROFILE_SETTINGS.aiProvider);
    setApiKeys(DEMO_PROFILE_SETTINGS.apiKeys);
    setEmploymentStatus(DEMO_PROFILE_SETTINGS.employmentStatus);
    setEducation(DEMO_PROFILE_SETTINGS.education);
    setTargetJob(DEMO_PROFILE_SETTINGS.targetJob);
    setHousingType(DEMO_PROFILE_SETTINGS.housingType);
    setAnnualIncome(DEMO_PROFILE_SETTINGS.annualIncome);
    setInterests(DEMO_PROFILE_SETTINGS.interests);
    setNotifyNewPolicy(DEMO_PROFILE_SETTINGS.notifyNewPolicy);
    setNotifyDeadline(DEMO_PROFILE_SETTINGS.notifyDeadline);
    setIsTelegramSelected(DEMO_PROFILE_SETTINGS.isTelegramSelected);
    setTelegramId(DEMO_PROFILE_SETTINGS.telegramId);
    setIsEmailSelected(DEMO_PROFILE_SETTINGS.isEmailSelected);
    setEmailAddress(DEMO_PROFILE_SETTINGS.emailAddress);
    showToast('✨ 예시 데모 데이터가 입력되었습니다.');
  };

  // [data-path] 네비게이션 지원
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
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-sky-400/40 flex items-center gap-2.5 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col w-full space-y-8">
        {/* Top Banner: Matches SCREEN_4 Airy Pastel Sky-Mint-Indigo Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-100/70 via-indigo-50/50 to-teal-50/70 p-6 md:p-8 border border-sky-200/60 shadow-sm shadow-sky-100/50">
          <div className="absolute -right-8 -top-10 w-72 h-72 rounded-full bg-teal-200/30 blur-3xl pointer-events-none"></div>
          <div className="absolute left-1/3 -bottom-10 w-64 h-64 rounded-full bg-sky-200/40 blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-sky-200/70 shadow-xs text-sky-800 text-xs font-semibold backdrop-blur-md" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                <span>로컬스토리지 실시간 동기화 v2.4 가동 중</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {nickname ? (
                  <>
                    <span className="text-sky-600">{nickname}</span>님의 맞춤 프로필 &amp; 정책 매칭 설정
                  </>
                ) : (
                  <>
                    맞춤 정책 추천을 위해 <span className="text-sky-600 underline decoration-sky-300 decoration-wavy underline-offset-4">프로필을 설정</span>해주세요
                  </>
                )}
              </h1>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                {nickname
                  ? '입력하신 모든 정보는 브라우저 로컬스토리지(localStorage)에 안전하게 보관되며 맞춤 정책 추천에 즉시 반영됩니다.'
                  : '닉네임, 생년월일, 거주지 및 소득 정보를 입력하시면 나에게 딱 맞는 2025 청년정책 혜택을 자동으로 정밀 산출합니다.'}
              </p>
            </div>
            {/* Graphic & Metric Badge Card */}
            <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-sky-100 shadow-md shadow-sky-100/60 shrink-0 self-start md:self-auto">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-100 via-sky-50 to-cyan-100 border border-sky-200 flex items-center justify-center shadow-inner shrink-0 text-sky-600">
                <svg className="w-8 h-8 drop-shadow-xs" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="4" x2="4" y1="21" y2="14"></line>
                  <line x1="4" x2="4" y1="10" y2="3"></line>
                  <line x1="12" x2="12" y1="21" y2="12"></line>
                  <line x1="12" x2="12" y1="8" y2="3"></line>
                  <line x1="20" x2="20" y1="21" y2="16"></line>
                  <line x1="20" x2="20" y1="12" y2="3"></line>
                  <circle cx="4" cy="12" fill="#E0F2FE" r="2.5"></circle>
                  <circle cx="12" cy="10" fill="#E0F2FE" r="2.5"></circle>
                  <circle cx="20" cy="14" fill="#E0F2FE" r="2.5"></circle>
                </svg>
              </div>
              <div className="pr-1" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${hasProfileData && matchCount > 0 ? 'bg-emerald-500' : hasProfileData ? 'bg-amber-400' : 'bg-slate-300'}`}></span>
                  <span className="text-xs font-medium text-slate-500">
                    {hasProfileData ? 'DB 맞춤 필터 적용' : '현재 필터 상태'}
                  </span>
                </div>
                {hasProfileData ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {matchCount}건
                    </span>
                    <span className="text-xs font-bold text-sky-600">
                      / DB {rawPolicies.length}건
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl md:text-2xl font-bold text-slate-400 tracking-tight">
                      미설정
                    </span>
                    <span className="text-xs font-medium text-slate-400">(전체 {rawPolicies.length}건 마감순)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Main Section: Left Form Cards (8 cols) + Right Sticky Sidebar (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Cards */}
          <div className="lg:col-span-8 space-y-6">
            {/* SECTION 01: 기본 인적사항 */}
            <div className="bg-white rounded-2xl p-6 md:p-7 shadow-sm border border-sky-100 hover:border-sky-200 transition-all space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 font-bold text-base flex items-center justify-center shadow-xs">01</span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">기본 인적사항</h2>
                    <p className="text-xs text-slate-500">나이와 거주지 기준의 지자체별 청년 조례 필수 정보</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${nickname && birthDate ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`} style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>
                  <svg className="w-3.5 h-3.5 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  {nickname && birthDate ? '입력 완료' : '필수 항목'}
                </span>
              </div>
              <div className="space-y-5">
                {/* 닉네임 (활동명) 입력란 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">닉네임 (활동명)</label>
                    <span className="text-xs text-sky-600 font-medium">플랫폼 맞춤 호칭</span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-400 focus:bg-white transition-all shadow-xs"
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="예: 청년탐험가 (미입력 시 '청년'으로 표시)"
                    />
                    <span className="material-symbols-outlined absolute right-3 text-slate-400 text-[18px]">badge</span>
                  </div>
                  <p className="text-xs text-slate-400">맞춤 정책 추천 및 AI 요약 브리핑 시 사용될 닉네임입니다.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* 생년월일 & 만 나이 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700">생년월일 (8자리)</label>
                      <span className="text-xs text-sky-600 font-medium">만 나이 자동계산</span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-400 focus:bg-white transition-all shadow-xs"
                        type="text"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        placeholder="예: 1999.04.15"
                      />
                      <span className={`absolute right-3 px-2 py-0.5 rounded-lg text-xs font-bold ${calculatedAge !== null ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-400'}`}>
                        {calculatedAge !== null ? `만 ${calculatedAge}세` : '미입력'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">청년기본법 기준(만 19세~34세) 지원 대상 여부를 판단합니다.</p>
                  </div>

                  {/* 가구원 및 세대 형태 칩 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">가구원 및 세대 형태</label>
                    <div className="grid grid-cols-3 gap-2" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>
                      {['1인가구(단독)', '부모 동거', '신혼부부'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setHouseholdType(householdType === type ? '' : type)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${householdType === type
                              ? 'bg-sky-600 text-white shadow-sm shadow-sky-200 border border-sky-600'
                              : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                            }`}
                        >
                          {householdType === type && (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                          <span>{type}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">세대 분리 및 1인 가구 우대 정책 판별에 활용됩니다.</p>
                  </div>
                </div>

                {/* 실거주지 선택 (특별시/광역시/도 선택 시 해당 하위 시/군/구 자동 연동) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">실제 주민등록 거주지</label>
                    <span className="text-xs text-sky-600 font-medium">지자체 청년 지원 조례 기준</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 상위: 특별시 & 광역시 & 도 선택 */}
                    <div className="relative">
                      <select
                        value={regionCity}
                        onChange={(e) => handleCityChange(e.target.value)}
                        className="w-full appearance-none bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-400 focus:bg-white cursor-pointer shadow-xs font-medium"
                      >
                        {KOREA_CITIES.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none text-[20px]">expand_more</span>
                    </div>

                    {/* 하위: 선택된 시/도에 맞는 시·군·구 선택 */}
                    <div className="relative">
                      <select
                        value={regionDistrict}
                        onChange={(e) => setRegionDistrict(e.target.value)}
                        className="w-full appearance-none bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-400 focus:bg-white cursor-pointer shadow-xs font-medium"
                      >
                        {(KOREA_REGIONS[regionCity] || []).map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none text-[20px]">expand_more</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sky-700 pt-1 text-xs">
                    <svg className="w-4 h-4 text-sky-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="16" y2="12"></line><line x1="12" x2="12.01" y1="8" y2="8"></line></svg>
                    <span><strong>{regionCity} {regionDistrict}</strong> 맞춤 청년 정책 및 전국 공통 혜택이 적용됩니다.</span>
                  </div>
                </div>

                {/* AI API 키 설정 (라디오 버튼 + API 키 입력란) */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sky-600 text-[18px]">psychology</span>
                      <label className="text-xs font-bold text-slate-700">AI 맞춤 추천 &amp; 요약 API 키 설정</label>
                    </div>
                    <span className="text-[11px] text-slate-400">개인 API 키로 맞춤 정책 분석 속도 향상</span>
                  </div>

                  {/* 라디오 버튼 선택 (OPENAI, OLLAMA, Router API) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(['OPENAI', 'OLLAMA', 'Router API'] as const).map((provider) => (
                      <label
                        key={provider}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${aiProvider === provider
                            ? 'bg-sky-50/70 border-sky-300 text-sky-900 shadow-xs ring-1 ring-sky-200'
                            : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100/60'
                          }`}
                      >
                        <input
                          type="radio"
                          name="aiProvider"
                          value={provider}
                          checked={aiProvider === provider}
                          onChange={() => setAiProvider(provider)}
                          className="w-4 h-4 text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                        />
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-bold truncate">{provider}</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* 선택된 API 키 입력 필드 */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700">
                        {aiProvider} {aiProvider === 'OLLAMA' ? '엔드포인트 / API Key' : 'API Key'} 입력
                      </label>
                      <span className="text-[11px] text-sky-600 font-medium">
                        {aiProvider === 'OPENAI' && 'OpenAI (GPT-4o/mini) 연동'}
                        {aiProvider === 'OLLAMA' && '로컬 / 원격 Ollama 서버 연동'}
                        {aiProvider === 'Router API' && 'OpenRouter 및 다중 LLM 라우팅'}
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKeys[aiProvider] || ''}
                        onChange={(e) => setApiKeys({ ...apiKeys, [aiProvider]: e.target.value })}
                        placeholder={
                          aiProvider === 'OPENAI'
                            ? 'sk-proj-...'
                            : aiProvider === 'OLLAMA'
                              ? 'http://localhost:11434 또는 API Key'
                              : 'sk-or-v1-...'
                        }
                        className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 pr-20 focus:outline-none focus:border-sky-400 focus:bg-white transition-all shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 px-2 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                      >
                        {showKey ? '숨기기' : '표시'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">
                      {aiProvider === 'OPENAI' && 'OpenAI API 대시보드에서 발급받은 Secret Key를 입력해주세요.'}
                      {aiProvider === 'OLLAMA' && '로컬 PC나 프라이빗 서버에서 실행 중인 Ollama URL 또는 키를 입력해주세요.'}
                      {aiProvider === 'Router API' && 'OpenRouter 등 라우터 서비스에서 발급받은 통합 API Key를 입력해주세요.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 02: 학력 및 취업 상태 */}
            <div className="bg-white rounded-2xl p-6 md:p-7 shadow-sm border border-sky-100 hover:border-sky-200 transition-all space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 font-bold text-base flex items-center justify-center shadow-xs">02</span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">학력 및 취업 · 구직 상태</h2>
                    <p className="text-xs text-slate-500">취업지원금, 구직수당 및 직무부트캠프 매칭에 활용됩니다.</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>선택 입력</span>
              </div>
              <div className="space-y-5">
                {/* 경제활동 상태 세그먼트 칩 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">현재 경제활동 상태</label>
                  <div className="flex flex-wrap gap-2" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>
                    {[
                      '대학생 (재학/휴학)',
                      '취업준비생',
                      '사회초년생 / 재직자',
                      '이직 준비자',
                      '청년창업가 / 프리랜서',
                    ].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setEmploymentStatus(employmentStatus === status ? '' : status)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${employmentStatus === status
                            ? 'bg-sky-600 text-white shadow-sm shadow-sky-200 border border-sky-600'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                          }`}
                      >
                        {employmentStatus === status && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                        <span>{status}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* 최종 학력 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">최종 학력</label>
                    <div className="relative">
                      <select
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        className="w-full appearance-none bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-400 focus:bg-white cursor-pointer shadow-xs"
                      >
                        <option value="">선택 안 함</option>
                        <option value="4년제 대학교 졸업">4년제 대학교 졸업</option>
                        <option value="전문대학 졸업">전문대학 졸업</option>
                        <option value="대학원 졸업 (석/박사)">대학원 졸업 (석/박사)</option>
                        <option value="고등학교 졸업">고등학교 졸업</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none text-[20px]">expand_more</span>
                    </div>
                  </div>
                  {/* 희망 직무 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">전공 계열 및 희망 직무</label>
                    <div className="relative flex items-center">
                      <input
                        className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-400 focus:bg-white transition-all shadow-xs"
                        type="text"
                        value={targetJob}
                        onChange={(e) => setTargetJob(e.target.value)}
                        placeholder="예: IT / 소프트웨어 기획 · PM"
                      />
                      <span className="material-symbols-outlined absolute right-3 text-slate-400 text-[18px]">edit</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 03: 소득 구간 및 주거 형태 */}
            <div className="bg-white rounded-2xl p-6 md:p-7 shadow-sm border border-sky-100 hover:border-sky-200 transition-all space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 font-bold text-base flex items-center justify-center shadow-xs">03</span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">소득 구간 &amp; 주거 형태</h2>
                    <p className="text-xs text-slate-500">청년 주거지원 및 청년도약계좌 기여금 산출 기준</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>높은 매칭 가중치</span>
              </div>
              <div className="space-y-5">
                {/* 주거계약 형태 선택 (자가, 전세, 월세) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">주거계약 형태</label>
                  <div className="grid grid-cols-3 gap-3" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>
                    {['자가', '전세', '월세'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setHousingType(housingType === type ? '' : type)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${housingType === type
                            ? 'bg-sky-600 text-white shadow-sm shadow-sky-200 border border-sky-600'
                            : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                          }`}
                      >
                        {housingType === type && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                        <span>{type}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    {housingType === '월세' && '청년월세 특별지원, 보증금 대출 이자 지원 등 월세 우대 정책 매칭'}
                    {housingType === '전세' && '버팀목 전세자금 대출, 안심 전세대출 우대 정책 매칭'}
                    {housingType === '자가' && '디딤돌 주택구입자금 대출 및 청년 주택드림 청약 우대 정책 매칭'}
                    {!housingType && '주거 형태를 선택하시면 맞춤 주거 정책을 자동으로 산출합니다.'}
                  </p>
                </div>

                {/* 소득기준 (연소득 입력) */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">소득기준 (연소득)</label>
                    <span className="text-xs text-sky-600 font-medium">직전년도 세전 기준</span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 pr-16 focus:outline-none focus:border-sky-400 focus:bg-white transition-all shadow-xs"
                      type="text"
                      value={annualIncome}
                      onChange={(e) => setAnnualIncome(e.target.value)}
                      placeholder="예: 3,200"
                    />
                    <span className="absolute right-3 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                      만원
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['무소득 (0원)', '2,400만원', '3,600만원', '5,000만원'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          const val = preset.includes('0원') ? '0' : preset.replace(/[^0-9]/g, '');
                          setAnnualIncome(val ? parseInt(val).toLocaleString() : '0');
                        }}
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">기준 중위소득 자동 환산 및 소득 분위별 적합 정책 매칭에 활용됩니다.</p>
                </div>

                {/* Matching Alert Pastel Card */}
                <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-teal-900">맞춤 주거 및 금융 정책 실시간 산출</span>
                    <p className="text-xs text-teal-700 leading-relaxed">
                      {housingType || annualIncome
                        ? `입력하신 ${housingType ? `${housingType} 계약 형태 및 ` : ''}연소득(${annualIncome || '0'}만원) 조건에 부합하는 정책을 실시간 분석합니다.`
                        : '소득 및 주거 형태를 입력하시면 더욱 정확한 맞춤 정책이 추천됩니다.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 04: 관심 분야 및 정책 키워드 (With Colorful Pastel SVG Illustrations) */}
            <div className="bg-white rounded-2xl p-6 md:p-7 shadow-sm border border-sky-100 hover:border-sky-200 transition-all space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 font-bold text-base flex items-center justify-center shadow-xs">04</span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">관심 분야 &amp; 정책 키워드</h2>
                    <p className="text-xs text-slate-500">선택된 관심사 관련 공고와 AI 3줄 뉴스를 우선 피드로 배치합니다.</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-sky-600" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>
                  {interests.length > 0 ? `${interests.length}개 분야 맞춤 설정` : '미선택'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" style={{ wordBreak: 'keep-all' }}>
                {/* 1. 일자리 */}
                <button
                  onClick={() => handleToggleInterest('일자리')}
                  className={`p-4 rounded-2xl text-left flex flex-col gap-2.5 transition-all shadow-xs hover:shadow-md group relative cursor-pointer ${interests.includes('일자리')
                      ? 'bg-amber-50/60 border-2 border-amber-400'
                      : 'bg-white border border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  type="button"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-100 to-amber-50 border border-amber-200 flex items-center justify-center shadow-xs">
                      <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect fill="#FEF3C7" height="13" rx="2" stroke="#F59E0B" width="18" x="3" y="7"></rect>
                        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#D97706"></path>
                        <circle cx="12" cy="13" fill="#D97706" r="1.5"></circle>
                      </svg>
                    </div>
                    {interests.includes('일자리') && (
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">일자리</span>
                    <span className="text-xs text-slate-500 leading-snug block mt-0.5">취업지원, 구직활동지원금, 인턴, 창업</span>
                  </div>
                </button>

                {/* 2. 주거 */}
                <button
                  onClick={() => handleToggleInterest('주거')}
                  className={`p-4 rounded-2xl text-left flex flex-col gap-2.5 transition-all shadow-xs hover:shadow-md group relative cursor-pointer ${interests.includes('주거')
                      ? 'bg-rose-50/60 border-2 border-rose-400'
                      : 'bg-white border border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  type="button"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-100 to-rose-50 border border-rose-200 flex items-center justify-center shadow-xs">
                      <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4H9v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10z" fill="#FFE4E6" stroke="#F43F5E"></path>
                        <rect fill="#FDA4AF" height="4" stroke="#E11D48" width="4" x="10" y="10"></rect>
                      </svg>
                    </div>
                    {interests.includes('주거') && (
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 group-hover:text-rose-700 transition-colors">주거</span>
                    <span className="text-xs text-slate-500 leading-snug block mt-0.5">청년월세, 전세보증금 대출, 행복주택, 공공임대</span>
                  </div>
                </button>

                {/* 3. 교육 / 직업훈련 */}
                <button
                  onClick={() => handleToggleInterest('교육 · 직업훈련')}
                  className={`p-4 rounded-2xl text-left flex flex-col gap-2.5 transition-all shadow-xs hover:shadow-md group relative cursor-pointer ${interests.includes('교육 · 직업훈련')
                      ? 'bg-purple-50/60 border-2 border-purple-400'
                      : 'bg-white border border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  type="button"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-100 to-indigo-50 border border-purple-200 flex items-center justify-center shadow-xs">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M2 9l10-5 10 5-10 5L2 9z" fill="#EDE9FE" stroke="#8B5CF6"></path>
                        <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" stroke="#7C3AED"></path>
                        <line stroke="#7C3AED" x1="22" x2="22" y1="10" y2="15"></line>
                      </svg>
                    </div>
                    {interests.includes('교육 · 직업훈련') && (
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">교육 · 직업훈련</span>
                    <span className="text-xs text-slate-500 leading-snug block mt-0.5">K-디지털 트레이닝, 부트캠프, 어학/자격증 응시료</span>
                  </div>
                </button>

                {/* 4. 금융 / 복지 / 문화 */}
                <button
                  onClick={() => handleToggleInterest('금융 · 복지 · 문화')}
                  className={`p-4 rounded-2xl text-left flex flex-col gap-2.5 transition-all shadow-xs hover:shadow-md group relative cursor-pointer ${interests.includes('금융 · 복지 · 문화')
                      ? 'bg-amber-50/60 border-2 border-amber-400'
                      : 'bg-white border border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  type="button"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 border border-amber-200 flex items-center justify-center shadow-xs">
                      <svg className="w-6 h-6 text-amber-500 drop-shadow-xs" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <rect fill="#FEF3C7" height="12" rx="3" stroke="#F59E0B" width="20" x="2" y="6"></rect>
                        <circle cx="16" cy="12" fill="#FBBF24" r="2.5" stroke="#D97706"></circle>
                        <path d="M6 10h3M6 14h2" stroke="#D97706" strokeLinecap="round"></path>
                      </svg>
                    </div>
                    {interests.includes('금융 · 복지 · 문화') && (
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">금융 · 복지 · 문화</span>
                    <span className="text-xs text-slate-500 leading-snug block mt-0.5">청년도약계좌, 내일저축, 마음건강, 문화예술패스</span>
                  </div>
                </button>

                {/* 5. 참여 / 기반 */}
                <button
                  onClick={() => handleToggleInterest('참여 · 기반')}
                  className={`p-4 rounded-2xl text-left flex flex-col gap-2.5 transition-all shadow-xs hover:shadow-md group relative sm:col-span-2 md:col-span-1 cursor-pointer ${interests.includes('참여 · 기반')
                      ? 'bg-teal-50/60 border-2 border-teal-400'
                      : 'bg-white border border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  type="button"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-100 to-emerald-50 border border-teal-200 flex items-center justify-center shadow-xs">
                      <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="#CCFBF1" stroke="#0D9488"></path>
                        <circle cx="8.5" cy="11.5" fill="#0D9488" r="1"></circle>
                        <circle cx="12" cy="11.5" fill="#0D9488" r="1"></circle>
                        <circle cx="15.5" cy="11.5" fill="#0D9488" r="1"></circle>
                      </svg>
                    </div>
                    {interests.includes('참여 · 기반') && (
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">참여 · 기반</span>
                    <span className="text-xs text-slate-500 leading-snug block mt-0.5">청년정책네트워크, 청년공간, 봉사 및 지역사회참여</span>
                  </div>
                </button>
              </div>
            </div>

            {/* SECTION 05: 알림 및 추천 수신 설정 */}
            <div className="bg-white rounded-2xl p-6 md:p-7 shadow-sm border border-sky-100 hover:border-sky-200 transition-all space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 font-bold text-base flex items-center justify-center shadow-xs">05</span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">알림 및 추천 수신 설정</h2>
                    <p className="text-xs text-slate-500">마감 임박 및 신규 적합 정책을 선제적으로 알려드립니다.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-5 divide-y divide-slate-100">
                {/* Setting 1: 신규 매칭 정책 요약 알림 */}
                <div className="flex items-center justify-between pt-1">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800">신규 매칭 정책 요약 알림</span>
                    <p className="text-xs text-slate-500">나의 프로필 조건에 부합하는 새로운 공고 게시 시 주 2회 요약 발송</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                    <input
                      checked={notifyNewPolicy}
                      onChange={(e) => setNotifyNewPolicy(e.target.checked)}
                      className="sr-only peer"
                      type="checkbox"
                    />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                  </label>
                </div>

                {/* Setting 2: 마감 임박 D-Day 긴급 알림 */}
                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800">마감 임박 D-Day 긴급 알림</span>
                    <p className="text-xs text-slate-500">관심 보관 정책의 신청 접수 마감 D-7, D-3, D-1 전 푸시 발송</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                    <input
                      checked={notifyDeadline}
                      onChange={(e) => setNotifyDeadline(e.target.checked)}
                      className="sr-only peer"
                      type="checkbox"
                    />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                  </label>
                </div>

                {/* Notification Channels */}
                <div className="pt-4 space-y-3">
                  <span className="text-xs font-bold text-slate-800">수신 채널 선택</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 텔레그램 알림 채널 */}
                    <div className={`p-4 rounded-xl border transition-all ${isTelegramSelected ? 'bg-sky-50/30 border-sky-200' : 'bg-slate-50/60 border-slate-200'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isTelegramSelected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setIsTelegramSelected(checked);
                              if (checked) {
                                setShowTelegramGuide(true);
                              }
                            }}
                            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                          />
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs shadow-xs transition-colors ${isTelegramSelected ? 'bg-[#229ED9]' : 'bg-slate-400'}`}>
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                              </svg>
                            </div>
                            <span className={`text-xs font-semibold transition-colors ${isTelegramSelected ? 'text-slate-800' : 'text-slate-500'}`}>텔레그램 알림</span>
                          </div>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowTelegramGuide(true)}
                          className="px-2 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-700 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="텔레그램 봇 설정 가이드 및 이미지 보기"
                        >
                          <span className="material-symbols-outlined text-[13px]">image</span>
                          <span>설정 가이드</span>
                        </button>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className={`text-[11px] font-bold transition-colors ${isTelegramSelected ? 'text-slate-700' : 'text-slate-400'}`}>텔레그램 ID 입력</label>
                          <button
                            type="button"
                            onClick={() => setShowTelegramGuide(true)}
                            className="text-[11px] text-sky-600 hover:text-sky-800 font-medium underline cursor-pointer flex items-center gap-0.5"
                          >
                            <span>봇 설정 방법 보기</span>
                            <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={telegramId}
                          disabled={!isTelegramSelected}
                          onChange={(e) => setTelegramId(e.target.value)}
                          placeholder="@username 또는 챗 ID (예: 123456789)"
                          className={`w-full rounded-lg px-3 py-2 text-xs transition-all ${isTelegramSelected
                              ? 'bg-white border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-400 shadow-xs'
                              : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed placeholder:text-slate-300'
                            }`}
                        />
                        <p className={`text-[11px] transition-colors ${isTelegramSelected ? 'text-slate-500' : 'text-slate-300'}`}>
                          @청년나침반_bot 추가 후 발급받은 Chat ID 또는 username을 입력해주세요.
                        </p>
                      </div>
                    </div>

                    {/* 이메일 알림 채널 */}
                    <div className={`p-4 rounded-xl border transition-all ${isEmailSelected ? 'bg-sky-50/30 border-sky-200' : 'bg-slate-50/60 border-slate-200'}`}>
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isEmailSelected}
                          onChange={(e) => setIsEmailSelected(e.target.checked)}
                          className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-xs transition-colors ${isEmailSelected ? 'bg-sky-100 text-sky-600' : 'bg-slate-200 text-slate-400'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                          </div>
                          <span className={`text-xs font-semibold transition-colors ${isEmailSelected ? 'text-slate-800' : 'text-slate-500'}`}>이메일 알림</span>
                        </div>
                      </label>
                      <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5">
                        <label className={`text-[11px] font-bold transition-colors ${isEmailSelected ? 'text-slate-700' : 'text-slate-400'}`}>이메일 주소 입력</label>
                        <input
                          type="email"
                          value={emailAddress}
                          disabled={!isEmailSelected}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          placeholder="example@email.com"
                          className={`w-full rounded-lg px-3 py-2 text-xs transition-all ${isEmailSelected
                              ? 'bg-white border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-400 shadow-xs'
                              : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed placeholder:text-slate-300'
                            }`}
                        />
                        <p className={`text-[11px] transition-colors ${isEmailSelected ? 'text-slate-400' : 'text-slate-300'}`}>
                          신규 맞춤 공고와 마감 임박 알림이 발송됩니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Completion Gauge Card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-sky-100 space-y-4" style={{ wordBreak: 'keep-all' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">프로필 완성도</span>
                  <span className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold ${profileCompletion >= 80 ? 'bg-sky-50 border-sky-200 text-sky-700' : profileCompletion >= 40 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                    {profileCompletion >= 80 ? '높음' : profileCompletion >= 40 ? '보통' : '미완료'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                      <circle className="text-slate-100" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="6"></circle>
                      <circle
                        className="text-sky-500 transition-all duration-500"
                        cx="32"
                        cy="32"
                        fill="transparent"
                        r="28"
                        stroke="currentColor"
                        strokeDasharray="175.9"
                        strokeDashoffset={`${175.9 - (175.9 * profileCompletion) / 100}`}
                        strokeLinecap="round"
                        strokeWidth="6"
                      ></circle>
                    </svg>
                    <span className="absolute text-base font-extrabold text-sky-600">{profileCompletion}%</span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">
                      {profileCompletion === 100 ? '🎉 모든 프로필 항목 완성' : profileCompletion === 0 ? '프로필을 입력해주세요' : `${Math.ceil((100 - profileCompletion) / 15)}개 항목 추가 시 완료`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {profileCompletion > 0 ? `현재 매칭 신뢰도 ${(profileCompletion * 0.98).toFixed(1)}%` : '정보 입력 시 매칭 계산 시작'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">빠른 입력 팁</span>
                    <button
                      type="button"
                      onClick={handleFillDemoData}
                      className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold underline cursor-pointer"
                    >
                      예시 데모 데이터 채우기
                    </button>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 pl-0 list-none">
                    <li className="flex items-center gap-1.5 text-sky-600 hover:underline cursor-pointer">
                      <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="16"></line><line x1="8" x2="16" y1="12" y2="12"></line></svg>
                      <span>직전년도 근로소득 등록 (+10%)</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-sky-600 hover:underline cursor-pointer">
                      <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="16"></line><line x1="8" x2="16" y1="12" y2="12"></line></svg>
                      <span>관심 분야 1개 이상 선택 (+10%)</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Real-time Matched Policies Preview Card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-sky-100 space-y-4" style={{ wordBreak: 'keep-all' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{hasProfileData ? '🎯' : '⏰'}</span>
                    <span className="text-sm font-bold text-slate-900">
                      {hasProfileData ? '내 설정 맞춤 공고' : '마감 임박 공고 추천'}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs ${
                    hasProfileData
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    {hasProfileData ? `맞춤 ${displayedPolicies.length}건 / DB ${rawPolicies.length}건` : `전체 ${displayedPolicies.length}건 (마감순)`}
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 leading-relaxed">
                  {hasProfileData
                    ? `설정하신 조건(관심분야 ${interests.length > 0 ? `[${interests.join(', ')}]` : '전체'}, 지역, 연령, 취업상태)에 정확히 일치하는 DB 공고만 선별한 결과입니다.`
                    : '프로필 미설정 상태입니다. 전체 DB 공고가 마감 임박순으로 우선 노출됩니다.'}
                </p>

                {policiesLoading ? (
                  <div className="p-8 text-center text-slate-400 text-xs animate-pulse">공고 목록을 불러오는 중...</div>
                ) : displayedPolicies.length > 0 ? (
                  <div className="space-y-2.5 pt-1 max-h-[420px] overflow-y-auto pr-0.5">
                    {displayedPolicies.slice(0, 5).map((p) => {
                      const badgeBg =
                        p.category === '주거'
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : p.category === '일자리'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : p.category === '교육·직업훈련'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : p.category === '금융·복지·문화'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200';

                      return (
                        <div
                          key={p.id}
                          onClick={() => onNavigate?.('detail', p.id)}
                          className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-100 hover:border-sky-300 hover:bg-sky-50/40 transition-all space-y-1.5 cursor-pointer group shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeBg}`}>
                                {p.category}
                              </span>
                              {hasProfileData && p.matchScore && (
                                <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 text-[10px] font-extrabold border border-sky-200">
                                  {p.matchScore}% 일치
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-rose-600 font-bold shrink-0">
                              {p.dDay || p.status || '접수중'}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1" title={p.title}>
                            {p.title}
                          </h4>

                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {p.benefitSummary || p.targetAge || '지원 세부 사항 확인'}
                          </p>

                          {(p as any).aiMatchReason && hasProfileData && (
                            <div className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md inline-block font-semibold border border-teal-200/50">
                              {(p as any).aiMatchReason}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                    <span className="text-2xl">🔍</span>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      설정하신 조건과 일치하는 공고가 없습니다.<br />
                      <strong className="text-slate-700 font-semibold">관심분야나 조건을 조정</strong>해 보세요.
                    </p>
                  </div>
                )}
              </div>

              {/* Quick CTA Box with Status */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-sky-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-amber-400 animate-ping'}`}></span>
                    <span className="text-xs text-slate-700 font-semibold">
                      {saveStatus === 'saved' ? `로컬스토리지 저장됨 (${lastSavedTime})` : '저장 중...'}
                    </span>
                  </div>
                  <button
                    onClick={handleResetSettings}
                    className="text-xs text-rose-500 hover:text-rose-700 font-semibold transition-colors cursor-pointer"
                    type="button"
                    title="모든 입력값 완전 초기화 (NULL/빈 값)"
                  >
                    완전 초기화
                  </button>
                </div>
                <button
                  onClick={handleExplicitSave}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-sky-200 hover:shadow-md transition-all cursor-pointer"
                  style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}
                  type="button"
                >
                  <span>설정 저장하고 맞춤 정책 확인하기</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 텔레그램 알림봇 설정 가이드 이미지 모달 팝업 */}
      {/* ========================================================================= */}
      {showTelegramGuide && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowTelegramGuide(false)}
        >
          <div 
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-sky-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-sky-500 via-sky-600 to-[#229ED9] p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-extrabold tracking-tight">텔레그램 알림봇 간편 설정 가이드</h3>
                    <p className="text-xs text-sky-100 mt-0.5">맞춤 정책 신규 공고 및 D-Day 마감 알림을 실시간 수신하세요</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTelegramGuide(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="닫기"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Infographic Image Card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">📱</span>
                    <span>텔레그램 알림봇 설정 가이드 (100% 한글 안내)</span>
                  </span>
                  <span className="text-[11px] text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 font-bold">
                    단계별 한글 가이드
                  </span>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm group bg-slate-50">
                  <img 
                    src="/telegram_guide_ko.jpg" 
                    alt="텔레그램 알림봇 설정 가이드 (한글)" 
                    className="w-full h-auto object-cover transform hover:scale-[1.01] transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/telegram_bot_guide.jpg';
                    }}
                  />
                </div>
              </div>

              {/* Step-by-Step Action Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">상세 연동 절차</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Step 1 */}
                  <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">1</span>
                      <span className="font-bold text-slate-900">텔레그램에서 봇 검색</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      텔레그램 앱 검색창에 <code className="bg-sky-100 text-sky-800 px-1 py-0.5 rounded font-mono font-bold">@youth_compass_bot</code> 입력
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCopyBotUsername}
                        className="px-2.5 py-1 rounded-lg bg-white border border-sky-200 hover:bg-sky-50 text-sky-700 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[13px]">{copiedBotId ? 'check' : 'content_copy'}</span>
                        <span>{copiedBotId ? '복사 완료!' : '아이디 복사'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">2</span>
                      <span className="font-bold text-slate-900">대화 시작 (/start)</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      채팅방 하단의 <strong className="text-indigo-700">[시작]</strong> 버튼을 누르거나 <code className="bg-indigo-100 text-indigo-800 px-1 py-0.5 rounded font-mono font-bold">/start</code> 메시지 전송
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3.5 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">3</span>
                      <span className="font-bold text-slate-900">나의 Chat ID 확인</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      봇이 자동으로 회신해주는 본인 고유의 <strong className="text-teal-700">Chat ID (예: 123456789)</strong> 확인
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">4</span>
                      <span className="font-bold text-slate-900">프로필에 입력 &amp; 저장</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      확인한 Chat ID를 텔레그램 ID 입력란에 입력 후 <strong className="text-amber-700">[설정 저장]</strong> 클릭
                    </p>
                  </div>
                </div>
              </div>

              {/* Simulation Test Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-sky-50/60 border border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm shrink-0">
                    🔔
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800">알림 연동 테스트</span>
                    <p className="text-[11px] text-slate-500">정상적으로 알림이 수신되는지 가상 테스트를 진행합니다.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSendTestTelegramAlert}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
                >
                  {testAlertSent ? '발송 완료 ✅' : '테스트 알림 발송'}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                문의: 청년나침반 봇 고객센터
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="https://t.me/youth_compass_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#229ED9] hover:bg-[#1e8cc0] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-sky-200 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                  </svg>
                  <span>텔레그램 봇 열기</span>
                  <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowTelegramGuide(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  확인 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProfileView;
