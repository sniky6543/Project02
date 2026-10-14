import React from 'react';

interface DDayBadgeProps {
  dDay?: string | null;
  status?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const DDayBadge: React.FC<DDayBadgeProps> = ({ dDay, status, size = 'md' }) => {
  // Determine urgency level
  let badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
  let dotColor = 'bg-blue-500';
  let isPulsing = false;
  let displayText = status || '상시모집';

  if (dDay) {
    displayText = dDay;
    const match = dDay.match(/D-(\d+)/i);
    if (match) {
      const days = parseInt(match[1], 10);
      if (days <= 3) {
        badgeStyle = 'bg-red-50 text-red-600 border-red-200 font-bold';
        dotColor = 'bg-red-500';
        isPulsing = true;
      } else if (days <= 14) {
        badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
        dotColor = 'bg-amber-500';
      } else {
        badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200 font-semibold';
        dotColor = 'bg-sky-500';
      }
    } else if (dDay.includes('마감임박')) {
      badgeStyle = 'bg-red-50 text-red-600 border-red-200 font-bold';
      dotColor = 'bg-red-500';
      isPulsing = true;
    }
  } else if (status === '마감') {
    badgeStyle = 'bg-slate-100 text-slate-500 border-slate-200';
    dotColor = 'bg-slate-400';
    displayText = '접수 마감';
  } else if (status === '상시모집') {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs transition-colors shrink-0 select-none ${badgeStyle} ${sizeClasses}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {isPulsing && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor}`} />
      </span>
      <span>{displayText}</span>
    </span>
  );
};

export default DDayBadge;
