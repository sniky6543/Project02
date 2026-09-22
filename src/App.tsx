import React, { useState, useEffect } from 'react';
import Header, { TabKey } from './components/Header';
import Footer from './components/Footer';

import HomeView from './views/HomeView';
import ExploreView from './views/ExploreView';
import DetailView from './views/DetailView';
import KanbanView from './views/KanbanView';
import CalendarView from './views/CalendarView';
import NewsView from './views/NewsView';
import ProfileView from './views/ProfileView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(true);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleNavigate = (path: string) => {
    switch (path) {
      case 'home':
      case 'home-recommendations':
      case 'dashboard':
        setActiveTab('home');
        break;
      case 'explore':
      case 'policy-explorer':
        setActiveTab('explore');
        break;
      case 'detail':
      case 'policy-detail':
        setActiveTab('detail');
        break;
      case 'kanban':
      case 'deadline-calendar':
        setActiveTab('kanban');
        break;
      case 'calendar':
      case 'deadline-calendar-month':
        setActiveTab('calendar');
        break;
      case 'news':
      case 'ai-briefing-news':
      case 'ai-news-curation':
        setActiveTab('news');
        break;
      case 'profile':
      case 'youth-profile':
      case 'profile-settings':
        setActiveTab('profile');
        break;
      default:
        console.log('Unhandled path:', path);
        break;
    }
  };

  const screens: { key: TabKey; title: string; num: string }[] = [
    { key: 'home', title: '홈/추천', num: '1' },
    { key: 'explore', title: '정책 탐색', num: '2' },
    { key: 'detail', title: '정책 상세', num: '3' },
    { key: 'kanban', title: '마감 캘린더 (칸반)', num: '4' },
    { key: 'calendar', title: '마감 캘린더 (월별)', num: '5' },
    { key: 'news', title: 'AI 요약 뉴스', num: '6' },
    { key: 'profile', title: '내 맞춤 프로필', num: '7' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800">
      {/* Top Fixed Header */}
      <Header activeTab={activeTab} onNavigate={(tab) => setActiveTab(tab)} />

      {/* Main View Render */}
      <div className="flex-1 flex flex-col">
        {activeTab === 'home' && <HomeView onNavigate={handleNavigate} />}
        {activeTab === 'explore' && <ExploreView onNavigate={handleNavigate} />}
        {activeTab === 'detail' && <DetailView onNavigate={handleNavigate} />}
        {activeTab === 'kanban' && <KanbanView onNavigate={handleNavigate} />}
        {activeTab === 'calendar' && <CalendarView onNavigate={handleNavigate} />}
        {activeTab === 'news' && <NewsView onNavigate={handleNavigate} />}
        {activeTab === 'profile' && <ProfileView onNavigate={handleNavigate} />}
      </div>

      {/* Footer */}
      <Footer />

      {/* Floating Quick Screen Switcher for reviewing all 7 screens */}
      <aside
        aria-label="화면 퀵 스위처"
        className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
      >
        {showQuickSwitcher ? (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3 shadow-2xl text-white flex flex-col gap-2 max-w-[340px] sm:max-w-none">
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-700/60 px-1">
              <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                청년큐레이터 화면 선택기 (7개 화면)
              </span>
              <button
                onClick={() => setShowQuickSwitcher(false)}
                className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
                title="접기"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {screens.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActiveTab(s.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === s.key
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 ring-1 ring-sky-300'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                    {s.num}
                  </span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowQuickSwitcher(true)}
            className="px-3.5 py-2 rounded-full bg-slate-900/90 text-sky-400 hover:bg-slate-800 text-xs font-bold shadow-xl border border-slate-700/80 flex items-center gap-2 backdrop-blur-md transition-all hover:scale-105"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            화면 전환기 열기 (7개)
          </button>
        )}
      </aside>
    </div>
  );
};

export default App;
