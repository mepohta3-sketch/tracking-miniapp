"use client"

import { useMemo, useState } from "react"

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
    bg: "rgba(19,231,161,0.12)",
    border: "1px solid rgba(19,231,161,0.25)",
    color: "#5dffba",
  },
  delivered: {
    bg: "rgba(19,231,161,0.14)",
    border: "1px solid rgba(19,231,161,0.28)",
    color: "#5dffba",
  },
}

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

const trackingSteps = [
  { key: "created", label: "Оформлен" },
  { key: "bought_out", label: "Выкуплен" },
  { key: "to_china_warehouse", label: "Склад Китай" },
  { key: "to_novosibirsk", label: "В пути" },
  { key: "delivered", label: "Доставлен" },
]

function getProgressIndex(status: string) {
  const idx = trackingSteps.findIndex((step) => step.key === status)
  return idx === -1 ? 0 : idx
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`
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

  const currentStatus = order?.status || ""
  const badgeStyle =
    statusBadgeStyles[currentStatus] || {
      bg: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: "#ffffff",
    }

  const progressIndex = getProgressIndex(currentStatus)
  const progressWidth =
    trackingSteps.length > 1 ? `${(progressIndex / (trackingSteps.length - 1)) * 100}%` : "0%"

  const lastEvent = useMemo(() => {
    if (!events.length) return null
    return events[events.length - 1]
  }, [events])

  const cardStyle: React.CSSProperties = {
    background: "linear-gradient(180deg, rgba(17,18,20,1) 0%, rgba(13,14,16,1) 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "28px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow:
      "0 0 0 1px rgba(255,255,255,0.02) inset, 0 24px 60px rgba(0,0,0,0.32)",
    backdropFilter: "blur(12px)",
  }

  const innerCardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "16px",
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "16px 18px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#0c0d0f",
    color: "#ffffff",
    fontSize: "16px",
    outline: "none",
  }

  const primaryButtonStyle: React.CSSProperties = {
    width: "100%",
    padding: "17px",
    borderRadius: "18px",
    border: "none",
    background: "#f3f3f3",
    color: "#000000",
    fontWeight: 700,
    fontSize: "17px",
    cursor: "pointer",
    letterSpacing: "0.01em",
  }

  const secondaryButtonStyle: React.CSSProperties = {
    width: "100%",
    padding: "16px",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "16px",
    cursor: "pointer",
  }

  return (
    <main
      style={{
        background:
          "radial-gradient(circle at top, rgba(19,231,161,0.08) 0%, rgba(9,9,9,1) 28%), #090909",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "32px 12px 56px",
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
      }}
    >
      <div style={{ width: "100%", maxWidth: "430px" }}>
        <div style={cardStyle}>
          <div
            style={{
              color: "rgba(255,255,255,0.42)",
              fontSize: "11px",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            Tracking
          </div>

          <div
            style={{
              color: "rgba(255,255,255,0.58)",
              fontSize: "12px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            by Kai Store
          </div>

          <h1
            style={{
              margin: "0 0 12px 0",
              fontSize: "34px",
              lineHeight: 1.06,
              fontWeight: 800,
              letterSpacing: "-0.03em",
            }}
          >
            Контроль заказа
          </h1>

          <p
            style={{
              margin: "0 0 20px 0",
              color: "rgba(255,255,255,0.72)",
              fontSize: "15px",
              lineHeight: 1.65,
            }}
          >
            Введи номер заказа и код доступа, чтобы сразу увидеть текущий этап и историю обновлений.
          </p>

          <div style={{ display: "grid", gap: "10px" }}>
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Номер заказа"
              style={inputStyle}
            />

            <input
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="Код доступа"
              style={{ ...inputStyle, textTransform: "uppercase" }}
            />

            <button onClick={searchOrder} style={primaryButtonStyle}>
              {loading ? "Загрузка..." : "Найти заказ"}
            </button>
          </div>

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
          <>
            <div style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "18px",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.42)",
                      fontSize: "11px",
                      letterSpacing: "0.24em",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                    }}
                  >
                    Заказ
                  </div>

                  <div
                    style={{
                      fontSize: "34px",
                      fontWeight: 800,
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
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
                  fontSize: "22px",
                  fontWeight: 700,
                  lineHeight: 1.25,
                  marginBottom: "16px",
                }}
              >
                {order.product_name}
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "8px",
                  marginBottom: "18px",
                  color: "rgba(255,255,255,0.72)",
                  fontSize: "15px",
                }}
              >
                {order.client_name && <div>Клиент: {order.client_name}</div>}
                {order.size && <div>Размер: {order.size}</div>}
                {lastEvent?.created_at && (
                  <div>Последнее обновление: {formatDateTime(lastEvent.created_at)}</div>
                )}
              </div>

              <div style={{ marginBottom: "18px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "rgba(255,255,255,0.58)",
                    fontSize: "12px",
                    marginBottom: "10px",
                  }}
                >
                  <span>Прогресс</span>
                  <span>{progressIndex + 1} / {trackingSteps.length}</span>
                </div>

                <div
                  style={{
                    position: "relative",
                    height: "8px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.06)",
                    overflow: "hidden",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: progressWidth,
                      background:
                        "linear-gradient(90deg, rgba(19,231,161,0.8) 0%, rgba(19,231,161,1) 100%)",
                      borderRadius: "999px",
                      boxShadow: "0 0 20px rgba(19,231,161,0.35)",
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
                  {trackingSteps.map((step, index) => {
                    const active = index <= progressIndex
                    const current = index === progressIndex

                    return (
                      <div
                        key={step.key}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            background: active ? "#13e7a1" : "rgba(255,255,255,0.16)",
                            boxShadow: current ? "0 0 0 5px rgba(19,231,161,0.12)" : "none",
                          }}
                        />
                        <div
                          style={{
                            textAlign: "center",
                            fontSize: "11px",
                            lineHeight: 1.35,
                            color: active ? "#ffffff" : "rgba(255,255,255,0.42)",
                          }}
                        >
                          {step.label}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <button onClick={bindNotifications} style={secondaryButtonStyle}>
                Подключить уведомления
              </button>

              {bindMessage && (
                <div
                  style={{
                    marginTop: "12px",
                    color: "#5dffba",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {bindMessage}
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  marginBottom: "16px",
                  letterSpacing: "-0.02em",
                }}
              >
                История заказа
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {events.map((event: any, index: number) => (
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
                        {formatDateTime(event.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div style={cardStyle}>
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
                  color: "rgba(255,255,255,0.42)",
                  fontSize: "11px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Раздел
              </div>

              <div
                style={{
                  color: "#ffffff",
                  fontSize: "28px",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
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

          <div style={{ ...innerCardStyle, marginBottom: "12px", padding: "14px" }}>
            <div
              style={{
                color: "#ffffff",
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
                      background: "rgba(255,255,255,0.03)",
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

          <div style={{ ...innerCardStyle, marginBottom: "12px" }}>
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
                marginBottom: "16px",
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
                background: "rgba(255,255,255,0.06)",
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

          <div style={innerCardStyle}>
            <div
              style={{
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 700,
                marginBottom: "14px",
              }}
            >
              Полезная инфа
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "16px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "8px",
                  }}
                >
                  Как работает отслеживание
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.72)",
                    fontSize: "14px",
                    lineHeight: 1.7,
                  }}
                >
                  После оформления заказа ему присваивается номер и код доступа. По ним можно открыть карточку заказа и посмотреть текущий статус и историю обновлений.
                </div>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "16px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "8px",
                  }}
                >
                  Если статус не меняется
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.72)",
                    fontSize: "14px",
                    lineHeight: 1.7,
                  }}
                >
                  Небольшие паузы между этапами логистики бывают нормой. Если прошло много времени без обновлений, лучше сразу написать в службу заботы.
                </div>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "16px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "15px",
                    fontWeight: 700,
                    marginBottom: "8px",
                  }}
                >
                  Как получить ответ быстрее
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.72)",
                    fontSize: "14px",
                    lineHeight: 1.7,
                  }}
                >
                  Когда пишешь в поддержку, сразу укажи номер заказа и коротко опиши вопрос. Так менеджер быстрее сориентируется и даст точный ответ.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
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
                color: "rgba(255,255,255,0.42)",
                fontSize: "11px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
              }}
            >
              Связь
            </div>

            <div
              style={{
                padding: "8px 14px",
                borderRadius: "999px",
                background: "rgba(19,231,161,0.12)",
                border: "1px solid rgba(19,231,161,0.25)",
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
              letterSpacing: "-0.02em",
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
            Если появились вопросы по заказу, срокам или доставке, можно сразу написать в Telegram.
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