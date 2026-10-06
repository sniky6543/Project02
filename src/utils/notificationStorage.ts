import { loadProfileSettings } from './profileStorage';
import { saveNotificationLogToDB, fetchNotificationLogsFromDB } from '../api/supabasePolicies';

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
 * 실제 알림 신청 또는 발송 시 DB(Supabase / PostgreSQL / Backend) 및 로컬 스토리지에 동시 저장
 */
export function addNotificationHistory(
  item: Omit<NotificationHistoryItem, 'id' | 'sentAt' | 'status'> & {
    id?: string;
    sentAt?: string;
    status?: 'SENT' | 'PENDING';
  }
) {
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
    const timeStr =
      item.sentAt ||
      `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newItem: NotificationHistoryItem = {
      ...item,
      id: item.id || `NOTI-${Date.now()}`,
      sentAt: timeStr,
      status: item.status || 'SENT',
    };

    const updated = [newItem, ...stored];
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('notification_history_updated'));
    }

    // 🌟 DB(Supabase notification_logs 테이블 및 Backend)에 비동기 영구 저장
    saveNotificationLogToDB({
      sendMethod: item.channel,
      recipientId: item.recipient,
      content: item.message,
      sentAt: now.toISOString(),
      policyId: item.policyId,
      status: 'SENT',
    }).catch((err) => {
      console.warn('[Notification DB Save Warning]:', err);
    });
  } catch (e) {
    console.error('Failed to add notification history:', e);
  }
}

/**
 * DB(Supabase notification_logs)에서 저장된 발송 기록을 조회하여 로컬 캐시와 동기화
 */
export async function syncNotificationHistoryFromDB(
  recipient?: string,
  channel?: 'telegram' | 'email'
): Promise<NotificationHistoryItem[]> {
  try {
    const dbLogs = await fetchNotificationLogsFromDB(recipient, channel);
    if (!dbLogs || dbLogs.length === 0) {
      return getNotificationHistory().history;
    }

    const mappedItems: NotificationHistoryItem[] = dbLogs
      .filter((row: any) => row.send_method === 'telegram' || row.send_method === 'email')
      .map((row: any) => {
        const d = row.sent_at ? new Date(row.sent_at) : new Date();
        const formattedDate = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

        return {
          id: `DB-NOTI-${row.no || Date.now()}`,
          policyId: row.policy_id || undefined,
          policyTitle: row.policy_id ? `맞춤 정책 알림 (${row.policy_id})` : '청년나침반 알림',
          category: row.send_method === 'telegram' ? '텔레그램' : '이메일',
          channel: row.send_method as 'telegram' | 'email',
          recipient: row.recipient_id || '',
          type: 'CUSTOM_ALERT',
          typeLabel: row.send_method === 'telegram' ? '텔레그램 발송' : '이메일 발송',
          sentAt: formattedDate,
          status: 'SENT',
          message: row.content || '',
        };
      });

    // 기존 로컬 스토리지와 병합 (ID 중복 제거)
    let stored: NotificationHistoryItem[] = [];
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) stored = parsed;
      } catch {}
    }

    const existingMessages = new Set(stored.map((s) => s.message.trim()));
    const newFromDB = mappedItems.filter((m) => !existingMessages.has(m.message.trim()));
    
    if (newFromDB.length > 0) {
      const merged = [...newFromDB, ...stored];
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(merged));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('notification_history_updated'));
      }
    }

    return getNotificationHistory().history;
  } catch (err) {
    console.warn('⚠️ [syncNotificationHistoryFromDB] 동기화 실패:', err);
    return getNotificationHistory().history;
  }
}

