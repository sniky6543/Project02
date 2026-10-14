import React from 'react';
import { PolicyDetail } from '../types/policy';

interface ApplyModalProps {
  policy: PolicyDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({ policy, isOpen, onClose }) => {
  if (!isOpen || !policy) return null;

  const handleConfirm = () => {
    window.open(policy.applicationUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-sky-100 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">open_in_new</span>
            </span>
            <h3 className="font-bold text-slate-900 text-base">공식 접수처 안내</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-sky-600">{policy.organization}</p>
          <h4 className="text-sm font-bold text-slate-800">{policy.title}</h4>
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
            정부 및 공공기관의 공식 신청 웹사이트로 이동합니다. 본인 인증(공동인증서, 간편인증)이 필요할 수 있습니다.
          </p>
        </div>

        <div className="bg-sky-50/60 rounded-xl p-3 border border-sky-100 text-xs space-y-1 text-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">문의처</span>
            <span className="font-semibold text-slate-800">{policy.contact}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">신청 방식</span>
            <span className="font-semibold text-slate-800">{policy.benefit?.method || '온라인 신청'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-1"
          >
            <span>공식 사이트로 이동</span>
            <span className="material-symbols-outlined text-[15px]">arrow_outward</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplyModal;
