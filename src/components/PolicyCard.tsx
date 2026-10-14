import React from 'react';
import { PolicyDetail } from '../types/policy';
import DDayBadge from './DDayBadge';
import AIDigestBox from './AIDigestBox';
import { usePolicy } from '../context/PolicyContext';

interface PolicyCardProps {
  policy: PolicyDetail;
  onNavigate?: (path: string) => void;
  onApplyClick?: (url: string) => void;
  showDigest?: boolean;
}

export const PolicyCard: React.FC<PolicyCardProps> = ({
  policy,
  onNavigate,
  onApplyClick,
  showDigest = true,
}) => {
  const { selectPolicy, isBookmarked, toggleBookmark } = usePolicy();
  const bookmarked = isBookmarked(policy.id);

  const handleCardClick = () => {
    selectPolicy(policy.id);
    onNavigate?.('detail');
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(policy.id);
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onApplyClick) {
      onApplyClick(policy.applicationUrl);
    } else {
      window.open(policy.applicationUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Category Color Map
  const categoryColorMap: Record<string, string> = {
    '주거': 'bg-rose-50 text-rose-700 border-rose-200',
    '일자리': 'bg-amber-50 text-amber-700 border-amber-200',
    '교육·직업훈련': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    '금융·복지·문화': 'bg-purple-50 text-purple-700 border-purple-200',
    '참여·기반': 'bg-sky-50 text-sky-700 border-sky-200',
  };

  return (
    <article
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_10px_20px_-3px_rgba(37,99,235,0.08)] hover:border-sky-300 transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Top Header: Organization & Badges */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                categoryColorMap[policy.category] || 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {policy.category}
            </span>
            <span className="text-xs text-slate-500 font-medium truncate max-w-[180px]">
              {policy.organization}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {policy.matchScore && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-800 text-xs font-extrabold border border-cyan-200 shadow-2xs">
                {policy.matchScore}% 적합
              </span>
            )}
            <DDayBadge dDay={policy.dDay} status={policy.status} size="sm" />
            <button
              onClick={handleBookmarkClick}
              aria-label={bookmarked ? '스크랩 취소' : '정책 스크랩'}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                bookmarked
                  ? 'bg-amber-50 text-amber-500 hover:bg-amber-100'
                  : 'bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  bookmarked ? 'font-variation-settings-fill' : ''
                }`}
                style={{
                  fontVariationSettings: bookmarked ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                bookmark
              </span>
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1 mb-2">
          {policy.title}
        </h3>

        {/* Benefit Summary */}
        <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
          {policy.benefitSummary}
        </p>

        {/* AI Digest Box */}
        {showDigest && (
          <div className="mb-4">
            <AIDigestBox
              target={policy.eligibility?.age || policy.targetAge}
              benefit={policy.benefit?.amount || policy.benefitSummary}
              method={policy.benefit?.method || '온라인 접수 (정부24 또는 복지로)'}
              reason={policy.aiMatchReason}
            />
          </div>
        )}
      </div>

      {/* Footer Info & Action Buttons */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-slate-400">group</span>
            <span>{policy.targetAge}</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-slate-400">visibility</span>
            <span>{(policy.viewCount || 1200).toLocaleString()}회</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCardClick}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
          >
            상세보기
          </button>
          <button
            onClick={handleApplyClick}
            className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-xs flex items-center gap-1 transition-colors"
          >
            <span>신청 바로가기</span>
            <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default PolicyCard;
