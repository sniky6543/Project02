import React, { useState, useEffect } from 'react';

interface ProfileViewProps {
  onNavigate?: (path: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate }) => {
  const [housingType, setHousingType] = useState<string>('월세');
  const [annualIncome, setAnnualIncome] = useState<string>('3,200');
  const [isTelegramSelected, setIsTelegramSelected] = useState<boolean>(true);
  const [telegramId, setTelegramId] = useState<string>('@youth_compass_user');
  const [isEmailSelected, setIsEmailSelected] = useState<boolean>(true);
  const [emailAddress, setEmailAddress] = useState<string>('youth.compass@example.com');
  const [aiProvider, setAiProvider] = useState<'OPENAI' | 'OLLAMA' | 'Router API'>('OPENAI');
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({
    OPENAI: '',
    OLLAMA: '',
    'Router API': '',
  });
  const [showKey, setShowKey] = useState<boolean>(false);

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
                <span className="">개인화 추천 엔진 v2.4 가동 중</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                내 맞춤 프로필 &amp; 정책 매칭 설정
              </h1>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                프로필 정보를 구체적으로 입력할수록 나에게 딱 맞는 2025 청년정책을 정확하게 찾아드립니다.
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
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-medium text-slate-500">현재 필터 상태</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">18건</span>
                  <span className="text-sm font-bold text-sky-600">적합 매칭</span>
                </div>
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
                <span className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold flex items-center gap-1.5" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>
                  <svg className="w-3.5 h-3.5 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  필수 검증완료
                </span>
              </div>
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* 생년월일 & 만 나이 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700">생년월일 (8자리)</label>
                      <span className="text-xs text-sky-600 font-medium">만 나이 자동계산</span>
                    </div>
                    <div className="relative flex items-center">
                      <input className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-400 focus:bg-white transition-all shadow-xs" type="text" defaultValue="1999.04.15" />
                      <span className="absolute right-3 px-2 py-0.5 rounded-lg bg-sky-100 text-sky-700 text-xs font-bold">
                        만 26세
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">청년기본법 기준(만 19세~34세) 지원 대상입니다.</p>
                  </div>
                  {/* 가구원 및 세대 형태 칩 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">가구원 및 세대 형태</label>
                    <div className="grid grid-cols-3 gap-2" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>
                      <button className="py-2.5 px-2 rounded-xl bg-sky-600 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm shadow-sky-200" type="button">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        1인가구(단독)
                      </button>
                      <button className="py-2.5 px-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-all border border-slate-200" type="button">
                        부모 동거
                      </button>
                      <button className="py-2.5 px-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-all border border-slate-200" type="button">
                        신혼부부
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">청년 1인 단독 세대주 우대 정책 12건 존재</p>
                  </div>
                </div>
                {/* 실거주지 선택 */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-slate-700">실제 주민등록 거주지</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <select className="w-full appearance-none bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-400 focus:bg-white cursor-pointer shadow-xs">
                        <option selected={true}>서울특별시</option>
                        <option>경기도</option>
                        <option>인천광역시</option>
                        <option>부산광역시</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none text-[20px]">expand_more</span>
                    </div>
                    <div className="relative">
                      <select className="w-full appearance-none bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-400 focus:bg-white cursor-pointer shadow-xs">
                        <option selected={true}>마포구 (서교동/상수동)</option>
                        <option>관악구</option>
                        <option>영등포구</option>
                        <option>성동구</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none text-[20px]">expand_more</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sky-700 pt-1 text-xs">
                    <svg className="w-4 h-4 text-sky-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="16" y2="12"></line><line x1="12" x2="12.01" y1="8" y2="8"></line></svg>
                    <span className="">서울시 청년수당, 마포구 청년도약 거점 공간 혜택 적용 대상지입니다.</span>
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
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>선택 1개 필수</span>
              </div>
              <div className="space-y-5">
                {/* 경제활동 상태 세그먼트 칩 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">현재 경제활동 상태</label>
                  <div className="flex flex-wrap gap-2" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>
                    <button className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-all shadow-xs" type="button">
                      대학생 (재학/휴학)
                    </button>
                    <button className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-sky-200" type="button">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      취업준비생 (선택됨)
                    </button>
                    <button className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-all shadow-xs" type="button">
                      사회초년생 / 재직자
                    </button>
                    <button className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-all shadow-xs" type="button">
                      이직 준비자
                    </button>
                    <button className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-all shadow-xs" type="button">
                      청년창업가 / 프리랜서
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* 최종 학력 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">최종 학력</label>
                    <div className="relative">
                      <select className="w-full appearance-none bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-400 focus:bg-white cursor-pointer shadow-xs">
                        <option selected={true}>4년제 대학교 졸업</option>
                        <option>전문대학 졸업</option>
                        <option>대학원 졸업 (석/박사)</option>
                        <option>고등학교 졸업</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 pointer-events-none text-[20px]">expand_more</span>
                    </div>
                  </div>
                  {/* 희망 직무 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">전공 계열 및 희망 직무</label>
                    <div className="relative flex items-center">
                      <input className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-sky-400 focus:bg-white transition-all shadow-xs" type="text" defaultValue="IT / 소프트웨어 기획 · PM" />
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
                        onClick={() => setHousingType(type)}
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
                    {housingType === '월세' && '청년월세 특별지원, 보증금 대출 이자 지원 등 월세 우대 정책 8건 매칭'}
                    {housingType === '전세' && '버팀목 전세자금 대출, 안심 전세대출 우대 정책 6건 매칭'}
                    {housingType === '자가' && '디딤돌 주택구입자금 대출 및 청년 주택드림 청약 우대 정책 4건 매칭'}
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
                    <span className="text-xs font-bold text-teal-900">맞춤 주거 및 금융 정책 요건 감지됨</span>
                    <p className="text-xs text-teal-700 leading-relaxed">
                      입력하신 {housingType} 계약 형태 및 연소득({annualIncome || '0'}만원) 조건에 부합하는 정책을 실시간 산출합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* SECTION 04: 관심 분야 및 정책 키워드 (With Colorful Pastel SVG Illustrations from SCREEN_4) */}
            <div className="bg-white rounded-2xl p-6 md:p-7 shadow-sm border border-sky-100 hover:border-sky-200 transition-all space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 font-bold text-base flex items-center justify-center shadow-xs">04</span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">관심 분야 &amp; 정책 키워드</h2>
                    <p className="text-xs text-slate-500">선택된 관심사 관련 공고와 AI 3줄 뉴스를 우선 피드로 배치합니다.</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-sky-600" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>5개 분야 맞춤 설정</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" style={{ wordBreak: 'keep-all' }}>
                {/* 1. 일자리: 따뜻한 앰버 옐로우 서류가방 일러스트 */}
                <button className="p-4 rounded-2xl bg-amber-50/40 border-2 border-amber-300 text-left flex flex-col gap-2.5 transition-all shadow-xs hover:shadow-md hover:border-amber-400 group relative" type="button">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-100 to-amber-50 border border-amber-200 flex items-center justify-center shadow-xs">
                      {/* Colorful Briefcase SVG */}
                      <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect fill="#FEF3C7" height="13" rx="2" stroke="#F59E0B" width="18" x="3" y="7"></rect>
                        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#D97706"></path>
                        <circle cx="12" cy="13" fill="#D97706" r="1.5"></circle>
                      </svg>
                    </div>
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">일자리</span>
                    <span className="text-xs text-slate-500 leading-snug block mt-0.5">취업지원, 구직활동지원금, 인턴, 창업</span>
                  </div>
                </button>
                {/* 2. 주거: 편안한 코랄 핑크 하우스 일러스트 */}
                <button className="p-4 rounded-2xl bg-rose-50/40 border-2 border-rose-300 text-left flex flex-col gap-2.5 transition-all shadow-xs hover:shadow-md hover:border-rose-400 group relative" type="button">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-100 to-rose-50 border border-rose-200 flex items-center justify-center shadow-xs">
                      {/* Colorful House SVG */}
                      <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4H9v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10z" fill="#FFE4E6" stroke="#F43F5E"></path>
                        <rect fill="#FDA4AF" height="4" stroke="#E11D48" width="4" x="10" y="10"></rect>
                      </svg>
                    </div>
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 group-hover:text-rose-700 transition-colors">주거</span>
                    <span className="text-xs text-slate-500 leading-snug block mt-0.5">청년월세, 전세보증금 대출, 행복주택, 공공임대</span>
                  </div>
                </button>
                {/* 3. 교육 / 직업훈련: 라벤더 퍼플 학사모 & 책 일러스트 */}
                <button className="p-4 rounded-2xl bg-purple-50/40 border-2 border-purple-300 text-left flex flex-col gap-2.5 transition-all shadow-xs hover:shadow-md hover:border-purple-400 group relative" type="button">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-100 to-indigo-50 border border-purple-200 flex items-center justify-center shadow-xs">
                      {/* Colorful Graduation Cap SVG */}
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M2 9l10-5 10 5-10 5L2 9z" fill="#EDE9FE" stroke="#8B5CF6"></path>
                        <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" stroke="#7C3AED"></path>
                        <line stroke="#7C3AED" x1="22" x2="22" y1="10" y2="15"></line>
                      </svg>
                    </div>
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">교육 · 직업훈련</span>
                    <span className="text-xs text-slate-500 leading-snug block mt-0.5">K-디지털 트레이닝, 부트캠프, 어학/자격증 응시료</span>
                  </div>
                </button>
                {/* 4. 금융 / 복지 / 문화: 파스텔 골드 지갑 & 코인 일러스트 */}
                <button className="p-4 rounded-2xl bg-amber-50/30 border-2 border-amber-300 text-left flex flex-col gap-2.5 transition-all shadow-xs hover:shadow-md hover:border-amber-400 group relative" type="button">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 border border-amber-200 flex items-center justify-center shadow-xs">
                      {/* Colorful Wallet & Coin SVG */}
                      <svg className="w-6 h-6 text-amber-500 drop-shadow-xs" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <rect fill="#FEF3C7" height="12" rx="3" stroke="#F59E0B" width="20" x="2" y="6"></rect>
                        <circle cx="16" cy="12" fill="#FBBF24" r="2.5" stroke="#D97706"></circle>
                        <path d="M6 10h3M6 14h2" stroke="#D97706" strokeLinecap="round"></path>
                      </svg>
                    </div>
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">금융 · 복지 · 문화</span>
                    <span className="text-xs text-slate-500 leading-snug block mt-0.5">청년도약계좌, 내일저축, 마음건강, 문화예술패스</span>
                  </div>
                </button>
                {/* 5. 참여 / 기반: 민트/청록 대화 말풍선 일러스트 */}
                <button className="p-4 rounded-2xl bg-teal-50/40 border-2 border-teal-300 text-left flex flex-col gap-2.5 transition-all shadow-xs hover:shadow-md hover:border-teal-400 group relative sm:col-span-2 md:col-span-1" type="button">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-100 to-emerald-50 border border-teal-200 flex items-center justify-center shadow-xs">
                      {/* Colorful Chat Bubble SVG */}
                      <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="#CCFBF1" stroke="#0D9488"></path>
                        <circle cx="8.5" cy="11.5" fill="#0D9488" r="1"></circle>
                        <circle cx="12" cy="11.5" fill="#0D9488" r="1"></circle>
                        <circle cx="15.5" cy="11.5" fill="#0D9488" r="1"></circle>
                      </svg>
                    </div>
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
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
                {/* Setting 1 */}
                <div className="flex items-center justify-between pt-1">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800">신규 매칭 정책 요약 알림</span>
                    <p className="text-xs text-slate-500">나의 프로필 조건에 부합하는 새로운 공고 게시 시 주 2회 요약 발송</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                    <input defaultChecked={true} className="sr-only peer" type="checkbox" />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                  </label>
                </div>
                {/* Setting 2 */}
                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800">마감 임박 D-Day 긴급 알림</span>
                    <p className="text-xs text-slate-500">관심 보관 정책의 신청 접수 마감 D-7, D-3, D-1 전 푸시 발송</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                    <input defaultChecked={true} className="sr-only peer" type="checkbox" />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                  </label>
                </div>
                {/* Notification Channels */}
                <div className="pt-4 space-y-3">
                  <span className="text-xs font-bold text-slate-800">수신 채널 선택</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 텔레그램 알림 채널 */}
                    <div className={`p-4 rounded-xl border transition-all ${isTelegramSelected ? 'bg-sky-50/30 border-sky-200' : 'bg-slate-50/60 border-slate-200'}`}>
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isTelegramSelected}
                          onChange={(e) => setIsTelegramSelected(e.target.checked)}
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
                      <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5">
                        <label className={`text-[11px] font-bold transition-colors ${isTelegramSelected ? 'text-slate-700' : 'text-slate-400'}`}>텔레그램 ID 입력</label>
                        <input
                          type="text"
                          value={telegramId}
                          disabled={!isTelegramSelected}
                          onChange={(e) => setTelegramId(e.target.value)}
                          placeholder="@username 또는 챗 ID"
                          className={`w-full rounded-lg px-3 py-2 text-xs transition-all ${isTelegramSelected
                              ? 'bg-white border border-sky-200 text-slate-900 focus:outline-none focus:border-sky-400 shadow-xs'
                              : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed placeholder:text-slate-300'
                            }`}
                        />
                        <p className={`text-[11px] transition-colors ${isTelegramSelected ? 'text-slate-400' : 'text-slate-300'}`}>
                          @청년나침반_bot 추가 후 ID를 입력해주세요.
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
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold">높음</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                      <circle className="text-slate-100" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="6"></circle>
                      <circle className="text-sky-500" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeDasharray="175.9" strokeDashoffset="26.38" strokeLinecap="round" strokeWidth="6"></circle>
                    </svg>
                    <span className="absolute text-base font-extrabold text-sky-600">85%</span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">3개 항목 추가 시 100% 완료</p>
                    <p className="text-xs text-slate-500">현재 매칭 신뢰도 98.4% 달성</p>
                  </div>
                </div>
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-800">정확도 향상 팁</span>
                  <ul className="text-xs text-slate-600 space-y-1.5 pl-0 list-none">
                    <li className="flex items-center gap-1.5 text-sky-600 hover:underline cursor-pointer">
                      <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="16"></line><line x1="8" x2="16" y1="12" y2="12"></line></svg>
                      <span className="">직전년도 근로소득 등록 (+8%)</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-sky-600 hover:underline cursor-pointer">
                      <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="16"></line><line x1="8" x2="16" y1="12" y2="12"></line></svg>
                      <span className="">희망 어학시험 종류 등록 (+7%)</span>
                    </li>
                  </ul>
                </div>
              </div>
              {/* Real-time Matched Policies Preview Card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-sky-100 space-y-4" style={{ wordBreak: 'keep-all' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">실시간 매칭 예상 정책</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold">
                    18건 적합
                  </span>
                </div>
                <p className="text-xs text-slate-500">설정 변경 시 실시간으로 계산됩니다.</p>
                <div className="space-y-2.5 pt-1">
                  {/* Matched mini item 1 */}
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-sky-200 transition-colors space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 text-[11px] font-bold">98% 일치</span>
                      <span className="text-xs text-rose-600 font-bold">D-5 마감</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">2025 서울시 청년수당 1차</h4>
                    <p className="text-xs text-slate-500">월 50만원 × 최대 6개월 구직지원</p>
                  </div>
                  {/* Matched mini item 2 */}
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-sky-200 transition-colors space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-700 text-[11px] font-bold">95% 일치</span>
                      <span className="text-xs text-teal-700 font-semibold">상시 접수</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">청년월세 한시 특별지원 2차</h4>
                    <p className="text-xs text-slate-500">월세 거주 및 연소득 조건 완벽 부합</p>
                  </div>
                  {/* Matched mini item 3 */}
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-sky-200 transition-colors space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[11px] font-bold">92% 일치</span>
                      <span className="text-xs text-slate-500 font-medium">매월 1~10일</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">청년도약계좌 2025</h4>
                    <p className="text-xs text-slate-500">정부 기여금 매월 최대 24,000원 추가</p>
                  </div>
                </div>
              </div>
              {/* Quick CTA Box with Status */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-sky-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs text-slate-700 font-semibold">자동 임시저장 완료</span>
                  </div>
                  <button className="text-xs text-slate-400 hover:text-slate-600 transition-colors" type="button">초기화</button>
                </div>
                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-sky-200 transition-all" style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }} type="button">
                  <span className="">설정 저장하고 맞춤 정책 18건 확인하기</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProfileView;
