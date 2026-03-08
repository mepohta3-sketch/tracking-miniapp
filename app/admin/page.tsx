"use client";

import { useEffect, useState } from "react";

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

const statusOptions = [
  { value: "created", label: "Заказ создан" },
  { value: "bought_out", label: "Товар выкуплен" },
  { value: "to_china_warehouse", label: "В пути на склад в Китае" },
  { value: "to_novosibirsk", label: "В пути к нам в Новосибирск" },
  { value: "delivered", label: "Доставлен" },
];

function getStatusLabel(status: string) {
  return statusOptions.find((item) => item.value === status)?.label || status;
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [status, setStatus] = useState("created");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  const [newOrderNumber, setNewOrderNumber] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newStatus, setNewStatus] = useState("created");
  const [newComment, setNewComment] = useState("");
  const [newAccessCode, setNewAccessCode] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("admin_secret");
    if (saved) {
      setSecret(saved);
    }
  }, []);

  useEffect(() => {
    const selected = orders.find((order) => order.id === selectedOrderId);
    if (selected) {
      setStatus(selected.status);
      setComment(selected.comment || "");
    }
  }, [selectedOrderId, orders]);

  async function loadOrders(secretOverride?: string): Promise<Order[] | null> {
    const finalSecret = (secretOverride || secret).trim();

    if (!finalSecret) {
      setMessage("Введи ADMIN_SECRET");
      return null;
    }

    setLoading(true);
    setMessage("");

    const res = await fetch("/api/admin/orders", {
      headers: {
        "x-admin-secret": finalSecret,
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Ошибка загрузки");
      setOrders([]);
      setLoading(false);
      return null;
    }

    const loadedOrders: Order[] = data.orders || [];
    setOrders(loadedOrders);

    if (!selectedOrderId && loadedOrders.length > 0) {
      setSelectedOrderId(loadedOrders[0].id);
    }

    setLoading(false);
    return loadedOrders;
  }

  async function connect() {
    const trimmed = secret.trim();
    localStorage.setItem("admin_secret", trimmed);
    await loadOrders(trimmed);
  }

  async function saveOrder() {
    const finalSecret = secret.trim();

    if (!selectedOrderId) {
      setMessage("Выбери заказ");
      return;
    }

    if (!finalSecret) {
      setMessage("Введи ADMIN_SECRET");
      return;
    }

    setSaving(true);
    setMessage("");

    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": finalSecret,
      },
      body: JSON.stringify({
        orderId: selectedOrderId,
        status,
        comment,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Ошибка сохранения");
      setSaving(false);
      return;
    }

    setMessage("Заказ обновлён");
    setSaving(false);
    await loadOrders(finalSecret);
  }

  async function createOrder() {
    const finalSecret = secret.trim();

    if (!finalSecret) {
      setMessage("Введи ADMIN_SECRET");
      return;
    }

    if (!newOrderNumber.trim()) {
      setMessage("Введи номер заказа");
      return;
    }

    if (!newProductName.trim()) {
      setMessage("Введи название товара");
      return;
    }

    setCreating(true);
    setMessage("");

    const res = await fetch("/api/admin/orders/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": finalSecret,
      },
      body: JSON.stringify({
        orderNumber: newOrderNumber.trim(),
        clientName: newClientName.trim(),
        productName: newProductName.trim(),
        size: newSize.trim(),
        status: newStatus,
        comment: newComment.trim(),
        accessCode: newAccessCode.trim(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Ошибка создания заказа");
      setCreating(false);
      return;
    }

    const createdCode = data?.result?.access_code || "—";
    const createdNumber = data?.result?.order_number || newOrderNumber.trim();

    setMessage(`Заказ создан: ${createdNumber}. Код: ${createdCode}`);

    setNewOrderNumber("");
    setNewClientName("");
    setNewProductName("");
    setNewSize("");
    setNewStatus("created");
    setNewComment("");
    setNewAccessCode("");

    const loadedOrders = await loadOrders(finalSecret);
    if (loadedOrders && createdNumber) {
      const created = loadedOrders.find(
        (order) => order.order_number === createdNumber
      );
      if (created) {
        setSelectedOrderId(created.id);
      }
    }

    setCreating(false);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              TRACKING
            </p>
            <h1 className="mt-2 text-4xl font-bold">Админка</h1>
          </div>

          <a
            href="/orders"
            className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white"
          >
            К заказам
          </a>
        </div>

        <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="mb-3 text-sm text-white/70">ADMIN_SECRET</p>

          <div className="flex gap-3">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              placeholder="Введи пароль админки"
            />
            <button
              onClick={connect}
              className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black"
            >
              Войти
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/85">
            {message}
          </div>
        )}

        <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-6 text-2xl font-bold">Создать заказ</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={newOrderNumber}
              onChange={(e) => setNewOrderNumber(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              placeholder="Номер заказа, например KAI-2003"
            />

            <input
              value={newAccessCode}
              onChange={(e) => setNewAccessCode(e.target.value.toUpperCase())}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none uppercase"
              placeholder="Код доступа (если пусто — создастся сам)"
            />

            <input
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              placeholder="Имя клиента"
            />

            <input
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              placeholder="Товар"
            />

            <input
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              placeholder="Размер"
            />

            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
            >
              {statusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mt-4 min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
            placeholder="Комментарий к новому заказу"
          />

          <button
            onClick={createOrder}
            disabled={creating}
            className="mt-4 w-full rounded-2xl bg-emerald-400 px-4 py-4 text-lg font-semibold text-black disabled:opacity-60"
          >
            {creating ? "Создаю..." : "Создать заказ"}
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Заказы</h2>
              <button
                onClick={() => loadOrders()}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
              >
                Обновить
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-white/60">Загрузка...</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-white/60">Заказов нет.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full rounded-2xl border p-4 text-left ${
                      selectedOrderId === order.id
                        ? "border-emerald-400/30 bg-emerald-400/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <p className="text-xl font-bold">{order.order_number}</p>
                    <p className="mt-1 text-xs text-white/45">
                      Код: {order.access_code}
                    </p>
                    <p className="mt-2 text-sm text-white/70">{order.product_name}</p>
                    <p className="mt-1 text-sm text-white/55">
                      {getStatusLabel(order.status)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-6 text-2xl font-bold">Редактирование</h2>

            {selectedOrderId ? (
              <>
                <p className="mb-3 text-sm text-white/60">
                  Код текущего заказа:{" "}
                  {orders.find((order) => order.id === selectedOrderId)?.access_code || "—"}
                </p>

                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-sm text-white/70">Статус</p>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                    >
                      {statusOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="mb-2 text-sm text-white/70">Комментарий</p>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[150px] w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                      placeholder="Новый комментарий"
                    />
                  </div>

                  <button
                    onClick={saveOrder}
                    disabled={saving}
                    className="w-full rounded-2xl bg-white px-4 py-4 text-lg font-semibold text-black disabled:opacity-60"
                  >
                    {saving ? "Сохраняю..." : "Сохранить и добавить этап"}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-white/60">Выбери заказ слева.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}