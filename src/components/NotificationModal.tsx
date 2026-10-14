import React, { useState } from 'react';
import { NotificationHistoryItem, syncNotificationHistoryFromDB } from '../utils/notificationStorage';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: NotificationHistoryItem[];
  recipient: string;
  channel: 'telegram' | 'email';
  onNavigateToDetail?: (policyId?: string) => void;
  onNavigateToProfile?: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  history,
  recipient,
  channel,
  onNavigateToDetail,
  onNavigateToProfile,
}) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'telegram' | 'email'>('all');

  if (!isOpen) return null;

  const hasRecipient = Boolean(recipient && recipient.trim());

  const handleSyncDB = async () => {
    setIsSyncing(true);
    try {
      await syncNotificationHistoryFromDB(recipient, channel);
    } catch (err) {
      console.warn('DB Sync Error:', err);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const filteredHistory = history.filter((item) => {
    if (activeFilter === 'telegram') return item.channel === 'telegram';
    if (activeFilter === 'email') return item.channel === 'email';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-sky-100 overflow-hidden flex flex-col max-h-[88vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-5 md:p-6 bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              🔔
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold tracking-tight text-white">맞춤 정책 알림 발송 내역 (DB)</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-xs font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  DB 실시간 연동
                </span>
              </div>
              <p className="text-xs text-sky-100/90 pt-0.5">
                텔레그램 ID 및 이메일로 발송된 알림 내용, 보낸 아이디, 발송 일시가 DB에 영구 보관됩니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* Recipient Channel & Filter Info Bar */}
        <div className="px-6 py-3 bg-sky-50 border-b border-sky-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">현재 수신 계정:</span>
            {hasRecipient ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-sky-200 text-sky-800 font-semibold shadow-2xs">
                {channel === 'telegram' ? (
                  <>
                    <span className="text-[#229ED9]">✈️ 텔레그램</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-sky-900">{recipient}</span>
                  </>
                ) : (
                  <>
                    <span className="text-sky-600">✉️ 이메일</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-sky-900">{recipient}</span>
                  </>
                )}
              </div>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 font-semibold">
                미등록 (계정 정보 없음)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center bg-white/80 p-0.5 rounded-lg border border-sky-200 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  activeFilter === 'all' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                전체 ({history.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('telegram')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  activeFilter === 'telegram' ? 'bg-[#229ED9] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                텔레그램 ({history.filter((h) => h.channel === 'telegram').length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('email')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  activeFilter === 'email' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                이메일 ({history.filter((h) => h.channel === 'email').length})
              </button>
            </div>

            {/* DB Refresh Button */}
            <button
              type="button"
              onClick={handleSyncDB}
              disabled={isSyncing}
              className="p-1.5 rounded-lg bg-white border border-sky-200 hover:bg-sky-100 text-sky-700 text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              title="DB에서 최신 발송 내역 새로고침"
            >
              <span className={`material-symbols-outlined text-[14px] ${isSyncing ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span className="hidden sm:inline font-bold">DB 동기화</span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
          {!hasRecipient ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-3">
              <p className="text-4xl">⚠️</p>
              <div className="space-y-1">
                <p className="text-base font-bold text-slate-800">등록된 수신 계정(텔레그램 ID 또는 이메일)이 없습니다.</p>
                <p className="text-xs text-slate-400">
                  프로필 설정 페이지에서 텔레그램 ID 또는 이메일을 등록하시면 실시간 맞춤 알림을 받아보실 수 있습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToProfile?.();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer mt-2"
              >
                <span>프로필에서 계정 등록하기</span>
                <span>⚙️</span>
              </button>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-3">
              <p className="text-4xl">📭</p>
              <div className="space-y-1">
                <p className="text-base font-bold text-slate-800">해당 채널로 수신된 알림 메시지가 없습니다.</p>
                <p className="text-xs text-slate-400">
                  등록된 계정(<strong className="text-slate-700">{recipient}</strong>)으로 발송된 맞춤 알림 내역이 없습니다.
                </p>
                <p className="text-[11px] text-slate-400 pt-1">
                  관심 정책 상세 페이지에서 [알림 신청]을 누르거나 프로필에서 [테스트 알림 발송]을 진행하면 DB에 저장됩니다.
                </p>
              </div>
            </div>
          ) : (
            filteredHistory.map((item) => {
              const typeColor =
                item.channel === 'telegram'
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200';

              return (
                <article
                  key={item.id}
                  onClick={() => {
                    if (item.policyId) {
                      onClose();
                      onNavigateToDetail?.(item.policyId);
                    }
                  }}
                  className="p-4 md:p-5 rounded-2xl bg-white border border-sky-100 hover:border-sky-300 shadow-xs hover:shadow-md transition-all space-y-3 cursor-pointer group"
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${typeColor}`}>
                        {item.channel === 'telegram' ? '✈️ 텔레그램' : '✉️ 이메일'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[11px]">
                        {item.category || item.typeLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 font-medium text-[11px]">
                      <span className="text-slate-500 font-mono">{item.sentAt}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold border border-emerald-100 text-[10px]">
                        DB 저장 완료 ✅
                      </span>
                    </div>
                  </div>

                  {/* Title & Recipient Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm md:text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors leading-snug">
                        {item.policyTitle}
                      </h4>
                      <p className="text-[11px] text-slate-500 pt-0.5">
                        수신 계정 (보낸 ID): <strong className="text-slate-700 font-mono">{item.recipient}</strong>
                      </p>
                    </div>
                    <span className="text-slate-400 group-hover:text-sky-600 text-xs shrink-0">→</span>
                  </div>

                  {/* Message Body (Content) */}
                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                    {item.message}
                  </div>

                  {/* Item Footer */}
                  <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                    <span className="text-[11px]">
                      채널: {item.channel.toUpperCase()} | 발송 상태: {item.status}
                    </span>
                    {item.policyId && (
                      <span className="text-sky-600 font-bold text-xs group-hover:underline flex items-center gap-0.5">
                        <span>정책 상세 보기</span>
                        <span>→</span>
                      </span>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            총 <strong>{filteredHistory.length}</strong>건의 알림 기록 (DB 보관)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToProfile?.();
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              수신 설정 변경 ⚙️
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;

