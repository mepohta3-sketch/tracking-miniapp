export default function OrdersPage() {
  const orders = [
    {
      id: "KAI-1024",
      product: "Rick Owens Geobasket",
      size: "43",
      status: "В пути к нам в Новосибирск",
      comment: "Товар уже отправлен, ожидаем прибытие.",
      updatedAt: "06.03.2026",
    },
    {
      id: "KAI-1025",
      product: "Stone Island Hoodie",
      size: "L",
      status: "Товар выкуплен",
      comment: "Выкуп подтвержден, готовим следующий этап.",
      updatedAt: "05.03.2026",
    },
    {
      id: "KAI-1026",
      product: "ERD T-Shirt",
      size: "M",
      status: "Заказ создан",
      comment: "Заказ принят и добавлен в систему.",
      updatedAt: "04.03.2026",
    },
  ];

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-md px-5 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              TRACKING
            </p>
            <h1 className="mt-2 text-3xl font-bold">Мои заказы</h1>
          </div>

          <a
            href="/"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
          >
            Назад
          </a>
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                    Номер заказа
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">{order.id}</h2>
                </div>

                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  {order.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-white/75">
                <p>
                  <span className="text-white">Товар:</span> {order.product}
                </p>
                <p>
                  <span className="text-white">Размер:</span> {order.size}
                </p>
                <p>
                  <span className="text-white">Комментарий:</span> {order.comment}
                </p>
                <p>
                  <span className="text-white">Обновлено:</span> {order.updatedAt}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}