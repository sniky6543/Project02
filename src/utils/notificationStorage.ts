import { loadProfileSettings } from './profileStorage';

export interface NotificationHistoryItem {
  id: string;
  policyId?: string;
  policyTitle: string;
  category: string;
  channel: 'telegram' | 'email';
  recipient: string; // 텔레그램 ID 또는 이메일 주소
  type: 'NEW_MATCH' | 'DEADLINE_ALERT' | 'DAILY_BRIEF' | 'CUSTOM_ALERT';
  typeLabel: string;
  sentAt: string;
  status: 'SENT' | 'PENDING';
  message: string;
}

export const NOTIFICATION_STORAGE_KEY = 'youth_compass_notification_history';

/**
 * 프로필에 저장된 실제 텔레그램 ID 또는 이메일을 중심으로 알림 발송 내역 조회
 * (등록된 계정이 아니거나 수신 내역이 없으면 빈 배열 반환)
 */
export function getNotificationHistory(): {
  history: NotificationHistoryItem[];
  recipient: string;
  channel: 'telegram' | 'email';
  isConfigured: boolean;
  hasRegisteredAccount: boolean;
} {
  const profile = loadProfileSettings();
  const hasTelegram = Boolean(profile.isTelegramSelected && profile.telegramId && profile.telegramId.trim());
  const hasEmail = Boolean(profile.isEmailSelected && profile.emailAddress && profile.emailAddress.trim());
  
  const channel: 'telegram' | 'email' = profile.isEmailSelected ? 'email' : 'telegram';
  const recipient = profile.isEmailSelected ? (profile.emailAddress || '').trim() : (profile.telegramId || '').trim();
  const hasRegisteredAccount = Boolean(recipient);
  const isConfigured = Boolean(
    (profile.nickname && profile.nickname.trim()) ||
    (profile.birthDate && profile.birthDate.trim()) ||
    hasRegisteredAccount ||
    profile.employmentStatus ||
    profile.housingType ||
    (profile.interests && profile.interests.length > 0)
  );

  // 등록된 수신 계정이 없으면 빈 내역 반환
  if (!hasRegisteredAccount) {
    return {
      history: [],
      recipient: '',
      channel,
      isConfigured,
      hasRegisteredAccount: false,
    };
  }

  let stored: NotificationHistoryItem[] = [];
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        stored = parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse notification history:', e);
  }

  // 현재 등록된 수신 계정(ID/이메일) 및 채널과 일치하는 내역만 엄격하게 필터링
  const normalizedRecipient = recipient.toLowerCase().replace(/^@/, '');
  const matchingHistory = stored.filter((item) => {
    if (!item.recipient) return false;
    const itemNorm = item.recipient.toLowerCase().replace(/^@/, '');
    return itemNorm === normalizedRecipient && item.channel === channel;
  });

  return {
    history: matchingHistory,
    recipient,
    channel,
    isConfigured,
    hasRegisteredAccount: true,
  };
}

/**
 * 실제 알림 신청 또는 발송 시 내역 저장
 */
export function addNotificationHistory(item: Omit<NotificationHistoryItem, 'id' | 'sentAt' | 'status'>) {
  try {
    let stored: NotificationHistoryItem[] = [];
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        stored = parsed;
      }
    }

    const now = new Date();
    const timeStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newItem: NotificationHistoryItem = {
      ...item,
      id: `NOTI-${Date.now()}`,
      sentAt: timeStr,
      status: 'SENT',
    };

    const updated = [newItem, ...stored];
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('notification_history_updated'));
    }
  } catch (e) {
    console.error('Failed to add notification history:', e);
  }
}
