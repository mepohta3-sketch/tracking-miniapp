"use client"

import { useState } from "react"

declare global {
  interface Window {
    Telegram?: any
  }
}

const statusMap: Record<string, string> = {
  created: "Заказ оформлен",
  bought_out: "Товар выкуплен",
  to_china_warehouse: "На складе в Китае",
  to_novosibirsk: "Едет в Новосибирск",
  delivered: "Доставлен",
}

export default function Home() {
  const [orderNumber, setOrderNumber] = useState("")
  const [accessCode, setAccessCode] = useState("")
  const [order, setOrder] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [error, setError] = useState("")

  async function searchOrder() {
    setError("")
    setOrder(null)
    setEvents([])

    const res = await fetch(`/api/order/${orderNumber}?code=${accessCode}`)
    const data = await res.json()

    if (!res.ok) {
      setError("Заказ не найден")
      return
    }

    setOrder(data.order)
    setEvents(data.events || [])
  }

  async function bindNotifications() {
    const tg = window.Telegram?.WebApp

    if (!tg?.initData) {
      alert("Открой через Telegram")
      return
    }

    await fetch("/api/bind-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderNumber: order.order_number,
        accessCode,
        initData: tg.initData,
      }),
    })

    alert("Уведомления подключены")
  }

  return (
    <main style={{ background: "#090909", minHeight: "100vh", padding: "20px", color: "#fff" }}>
      <div style={{ maxWidth: "420px", margin: "0 auto" }}>

        <h1>TRACKING BY KAI STORE</h1>

        <input
          placeholder="Номер заказа"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          style={{ width: "100%", padding: "12px", marginBottom: "10px" }}
        />

        <input
          placeholder="Код доступа"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          style={{ width: "100%", padding: "12px", marginBottom: "10px" }}
        />

        <button onClick={searchOrder} style={{ width: "100%", padding: "14px" }}>
          Найти заказ
        </button>

        {error && <div style={{ color: "red", marginTop: "10px" }}>{error}</div>}

        {order && (
          <div style={{ marginTop: "20px" }}>
            <h2>{order.order_number}</h2>
            <div>{order.product_name}</div>
            <div>{statusMap[order.status]}</div>

            <button onClick={bindNotifications} style={{ marginTop: "10px" }}>
              Подключить уведомления
            </button>

            <h3 style={{ marginTop: "20px" }}>История</h3>

            {events.map((e, i) => (
              <div key={i} style={{ marginBottom: "10px" }}>
                <b>{statusMap[e.status]}</b>
                <div>{e.comment}</div>
              </div>
            ))}
          </div>
        )}

        {/* ПОЛЕЗНОЕ */}
        <div style={{ marginTop: "30px" }}>

          <h2>Полезное</h2>

          <h3>FAQ</h3>

          <div>🚚 Доставка ~15 дней до Новосибирска</div>
          <div>Выкуплен — мы купили товар</div>
          <div>Склад Китай — товар на складе</div>
          <div>Едет — товар в пути</div>
          <div>Доставлен — товар у нас</div>

          <h3 style={{ marginTop: "20px" }}>Отзывы</h3>

          <a href="https://t.me/KAI_STORE_OTZIVI" target="_blank">
            Смотреть отзывы
          </a>

          <h3 style={{ marginTop: "20px" }}>Полезная инфа</h3>

          <div>Используй номер и код для отслеживания</div>
          <div>Задержки — это нормально</div>
          <div>Пиши в поддержку при вопросах</div>

        </div>

      </div>
    </main>
  )
}