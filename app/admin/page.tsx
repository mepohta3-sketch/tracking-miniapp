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
  { value: "created", label: "Оформлен" },
  { value: "bought_out", label: "Выкуплен" },
  { value: "to_china_warehouse", label: "На складе в Китае" },
  { value: "to_novosibirsk", label: "Едет в Новосибирск" },
  { value: "delivered", label: "Доставлен" },
]

const statusTabs = [{ value: "all", label: "Все" }, ...statusOptions]

function getStatusLabel(status: string) {
  return statusOptions.find((s) => s.value === status)?.label || status
}

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function normalize(value: string | null | undefined) {
  return String(value || "").toLowerCase().trim()
}

export default function AdminPage() {
  const [secret, setSecret] = useState("")
  const [orders, setOrders] = useState<Order[]>([])
  const [message, setMessage] = useState("")

  const [searchQuery, setSearchQuery] = useState("")
  const [activeStatus, setActiveStatus] = useState("all")

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

  useEffect(() => {
    const savedSecret = window.localStorage.getItem("kai_admin_secret")
    if (savedSecret) {
      setSecret(savedSecret)
    }
  }, [])

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

      window.localStorage.setItem("kai_admin_secret", finalSecret)

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

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: orders.length,
    }

    statusOptions.forEach((status) => {
      counts[status.value] = orders.filter((order) => order.status === status.value).length
    })

    return counts
  }, [orders])

  const visibleOrders = useMemo(() => {
    const query = normalize(searchQuery)

    return orders.filter((order) => {
      const matchesSearch = !query || normalize(order.order_number).includes(query)
      const matchesStatus = activeStatus === "all" || order.status === activeStatus

      return matchesSearch && matchesStatus
    })
  }, [orders, searchQuery, activeStatus])

  const selectedOrder = orders.find((order) => order.id === selectedOrderId)

  useEffect(() => {
    if (selectedOrder) {
      setSelectedStatus(selectedOrder.status)
      setSelectedComment(selectedOrder.comment || "")
      setSelectedAccessCode(selectedOrder.access_code || "")
    }
  }, [selectedOrder])

  return (
    <main className="adminMain">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .adminMain {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(19, 231, 161, 0.12), transparent 32%),
            radial-gradient(circle at top right, rgba(255, 255, 255, 0.06), transparent 28%),
            #090909;
          color: #ffffff;
          font-family: Arial, sans-serif;
          padding: 32px 14px 60px;
        }

        .shell {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
        }

        .top {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .eyebrow {
          color: rgba(255,255,255,0.45);
          font-size: 12px;
          letter-spacing: 5px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .title {
          margin: 0;
          font-size: 44px;
          line-height: 1.1;
        }

        .subtitle {
          margin-top: 10px;
          color: rgba(255,255,255,0.58);
          font-size: 15px;
          line-height: 1.5;
        }

        .card {
          background: rgba(17, 18, 20, 0.92);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px;
          padding: 24px;
          backdrop-filter: blur(14px);
        }

        .card + .card {
          margin-top: 24px;
        }

        .secretGrid {
          display: grid;
          grid-template-columns: 1fr 220px;
          gap: 12px;
        }

        .input,
        .textarea,
        .select {
          width: 100%;
          padding: 15px 16px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.08);
          background: #0d0e10;
          color: #ffffff;
          font-size: 16px;
          outline: none;
        }

        .input:focus,
        .textarea:focus,
        .select:focus {
          border-color: rgba(19,231,161,0.42);
          box-shadow: 0 0 0 4px rgba(19,231,161,0.08);
        }

        .textarea {
          min-height: 120px;
          resize: vertical;
        }

        .label {
          color: rgba(255,255,255,0.72);
          font-size: 14px;
          margin-bottom: 12px;
        }

        .button {
          border: none;
          border-radius: 18px;
          padding: 16px 18px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.18s ease;
        }

        .button:active {
          transform: scale(0.98);
        }

        .primaryButton {
          background: #f4f4f4;
          color: #000000;
        }

        .greenButton {
          width: 100%;
          background: #13e7a1;
          color: #000000;
          font-size: 20px;
          padding: 18px;
        }

        .ghostButton {
          background: rgba(255,255,255,0.06);
          color: #ffffff;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .message {
          margin-bottom: 24px;
          color: #ffffff;
        }

        .formGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }

        .full {
          grid-column: 1 / span 2;
        }

        .sectionTitle {
          margin-top: 0;
          margin-bottom: 20px;
          font-size: 34px;
        }

        .ordersLayout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-top: 24px;
        }

        .ordersHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .searchBox {
          margin-bottom: 14px;
        }

        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 18px;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .statusTab {
          min-width: max-content;
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 12px 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.06);
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .statusTabActive {
          background: #f4f4f4;
          color: #000000;
          border-color: #f4f4f4;
        }

        .count {
          min-width: 24px;
          height: 24px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.08);
          font-size: 12px;
        }

        .statusTabActive .count {
          background: rgba(0,0,0,0.1);
        }

        .ordersList {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .orderCard {
          text-align: left;
          width: 100%;
          padding: 18px;
          border-radius: 22px;
          cursor: pointer;
          color: #ffffff;
          transition: 0.18s ease;
        }

        .orderCardDefault {
          background: #0d0e10;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .orderCardSelected {
          background: rgba(19,231,161,0.12);
          border: 1px solid rgba(19,231,161,0.25);
        }

        .orderNumber {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .product {
          font-size: 18px;
          margin-bottom: 8px;
          line-height: 1.35;
        }

        .metaRow {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .pill {
          border-radius: 999px;
          padding: 7px 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.72);
          font-size: 13px;
          font-weight: 700;
        }

        .codePill {
          color: #5dffba;
        }

        .empty {
          color: rgba(255,255,255,0.6);
          line-height: 1.5;
        }

        .selectedInfo {
          margin-bottom: 18px;
          color: rgba(255,255,255,0.78);
          line-height: 1.6;
        }

        @media (max-width: 860px) {
          .adminMain {
            padding: 22px 10px 42px;
          }

          .top {
            flex-direction: column;
          }

          .title {
            font-size: 36px;
          }

          .card {
            border-radius: 22px;
            padding: 18px;
          }

          .secretGrid,
          .formGrid,
          .ordersLayout {
            grid-template-columns: 1fr;
          }

          .full {
            grid-column: auto;
          }

          .sectionTitle {
            font-size: 28px;
          }

          .ordersHeader {
            align-items: stretch;
            flex-direction: column;
          }

          .button {
            width: 100%;
          }

          .orderNumber {
            font-size: 24px;
          }

          .product {
            font-size: 16px;
          }
        }
      `}</style>

      <div className="shell">
        <div className="top">
          <div>
            <div className="eyebrow">TRACKING</div>
            <h1 className="title">Админка KAI STORE</h1>
            <div className="subtitle">
              Создание заказов, поиск по номеру и быстрый переход по статусам.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="label">ADMIN_SECRET</div>

          <div className="secretGrid">
            <input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              type="password"
              placeholder="Введи ADMIN_SECRET"
              className="input"
            />

            <button onClick={() => loadOrders(secret)} className="button primaryButton">
              Загрузить заказы
            </button>
          </div>
        </div>

        {message && <div className="card message">{message}</div>}

        <div className="card">
          <h2 className="sectionTitle">Создать заказ</h2>

          <div className="formGrid">
            <input
              value={newOrderNumber}
              onChange={(e) => setNewOrderNumber(e.target.value)}
              placeholder="Номер заказа"
              className="input"
            />

            <input
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="Имя клиента"
              className="input"
            />

            <input
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="Товар"
              className="input"
            />

            <input
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              placeholder="Размер"
              className="input"
            />

            <input
              value={newAccessCode}
              onChange={(e) => setNewAccessCode(e.target.value.toUpperCase())}
              placeholder="Код доступа, если пусто — создастся сам"
              className="input full"
              style={{ textTransform: "uppercase" }}
            />
          </div>

          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Комментарий к новому заказу"
            className="textarea"
            style={{ marginBottom: "12px" }}
          />

          <button onClick={createOrder} className="button greenButton">
            Создать заказ
          </button>
        </div>

        <div className="ordersLayout">
          <div className="card">
            <div className="ordersHeader">
              <h2 className="sectionTitle" style={{ marginBottom: 0 }}>
                Заказы
              </h2>

              <button onClick={() => loadOrders(secret)} className="button ghostButton">
                Обновить
              </button>
            </div>

            <div className="searchBox">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по номеру заказа"
                className="input"
              />
            </div>

            <div className="tabs">
              {statusTabs.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setActiveStatus(status.value)}
                  className={
                    activeStatus === status.value
                      ? "statusTab statusTabActive"
                      : "statusTab"
                  }
                >
                  <span>{status.label}</span>
                  <span className="count">{statusCounts[status.value] || 0}</span>
                </button>
              ))}
            </div>

            <div className="ordersList">
              {visibleOrders.length === 0 ? (
                <div className="empty">
                  Заказов нет. Проверь номер заказа или выбери другой статус.
                </div>
              ) : (
                visibleOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={
                      selectedOrderId === order.id
                        ? "orderCard orderCardSelected"
                        : "orderCard orderCardDefault"
                    }
                  >
                    <div className="orderNumber">#{order.order_number}</div>

                    <div className="product">{order.product_name}</div>

                    <div className="metaRow">
                      <span className="pill">{getStatusLabel(order.status)}</span>

                      {order.size && <span className="pill">Размер: {order.size}</span>}

                      <span className="pill codePill">
                        Код: {order.access_code || "—"}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="sectionTitle">Редактирование</h2>

            {!selectedOrder ? (
              <div className="empty">Выбери заказ слева.</div>
            ) : (
              <>
                <div className="selectedInfo">
                  <div>
                    Выбран заказ: <b>#{selectedOrder.order_number}</b>
                  </div>
                  <div>{selectedOrder.product_name}</div>
                  {selectedOrder.size && <div>Размер: {selectedOrder.size}</div>}
                </div>

                <div className="label">Код доступа</div>

                <input
                  value={selectedAccessCode}
                  onChange={(e) => setSelectedAccessCode(e.target.value.toUpperCase())}
                  placeholder="Код доступа"
                  className="input"
                  style={{
                    marginBottom: "18px",
                    textTransform: "uppercase",
                  }}
                />

                <div className="label">Статус</div>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="select"
                  style={{ marginBottom: "18px" }}
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>

                <div className="label">Комментарий</div>

                <textarea
                  value={selectedComment}
                  onChange={(e) => setSelectedComment(e.target.value)}
                  className="textarea"
                  style={{
                    minHeight: "180px",
                    marginBottom: "12px",
                  }}
                />

                <button onClick={updateOrder} className="button primaryButton">
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