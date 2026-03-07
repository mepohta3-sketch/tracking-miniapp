import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  order_number: string;
  product_name: string;
  size: string | null;
  status: string;
  comment: string | null;
  updated_at: string;
};

function getStatusLabel(status: string) {
  switch (status) {
    case "created":
      return "Заказ создан";
    case "bought_out":
      return "Товар выкуплен";
    case "to_china_warehouse":
      return "В пути на склад в Китае";
    case "to_novosibirsk":
      return "В пути к нам в Новосибирск";
    case "delivered":
      return "Доставлен";
    default:
      return status;
  }
}

export default async function OrdersPage() {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, order_number, product_name, size, status, comment, updated_at")
    .order("updated_at", { ascending: false });

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

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            Ошибка загрузки заказов: {error.message}
          </div>
        )}

        {!error && (!orders || orders.length === 0) && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            Заказов пока нет.
          </div>
        )}

        <div className="space-y-4">
          {orders?.map((order: Order) => (
            <div
              key={order.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                    Номер заказа
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">
                    {order.order_number}
                  </h2>
                </div>

                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  {getStatusLabel(order.status)}
                </span>
              </div>

              <div className="space-y-2 text-sm text-white/75">
                <p>
                  <span className="text-white">Товар:</span> {order.product_name}
                </p>
                <p>
                  <span className="text-white">Размер:</span> {order.size || "—"}
                </p>
                <p>
                  <span className="text-white">Комментарий:</span> {order.comment || "—"}
                </p>
                <p>
                  <span className="text-white">Обновлено:</span>{" "}
                  {new Date(order.updated_at).toLocaleDateString("ru-RU")}
                </p>
              </div>

              <a
                href={`/orders/${order.id}`}
                className="mt-4 inline-block rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black"
              >
                Открыть
              </a>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}