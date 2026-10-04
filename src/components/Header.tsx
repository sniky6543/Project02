import React, { useState } from 'react';
import { useProfileNickname, loadProfileSettings } from '../utils/profileStorage';
import { getNotificationHistory, NotificationHistoryItem } from '../utils/notificationStorage';
import { NotificationModal } from './NotificationModal';

export type TabKey = 
  | 'home'
  | 'explore'
  | 'detail'
  | 'kanban'
  | 'calendar'
  | 'news'
  | 'profile';

interface HeaderProps {
  activeTab: TabKey;
  onNavigate: (tab: TabKey, policyId?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onNavigate }) => {
  const nickname = useProfileNickname('');
  const hasNickname = Boolean(nickname && nickname.trim());
  const avatarText = hasNickname ? (nickname.length > 2 ? nickname.slice(0, 2) : nickname) : '';

  // 알림 모달 상태
  const [isNotiModalOpen, setIsNotiModalOpen] = useState<boolean>(false);
  const [notiHistory, setNotiHistory] = useState<NotificationHistoryItem[]>([]);
  const [notiRecipient, setNotiRecipient] = useState<string>('');
  const [notiChannel, setNotiChannel] = useState<'telegram' | 'email'>('telegram');

  const isHome = activeTab === 'home';
  const isExplore = activeTab === 'explore' || activeTab === 'detail';
  const isNews = activeTab === 'news';
  const isCalendar = activeTab === 'calendar' || activeTab === 'kanban';
  const isProfile = activeTab === 'profile';

  // 헤더 알림 버튼 클릭 핸들러
  const handleNotificationClick = () => {
    const profile = loadProfileSettings();
    const isConfigured = Boolean(
      (profile.nickname && profile.nickname.trim()) ||
      (profile.birthDate && profile.birthDate.trim()) ||
      (profile.isTelegramSelected && profile.telegramId && profile.telegramId.trim()) ||
      (profile.isEmailSelected && profile.emailAddress && profile.emailAddress.trim()) ||
      profile.employmentStatus ||
      profile.housingType ||
      (profile.interests && profile.interests.length > 0)
    );

    // 1. 프로필 미설정의 경우: 프로필 설정 페이지로 즉시 이동
    if (!isConfigured) {
      onNavigate('profile');
      return;
    }

    // 2. 프로필 설정된 경우: 해당 프로필의 텔레그램 ID 또는 이메일 중심 알림 발송 내역 로드 및 모달 팝업
    const { history, recipient, channel } = getNotificationHistory();
    setNotiHistory(history);
    setNotiRecipient(recipient);
    setNotiChannel(channel);
    setIsNotiModalOpen(true);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-b border-sky-100/60 shadow-[0_2px_12px_rgba(2,132,199,0.03)]">
        <div className="h-14 sm:h-16 max-w-[1240px] mx-auto px-3 sm:px-6 md:px-8 flex items-center justify-between">
          {/* Left: Logo & Desktop Nav */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 text-left group transition-transform focus:outline-none cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-cyan-400 to-teal-300 flex items-center justify-center shadow-md shadow-sky-200 shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9" />
                </svg>
              </div>
              <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight flex items-center gap-1 whitespace-nowrap">
                청년나침반 <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              </span>
            </button>

            {/* Desktop & Wide Tablet Nav */}
            <nav className="hidden lg:flex items-center gap-1.5">
              <button
                onClick={() => onNavigate('home')}
                className={`transition-all py-1.5 px-3 rounded-full text-sm font-semibold cursor-pointer ${
                  isHome
                    ? 'text-sky-600 bg-sky-50 shadow-xs'
                    : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
                }`}
              >
                홈·추천
              </button>
              <button
                onClick={() => onNavigate('explore')}
                className={`transition-all py-1.5 px-3 rounded-full text-sm font-semibold cursor-pointer ${
                  isExplore
                    ? 'text-sky-600 bg-sky-50 shadow-xs'
                    : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
                }`}
              >
                정책탐색
              </button>
              <button
                onClick={() => onNavigate('news')}
                className={`transition-all py-1.5 px-3 rounded-full text-sm font-semibold cursor-pointer ${
                  isNews
                    ? 'text-sky-600 bg-sky-50 shadow-xs'
                    : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
                }`}
              >
                AI요약 뉴스
              </button>
              <button
                onClick={() => onNavigate('calendar')}
                className={`transition-all py-1.5 px-3 rounded-full text-sm font-semibold cursor-pointer ${
                  isCalendar
                    ? 'text-sky-600 bg-sky-50 shadow-xs'
                    : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
                }`}
              >
                마감캘린더
              </button>
              <button
                onClick={() => onNavigate('profile')}
                className={`transition-all py-1.5 px-3 rounded-full text-sm font-semibold cursor-pointer ${
                  isProfile
                    ? 'text-sky-600 bg-sky-50 shadow-xs'
                    : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
                }`}
              >
                프로필
              </button>
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="relative flex items-center">
              <button
                onClick={() => onNavigate('explore')}
                aria-label="정책 검색"
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-sky-50 text-slate-500 hover:text-sky-600 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" x2="16.65" y1="21" y2="16.65" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* 알림 버튼 */}
              <button
                onClick={handleNotificationClick}
                aria-label="맞춤 정책 알림"
                title={hasNickname ? `${nickname}님의 맞춤 정책 알림 내역 확인` : '프로필 설정하고 맞춤 알림 받기'}
                className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-sky-50 text-slate-500 hover:text-sky-600 transition-colors cursor-pointer active:scale-95"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              </button>

              {/* 프로필 바로가기 아바타/버튼 */}
              <button
                onClick={() => onNavigate('profile')}
                aria-label={hasNickname ? `프로필 열기 (${nickname})` : '프로필을 설정해주세요'}
                title={hasNickname ? `내 프로필: ${nickname}` : '프로필을 설정해주세요'}
                className="flex items-center gap-1.5 cursor-pointer focus:outline-none group"
              >
                {hasNickname ? (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-400 p-[2px] shadow-sm group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-sky-600 font-semibold text-[11px] sm:text-xs px-0.5 truncate text-center">
                      {avatarText}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 sm:gap-1.5 py-1 px-2 sm:px-2.5 rounded-full bg-sky-50 hover:bg-sky-100/80 border border-sky-200 text-sky-700 text-[11px] sm:text-xs font-semibold shadow-xs transition-all">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-sky-500 animate-pulse" />
                    <span>프로필</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Bottom Navigation Bar (<1024px) */}
      <nav
        aria-label="모바일 하단 내비게이션"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden flex justify-around items-center h-16 px-2 safe-area-pb"
      >
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            isHome ? 'text-sky-600 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" strokeWidth={isHome ? '2.4' : '1.8'} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[11px] tracking-tight">홈·추천</span>
        </button>

        <button
          onClick={() => onNavigate('explore')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            isExplore ? 'text-sky-600 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" strokeWidth={isExplore ? '2.4' : '1.8'} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-[11px] tracking-tight">정책탐색</span>
        </button>

        <button
          onClick={() => onNavigate('news')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            isNews ? 'text-sky-600 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" strokeWidth={isNews ? '2.4' : '1.8'} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <span className="text-[11px] tracking-tight">AI뉴스</span>
        </button>

        <button
          onClick={() => onNavigate('calendar')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            isCalendar ? 'text-sky-600 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" strokeWidth={isCalendar ? '2.4' : '1.8'} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[11px] tracking-tight">마감캘린더</span>
        </button>

        <button
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            isProfile ? 'text-sky-600 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" strokeWidth={isProfile ? '2.4' : '1.8'} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[11px] tracking-tight">내프로필</span>
        </button>
      </nav>

      {/* 알림 발송 내역 모달 */}
      <NotificationModal
        isOpen={isNotiModalOpen}
        onClose={() => setIsNotiModalOpen(false)}
        history={notiHistory}
        recipient={notiRecipient}
        channel={notiChannel}
        onNavigateToDetail={(policyId) => onNavigate('detail', policyId)}
        onNavigateToProfile={() => onNavigate('profile')}
      />
    </>
  );
};

export default Header;
