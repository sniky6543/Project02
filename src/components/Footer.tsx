import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-slate-200/70 mt-auto">
      <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">청년나침반</span>
            <span className="text-xs text-slate-400">청년 정책 통합 큐레이션 포털</span>
          </div>
          <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
            본 서비스는 대한민국 2039 청년세대의 안정적인 자립과 금융·주거·취업 복지 정책 혜택을 빠르고 신뢰성 있게 탐색할 수 있도록 지원하는 공공 핀테크 플랫폼입니다.
          </p>
          <span className="text-[11px] text-slate-400 mt-1">
            © 2025 청년나침반 (Youth Compass). All rights reserved.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-slate-500 text-xs">
          <a className="hover:text-sky-600 transition-colors" href="#">
            이용약관
          </a>
          <span className="text-slate-300">•</span>
          <a className="hover:text-sky-600 transition-colors font-semibold" href="#">
            개인정보처리방침
          </a>
          <span className="text-slate-300">•</span>
          <a className="hover:text-sky-600 transition-colors" href="#">
            정책제보 및 문의
          </a>
          <span className="text-slate-300">•</span>
          <a className="hover:text-sky-600 transition-colors" href="#">
            오픈 API 가이드
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
