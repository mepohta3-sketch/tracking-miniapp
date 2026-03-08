"use client";

import { useState } from "react";

type Order = {
  id: string;
  order_number: string;
  access_code: string;
  client_name: string | null;
  product_name: string;
  size: string | null;
  status: string;
  comment: string | null;
  updated_at: string;
};

type OrderEvent = {
  status: string;
  comment: string | null;
  created_at: string;
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

export default function OrdersPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function findOrder() {
    setLoading(true);
    setMessage("");
    setOrder(null);
    setEvents([]);

    const res = await fetch("/api/orders/find", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderNumber,
        accessCode,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Ошибка поиска заказа");
      setLoading(false);
      return;
    }

    setOrder(data.order);
    setEvents(data.events || []);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-md px-5 py-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            TRACKING
          </p>
          <h1 className="mt-2 text-4xl font-bold">Проверить заказ</h1>
          <p className="mt-3 text-sm text-white/65">
            Введи номер заказа и код доступа.
          </p>
        </div>

        <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="space-y-4">
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              placeholder="Номер заказа, например KAI-2002"
            />

            <input
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none uppercase"
              placeholder="Код доступа"
            />

            <button
              onClick={findOrder}
              disabled={loading}
              className="w-full rounded-2xl bg-white px-4 py-4 text-lg font-semibold text-black disabled:opacity-60"
            >
              {loading ? "Ищу..." : "Найти заказ"}
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/85">
            {message}
          </div>
        )}

        {order && (
          <>
            <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                    Номер заказа
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    {order.order_number}
                  </h2>
                  <p className="mt-2 text-xs text-white/45">
                    Код: {order.access_code}
                  </p>
                </div>

                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  {getStatusLabel(order.status)}
                </span>
              </div>

              <div className="space-y-3 text-sm text-white/75">
                {order.client_name && (
                  <p>
                    <span className="text-white">Клиент:</span> {order.client_name}
                  </p>
                )}

                <p>
                  <span className="text-white">Товар:</span> {order.product_name}
                </p>

                <p>
                  <span className="text-white">Размер:</span> {order.size || "—"}
                </p>

                <p>
                  <span className="text-white">Комментарий:</span>{" "}
                  {order.comment || "—"}
                </p>

                <p>
                  <span className="text-white">Обновлено:</span>{" "}
                  {new Date(order.updated_at).toLocaleString("ru-RU")}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h3 className="mb-4 text-lg font-semibold">История заказа</h3>

              <div className="space-y-3">
                {events.length > 0 ? (
                  events.map((event, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <p className="text-sm font-medium">
                        {getStatusLabel(event.status)}
                      </p>

                      <p className="mt-1 text-xs text-white/50">
                        {new Date(event.created_at).toLocaleString("ru-RU")}
                      </p>

                      {event.comment && (
                        <p className="mt-2 text-sm text-white/70">
                          {event.comment}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                    История этапов пока пуста.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}