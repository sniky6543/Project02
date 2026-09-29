import { useMemo, useState, useEffect } from 'react';
import { PolicyItem } from '../types/policy';
import { ProfileSettingsData, loadProfileSettings } from './profileStorage';

export interface PolicyMatchResult {
  score: number;
  matchReasons: string[];
  isTopMatch: boolean;
  isMatched: boolean;
}

/**
 * 생년월일 문자열(예: '1999.04.15', '1999-04-15')로부터 만 나이 계산
 */
export function calculateAgeFromBirthDate(birthDateStr?: string): number | null {
  if (!birthDateStr || !birthDateStr.trim()) return null;
  try {
    const cleaned = birthDateStr.replace(/[^0-9]/g, '');
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
}

/**
 * 사용자가 의미 있는 프로필 정보를 설정했는지 확인
 */
export function hasConfiguredProfile(profile: ProfileSettingsData): boolean {
  return Boolean(
    (profile.nickname && profile.nickname.trim()) ||
    (profile.birthDate && profile.birthDate.trim()) ||
    profile.employmentStatus ||
    (profile.interests && profile.interests.length > 0) ||
    profile.housingType ||
    profile.householdType ||
    (profile.targetJob && profile.targetJob.trim()) ||
    (profile.annualIncome && profile.annualIncome.trim())
  );
}

/**
 * 개별 정책과 사용자 프로필 간의 정밀 조건 매칭 및 점수 산출
 * - 관심분야(카테고리), 연령, 거주지역, 취업상태, 주거형태 등을 DB 데이터와 엄격 비교
 * - 조건 불일치 시 isMatched = false 처리하여 정확한 매칭 건수 도출
 */
export function calculatePolicyMatch(policy: PolicyItem, profile: ProfileSettingsData): PolicyMatchResult {
  const matchReasons: string[] = [];

  // 프로필 미설정 시 기본값 반환
  if (!hasConfiguredProfile(profile)) {
    return {
      score: policy.matchScore || 80,
      matchReasons: ['전체 공고'],
      isTopMatch: false,
      isMatched: true,
    };
  }

  const fullPolicyText = `${policy.title} ${policy.benefitSummary} ${policy.organization} ${policy.incomeCondition || ''} ${policy.employmentCondition || ''} ${policy.category || ''}`.toLowerCase();

  let isCategoryMatched = true;
  let isAgeMatched = true;
  let isRegionMatched = true;
  let isEmploymentMatched = true;

  let bonusScore = 0;

  // 1. 관심 분야(카테고리) 엄격 매칭
  // 사용자가 1개 이상의 관심분야를 선택한 경우, 해당 카테고리에 속하지 않는 공고는 매칭 제외
  if (profile.interests && profile.interests.length > 0) {
    isCategoryMatched = profile.interests.some((interest) => {
      const cleanInterest = interest.replace(/\s+/g, '');
      const cleanCategory = (policy.category || '').replace(/\s+/g, '');
      
      // 일자리 카테고리 매칭
      if (cleanInterest.includes('일자리') && (cleanCategory.includes('일자리') || cleanCategory.includes('취업') || /취업|인턴|일자리|채용|구직|창업/.test(policy.title))) {
        return true;
      }
      // 주거 카테고리 매칭
      if (cleanInterest.includes('주거') && (cleanCategory.includes('주거') || /월세|전세|주택|임대|보증금|원룸|기숙사/.test(policy.title))) {
        return true;
      }
      // 교육/직업훈련 매칭
      if (cleanInterest.includes('교육') && (cleanCategory.includes('교육') || cleanCategory.includes('훈련') || /교육|훈련|부트캠프|아카데미|역량|자격증/.test(policy.title))) {
        return true;
      }
      // 금융/복지/문화 매칭
      if ((cleanInterest.includes('금융') || cleanInterest.includes('복지') || cleanInterest.includes('문화')) && 
          (cleanCategory.includes('금융') || cleanCategory.includes('복지') || cleanCategory.includes('문화') || /도약계좌|적금|통장|지원금|수당|마음건강|문화/.test(policy.title))) {
        return true;
      }
      // 참여/기반 매칭
      if (cleanInterest.includes('참여') && (cleanCategory.includes('참여') || cleanCategory.includes('기반') || /네트워크|공간|참여|위원회|서포터즈/.test(policy.title))) {
        return true;
      }

      return cleanInterest.includes(cleanCategory) || cleanCategory.includes(cleanInterest);
    });

    if (isCategoryMatched) {
      bonusScore += 25;
      matchReasons.push(`관심분야(${policy.category})`);
    }
  }

  // 2. 연령 적합성 엄격 매칭
  const userAge = calculateAgeFromBirthDate(profile.birthDate);
  if (userAge !== null) {
    const numbers = policy.targetAge.match(/\d+/g)?.map(Number);
    if (numbers && numbers.length >= 2) {
      const minAge = numbers[0];
      const maxAge = numbers[1];
      if (userAge >= minAge && userAge <= maxAge) {
        bonusScore += 20;
        matchReasons.push(`만 ${userAge}세 적합 (${minAge}~${maxAge}세)`);
      } else {
        // 연령 조건에 맞지 않는 경우 매칭 제외
        isAgeMatched = false;
        bonusScore -= 35;
      }
    } else if (policy.targetAge.includes('무관') || policy.targetAge.includes('전체') || !policy.targetAge) {
      bonusScore += 15;
      matchReasons.push('전 연령 대상');
    }
  }

  // 3. 거주 지역 매칭
  if (profile.regionCity) {
    const city = profile.regionCity.trim();
    const shortCity = city.slice(0, 2); // '서울', '경기', '부산', '인천' 등
    const district = profile.regionDistrict ? profile.regionDistrict.split(' ')[0].replace(/[^가-힣]/g, '') : '';

    const isLocalMatch = fullPolicyText.includes(shortCity.toLowerCase()) || (district && fullPolicyText.includes(district.toLowerCase()));
    const isNational = 
      policy.organization.includes('부') || // 부처 (고용노동부, 국토교통부 등)
      policy.organization.includes('청') ||
      policy.organization.includes('재단') ||
      policy.organization.includes('공단') ||
      policy.organization.includes('공사') ||
      policy.organization.includes('LH') ||
      policy.organization.includes('HUG') ||
      fullPolicyText.includes('전국') ||
      fullPolicyText.includes('온통청년') ||
      fullPolicyText.includes('복지로');

    // 타 지자체 전용 공고인지 확인
    const otherCities = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
    const conflictingCities = otherCities.filter((c) => c !== shortCity && fullPolicyText.includes(c));
    const isConflictingCity = conflictingCities.length > 0 && !isLocalMatch && !isNational;

    if (isLocalMatch) {
      bonusScore += district && fullPolicyText.includes(district) ? 20 : 15;
      matchReasons.push(`거주 지역(${shortCity})`);
    } else if (isNational) {
      bonusScore += 12;
      matchReasons.push('전국 공통 혜택');
    } else if (isConflictingCity) {
      isRegionMatched = false;
      bonusScore -= 30;
    }
  }

  // 4. 경제활동 / 취업상태 매칭
  if (profile.employmentStatus) {
    const status = profile.employmentStatus;
    if (status.includes('취업준비') || status.includes('구직') || status.includes('미취업')) {
      if (/구직|취업|미취업|청년인턴|역량|면접|자격증|도전|캠프|훈련|취업준비/.test(fullPolicyText)) {
        bonusScore += 15;
        matchReasons.push('취업준비생 맞춤');
      } else if (/재직자\s*전용|고용보험\s*가입\s*필수|근로자만/.test(fullPolicyText)) {
        isEmploymentMatched = false;
        bonusScore -= 20;
      }
    } else if (status.includes('재직') || status.includes('근로') || status.includes('사회초년생')) {
      if (/재직|근로|중소기업|소득세|내일채움|통장|월급|직장인|사회초년생/.test(fullPolicyText)) {
        bonusScore += 15;
        matchReasons.push('재직 청년 맞춤');
      }
    } else if (status.includes('대학') || status.includes('학생')) {
      if (/대학|학생|학자금|장학|등록금|캠퍼스|학습/.test(fullPolicyText)) {
        bonusScore += 15;
        matchReasons.push('대학생 맞춤');
      } else if (/재직자\s*전용|고용보험\s*가입\s*필수/.test(fullPolicyText)) {
        isEmploymentMatched = false;
        bonusScore -= 20;
      }
    } else if (status.includes('창업') || status.includes('스타트업')) {
      if (/창업|스타트업|사업|시제품|입주|대표|벤처/.test(fullPolicyText)) {
        bonusScore += 15;
        matchReasons.push('창업 맞춤');
      }
    } else if (status.includes('프리랜서') || status.includes('긱워커')) {
      if (/프리랜서|특수형태|예술인|창작|플랫폼|긱/.test(fullPolicyText)) {
        bonusScore += 15;
        matchReasons.push('프리랜서 맞춤');
      }
    }
  }

  // 5. 주거 형태 매칭
  if (profile.housingType) {
    if ((profile.housingType.includes('월세') || profile.housingType.includes('전세')) &&
        /월세|전세|보증금|임차|주거비|행복주택|청년주택|원룸/.test(fullPolicyText)) {
      bonusScore += 10;
      matchReasons.push(`주거 형태(${profile.housingType})`);
    } else if (profile.housingType.includes('자가') && /디딤돌|구입|내집마련|청약/.test(fullPolicyText)) {
      bonusScore += 10;
      matchReasons.push('자가·청약 맞춤');
    }
  }

  // 6. 희망 직무 / 키워드 매칭
  if (profile.targetJob && profile.targetJob.trim()) {
    const jobKeywords = profile.targetJob.split(/[\s/,·]+/).filter((k) => k.length >= 2);
    const hasJobMatch = jobKeywords.some((k) => fullPolicyText.includes(k.toLowerCase()));
    if (hasJobMatch) {
      bonusScore += 8;
      matchReasons.push(`희망직무 연계`);
    }
  }

  // 엄격 매칭 판정:
  // 사용자가 설정한 필수 조건(선택한 관심분야, 연령, 지역, 취업상태)을 모두 만족해야 함
  const hasInterests = Boolean(profile.interests && profile.interests.length > 0);
  const hasBirth = Boolean(profile.birthDate && profile.birthDate.trim() && userAge !== null);

  const isMatched = 
    (!hasInterests || isCategoryMatched) &&
    (!hasBirth || isAgeMatched) &&
    isRegionMatched &&
    isEmploymentMatched;

  // 점수 계산: 매칭인 경우 75~99점, 비매칭인 경우 30~65점
  let finalScore: number;
  if (isMatched) {
    finalScore = Math.max(75, Math.min(99, 65 + bonusScore));
  } else {
    finalScore = Math.max(30, Math.min(65, 45 + bonusScore));
  }

  return {
    score: finalScore,
    matchReasons: matchReasons.length > 0 ? matchReasons : ['맞춤 조건 반영'],
    isTopMatch: finalScore >= 90,
    isMatched,
  };
}

/**
 * 프로필 설정값을 기준으로 정책 목록을 맞춤 필터링 및 우선순위 정렬
 * @param filterUnmatchedIfProfileSet 프로필 설정 시 내가 설정한 자격에 부합하지 않는 공고(isMatched === false)를 목록에서 완전 제외할지 여부
 */
export function prioritizePoliciesByProfile(
  policies: PolicyItem[],
  profile: ProfileSettingsData,
  filterUnmatchedIfProfileSet: boolean = false
): PolicyItem[] {
  if (!policies || policies.length === 0) return [];

  const isConfigured = hasConfiguredProfile(profile);

  // 각 정책에 계산된 맞춤 점수 및 매칭 자격 여부 부여
  const scoredPolicies = policies.map((policy) => {
    const match = calculatePolicyMatch(policy, profile);
    return {
      ...policy,
      matchScore: match.score,
      aiMatchReason: match.matchReasons.join(' · '),
      isMatched: match.isMatched,
    };
  });

  // 프로필이 설정되어 있고 자격 엄격 필터링(filterUnmatchedIfProfileSet)이 활성화된 경우
  // 내가 설정한 자격 요건(선택한 관심분야, 연령, 지역, 취업상태)에 일치하는 정책만 선별
  let targetPolicies = scoredPolicies;
  if (isConfigured && filterUnmatchedIfProfileSet) {
    targetPolicies = scoredPolicies.filter((p) => (p as any).isMatched && (p.matchScore || 0) >= 75);
  }

  // 점수 내림차순 정렬 (높은 점수 우선)
  return targetPolicies.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}

/**
 * React 뷰 어디서나 사용자 프로필 변경을 실시간 감지하고 정렬/선별된 맞춤 정책을 제공하는 훅
 * @param filterUnmatchedIfProfileSet 프로필 설정 시 자격 미부합 정책 완전 제외 여부 (기본값: false)
 */
export function usePersonalizedPolicies(
  rawPolicies: PolicyItem[],
  filterUnmatchedIfProfileSet: boolean = false
) {
  const [profile, setProfile] = useState<ProfileSettingsData>(() => loadProfileSettings());

  useEffect(() => {
    const handleProfileChange = () => {
      setProfile(loadProfileSettings());
    };

    window.addEventListener('profile_updated', handleProfileChange);
    window.addEventListener('storage', handleProfileChange);
    return () => {
      window.removeEventListener('profile_updated', handleProfileChange);
      window.removeEventListener('storage', handleProfileChange);
    };
  }, []);

  const hasProfile = useMemo(() => hasConfiguredProfile(profile), [profile]);

  const personalizedPolicies = useMemo(() => {
    return prioritizePoliciesByProfile(rawPolicies, profile, filterUnmatchedIfProfileSet);
  }, [rawPolicies, profile, filterUnmatchedIfProfileSet]);

  return {
    policies: personalizedPolicies,
    profile,
    hasProfile,
  };
}
