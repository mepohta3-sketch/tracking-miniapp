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

const steps = [
  { key: "created", label: "Оформлен" },
  { key: "bought_out", label: "Выкуплен" },
  { key: "to_china_warehouse", label: "Склад Китай" },
  { key: "to_novosibirsk", label: "В пути" },
  { key: "delivered", label: "Доставлен" },
]

const faqItems = [
  {
    question: "Сколько в среднем идёт доставка?",
    answer:
      "Обычно доставка занимает около 15 дней до нас в Новосибирск с момента поступления товара на наш склад в Китае.",
  },
  {
    question: "Что значит статус «Выкуплен»?",
    answer:
      "Это значит, что мы уже выкупили вашу вещь у поставщика и теперь она направляется на наш склад.",
  },
  {
    question: "Что значит статус «На складе в Китае»?",
    answer:
      "Это значит, что товар уже выкуплен и сейчас находится на нашем складе в Китае перед следующим этапом маршрута.",
  },
  {
    question: "Что значит статус «Едет в Новосибирск»?",
    answer:
      "Это значит, что товар уже отправился с нашего склада в Китае и находится в пути к нам в Новосибирск.",
  },
  {
    question: "Что значит статус «Доставлен»?",
    answer:
      "Это значит, что товар уже приехал к нам в Новосибирск. После этого менеджер свяжется с вами и отправит видеообзор вашей вещи.",
  },
]

function getStatusIndex(status: string) {
  const index = steps.findIndex((step) => step.key === status)
  return index === -1 ? 0 : index
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`
}

function getStatusStyles(status: string) {
  switch (status) {
    case "bought_out":
      return {
        bg: "rgba(255, 216, 104, 0.10)",
        border: "1px solid rgba(255, 216, 104, 0.20)",
        color: "#F7D977",
      }
    case "to_china_warehouse":
      return {
        bg: "rgba(112, 174, 255, 0.12)",
        border: "1px solid rgba(112, 174, 255, 0.20)",
        color: "#9DCCFF",
      }
    case "to_novosibirsk":
      return {
        bg: "rgba(84, 226, 176, 0.12)",
        border: "1px solid rgba(84, 226, 176, 0.20)",
        color: "#7AF0C7",
      }
    case "delivered":
      return {
        bg: "rgba(84, 226, 176, 0.15)",
        border: "1px solid rgba(84, 226, 176, 0.25)",
        color: "#86F5D0",
      }
    default:
      return {
        bg: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#FFFFFF",
      }
  }
}

function dedupeEvents(events: any[]) {
  const seen = new Set<string>()
  const result: any[] = []

  for (let i = events.length - 1; i >= 0; i--) {
    const item = events[i]
    const signature = `${item.status}__${item.comment || ""}`
    if (!seen.has(signature)) {
      seen.add(signature)
      result.unshift(item)
    }
  }

  return result
}

export default function Home() {
  const [orderNumber, setOrderNumber] = useState("")
  const [accessCode, setAccessCode] = useState("")
  const [order, setOrder] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [bindMessage, setBindMessage] = useState("")
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

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

      setOrder(data.order)
      setEvents(dedupeEvents(data.events || []))
    } catch {
      setError("Ошибка загрузки заказа")
    } finally {
      setLoading(false)
    }
  }

  async function bindNotifications() {
    if (!order) return

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
          accessCode: accessCode.trim().toUpperCase(),
          initData: tg.initData,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setBindMessage(data.error || "Не удалось подключить уведомления")
        return
      }

      setBindMessage("Уведомления подключены")
    } catch {
      setBindMessage("Не удалось подключить уведомления")
    }
  }

  const currentStatus = order?.status || "created"
  const currentStatusLabel = statusMap[currentStatus] || currentStatus
  const currentStatusIndex = getStatusIndex(currentStatus)
  const progressPercent =
    steps.length > 1 ? `${(currentStatusIndex / (steps.length - 1)) * 100}%` : "0%"
  const statusStyles = getStatusStyles(currentStatus)
  const lastEvent = events.length ? events[events.length - 1] : null

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #060606 0%, #0B0B0C 34%, #080809 100%)",
        fontFamily: "Inter, Arial, sans-serif",
        color: "#ffffff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* background layers */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 10% 0%, rgba(255,255,255,0.05) 0%, transparent 28%), radial-gradient(circle at 100% 10%, rgba(84,226,176,0.10) 0%, transparent 24%), radial-gradient(circle at 50% 100%, rgba(120,120,255,0.06) 0%, transparent 28%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 16%, transparent 84%, rgba(255,255,255,0.01) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "460px",
          margin: "0 auto",
          padding: "24px 12px 56px",
        }}
      >
        {/* HERO / SEARCH */}
        <section
          style={{
            position: "relative",
            marginBottom: "20px",
            borderRadius: "32px",
            overflow: "hidden",
            background:
              "linear-gradient(145deg, rgba(19,20,22,0.98) 0%, rgba(11,12,13,0.98) 55%, rgba(8,8,9,0.98) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 20px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-80px",
              right: "-40px",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(84,226,176,0.18) 0%, transparent 62%)",
              filter: "blur(10px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "-60px",
              bottom: "-80px",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 64%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ padding: "28px 24px 24px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#6EF0C2",
                  boxShadow: "0 0 14px rgba(110,240,194,0.6)",
                }}
              />
              <span
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.58)",
                }}
              >
                Kai Store Tracking
              </span>
            </div>

            <h1
              style={{
                margin: "0 0 12px 0",
                fontSize: "40px",
                lineHeight: 0.95,
                letterSpacing: "-0.06em",
                fontWeight: 800,
                maxWidth: "300px",
              }}
            >
              Заказ
              <br />
              под контролем
            </h1>

            <p
              style={{
                margin: "0 0 22px 0",
                fontSize: "15px",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.72)",
                maxWidth: "330px",
              }}
            >
              Статус, этапы, история и уведомления в одном аккуратном интерфейсе — без лишнего шума.
            </p>

            <div
              style={{
                display: "grid",
                gap: "10px",
                marginBottom: "14px",
              }}
            >
              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Номер заказа"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "16px 18px",
                  borderRadius: "18px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  color: "#ffffff",
                  fontSize: "16px",
                  outline: "none",
                  backdropFilter: "blur(8px)",
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
                  borderRadius: "18px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  color: "#ffffff",
                  fontSize: "16px",
                  outline: "none",
                  textTransform: "uppercase",
                  backdropFilter: "blur(8px)",
                }}
              />

              <button
                onClick={searchOrder}
                style={{
                  width: "100%",
                  padding: "17px",
                  borderRadius: "18px",
                  border: "none",
                  background: "#F4F4F4",
                  color: "#000000",
                  fontSize: "17px",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "-0.01em",
                  marginTop: "2px",
                }}
              >
                {loading ? "Загрузка..." : "Найти заказ"}
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginTop: "10px",
              }}
            >
              {["Прозрачный статус", "История этапов", "Уведомления"].map((item) => (
                <div
                  key={item}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.62)",
                    fontSize: "12px",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>

            {error && (
              <div
                style={{
                  marginTop: "14px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#ff6f6f",
                }}
              >
                {error}
              </div>
            )}
          </div>
        </section>

        {/* FOUND ORDER */}
        {order && (
          <>
            <section
              style={{
                marginBottom: "20px",
                borderRadius: "32px",
                overflow: "hidden",
                background:
                  "linear-gradient(145deg, rgba(20,21,23,0.98) 0%, rgba(10,11,12,0.98) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow:
                  "0 18px 60px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              {/* top status band */}
              <div
                style={{
                  padding: "22px 22px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "14px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.24em",
                        color: "rgba(255,255,255,0.42)",
                        marginBottom: "8px",
                      }}
                    >
                      Current order
                    </div>

                    <div
                      style={{
                        fontSize: "34px",
                        lineHeight: 1,
                        fontWeight: 800,
                        letterSpacing: "-0.05em",
                        marginBottom: "10px",
                      }}
                    >
                      {order.order_number}
                    </div>

                    <div
                      style={{
                        fontSize: "22px",
                        lineHeight: 1.25,
                        fontWeight: 700,
                        maxWidth: "250px",
                      }}
                    >
                      {order.product_name}
                    </div>
                  </div>

                  <div
                    style={{
                      minWidth: "92px",
                      height: "92px",
                      borderRadius: "24px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.4)",
                        textTransform: "uppercase",
                        letterSpacing: "0.18em",
                        marginBottom: "6px",
                      }}
                    >
                      Stage
                    </div>
                    <div
                      style={{
                        fontSize: "26px",
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      {currentStatusIndex + 1}
                    </div>
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      / {steps.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* main content */}
              <div style={{ padding: "20px 22px 22px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "999px",
                      background: statusStyles.bg,
                      border: statusStyles.border,
                      color: statusStyles.color,
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    {currentStatusLabel}
                  </div>

                  {lastEvent?.created_at && (
                    <div
                      style={{
                        color: "rgba(255,255,255,0.48)",
                        fontSize: "13px",
                      }}
                    >
                      {formatDateTime(lastEvent.created_at)}
                    </div>
                  )}
                </div>

                {/* redesigned progress panel */}
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "18px",
                    borderRadius: "24px",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                      }}
                    >
                      Маршрут заказа
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.48)",
                      }}
                    >
                      {Math.round((currentStatusIndex / (steps.length - 1)) * 100)}%
                    </div>
                  </div>

                  <div
                    style={{
                      position: "relative",
                      height: "8px",
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.06)",
                      overflow: "hidden",
                      marginBottom: "18px",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: progressPercent,
                        borderRadius: "999px",
                        background:
                          "linear-gradient(90deg, #8CF6D4 0%, #55E2B0 52%, #2EC995 100%)",
                        boxShadow: "0 0 24px rgba(84,226,176,0.35)",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: "10px",
                    }}
                  >
                    {steps.map((step, index) => {
                      const active = index === currentStatusIndex
                      const completed = index < currentStatusIndex

                      return (
                        <div
                          key={step.key}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "18px 1fr auto",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 0",
                          }}
                        >
                          <div
                            style={{
                              width: "14px",
                              height: "14px",
                              borderRadius: "50%",
                              background: active
                                ? "#55E2B0"
                                : completed
                                ? "rgba(84,226,176,0.55)"
                                : "rgba(255,255,255,0.14)",
                              boxShadow: active
                                ? "0 0 0 6px rgba(84,226,176,0.12)"
                                : "none",
                            }}
                          />
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: active ? 700 : 500,
                              color: active
                                ? "#ffffff"
                                : completed
                                ? "rgba(255,255,255,0.76)"
                                : "rgba(255,255,255,0.38)",
                            }}
                          >
                            {step.label}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              textTransform: "uppercase",
                              letterSpacing: "0.16em",
                              color: active
                                ? "rgba(84,226,176,0.92)"
                                : "rgba(255,255,255,0.28)",
                            }}
                          >
                            {active ? "Now" : completed ? "Done" : ""}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* meta cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "20px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.18em",
                        color: "rgba(255,255,255,0.42)",
                        marginBottom: "8px",
                      }}
                    >
                      Client
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        lineHeight: 1.5,
                        color: "#ffffff",
                      }}
                    >
                      {order.client_name || "—"}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "20px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.18em",
                        color: "rgba(255,255,255,0.42)",
                        marginBottom: "8px",
                      }}
                    >
                      Size
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        lineHeight: 1.5,
                        color: "#ffffff",
                      }}
                    >
                      {order.size || "—"}
                    </div>
                  </div>
                </div>

                <button
                  onClick={bindNotifications}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "18px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                >
                  Подключить уведомления
                </button>

                {bindMessage && (
                  <div
                    style={{
                      marginTop: "12px",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#76F2CB",
                    }}
                  >
                    {bindMessage}
                  </div>
                )}
              </div>
            </section>

            {/* HISTORY */}
            <section
              style={{
                marginBottom: "20px",
                borderRadius: "32px",
                overflow: "hidden",
                background:
                  "linear-gradient(145deg, rgba(19,20,22,0.98) 0%, rgba(10,11,12,0.98) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow:
                  "0 18px 60px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <div
                style={{
                  padding: "22px 22px 18px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 700,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    Журнал движения
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.42)",
                    }}
                  >
                    {events.length} этапов
                  </div>
                </div>
              </div>

              <div style={{ padding: "18px 22px 22px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {events.map((event: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "20px 1fr",
                        gap: "14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            background: "#55E2B0",
                            marginTop: "6px",
                            boxShadow: "0 0 0 5px rgba(84,226,176,0.12)",
                          }}
                        />
                        {index !== events.length - 1 && (
                          <div
                            style={{
                              width: "2px",
                              flex: 1,
                              minHeight: "44px",
                              background: "rgba(255,255,255,0.10)",
                              marginTop: "8px",
                            }}
                          />
                        )}
                      </div>

                      <div
                        style={{
                          padding: "16px",
                          borderRadius: "20px",
                          background:
                            "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "15px",
                            fontWeight: 700,
                            lineHeight: 1.45,
                            marginBottom: "6px",
                          }}
                        >
                          {event.comment || statusMap[event.status] || event.status}
                        </div>

                        <div
                          style={{
                            fontSize: "13px",
                            color: "rgba(255,255,255,0.46)",
                          }}
                        >
                          {formatDateTime(event.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* KNOWLEDGE */}
        <section
          style={{
            marginBottom: "20px",
            borderRadius: "32px",
            overflow: "hidden",
            background:
              "linear-gradient(145deg, rgba(19,20,22,0.98) 0%, rgba(10,11,12,0.98) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 18px 60px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div
            style={{
              padding: "22px 22px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.24em",
                color: "rgba(255,255,255,0.42)",
                marginBottom: "8px",
              }}
            >
              Knowledge
            </div>

            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                letterSpacing: "-0.04em",
              }}
            >
              Полезное
            </div>
          </div>

          <div style={{ padding: "18px 22px 22px" }}>
            {/* FAQ */}
            <div
              style={{
                padding: "14px",
                borderRadius: "24px",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  marginBottom: "10px",
                  padding: "6px 6px 2px",
                }}
              >
                FAQ
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                {faqItems.map((item, index) => {
                  const isOpen = openFaqIndex === index

                  return (
                    <div
                      key={index}
                      style={{
                        borderRadius: "18px",
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        overflow: "hidden",
                      }}
                    >
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          color: "#ffffff",
                          cursor: "pointer",
                          padding: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px",
                          textAlign: "left",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "15px",
                            fontWeight: 700,
                            lineHeight: 1.5,
                          }}
                        >
                          {item.question}
                        </span>

                        <span
                          style={{
                            fontSize: "18px",
                            color: "rgba(255,255,255,0.64)",
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s ease",
                            flexShrink: 0,
                          }}
                        >
                          ▾
                        </span>
                      </button>

                      {isOpen && (
                        <div
                          style={{
                            padding: "0 16px 16px 16px",
                            color: "rgba(255,255,255,0.72)",
                            fontSize: "15px",
                            lineHeight: 1.7,
                          }}
                        >
                          {item.answer}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Reviews */}
            <div
              style={{
                padding: "18px",
                borderRadius: "24px",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
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
                  lineHeight: 1.7,
                  marginBottom: "14px",
                }}
              >
                Реальные отзывы клиентов и подтверждение доверия. Можно открыть Telegram-канал и посмотреть больше отзывов.
              </div>

              <a
                href="https://t.me/KAI_STORE_OTZIVI"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  width: "100%",
                  boxSizing: "border-box",
                  textAlign: "center",
                  padding: "14px 16px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "16px",
                  textDecoration: "none",
                }}
              >
                Открыть канал с отзывами
              </a>
            </div>

            {/* Useful info */}
            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              {[
                {
                  label: "Access",
                  title: "Как работает отслеживание",
                  text:
                    "После оформления заказа ему присваивается номер и код доступа. По ним открывается карточка заказа с текущим статусом и историей обновлений.",
                },
                {
                  label: "Timing",
                  title: "Если статус не меняется",
                  text:
                    "Небольшие паузы между этапами логистики бывают нормой. Если обновлений долго нет, лучше сразу написать в службу заботы и уточнить детали.",
                },
                {
                  label: "Support",
                  title: "Как получить ответ быстрее",
                  text:
                    "Когда пишешь в поддержку, сразу укажи номер заказа и коротко опиши вопрос. Так менеджер быстрее найдёт заказ и даст точный ответ.",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: "18px",
                    borderRadius: "24px",
                    background:
                      index === 2
                        ? "linear-gradient(180deg, rgba(84,226,176,0.10) 0%, rgba(255,255,255,0.02) 100%)"
                        : "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                    border:
                      index === 2
                        ? "1px solid rgba(84,226,176,0.14)"
                        : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.2em",
                      color: "rgba(255,255,255,0.42)",
                      marginBottom: "8px",
                    }}
                  >
                    {item.label}
                  </div>

                  <div
                    style={{
                      fontSize: "17px",
                      fontWeight: 700,
                      lineHeight: 1.35,
                      marginBottom: "8px",
                    }}
                  >
                    {item.title}
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      lineHeight: 1.7,
                      color: "rgba(255,255,255,0.72)",
                    }}
                  >
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SUPPORT */}
        <section
          style={{
            borderRadius: "32px",
            overflow: "hidden",
            background:
              "linear-gradient(145deg, rgba(19,20,22,0.98) 0%, rgba(10,11,12,0.98) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 18px 60px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div
            style={{
              padding: "22px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.24em",
                  color: "rgba(255,255,255,0.42)",
                }}
              >
                Care
              </div>

              <div
                style={{
                  padding: "8px 14px",
                  borderRadius: "999px",
                  background: "rgba(84,226,176,0.12)",
                  border: "1px solid rgba(84,226,176,0.22)",
                  color: "#7AF0C7",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                Онлайн
              </div>
            </div>

            <div
              style={{
                fontSize: "30px",
                lineHeight: 1.05,
                letterSpacing: "-0.05em",
                fontWeight: 800,
                marginBottom: "12px",
              }}
            >
              Служба заботы
            </div>

            <div
              style={{
                fontSize: "15px",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.72)",
                marginBottom: "18px",
              }}
            >
              Если появились вопросы по заказу, срокам или этапам доставки, можно сразу написать в Telegram.
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
                padding: "18px",
                borderRadius: "18px",
                background: "#55E2B0",
                color: "#000000",
                fontWeight: 700,
                fontSize: "18px",
                textDecoration: "none",
              }}
            >
              Написать в службу заботы
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}