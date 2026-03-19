"use client"

import { useEffect, useMemo, useState } from "react"

type Order = {
  id: string
  order_number: string
  client_name: string | null
  product_name: string
  size: string | null
  status: string
  comment: string | null
  access_code: string | null
}

const statusOptions = [
  { value: "created", label: "Заказ оформлен" },
  { value: "bought_out", label: "Товар выкуплен" },
  { value: "to_china_warehouse", label: "На складе в Китае" },
  { value: "to_novosibirsk", label: "Едет в Новосибирск" },
  { value: "delivered", label: "Доставлен" },
]

function getStatusLabel(status: string) {
  return statusOptions.find((s) => s.value === status)?.label || status
}

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export default function AdminPage() {
  const [secret, setSecret] = useState("")
  const [orders, setOrders] = useState<Order[]>([])
  const [message, setMessage] = useState("")

  const [newOrderNumber, setNewOrderNumber] = useState("")
  const [newClientName, setNewClientName] = useState("")
  const [newProductName, setNewProductName] = useState("")
  const [newSize, setNewSize] = useState("")
  const [newComment, setNewComment] = useState("")
  const [newAccessCode, setNewAccessCode] = useState("")

  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("created")
  const [selectedComment, setSelectedComment] = useState("")
  const [selectedAccessCode, setSelectedAccessCode] = useState("")

  const [tab, setTab] = useState<"active" | "delivered">("active")

  async function loadOrders(sec?: string) {
    const finalSecret = (sec || secret).trim()

    if (!finalSecret) {
      setMessage("Введи ADMIN_SECRET")
      return
    }

    try {
      const res = await fetch("/api/admin/orders", {
        headers: {
          "x-admin-secret": finalSecret,
        },
        cache: "no-store",
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Ошибка загрузки заказов")
        return
      }

      setOrders(data.orders || [])
      setMessage("")
    } catch {
      setMessage("Ошибка загрузки заказов")
    }
  }

  async function createOrder() {
    const finalSecret = secret.trim()
    const finalCode = (newAccessCode.trim() || generateCode()).toUpperCase()

    if (!finalSecret) {
      setMessage("Введи ADMIN_SECRET")
      return
    }

    if (!newOrderNumber.trim()) {
      setMessage("Введи номер заказа")
      return
    }

    if (!newProductName.trim()) {
      setMessage("Введи товар")
      return
    }

    try {
      const res = await fetch("/api/admin/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": finalSecret,
        },
        body: JSON.stringify({
          order_number: newOrderNumber.trim(),
          client_name: newClientName.trim() || null,
          telegram_id: null,
          product_name: newProductName.trim(),
          size: newSize.trim() || null,
          status: "created",
          comment: newComment.trim() || "Заказ оформлен",
          access_code: finalCode,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Ошибка создания заказа")
        return
      }

      setMessage(`Заказ создан. Код клиента: ${data.access_code || finalCode}`)
      setNewOrderNumber("")
      setNewClientName("")
      setNewProductName("")
      setNewSize("")
      setNewComment("")
      setNewAccessCode("")

      await loadOrders(finalSecret)
    } catch {
      setMessage("Ошибка создания заказа")
    }
  }

  async function updateOrder() {
    const finalSecret = secret.trim()

    if (!finalSecret) {
      setMessage("Введи ADMIN_SECRET")
      return
    }

    if (!selectedOrderId) {
      setMessage("Выбери заказ")
      return
    }

    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": finalSecret,
        },
        body: JSON.stringify({
          orderId: selectedOrderId,
          status: selectedStatus,
          comment: selectedComment,
          accessCode: selectedAccessCode.trim().toUpperCase() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Ошибка сохранения")
        return
      }

      setMessage("Заказ обновлён")
      await loadOrders(finalSecret)
    } catch {
      setMessage("Ошибка сохранения")
    }
  }

  const visibleOrders = useMemo(() => {
    return orders.filter((o) =>
      tab === "active" ? o.status !== "delivered" : o.status === "delivered"
    )
  }, [orders, tab])

  const selectedOrder = orders.find((o) => o.id === selectedOrderId)

  useEffect(() => {
    if (selectedOrder) {
      setSelectedStatus(selectedOrder.status)
      setSelectedComment(selectedOrder.comment || "")
      setSelectedAccessCode(selectedOrder.access_code || "")
    }
  }, [selectedOrderId, selectedOrder])

  const cardStyle = {
    background: "#111214",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "28px",
    padding: "24px",
  } as const

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "15px 16px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#0d0e10",
    color: "#ffffff",
    fontSize: "16px",
    outline: "none",
  }

  const buttonStyle = {
    border: "none",
    borderRadius: "18px",
    padding: "16px 18px",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
  } as const

  return (
    <main
      style={{
        background: "#090909",
        minHeight: "100vh",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        padding: "32px 14px 60px",
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "12px",
              letterSpacing: "5px",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            TRACKING
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "44px",
              lineHeight: 1.1,
            }}
          >
            Админка
          </h1>
        </div>

        <div style={{ ...cardStyle, marginBottom: "24px" }}>
          <div
            style={{
              color: "rgba(255,255,255,0.72)",
              fontSize: "14px",
              marginBottom: "12px",
            }}
          >
            ADMIN_SECRET
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 220px",
              gap: "12px",
            }}
          >
            <input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              type="password"
              placeholder="Введи ADMIN_SECRET"
              style={inputStyle}
            />

            <button
              onClick={() => loadOrders(secret)}
              style={{
                ...buttonStyle,
                background: "#f4f4f4",
                color: "#000000",
              }}
            >
              Загрузить заказы
            </button>
          </div>
        </div>

        {message && (
          <div
            style={{
              ...cardStyle,
              marginBottom: "24px",
              color: "#ffffff",
            }}
          >
            {message}
          </div>
        )}

        <div style={{ ...cardStyle, marginBottom: "24px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: "34px" }}>
            Создать заказ
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <input
              value={newOrderNumber}
              onChange={(e) => setNewOrderNumber(e.target.value)}
              placeholder="Номер заказа"
              style={inputStyle}
            />

            <input
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="Имя клиента"
              style={inputStyle}
            />

            <input
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="Товар"
              style={inputStyle}
            />

            <input
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              placeholder="Размер"
              style={inputStyle}
            />

            <input
              value={newAccessCode}
              onChange={(e) => setNewAccessCode(e.target.value.toUpperCase())}
              placeholder="Код доступа (если пусто — создастся сам)"
              style={{ ...inputStyle, gridColumn: "1 / span 2", textTransform: "uppercase" }}
            />
          </div>

          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Комментарий к новому заказу"
            style={{
              ...inputStyle,
              minHeight: "120px",
              resize: "vertical",
              marginBottom: "12px",
            }}
          />

          <button
            onClick={createOrder}
            style={{
              ...buttonStyle,
              width: "100%",
              background: "#13e7a1",
              color: "#000000",
              fontSize: "20px",
              padding: "18px",
            }}
          >
            Создать заказ
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
          }}
        >
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "34px" }}>Заказы</h2>

              <button
                onClick={() => loadOrders(secret)}
                style={{
                  ...buttonStyle,
                  background: "rgba(255,255,255,0.06)",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Обновить
              </button>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
              <button
                onClick={() => setTab("active")}
                style={{
                  ...buttonStyle,
                  background: tab === "active" ? "#f4f4f4" : "rgba(255,255,255,0.06)",
                  color: tab === "active" ? "#000000" : "#ffffff",
                  border: tab === "active" ? "none" : "1px solid rgba(255,255,255,0.08)",
                  flex: 1,
                }}
              >
                Активные
              </button>

              <button
                onClick={() => setTab("delivered")}
                style={{
                  ...buttonStyle,
                  background: tab === "delivered" ? "#f4f4f4" : "rgba(255,255,255,0.06)",
                  color: tab === "delivered" ? "#000000" : "#ffffff",
                  border: tab === "delivered" ? "none" : "1px solid rgba(255,255,255,0.08)",
                  flex: 1,
                }}
              >
                Доставленные
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {visibleOrders.length === 0 ? (
                <div style={{ color: "rgba(255,255,255,0.6)" }}>Заказов нет.</div>
              ) : (
                visibleOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    style={{
                      textAlign: "left" as const,
                      width: "100%",
                      padding: "18px",
                      borderRadius: "20px",
                      cursor: "pointer",
                      background:
                        selectedOrderId === order.id
                          ? "rgba(19,231,161,0.12)"
                          : "#0d0e10",
                      border:
                        selectedOrderId === order.id
                          ? "1px solid rgba(19,231,161,0.25)"
                          : "1px solid rgba(255,255,255,0.06)",
                      color: "#ffffff",
                    }}
                  >
                    <div style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>
                      {order.order_number}
                    </div>
                    <div style={{ fontSize: "18px", marginBottom: "6px" }}>
                      {order.product_name}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: "6px" }}>
                      {getStatusLabel(order.status)}
                    </div>
                    <div style={{ color: "#5dffba", fontSize: "13px", fontWeight: 700 }}>
                      Код: {order.access_code || "—"}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: "34px" }}>
              Редактирование
            </h2>

            {!selectedOrder ? (
              <div style={{ color: "rgba(255,255,255,0.6)" }}>Выбери заказ слева.</div>
            ) : (
              <>
                <div
                  style={{
                    marginBottom: "18px",
                    color: "rgba(255,255,255,0.78)",
                    lineHeight: 1.6,
                  }}
                >
                  <div>Выбран заказ: {selectedOrder.order_number}</div>
                  <div>{selectedOrder.product_name}</div>
                </div>

                <div style={{ marginBottom: "12px", color: "rgba(255,255,255,0.72)" }}>
                  Код доступа
                </div>

                <input
                  value={selectedAccessCode}
                  onChange={(e) => setSelectedAccessCode(e.target.value.toUpperCase())}
                  placeholder="Код доступа"
                  style={{ ...inputStyle, marginBottom: "18px", textTransform: "uppercase" }}
                />

                <div style={{ marginBottom: "12px", color: "rgba(255,255,255,0.72)" }}>
                  Статус
                </div>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{ ...inputStyle, marginBottom: "18px" }}
                >
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>

                <div style={{ marginBottom: "12px", color: "rgba(255,255,255,0.72)" }}>
                  Комментарий
                </div>

                <textarea
                  value={selectedComment}
                  onChange={(e) => setSelectedComment(e.target.value)}
                  style={{
                    ...inputStyle,
                    minHeight: "180px",
                    resize: "vertical",
                    marginBottom: "12px",
                  }}
                />

                <button
                  onClick={updateOrder}
                  style={{
                    ...buttonStyle,
                    width: "100%",
                    background: "#f4f4f4",
                    color: "#000000",
                    fontSize: "20px",
                    padding: "18px",
                  }}
                >
                  Сохранить и добавить этап
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}