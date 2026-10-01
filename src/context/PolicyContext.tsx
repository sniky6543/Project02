import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PolicyDetail, PolicyFilterParams, PolicyCategory } from '../types/policy';
import { UserProfile } from '../types/user';
import { MOCK_POLICIES } from '../api/mockData';

interface PolicyContextType {
  policies: PolicyDetail[];
  filteredPolicies: PolicyDetail[];
  selectedPolicyId: string | null;
  selectedPolicy: PolicyDetail | null;
  selectPolicy: (id: string) => void;
  filterParams: PolicyFilterParams;
  setFilterParams: React.Dispatch<React.SetStateAction<PolicyFilterParams>>;
  resetFilter: () => void;
  bookmarkedIds: string[];
  toggleBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const DEFAULT_PROFILE: UserProfile = {
  userId: 'usr-2026-minwoo',
  personal: {
    name: '김민우',
    birthDate: '1998-05-14',
    gender: '남성',
    contact: '010-8254-9921',
    region: '서울특별시',
  },
  education: '대졸(4년제)',
  employmentStatus: '취업준비생(구직자)',
  housing: {
    housingType: '월세',
    annualIncome: 2800,
  },
  aiSettings: {
    selectedProvider: 'OPENAI',
  },
  notificationChannels: {
    telegram: { enabled: true, account: '@minwoo_youth' },
    email: { enabled: true, account: 'minwoo.dev@example.com' },
  },
};

const DEFAULT_FILTERS: PolicyFilterParams = {
  keyword: '',
  category: '전체',
  region: '전체',
  maritalStatus: '미혼',
  employment: '제한없음',
  sortBy: 'matchScore',
};

const PolicyContext = createContext<PolicyContextType | undefined>(undefined);

export const PolicyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [policies, setPolicies] = useState<PolicyDetail[]>(MOCK_POLICIES);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('POL-2026-001');
  const [filterParams, setFilterParams] = useState<PolicyFilterParams>(DEFAULT_FILTERS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load Bookmarks from LocalStorage
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('youth_compass_bookmarks');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load bookmarks from storage', e);
    }
    return ['POL-2026-001', 'POL-2026-003', 'POL-2026-005'];
  });

  // Load User Profile from LocalStorage
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('youth_compass_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load profile from storage', e);
    }
    return DEFAULT_PROFILE;
  });

  // Save Bookmarks
  useEffect(() => {
    try {
      localStorage.setItem('youth_compass_bookmarks', JSON.stringify(bookmarkedIds));
    } catch (e) {
      console.warn('Failed to save bookmarks', e);
    }
  }, [bookmarkedIds]);

  // Save Profile
  useEffect(() => {
    try {
      localStorage.setItem('youth_compass_profile', JSON.stringify(userProfile));
    } catch (e) {
      console.warn('Failed to save profile', e);
    }
  }, [userProfile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      showToast(exists ? '관심 정책 보관함에서 삭제되었습니다.' : '관심 정책 보관함에 저장되었습니다! ⭐');
      return next;
    });
  };

  const isBookmarked = (id: string) => bookmarkedIds.includes(id);

  const selectPolicy = (id: string) => {
    setSelectedPolicyId(id);
  };

  const resetFilter = () => {
    setFilterParams(DEFAULT_FILTERS);
    showToast('검색 필터가 초기화되었습니다.');
  };

  const updateUserProfile = (newProfile: Partial<UserProfile>) => {
    setUserProfile((prev) => ({
      ...prev,
      ...newProfile,
      personal: { ...prev.personal, ...(newProfile.personal || {}) },
      housing: { ...prev.housing, ...(newProfile.housing || {}) },
    }));
    showToast('맞춤 프로필 정보가 성공적으로 저장되었습니다!');
  };

  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId) || policies[0] || null;

  // Filtered & Sorted Policies
  const filteredPolicies = React.useMemo(() => {
    let list = [...policies];

    // Category filter
    if (filterParams.category && filterParams.category !== '전체') {
      list = list.filter((p) => p.category === filterParams.category);
    }

    // Keyword search
    if (filterParams.keyword && filterParams.keyword.trim()) {
      const kw = filterParams.keyword.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(kw) ||
          p.organization.toLowerCase().includes(kw) ||
          p.benefitSummary.toLowerCase().includes(kw) ||
          p.eligibility.income.toLowerCase().includes(kw) ||
          p.eligibility.residence.toLowerCase().includes(kw)
      );
    }

    // Employment filter
    if (filterParams.employment && filterParams.employment !== '제한없음') {
      list = list.filter(
        (p) =>
          p.employmentCondition.includes('제한없음') ||
          p.employmentCondition.includes(filterParams.employment!)
      );
    }

    // Region filter
    if (filterParams.region && filterParams.region !== '전체') {
      list = list.filter(
        (p) =>
          p.eligibility.residence.includes('제한없음') ||
          p.eligibility.residence.includes('전국') ||
          p.eligibility.residence.includes(filterParams.region!)
      );
    }

    // Sorting
    if (filterParams.sortBy === 'matchScore') {
      list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    } else if (filterParams.sortBy === 'popular') {
      list.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    } else if (filterParams.sortBy === 'deadline') {
      list.sort((a, b) => {
        if (!a.dDay) return 1;
        if (!b.dDay) return -1;
        return a.dDay.localeCompare(b.dDay);
      });
    }

    return list;
  }, [policies, filterParams]);

  return (
    <PolicyContext.Provider
      value={{
        policies,
        filteredPolicies,
        selectedPolicyId,
        selectedPolicy,
        selectPolicy,
        filterParams,
        setFilterParams,
        resetFilter,
        bookmarkedIds,
        toggleBookmark,
        isBookmarked,
        userProfile,
        updateUserProfile,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </PolicyContext.Provider>
  );
};

export const usePolicy = (): PolicyContextType => {
  const context = useContext(PolicyContext);
  if (!context) {
    throw new Error('usePolicy must be used within a PolicyProvider');
  }
  return context;
};
