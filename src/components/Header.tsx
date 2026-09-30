import React from 'react';

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
  onNavigate: (tab: TabKey) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onNavigate }) => {
  const isHome = activeTab === 'home';
  const isExplore = activeTab === 'explore' || activeTab === 'detail';
  const isNews = activeTab === 'news';
  const isCalendar = activeTab === 'calendar' || activeTab === 'kanban';
  const isProfile = activeTab === 'profile';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-sky-100/60 shadow-[0_2px_12px_rgba(2,132,199,0.03)]">
      <div className="h-16 max-w-[1240px] mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Left: Logo & Nav */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left group transition-transform focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-cyan-400 to-teal-300 flex items-center justify-center shadow-md shadow-sky-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9" />
              </svg>
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1">
              청년나침반 <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => onNavigate('home')}
              className={`transition-all py-1.5 px-3.5 rounded-full text-sm font-semibold ${
                isHome
                  ? 'text-sky-600 bg-sky-50 shadow-xs'
                  : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
              }`}
            >
              홈·추천
            </button>
            <button
              onClick={() => onNavigate('explore')}
              className={`transition-all py-1.5 px-3.5 rounded-full text-sm font-semibold ${
                isExplore
                  ? 'text-sky-600 bg-sky-50 shadow-xs'
                  : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
              }`}
            >
              정책탐색
            </button>
            <button
              onClick={() => onNavigate('news')}
              className={`transition-all py-1.5 px-3.5 rounded-full text-sm font-semibold ${
                isNews
                  ? 'text-sky-600 bg-sky-50 shadow-xs'
                  : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
              }`}
            >
              AI요약 뉴스
            </button>
            <button
              onClick={() => onNavigate('kanban')}
              className={`transition-all py-1.5 px-3.5 rounded-full text-sm font-semibold ${
                isCalendar
                  ? 'text-sky-600 bg-sky-50 shadow-xs'
                  : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
              }`}
            >
              마감캘린더
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className={`transition-all py-1.5 px-3.5 rounded-full text-sm font-semibold ${
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
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:flex items-center">
            <button
              onClick={() => onNavigate('explore')}
              aria-label="정책 검색"
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-sky-50 text-slate-500 hover:text-sky-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" x2="16.65" y1="21" y2="16.65" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('profile')}
              aria-label="알림"
              className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-sky-50 text-slate-500 hover:text-sky-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            <button
              onClick={() => onNavigate('profile')}
              aria-label="프로필 열기"
              className="flex items-center cursor-pointer focus:outline-none"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-400 p-[2px] shadow-sm">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-sky-600 font-semibold text-xs">
                  민우
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
