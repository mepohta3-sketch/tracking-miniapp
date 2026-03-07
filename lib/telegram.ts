export const TEST_TELEGRAM_ID = 123456789;

export function getTelegramUserId(): number | null {
  if (typeof window === "undefined") return null;

  const telegram = (
    window as Window & {
      Telegram?: {
        WebApp?: {
          initDataUnsafe?: {
            user?: { id?: number };
          };
          ready?: () => void;
          expand?: () => void;
        };
      };
    }
  ).Telegram;

  const id = telegram?.WebApp?.initDataUnsafe?.user?.id;
  return typeof id === "number" ? id : null;
}

export function initTelegramWebApp() {
  if (typeof window === "undefined") return;

  const telegram = (
    window as Window & {
      Telegram?: {
        WebApp?: {
          ready?: () => void;
          expand?: () => void;
        };
      };
    }
  ).Telegram;

  telegram?.WebApp?.ready?.();
  telegram?.WebApp?.expand?.();
}