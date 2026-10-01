import React, { useState } from 'react';
import { usePolicy } from '../context/PolicyContext';

interface SearchBarProps {
  isFilterOpen: boolean;
  onToggleFilter: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ isFilterOpen, onToggleFilter }) => {
  const { filterParams, setFilterParams, resetFilter } = usePolicy();
  const [inputValue, setInputValue] = useState(filterParams.keyword || '');

  const quickKeywords = [
    '청년월세',
    '구직촉진수당',
    '버팀목전세대출',
    '자격증 응시료',
    '국민취업지원제도',
    'AI 청년 아카데미',
  ];

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFilterParams((prev) => ({ ...prev, keyword: inputValue }));
  };

  const handleKeywordClick = (kw: string) => {
    setInputValue(kw);
    setFilterParams((prev) => ({ ...prev, keyword: kw }));
  };

  const handleReset = () => {
    setInputValue('');
    resetFilter();
  };

  return (
    <div className="space-y-3 mb-6">
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white p-2.5 rounded-2xl border border-sky-200/80 shadow-xs flex flex-col md:flex-row items-center gap-2"
      >
        <div className="flex-1 flex items-center w-full px-3.5 py-1.5 gap-2.5">
          <span className="material-symbols-outlined text-sky-600 text-[24px]">search</span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="키워드나 정책명을 입력하세요 (예: 청년월세, 구직활동지원금, 전세보증금)"
            className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none"
          />
          {inputValue && (
            <button
              type="button"
              onClick={() => {
                setInputValue('');
                setFilterParams((prev) => ({ ...prev, keyword: '' }));
              }}
              className="text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={onToggleFilter}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all border shadow-2xs ${
              isFilterOpen
                ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>{isFilterOpen ? '상세 필터 닫기' : '상세 필터 열기'}</span>
            <span
              className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${
                isFilterOpen ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            <span className="hidden sm:inline">초기화</span>
          </button>

          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">manage_search</span>
            <span>검색</span>
          </button>
        </div>
      </form>

      {/* Recommended Keywords */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
          인기 검색어:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {quickKeywords.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => handleKeywordClick(kw)}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200/80 transition-colors shadow-2xs font-medium"
            >
              #{kw}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
