import React from 'react';

interface AIDigestBoxProps {
  target?: string;
  benefit?: string;
  method?: string;
  reason?: string;
}

export const AIDigestBox: React.FC<AIDigestBoxProps> = ({
  target,
  benefit,
  method,
  reason,
}) => {
  return (
    <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 space-y-2 text-xs">
      <div className="flex items-center justify-between pb-1.5 border-b border-sky-100/70">
        <div className="flex items-center gap-1.5 text-sky-800 font-bold">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
          </span>
          <span className="tracking-tight">AI 3줄 핵심 다이제스트</span>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-sky-600 border border-sky-200 shadow-2xs">
          자동요약
        </span>
      </div>

      <div className="space-y-1.5 text-slate-700">
        {target && (
          <div className="flex items-start gap-2">
            <span className="font-semibold text-sky-900 shrink-0 w-14">지원대상</span>
            <span className="text-slate-600 line-clamp-1 flex-1">{target}</span>
          </div>
        )}
        {benefit && (
          <div className="flex items-start gap-2">
            <span className="font-semibold text-sky-900 shrink-0 w-14">지원혜택</span>
            <span className="text-slate-800 font-medium line-clamp-1 flex-1">{benefit}</span>
          </div>
        )}
        {method && (
          <div className="flex items-start gap-2">
            <span className="font-semibold text-sky-900 shrink-0 w-14">신청방법</span>
            <span className="text-slate-600 line-clamp-1 flex-1">{method}</span>
          </div>
        )}
        {reason && (
          <div className="pt-1 mt-1 border-t border-sky-100 text-sky-700 font-medium text-[11px] flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            <span className="truncate">{reason}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDigestBox;
