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

const statusOrder = [
  "created",
  "bought_out",
  "to_china_warehouse",
  "to_novosibirsk",
  "delivered",
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
  const index = statusOrder.indexOf(status)
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
        bg: "rgba(255, 214, 10, 0.12)",
        border: "1px solid rgba(255, 214, 10, 0.24)",
        color: "#FFE37A",
      }
    case "to_china_warehouse":
      return {
        bg: "rgba(89, 163, 255, 0.12)",
        border: "1px solid rgba(89, 163, 255, 0.24)",
        color: "#8CC4FF",
      }
    case "to_novosibirsk":
      return {
        bg: "rgba(19, 231, 161, 0.12)",
        border: "1px solid rgba(19, 231, 161, 0.24)",
        color: "#6BF4C5",
      }
    case "delivered":
      return {
        bg: "rgba(19, 231, 161, 0.14)",
        border: "1px solid rgba(19, 231, 161, 0.3)",
        color: "#7FF7D0",
      }
    default:
      return {
        bg: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#FFFFFF",
      }
  }
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
      setEvents(data.events || [])
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
  const statusStyles = getStatusStyles(currentStatus)
  const progressPercent =
    statusOrder.length > 1
      ? `${(currentStatusIndex / (statusOrder.length - 1)) * 100}%`
      : "0%"

  return (
    <main
      style={{
        background:
          "radial-gradient(circle at top center, rgba(19,231,161,0.08) 0%, rgba(9,9,9,1) 26%), #090909",
        minHeight: "100vh",
        padding: "28px 12px 56px",
        fontFamily: "Inter, Arial, sans-serif",
        color: "#ffffff",
      }}
    >
      <div style={{ maxWidth: "430px", margin: "0 auto" }}>
        {/* HERO */}
        <div
          style={{
            position: "relative",
            background:
              "linear-gradient(180deg, rgba(20,21,24,0.98) 0%, rgba(12,13,15,0.98) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "32px",
            padding: "26px",
            marginBottom: "20px",
            overflow: "hidden",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.02) inset, 0 24px 80px rgba(0,0,0,0.38)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-80px",
              right: "-40px",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: "rgba(19,231,161,0.08)",
              filter: "blur(40px)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.34em",
                color: "rgba(255,255,255,0.42)",
                marginBottom: "10px",
              }}
            >
              Tracking
            </div>

            <div
              style={{
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "rgba(255,255,255,0.56)",
                marginBottom: "16px",
              }}
            >
              Kai Store
            </div>

            <h1
              style={{
                margin: "0 0 12px 0",
                fontSize: "38px",
                lineHeight: 0.96,
                letterSpacing: "-0.05em",
                fontWeight: 800,
              }}
            >
              Order
              <br />
              Tracking
            </h1>

            <p
              style={{
                margin: "0 0 20px 0",
                color: "rgba(255,255,255,0.72)",
                fontSize: "15px",
                lineHeight: 1.7,
                maxWidth: "320px",
              }}
            >
              Премиальный трекинг заказа с прозрачной историей, статусом и быстрым доступом к поддержке.
            </p>

            <div
              style={{
                display: "grid",
                gap: "10px",
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
                }}
              />

              <button
                onClick={searchOrder}
                style={{
                  width: "100%",
                  padding: "17px",
                  borderRadius: "18px",
                  border: "none",
                  background: "#F2F2F2",
                  color: "#000000",
                  fontSize: "17px",
                  fontWeight: 700,
                  cursor: "pointer",
                  marginTop: "2px",
                }}
              >
                {loading ? "Загрузка..." : "Найти заказ"}
              </button>
            </div>

            {error && (
              <div
                style={{
                  marginTop: "14px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#ff7272",
                }}
              >
                {error}
              </div>
            )}
          </div>
        </div>

        {/* ORDER CORE */}
        {order && (
          <>
            <div
              style={{
                background:
                  "linear-gradient(180deg, rgba(18,19,22,1) 0%, rgba(12,13,15,1) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "28px",
                padding: "22px",
                marginBottom: "20px",
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.02) inset, 0 20px 60px rgba(0,0,0,0.32)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "14px",
                  marginBottom: "18px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.26em",
                      color: "rgba(255,255,255,0.4)",
                      marginBottom: "8px",
                    }}
                  >
                    Order ID
                  </div>

                  <div
                    style={{
                      fontSize: "34px",
                      fontWeight: 800,
                      letterSpacing: "-0.05em",
                      lineHeight: 1,
                    }}
                  >
                    {order.order_number}
                  </div>
                </div>

                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "999px",
                    background: statusStyles.bg,
                    border: statusStyles.border,
                    color: statusStyles.color,
                    fontSize: "13px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentStatusLabel}
                </div>
              </div>

              <div
                style={{
                  fontSize: "22px",
                  lineHeight: 1.25,
                  fontWeight: 700,
                  marginBottom: "16px",
                }}
              >
                {order.product_name}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "18px",
                    padding: "14px",
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
                      color: "#ffffff",
                      fontSize: "15px",
                      lineHeight: 1.5,
                    }}
                  >
                    {order.client_name || "—"}
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "18px",
                    padding: "14px",
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
                      color: "#ffffff",
                      fontSize: "15px",
                      lineHeight: 1.5,
                    }}
                  >
                    {order.size || "—"}
                  </div>
                </div>
              </div>

              {/* NEW PROGRESS RAIL */}
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "22px",
                  padding: "16px",
                  marginBottom: "18px",
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
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#ffffff",
                    }}
                  >
                    Статус заказа
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.54)",
                    }}
                  >
                    Этап {currentStatusIndex + 1} из {statusOrder.length}
                  </div>
                </div>

                <div
                  style={{
                    position: "relative",
                    height: "6px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.06)",
                    overflow: "hidden",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: progressPercent,
                      borderRadius: "999px",
                      background:
                        "linear-gradient(90deg, rgba(19,231,161,0.85) 0%, rgba(19,231,161,1) 100%)",
                      boxShadow: "0 0 24px rgba(19,231,161,0.35)",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "8px",
                  }}
                >
                  {statusOrder.map((key, index) => {
                    const done = index <= currentStatusIndex
                    const current = index === currentStatusIndex

                    return (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: current ? "12px" : "10px",
                            height: current ? "12px" : "10px",
                            borderRadius: "50%",
                            background: done ? "#13E7A1" : "rgba(255,255,255,0.16)",
                            boxShadow: current
                              ? "0 0 0 5px rgba(19,231,161,0.12)"
                              : "none",
                          }}
                        />
                        <div
                          style={{
                            textAlign: "center",
                            fontSize: "10px",
                            lineHeight: 1.35,
                            color: done ? "#ffffff" : "rgba(255,255,255,0.38)",
                          }}
                        >
                          {statusMap[key]}
                        </div>
                      </div>
                    )
                  })}
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
                    color: "#6EF0C2",
                  }}
                >
                  {bindMessage}
                </div>
              )}
            </div>

            {/* HISTORY */}
            <div
              style={{
                background:
                  "linear-gradient(180deg, rgba(18,19,22,1) 0%, rgba(12,13,15,1) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "28px",
                padding: "22px",
                marginBottom: "20px",
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.02) inset, 0 20px 60px rgba(0,0,0,0.32)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                  }}
                >
                  История заказа
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {events.length} этапов
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {events.map((event: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "18px 1fr",
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
                          background: "#13E7A1",
                          marginTop: "4px",
                          boxShadow: "0 0 0 4px rgba(19,231,161,0.12)",
                        }}
                      />
                      {index !== events.length - 1 && (
                        <div
                          style={{
                            width: "2px",
                            flex: 1,
                            minHeight: "42px",
                            background: "rgba(255,255,255,0.1)",
                            marginTop: "8px",
                          }}
                        />
                      )}
                    </div>

                    <div
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "18px",
                        padding: "14px",
                      }}
                    >
                      <div
                        style={{
                          color: "#ffffff",
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
                          color: "rgba(255,255,255,0.48)",
                          fontSize: "13px",
                        }}
                      >
                        {formatDateTime(event.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* KNOWLEDGE */}
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(18,19,22,1) 0%, rgba(12,13,15,1) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "28px",
            padding: "22px",
            marginBottom: "20px",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.02) inset, 0 20px 60px rgba(0,0,0,0.32)",
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
                  letterSpacing: "-0.03em",
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
              FAQ / отзывы / info
            </div>
          </div>

          {/* FAQ ACCORDION */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "22px",
              padding: "14px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 700,
                marginBottom: "10px",
                padding: "4px 6px 2px",
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
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "16px",
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
                          color: "rgba(255,255,255,0.72)",
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

          {/* REVIEWS */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "22px",
              padding: "16px",
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
                lineHeight: 1.65,
                marginBottom: "14px",
              }}
            >
              Реальные отзывы клиентов и подтверждение доверия. Открой Telegram-канал и посмотри больше отзывов.
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
                background: "rgba(255,255,255,0.05)",
                color: "#ffffff",
                padding: "14px 16px",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.08)",
                fontWeight: 700,
                fontSize: "16px",
                textDecoration: "none",
              }}
            >
              Открыть канал с отзывами
            </a>
          </div>

          {/* USEFUL INFO - REALLY NEW DESIGN */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "22px",
              padding: "16px",
            }}
          >
            <div
              style={{
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 700,
                marginBottom: "12px",
              }}
            >
              Полезная инфа
            </div>

            <div style={{ display: "grid", gap: "10px" }}>
              <div
                style={{
                  padding: "18px",
                  borderRadius: "18px",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    color: "rgba(255,255,255,0.42)",
                    marginBottom: "8px",
                  }}
                >
                  Access
                </div>
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "16px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    lineHeight: 1.35,
                  }}
                >
                  Номер заказа и код доступа
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "14px",
                    lineHeight: 1.7,
                  }}
                >
                  Каждый заказ открывается по номеру и коду доступа. Это помогает быстро получить нужную информацию и сохраняет контроль над деталями заказа.
                </div>
              </div>

              <div
                style={{
                  padding: "18px",
                  borderRadius: "18px",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    color: "rgba(255,255,255,0.42)",
                    marginBottom: "8px",
                  }}
                >
                  Timing
                </div>
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "16px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    lineHeight: 1.35,
                  }}
                >
                  Если обновлений долго нет
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "14px",
                    lineHeight: 1.7,
                  }}
                >
                  Небольшие паузы между этапами логистики бывают нормой. Если статус долго не меняется, лучше сразу написать в службу заботы и уточнить детали.
                </div>
              </div>

              <div
                style={{
                  padding: "18px",
                  borderRadius: "18px",
                  background:
                    "linear-gradient(180deg, rgba(19,231,161,0.07) 0%, rgba(255,255,255,0.02) 100%)",
                  border: "1px solid rgba(19,231,161,0.12)",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    color: "rgba(255,255,255,0.42)",
                    marginBottom: "8px",
                  }}
                >
                  Support
                </div>
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "16px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    lineHeight: 1.35,
                  }}
                >
                  Как получить ответ быстрее
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "14px",
                    lineHeight: 1.7,
                  }}
                >
                  Когда пишешь в поддержку, сразу укажи номер заказа и коротко опиши вопрос. Так менеджер быстрее найдёт заказ и даст точный ответ.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARE */}
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(18,19,22,1) 0%, rgba(12,13,15,1) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "28px",
            padding: "22px",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.02) inset, 0 20px 60px rgba(0,0,0,0.32)",
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
                background: "rgba(19,231,161,0.12)",
                border: "1px solid rgba(19,231,161,0.25)",
                color: "#6EF0C2",
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
              letterSpacing: "-0.03em",
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
              marginBottom: "20px",
            }}
          >
            Если появились вопросы по срокам, доставке или этапам заказа, можно сразу написать в Telegram.
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
              background: "#13E7A1",
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