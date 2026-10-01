import React from 'react';
import { usePolicy } from '../context/PolicyContext';
import { PolicyCategory } from '../types/policy';

interface FilterSectionProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const FilterSection: React.FC<FilterSectionProps> = ({ isOpen, onToggle }) => {
  const { filterParams, setFilterParams, resetFilter, filteredPolicies } = usePolicy();

  const categories: { label: string; value: string; count?: number }[] = [
    { label: '전체', value: '전체' },
    { label: '일자리', value: '일자리' },
    { label: '주거', value: '주거' },
    { label: '교육·직업훈련', value: '교육·직업훈련' },
    { label: '금융·복지·문화', value: '금융·복지·문화' },
    { label: '참여·기반', value: '참여·기반' },
  ];

  const regions = [
    '전체',
    '서울특별시',
    '경기도',
    '인천광역시',
    '부산광역시',
    '대구광역시',
    '대전광역시',
    '광주광역시',
    '세종특별자치시',
  ];

  const employmentOptions = [
    '제한없음',
    '취업준비생(구직자)',
    '재직자(중소기업)',
    '프리랜서·특수고용',
    '예비창업자·스타트업',
    '대학생·대학원생',
  ];

  const sortOptions: { label: string; value: 'matchScore' | 'popular' | 'latest' | 'deadline' }[] = [
    { label: '내 적합도순', value: 'matchScore' },
    { label: '인기순(조회수)', value: 'popular' },
    { label: '마감임박순', value: 'deadline' },
  ];

  const handleCategorySelect = (cat: string) => {
    setFilterParams((prev) => ({ ...prev, category: cat }));
  };

  const handleRegionSelect = (reg: string) => {
    setFilterParams((prev) => ({ ...prev, region: reg }));
  };

  const handleEmploymentSelect = (emp: string) => {
    setFilterParams((prev) => ({ ...prev, employment: emp }));
  };

  const handleSortSelect = (sort: 'matchScore' | 'popular' | 'latest' | 'deadline') => {
    setFilterParams((prev) => ({ ...prev, sortBy: sort }));
  };

  return (
    <section className="bg-white rounded-2xl shadow-xs mb-8 overflow-hidden border border-sky-100 transition-all duration-300">
      {/* Accordion Header */}
      <div
        onClick={onToggle}
        className="flex items-center justify-between px-6 py-3.5 bg-gradient-to-r from-sky-50/70 to-indigo-50/40 border-b border-sky-100 cursor-pointer select-none hover:bg-sky-50/90 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sky-600 text-[20px]">filter_alt</span>
          <span className="font-bold text-slate-900 text-sm">맞춤 상세 조건 필터</span>
          <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[11px] font-bold">
            검색 결과 {filteredPolicies.length}건
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700">
          <span>{isOpen ? '필터 접기' : '필터 펼치기'}</span>
          <span
            className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
        </div>
      </div>

      {/* Accordion Content */}
      {isOpen && (
        <div className="px-6 md:px-8 py-4 space-y-4 text-sm text-slate-600">
          {/* 1. Category */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 pb-3 border-b border-dashed border-sky-100">
            <label className="w-24 font-bold text-slate-900 text-xs md:text-sm shrink-0">
              분야 (카테고리)
            </label>
            <div className="flex flex-wrap gap-2 flex-1">
              {categories.map((cat) => {
                const isSelected = filterParams.category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleCategorySelect(cat.value)}
                    className={`rounded-full px-3.5 py-1 text-xs transition-all ${
                      isSelected
                        ? 'border border-sky-600 bg-sky-600 text-white font-semibold shadow-xs'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Region & Employment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-dashed border-sky-100">
            {/* Region */}
            <div className="flex items-center gap-3">
              <label className="w-24 font-bold text-slate-900 text-xs md:text-sm shrink-0">
                거주 지역
              </label>
              <select
                value={filterParams.region || '전체'}
                onChange={(e) => handleRegionSelect(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500"
              >
                {regions.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>

            {/* Employment Status */}
            <div className="flex items-center gap-3">
              <label className="w-24 font-bold text-slate-900 text-xs md:text-sm shrink-0">
                취업 상태
              </label>
              <select
                value={filterParams.employment || '제한없음'}
                onChange={(e) => handleEmploymentSelect(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500"
              >
                {employmentOptions.map((emp) => (
                  <option key={emp} value={emp}>
                    {emp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Sorting & Reset Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">정렬 기준:</span>
              <div className="flex items-center gap-1.5">
                {sortOptions.map((s) => {
                  const isSelected = filterParams.sortBy === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => handleSortSelect(s.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        isSelected
                          ? 'bg-sky-100 text-sky-800 border border-sky-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={resetFilter}
              className="text-xs text-slate-500 hover:text-sky-600 flex items-center gap-1 self-end sm:self-auto font-medium"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>모든 조건 초기화</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default FilterSection;
