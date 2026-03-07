"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getTelegramUserId,
  initTelegramWebApp,
  TEST_TELEGRAM_ID,
} from "@/lib/telegram";

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

function getStatusStep(status: string) {
  switch (status) {
    case "created":
      return 1;
    case "bought_out":
      return 2;
    case "to_china_warehouse":
      return 3;
    case "to_novosibirsk":
      return 4;
    case "delivered":
      return 5;
    default:
      return 1;
  }
}

export default function OrderPage() {
  const params = useParams() as { id?: string };
  const orderId = params.id;

  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initTelegramWebApp();
    const tgId = getTelegramUserId() ?? TEST_TELEGRAM_ID;
    setTelegramId(tgId);
  }, []);

  useEffect(() => {
    if (!orderId || telegramId === null) return;

    async function loadOrder() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, product_name, size, status, comment, updated_at, telegram_id"
        )
        .eq("id", orderId)
        .eq("telegram_id", telegramId)
        .single();

      if (error) {
        setError(error.message);
        setOrder(null);
      } else {
        setOrder(data as Order);
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

  const currentStep = getStatusStep(order.status);

  const steps = [
    "Заказ создан",
    "Товар выкуплен",
    "В пути на склад в Китае",
    "В пути к нам в Новосибирск",
    "Доставлен",
  ];

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-md px-5 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              TRACKING
            </p>
            <h1 className="mt-2 text-3xl font-bold">Заказ</h1>
            <p className="mt-2 text-xs text-white/45">
              Telegram ID: {telegramId}
            </p>
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
              <span className="text-white">Комментарий:</span>{" "}
              {order.comment || "—"}
            </p>
            <p>
              <span className="text-white">Обновлено:</span>{" "}
              {new Date(order.updated_at).toLocaleDateString("ru-RU")}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-4 text-lg font-semibold">Этапы заказа</h3>

          <div className="space-y-3">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isDone = stepNumber <= currentStep;
              const isCurrent = stepNumber === currentStep;

              const cardClass = isDone
                ? "rounded-2xl border p-4 border-emerald-400/30 bg-emerald-400/10"
                : "rounded-2xl border p-4 border-white/10 bg-white/5";

              const circleClass = isDone
                ? "flex h-8 w-8 items-center justify-center rounded-full bg-emerald-300 text-sm font-semibold text-black"
                : "flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white/60";

              return (
                <div key={step} className={cardClass}>
                  <div className="flex items-center gap-3">
                    <div className={circleClass}>{stepNumber}</div>

                    <div>
                      <p className="text-sm font-medium">{step}</p>
                      <p className="text-xs text-white/50">
                        {isCurrent
                          ? "Текущий этап"
                          : isDone
                          ? "Этап пройден"
                          : "Ожидается"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}