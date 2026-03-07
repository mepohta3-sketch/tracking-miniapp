export const TEST_TELEGRAM_ID = 5527330300;

export function getTelegramUserId(): number | null {
  if (typeof window === "undefined") return null;

  const w = window as Window & {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: { id?: number };
        };
        ready?: () => void;
        expand?: () => void;
      };
    };
  };

  const telegramId = w.Telegram?.WebApp?.initDataUnsafe?.user?.id;

  if (typeof telegramId === "number") {
    return telegramId;
  }

  if (window.location.hostname === "localhost") {
    return TEST_TELEGRAM_ID;
  }

  return null;
}

export function initTelegramWebApp() {
  if (typeof window === "undefined") return;

  const w = window as Window & {
    Telegram?: {
      WebApp?: {
        ready?: () => void;
        expand?: () => void;
      };
    };
  };

  w.Telegram?.WebApp?.ready?.();
  w.Telegram?.WebApp?.expand?.();
}