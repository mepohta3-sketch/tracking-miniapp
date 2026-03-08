const MANAGER_URL = "https://t.me/manager_KaiStore";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-md px-5 py-8">
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            TRACKING
          </p>

          <h1 className="mt-2 text-4xl font-bold leading-tight">
            Отслеживание
            <br />
            заказа
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/70">
            Введи номер заказа и код доступа, чтобы быстро посмотреть статус и
            историю доставки.
          </p>

          <div className="mt-6 grid gap-3">
            <a
              href="/orders"
              className="rounded-2xl bg-white px-4 py-4 text-center text-lg font-semibold text-black"
            >
              Проверить заказ
            </a>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/45">
                РАЗДЕЛ
              </p>
              <h2 className="mt-2 text-2xl font-bold">Полезное</h2>
            </div>

            <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/55">
              FAQ / отзывы / инфо
            </div>
          </div>

          <div className="space-y-3 text-sm leading-6 text-white/70">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-semibold text-white">Что здесь будет</p>
              <p className="mt-2">
                Здесь можно собрать всё полезное для клиента в одном месте:
                ответы на частые вопросы, отзывы, полезную информацию по срокам,
                этапам доставки и получению заказа.
              </p>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="font-semibold text-white">FAQ</p>
                <p className="mt-1 text-white/65">
                  Сроки, статусы, доставка, получение заказа.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="font-semibold text-white">Отзывы</p>
                <p className="mt-1 text-white/65">
                  Отзывы клиентов и подтверждение доверия.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="font-semibold text-white">Полезная инфа</p>
                <p className="mt-1 text-white/65">
                  Что значит каждый этап и как проходит заказ.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/45">
                СВЯЗЬ
              </p>
              <h2 className="mt-2 text-2xl font-bold">Менеджер</h2>
            </div>

            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
              Онлайн
            </div>
          </div>

          <p className="mb-5 text-sm leading-6 text-white/70">
            Если появились вопросы по заказу, срокам или доставке, можно сразу
            написать менеджеру в Telegram.
          </p>

          <a
            href={MANAGER_URL}
            target="_blank"
            rel="noreferrer"
            className="block rounded-2xl bg-emerald-400 px-4 py-4 text-center text-lg font-semibold text-black"
          >
            Написать менеджеру
          </a>
        </div>
      </div>
    </main>
  );
}