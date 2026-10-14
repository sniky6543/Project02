/**
 * 텔레그램 알림 발송 유틸리티 모듈
 */

export interface TelegramSendResult {
  success: boolean;
  message: string;
  chatId?: string;
}

export async function sendTelegramMessage(
  recipient: string,
  text: string
): Promise<TelegramSendResult> {
  const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  if (!token) {
    return {
      success: false,
      message: 'VITE_TELEGRAM_BOT_TOKEN 환경변수가 설정되지 않았습니다.',
    };
  }

  let targetChatId = recipient.trim();
  if (!targetChatId) {
    return {
      success: false,
      message: '수신할 텔레그램 Chat ID(숫자) 또는 아이디를 입력해주세요.',
    };
  }

  // 사용자가 @username 형태로 입력한 경우, 봇과의 대화 기록(getUpdates)에서 해당 사용자의 숫자 chat_id 역추적
  if (targetChatId.startsWith('@')) {
    try {
      const updatesRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
      const updatesData = await updatesRes.json();
      if (updatesData.ok && Array.isArray(updatesData.result)) {
        const cleanUser = targetChatId.replace('@', '').toLowerCase();
        const found = [...updatesData.result].reverse().find((u: any) =>
          u.message?.from?.username?.toLowerCase() === cleanUser
        );
        if (found?.message?.chat?.id) {
          targetChatId = String(found.message.chat.id);
        }
      }
    } catch (e) {
      console.warn('[Telegram] Chat ID 역추적 실패:', e);
    }
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      return {
        success: true,
        message: '텔레그램 메시지가 정상 발송되었습니다.',
        chatId: targetChatId,
      };
    } else {
      const desc = data.description || '';
      if (desc.includes('chat not found') || desc.includes("bot can't initiate conversation")) {
        return {
          success: false,
          message: '봇(@youth_alarm_bot)과 먼저 대화방에서 [시작] (/start)을 눌러주셔야 메시지를 수신할 수 있습니다.',
          chatId: targetChatId,
        };
      }
      return {
        success: false,
        message: `텔레그램 발송 실패: ${desc}`,
        chatId: targetChatId,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `네트워크 오류: ${err.message || err}`,
    };
  }
}
