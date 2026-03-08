export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-md px-5 py-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            TRACKING
          </p>

          <h1 className="mt-2 text-4xl font-bold leading-tight">
            Отслеживание
            <br />
            заказа
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/70">
            Для проверки заказа введи номер и код доступа.
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
      </div>
    </main>
  );
}