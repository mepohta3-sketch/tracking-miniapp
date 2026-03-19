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

const statusBadgeStyles: Record<string, { bg: string; border: string; color: string }> = {
  created: {
    bg: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#ffffff",
  },
  bought_out: {
    bg: "rgba(255,214,10,0.12)",
    border: "1px solid rgba(255,214,10,0.25)",
    color: "#ffe066",
  },
  to_china_warehouse: {
    bg: "rgba(0,122,255,0.12)",
    border: "1px solid rgba(0,122,255,0.25)",
    color: "#7cc4ff",
  },
  to_novosibirsk: {
    bg: "rgba(0,255,153,0.12)",
    border: "1px solid rgba(0,255,153,0.25)",
    color: "#5dffba",
  },
  delivered: {
    bg: "rgba(0,255,153,0.12)",
    border: "1px solid rgba(0,255,153,0.25)",
    color: "#5dffba",
  },
}

export default function Home() {
  const [orderNumber, setOrderNumber] = useState("")
  const [accessCode, setAccessCode] = useState("")
  const [order, setOrder] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [bindMessage, setBindMessage] = useState("")

  async function searchOrder() {
    const trimmedOrderNumber = orderNumber.trim()
    const trimmedAccessCode = accessCode.trim().toUpperCase()

    if (!trimmedOrderNumber || !trimmedAccessCode) {
      setError("Введи номер заказа и код доступа")
      setOrder(null)
      setEvents([])
      return
    }

    setLoading(true)
    setError("")
    setBindMessage("")
    setOrder(null)
    setEvents([])

    try {
      const res = await fetch(
        `/api/order/${encodeURIComponent(trimmedOrderNumber)}?code=${encodeURIComponent(trimmedAccessCode)}`,
        { cache: "no-store" }
      )

      const text = await res.text()
      let data: any = null

      try {
        data = text ? JSON.parse(text) : null
      } catch {
        setError("Ошибка загрузки заказа")
        setLoading(false)
        return
      }

      if (!res.ok || !data?.order) {
        setError("Неверный номер заказа или код доступа")
        setLoading(false)
        return
      }

      const uniqueEvents = (data.events || []).filter(
        (e: any, i: number, arr: any[]) =>
          i === arr.findIndex((x: any) => x.status === e.status)
      )

      setOrder(data.order)
      setEvents(uniqueEvents)
    } catch {
      setError("Ошибка загрузки заказа")
    } finally {
      setLoading(false)
    }
  }

  async function bindNotifications() {
    if (!order) {
      return
    }

    const tg = window.Telegram?.WebApp

    if (!tg?.initData) {
      setBindMessage("Открой Mini App через Telegram-бота")
      return
    }

    try {
      const res = await fetch("/api/bind-order", {
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

      const data = await res.json()

      if (!res.ok) {
        setBindMessage(data.error || "Не удалось подключить уведомления")
        return
      }

      setBindMessage("Уведомления подключены ✅")
    } catch {
      setBindMessage("Не удалось подключить уведомления")
    }
  }

  const currentStatus = order?.status || ""
  const badgeStyle =
    statusBadgeStyles[currentStatus] || {
      bg: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: "#ffffff",
    }

  return (
    <main
      style={{
        background: "#090909",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "40px 12px 60px",
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
      }}
    >
      <div style={{ width: "100%", maxWidth: "430px" }}>
        <div
          style={{
            background: "#111214",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "30px",
            padding: "28px",
            marginBottom: "24px",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.02) inset",
          }}
        >
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

          <div
            style={{
              color: "rgba(255,255,255,0.62)",
              fontSize: "12px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            BY KAI STORE
          </div>

          <h1
            style={{
              margin: "0 0 14px 0",
              fontSize: "34px",
              lineHeight: 1.15,
              color: "#ffffff",
              fontWeight: 700,
            }}
          >
            Отслеживание заказа
          </h1>

          <p
            style={{
              margin: "0 0 22px 0",
              color: "rgba(255,255,255,0.72)",
              fontSize: "15px",
              lineHeight: 1.65,
            }}
          >
            Введи номер заказа и код доступа, чтобы посмотреть текущий статус и историю доставки.
          </p>

          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Номер заказа, например KAI-2001"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "16px 18px",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#0d0e10",
              color: "#ffffff",
              fontSize: "16px",
              outline: "none",
              marginBottom: "12px",
            }}
          />

          <input
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            placeholder="Код доступа"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "16px 18px",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#0d0e10",
              color: "#ffffff",
              fontSize: "16px",
              outline: "none",
              marginBottom: "12px",
              textTransform: "uppercase",
            }}
          />

          <button
            onClick={searchOrder}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: "18px",
              border: "none",
              background: "#f4f4f4",
              color: "#000000",
              fontWeight: 700,
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            {loading ? "Загрузка..." : "Проверить заказ"}
          </button>

          {error && (
            <div
              style={{
                marginTop: "14px",
                color: "#ff6b6b",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}
        </div>

        {order && (
          <div
            style={{
              background: "#111214",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "30px",
              padding: "28px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "14px",
                marginBottom: "18px",
              }}
            >
              <div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: "12px",
                    letterSpacing: "4px",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  ЗАКАЗ
                </div>

                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "36px",
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  {order.order_number}
                </div>
              </div>

              <div
                style={{
                  whiteSpace: "nowrap",
                  borderRadius: "999px",
                  padding: "10px 14px",
                  background: badgeStyle.bg,
                  border: badgeStyle.border,
                  color: badgeStyle.color,
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                {statusMap[order.status] || order.status}
              </div>
            </div>

            <div
              style={{
                color: "#ffffff",
                fontSize: "24px",
                fontWeight: 700,
                marginBottom: "14px",
                lineHeight: 1.25,
              }}
            >
              {order.product_name}
            </div>

            <div
              style={{
                display: "grid",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              {order.client_name && (
                <div
                  style={{
                    color: "rgba(255,255,255,0.72)",
                    fontSize: "15px",
                  }}
                >
                  Клиент: {order.client_name}
                </div>
              )}

              {order.size && (
                <div
                  style={{
                    color: "rgba(255,255,255,0.72)",
                    fontSize: "15px",
                  }}
                >
                  Размер: {order.size}
                </div>
              )}
            </div>

            <button
              onClick={bindNotifications}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "18px",
                border: "none",
                background: "#13e7a1",
                color: "#000000",
                fontWeight: 700,
                fontSize: "17px",
                cursor: "pointer",
                marginBottom: "14px",
              }}
            >
              Подключить уведомления
            </button>

            {bindMessage && (
              <div
                style={{
                  color: "#5dffba",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "20px",
                }}
              >
                {bindMessage}
              </div>
            )}

            <div
              style={{
                color: "#ffffff",
                fontSize: "22px",
                fontWeight: 700,
                marginBottom: "18px",
              }}
            >
              История заказа
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {events.map((event: any, index: number) => {
                const date = new Date(event.created_at)

                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        minWidth: "16px",
                      }}
                    >
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: "#13e7a1",
                          marginTop: "4px",
                          boxShadow: "0 0 0 4px rgba(19,231,161,0.12)",
                        }}
                      />
                      {index !== events.length - 1 && (
                        <div
                          style={{
                            width: "2px",
                            flex: 1,
                            minHeight: "36px",
                            background: "rgba(255,255,255,0.12)",
                            marginTop: "8px",
                          }}
                        />
                      )}
                    </div>

                    <div>
                      <div
                        style={{
                          color: "#ffffff",
                          fontSize: "16px",
                          fontWeight: 700,
                          marginBottom: "6px",
                          lineHeight: 1.4,
                        }}
                      >
                        {event.comment || statusMap[event.status] || event.status}
                      </div>

                      <div
                        style={{
                          color: "rgba(255,255,255,0.5)",
                          fontSize: "13px",
                        }}
                      >
                        {date.toLocaleDateString()}{" "}
                        {date.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div
          style={{
            background: "#111214",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "30px",
            padding: "28px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div>
              <div
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: "12px",
                  letterSpacing: "4px",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                РАЗДЕЛ
              </div>

              <div
                style={{
                  color: "#ffffff",
                  fontSize: "28px",
                  fontWeight: 700,
                }}
              >
                Полезное
              </div>
            </div>

            <div
              style={{
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "999px",
                padding: "10px 14px",
                fontSize: "13px",
                color: "rgba(255,255,255,0.72)",
                whiteSpace: "nowrap",
              }}
            >
              FAQ / отзывы / инфо
            </div>
          </div>

          <div
            style={{
              background: "#0d0e10",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "20px",
              padding: "20px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              FAQ
            </div>

            <div
              style={{
                color: "rgba(255,255,255,0.72)",
                fontSize: "15px",
                lineHeight: 1.6,
              }}
            >
              Сроки, статусы, доставка, получение заказа.
            </div>
          </div>

          <div
            style={{
              background: "#0d0e10",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "20px",
              padding: "20px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              Отзывы
            </div>

            <div
              style={{
                color: "rgba(255,255,255,0.72)",
                fontSize: "15px",
                lineHeight: 1.6,
              }}
            >
              Отзывы клиентов и подтверждение доверия.
            </div>
          </div>

          <div
            style={{
              background: "#0d0e10",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "20px",
              padding: "20px",
            }}
          >
            <div
              style={{
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              Полезная инфа
            </div>

            <div
              style={{
                color: "rgba(255,255,255,0.72)",
                fontSize: "15px",
                lineHeight: 1.6,
              }}
            >
              Что значит каждый этап и как проходит заказ.
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#111214",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "30px",
            padding: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: "12px",
                letterSpacing: "4px",
                textTransform: "uppercase",
              }}
            >
              СВЯЗЬ
            </div>

            <div
              style={{
                padding: "8px 14px",
                borderRadius: "999px",
                background: "rgba(0,255,153,0.12)",
                border: "1px solid rgba(0,255,153,0.25)",
                color: "#5dffba",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              Онлайн
            </div>
          </div>

          <div
            style={{
              color: "#ffffff",
              fontSize: "28px",
              fontWeight: 700,
              marginBottom: "14px",
            }}
          >
            Служба заботы
          </div>

          <div
            style={{
              color: "rgba(255,255,255,0.72)",
              fontSize: "15px",
              lineHeight: 1.7,
              marginBottom: "22px",
            }}
          >
            Если появились вопросы по заказу, срокам или доставке, можно сразу
            написать в Telegram.
          </div>

          <a
            href="https://t.me/manager_KaiStore"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "block",
              width: "100%",
              boxSizing: "border-box",
              textAlign: "center",
              background: "#13e7a1",
              color: "#000000",
              padding: "18px",
              borderRadius: "18px",
              fontWeight: 700,
              fontSize: "18px",
              textDecoration: "none",
            }}
          >
            Написать в службу заботы
          </a>
        </div>
      </div>
    </main>
  )
}