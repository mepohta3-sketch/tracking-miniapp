"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getTelegramUserId, initTelegramWebApp } from "@/lib/telegram";

type Order = {
  id: string;
  order_number: string;
  product_name: string;
  size: string | null;
  status: string;
  comment: string | null;
  updated_at: string;
  telegram_id: number;
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

export default function OrderPage() {
  const params = useParams() as { id?: string };
  const orderId = params.id;

  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initTelegramWebApp();
    const tgId = getTelegramUserId();
    setTelegramId(tgId);
  }, []);

  useEffect(() => {
    if (!orderId || telegramId === null) return;

    async function loadOrder() {
      setLoading(true);
      setError(null);

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          "id, order_number, product_name, size, status, comment, updated_at, telegram_id"
        )
        .eq("id", orderId)
        .eq("telegram_id", telegramId)
        .single();

      if (orderError || !orderData) {
        setError(orderError?.message || "Заказ не найден");
        setOrder(null);
        setEvents([]);
        setLoading(false);
        return;
      }

      setOrder(orderData as Order);

      const { data: eventsData, error: eventsError } = await supabase
        .from("order_events")
        .select("status, comment, created_at")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (eventsError) {
        setError(eventsError.message);
        setEvents([]);
      } else {
        setEvents((eventsData as OrderEvent[]) || []);
      }

      setLoading(false);
    }

    loadOrder();
  }, [orderId, telegramId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white">
        <div className="mx-auto max-w-md px-5 py-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white/70">
            Загрузка заказа...
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white">
        <div className="mx-auto max-w-md px-5 py-6">
          <a
            href="/orders"
            className="mb-6 inline-block rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
          >
            Назад
          </a>

          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">
            Заказ не найден.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-md px-5 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              TRACKING
            </p>
            <h1 className="mt-2 text-3xl font-bold">Заказ</h1>
          </div>

          <a
            href="/orders"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
          >
            Назад
          </a>
        </div>
<div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                Номер заказа
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                {order.order_number}
              </h2>
            </div>

            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
              {getStatusLabel(order.status)}
            </span>
          </div>

          <div className="space-y-3 text-sm text-white/75">
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
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-4 text-lg font-semibold">История заказа</h3>

          <div className="space-y-3">
            {events.length > 0 ? (
              events.map((event, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
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
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                История этапов пока пуста.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}