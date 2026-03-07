export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-md px-5 py-6">
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            TRACKING
          </p>

          <h1 className="mt-2 text-3xl font-bold leading-tight">
            Отслеживание
            <br />
            заказов
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/70">
            Здесь клиент сможет смотреть свои заказы, статусы, статьи,
            видео и ответы на частые вопросы.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <a
  href="/orders"
  className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-black"
>
  Мои заказы
</a>

            <button className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white">
              Поддержка
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Этапы заказа</h2>

          <div className="space-y-3">
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
              <p className="text-sm font-medium">1. Заказ создан</p>
              <p className="text-xs text-white/50">Текущий пример этапа</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium">2. Товар выкуплен</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium">3. В пути на склад в Китае</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium">4. В пути к нам в Новосибирск</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium">5. Доставлен</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-base font-semibold">Отзывы</h3>
            <p className="mt-2 text-sm text-white/65">
              Здесь позже будут отзывы клиентов.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-base font-semibold">Польза</h3>
            <p className="mt-2 text-sm text-white/65">
              Статьи, ответы и полезная информация по доставке.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-base font-semibold">Видео</h3>
            <p className="mt-2 text-sm text-white/65">
              Видеообзоры и обновления.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-base font-semibold">FAQ</h3>
            <p className="mt-2 text-sm text-white/65">
              Частые вопросы по срокам и статусам заказа.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}