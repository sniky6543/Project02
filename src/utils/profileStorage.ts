import { useState, useEffect } from 'react';

export interface ProfileSettingsData {
  // SECTION 01: 기본 인적사항
  nickname: string;
  birthDate: string;
  householdType: string;
  regionCity: string;
  regionDistrict: string;
  aiProvider: 'OPENAI' | 'OLLAMA' | 'Router API';
  apiKeys: {
    OPENAI: string;
    OLLAMA: string;
    'Router API': string;
  };

  // SECTION 02: 학력 및 취업 · 구직 상태
  employmentStatus: string;
  education: string;
  targetJob: string;

  // SECTION 03: 소득 구간 & 주거 형태
  housingType: string;
  annualIncome: string;

  // SECTION 04: 관심 분야 & 정책 키워드
  interests: string[];

  // SECTION 05: 알림 및 추천 수신 설정
  notifyNewPolicy: boolean;
  notifyDeadline: boolean;
  isTelegramSelected: boolean;
  telegramId: string;
  isEmailSelected: boolean;
  emailAddress: string;

  // 메타데이터
  updatedAt?: string;
}

/**
 * 완전 초기화 상태 (모든 사용자 입력값이 NULL/빈 값인 상태)
 */
export const EMPTY_PROFILE_SETTINGS: ProfileSettingsData = {
  nickname: '',
  birthDate: '',
  householdType: '',
  regionCity: '서울특별시',
  regionDistrict: '마포구 (서교동/상수동)',
  aiProvider: 'OPENAI',
  apiKeys: {
    OPENAI: '',
    OLLAMA: '',
    'Router API': '',
  },
  employmentStatus: '',
  education: '',
  targetJob: '',
  housingType: '',
  annualIncome: '',
  interests: [],
  notifyNewPolicy: false,
  notifyDeadline: false,
  isTelegramSelected: false,
  telegramId: '',
  isEmailSelected: false,
  emailAddress: '',
};

/**
 * 예시 데모용 샘플 데이터
 */
export const DEMO_PROFILE_SETTINGS: ProfileSettingsData = {
  nickname: '청년탐험가',
  birthDate: '1999.04.15',
  householdType: '1인가구(단독)',
  regionCity: '서울특별시',
  regionDistrict: '마포구 (서교동/상수동)',
  aiProvider: 'OPENAI',
  apiKeys: {
    OPENAI: '',
    OLLAMA: '',
    'Router API': '',
  },
  employmentStatus: '취업준비생',
  education: '4년제 대학교 졸업',
  targetJob: 'IT / 소프트웨어 기획 · PM',
  housingType: '월세',
  annualIncome: '3,200',
  interests: ['일자리', '주거', '교육 · 직업훈련', '금융 · 복지 · 문화', '참여 · 기반'],
  notifyNewPolicy: true,
  notifyDeadline: true,
  isTelegramSelected: true,
  telegramId: '@youth_compass_user',
  isEmailSelected: true,
  emailAddress: 'youth.compass@example.com',
};

// 기본값은 완전 초기화(EMPTY) 규격 준수
export const DEFAULT_PROFILE_SETTINGS = EMPTY_PROFILE_SETTINGS;

export const PROFILE_STORAGE_KEY = 'youth_compass_profile_settings';

/**
 * 로컬스토리지에서 프로필 설정 데이터 불러오기 (NULL-Safe 처리)
 */
export const loadProfileSettings = (): ProfileSettingsData => {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return EMPTY_PROFILE_SETTINGS;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return EMPTY_PROFILE_SETTINGS;

    return {
      nickname: typeof parsed.nickname === 'string' ? parsed.nickname : '',
      birthDate: typeof parsed.birthDate === 'string' ? parsed.birthDate : '',
      householdType: typeof parsed.householdType === 'string' ? parsed.householdType : '',
      regionCity: typeof parsed.regionCity === 'string' && parsed.regionCity ? parsed.regionCity : '서울특별시',
      regionDistrict: typeof parsed.regionDistrict === 'string' && parsed.regionDistrict ? parsed.regionDistrict : '마포구 (서교동/상수동)',
      aiProvider: parsed.aiProvider === 'OLLAMA' || parsed.aiProvider === 'Router API' ? parsed.aiProvider : 'OPENAI',
      apiKeys: {
        OPENAI: parsed.apiKeys?.OPENAI || '',
        OLLAMA: parsed.apiKeys?.OLLAMA || '',
        'Router API': parsed.apiKeys?.['Router API'] || '',
      },
      employmentStatus: typeof parsed.employmentStatus === 'string' ? parsed.employmentStatus : '',
      education: typeof parsed.education === 'string' ? parsed.education : '',
      targetJob: typeof parsed.targetJob === 'string' ? parsed.targetJob : '',
      housingType: typeof parsed.housingType === 'string' ? parsed.housingType : '',
      annualIncome: typeof parsed.annualIncome === 'string' ? parsed.annualIncome : '',
      interests: Array.isArray(parsed.interests) ? parsed.interests : [],
      notifyNewPolicy: Boolean(parsed.notifyNewPolicy),
      notifyDeadline: Boolean(parsed.notifyDeadline),
      isTelegramSelected: Boolean(parsed.isTelegramSelected),
      telegramId: typeof parsed.telegramId === 'string' ? parsed.telegramId : '',
      isEmailSelected: Boolean(parsed.isEmailSelected),
      emailAddress: typeof parsed.emailAddress === 'string' ? parsed.emailAddress : '',
      updatedAt: parsed.updatedAt,
    };
  } catch (err) {
    console.error('[localStorage] 프로필 설정을 불러오는 중 오류가 발생했습니다:', err);
    return EMPTY_PROFILE_SETTINGS;
  }
};

/**
 * 로컬스토리지에 프로필 설정 데이터 저장하기
 */
export const saveProfileSettings = (data: ProfileSettingsData): boolean => {
  try {
    const payload: ProfileSettingsData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(payload));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('profile_updated'));
    }
    return true;
  } catch (err) {
    console.error('[localStorage] 프로필 설정을 저장하는 중 오류가 발생했습니다:', err);
    return false;
  }
};

/**
 * 로컬스토리지의 프로필 설정 데이터 완전 초기화 (NULL / 삭제 처리)
 */
export const clearProfileSettings = (): boolean => {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('profile_updated'));
    }
    return true;
  } catch (err) {
    console.error('[localStorage] 프로필 설정을 초기화하는 중 오류가 발생했습니다:', err);
    return false;
  }
};

/**
 * 컴포넌트 어디서나 설정된 닉네임을 반응형으로 구독할 수 있는 React Hook
 */
export const useProfileNickname = (defaultFallback = ''): string => {
  const [nickname, setNickname] = useState<string>(() => {
    const current = loadProfileSettings();
    return current.nickname || defaultFallback;
  });

  useEffect(() => {
    const handleUpdate = () => {
      const current = loadProfileSettings();
      setNickname(current.nickname || defaultFallback);
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('profile_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('profile_updated', handleUpdate);
    };
  }, [defaultFallback]);

  return nickname;
};
