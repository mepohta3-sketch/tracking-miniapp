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
  const idx = steps.findIndex((step) => step.key === status)
  return idx === -1 ? 0 : idx
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`
}

function getStepWord(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) return "этап"
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return "этапа"
  return "этапов"
}

function getStatusStyles(status: string) {
  switch (status) {
    case "bought_out":
      return {
        bg: "rgba(255, 214, 10, 0.10)",
        border: "1px solid rgba(255, 214, 10, 0.22)",
        color: "#F8D86A",
      }
    case "to_china_warehouse":
      return {
        bg: "rgba(93, 162, 255, 0.12)",
        border: "1px solid rgba(93, 162, 255, 0.20)",
        color: "#9FCBFF",
      }
    case "to_novosibirsk":
      return {
        bg: "rgba(84, 226, 176, 0.12)",
        border: "1px solid rgba(84, 226, 176, 0.20)",
        color: "#84F2CB",
      }
    case "delivered":
      return {
        bg: "rgba(84, 226, 176, 0.15)",
        border: "1px solid rgba(84, 226, 176, 0.25)",
        color: "#92F7D4",
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

  const lastEvent = useMemo(() => {
    if (!events.length) return null
    return events[events.length - 1]
  }, [events])

  const cardBase = {
    borderRadius: "30px",
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(180deg, rgba(18,19,22,0.96) 0%, rgba(11,12,14,0.98) 100%)",
    boxShadow:
      "0 24px 80px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)",
  } as const

  const innerCard = {
    borderRadius: "22px",
    border: "1px solid rgba(255,255,255,0.06)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)",
  } as const

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #050506 0%, #090A0C 28%, #060708 100%)",
        color: "#ffffff",
        fontFamily: "Inter, Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 18% 0%, rgba(255,255,255,0.06) 0%, transparent 28%), radial-gradient(circle at 100% 0%, rgba(84,226,176,0.10) 0%, transparent 24%), radial-gradient(circle at 50% 100%, rgba(93,162,255,0.06) 0%, transparent 24%)",
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
        {/* ГЛАВНЫЙ БЛОК */}
<section
  style={{
    ...cardBase,
    overflow: "hidden",
    marginBottom: "20px",
    position: "relative",
  }}
>
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 32%, transparent 100%)",
      pointerEvents: "none",
    }}
  />
  <div
    style={{
      position: "absolute",
      top: "-90px",
      right: "-60px",
      width: "240px",
      height: "240px",
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(84,226,176,0.20) 0%, transparent 62%)",
      filter: "blur(8px)",
      pointerEvents: "none",
    }}
  />

  <div style={{ padding: "28px 24px 24px", position: "relative", zIndex: 1 }}>
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
          background: "#84F2CB",
          boxShadow: "0 0 16px rgba(132,242,203,0.65)",
        }}
      />
      <span
        style={{
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.24em",
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
        lineHeight: 0.94,
        letterSpacing: "-0.06em",
        fontWeight: 800,
      }}
    >
      Заказ
      <br />
      под
      <br />
      контролем
    </h1>

    <p
      style={{
        margin: "0 0 20px 0",
        fontSize: "15px",
        lineHeight: 1.72,
        color: "rgba(255,255,255,0.72)",
        maxWidth: "320px",
      }}
    >
      Статус, история, прогресс и уведомления в одном аккуратном интерфейсе.
    </p>

    <div style={{ display: "grid", gap: "10px", marginBottom: "14px" }}>
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
          background: "#F3F3F3",
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
          color: "#ff7373",
        }}
      >
        {error}
      </div>
    )}
  </div>
</section>
              
        {/* ЗАГРУЗКА */}
        {loading && (
          <section
            style={{
              ...cardBase,
              padding: "22px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                marginBottom: "10px",
              }}
            >
              Ищем заказ
            </div>
            <div
              style={{
                fontSize: "15px",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.68)",
              }}
            >
              Проверяем номер заказа и код доступа. Это займёт пару секунд.
            </div>
          </section>
        )}

        {/* ЗАКАЗ */}
        {order && !loading && (
          <>
            <section
              style={{
                ...cardBase,
                overflow: "hidden",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  padding: "22px 22px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)",
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
                      Текущий заказ
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
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.42)",
                        marginBottom: "6px",
                      }}
                    >
                      Этап
                    </div>
                    <div
                      style={{
                        fontSize: "26px",
                        lineHeight: 1,
                        fontWeight: 800,
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
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.46)",
                      }}
                    >
                      {formatDateTime(lastEvent.created_at)}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    ...innerCard,
                    padding: "18px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "14px",
                      alignItems: "end",
                      marginBottom: "14px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.42)",
                          marginBottom: "8px",
                        }}
                      >
                        Текущий статус
                      </div>
                      <div
                        style={{
                          fontSize: "28px",
                          lineHeight: 1.05,
                          letterSpacing: "-0.05em",
                          fontWeight: 800,
                          marginBottom: "8px",
                        }}
                      >
                        {currentStatusLabel}
                      </div>
                      <div
                        style={{
                          color: "rgba(255,255,255,0.68)",
                          fontSize: "14px",
                          lineHeight: 1.7,
                          maxWidth: "240px",
                        }}
                      >
                        {currentStatus === "created" &&
                          "Заказ оформлен и зафиксирован в системе. Следующий этап — выкуп товара."}
                        {currentStatus === "bought_out" &&
                          "Товар уже выкуплен у поставщика и движется к следующему этапу маршрута."}
                        {currentStatus === "to_china_warehouse" &&
                          "Товар находится на нашем складе в Китае и готовится к отправке дальше."}
                        {currentStatus === "to_novosibirsk" &&
                          "Заказ уже покинул Китай и находится в пути к нам в Новосибирск."}
                        {currentStatus === "delivered" &&
                          "Заказ уже прибыл в Новосибирск. Менеджер скоро свяжется с вами по дальнейшим действиям."}
                      </div>
                    </div>

                    <div
                      style={{
                        width: "84px",
                        height: "84px",
                        borderRadius: "24px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.42)",
                          marginBottom: "6px",
                        }}
                      >
                        Прогресс
                      </div>
                      <div
                        style={{
                          fontSize: "24px",
                          lineHeight: 1,
                          fontWeight: 800,
                        }}
                      >
                        {Math.round((currentStatusIndex / (steps.length - 1)) * 100)}%
                      </div>
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
                          "linear-gradient(90deg, #9AF8DA 0%, #64E7B9 55%, #37CA98 100%)",
                        boxShadow: "0 0 24px rgba(84,226,176,0.35)",
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
                    {steps.map((step, index) => {
                      const active = index === currentStatusIndex
                      const completed = index < currentStatusIndex

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
                              width: active ? "14px" : "10px",
                              height: active ? "14px" : "10px",
                              borderRadius: "50%",
                              background: active
                                ? "#84F2CB"
                                : completed
                                ? "rgba(132,242,203,0.55)"
                                : "rgba(255,255,255,0.14)",
                              boxShadow: active
                                ? "0 0 0 6px rgba(132,242,203,0.12)"
                                : "none",
                            }}
                          />
                          <div
                            style={{
                              textAlign: "center",
                              fontSize: "10px",
                              lineHeight: 1.35,
                              color: active
                                ? "#ffffff"
                                : completed
                                ? "rgba(255,255,255,0.72)"
                                : "rgba(255,255,255,0.36)",
                            }}
                          >
                            {step.label}
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
                      color: "#84F2CB",
                    }}
                  >
                    {bindMessage}
                  </div>
                )}
              </div>
            </section>

            {/* ИСТОРИЯ */}
            <section
              style={{
                ...cardBase,
                overflow: "hidden",
                marginBottom: "20px",
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
                    История заказа
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.42)",
                    }}
                  >
                    {events.length} {getStepWord(events.length)}
                  </div>
                </div>
              </div>

              <div style={{ padding: "18px 22px 22px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {events.map((event: any, index: number) => {
                    const isLast = index === events.length - 1

                    return (
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
                              background: isLast ? "#84F2CB" : "rgba(132,242,203,0.75)",
                              marginTop: "6px",
                              boxShadow: isLast
                                ? "0 0 0 5px rgba(132,242,203,0.12)"
                                : "none",
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
                            background: isLast
                              ? "linear-gradient(180deg, rgba(84,226,176,0.08) 0%, rgba(255,255,255,0.02) 100%)"
                              : "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                            border: isLast
                              ? "1px solid rgba(84,226,176,0.12)"
                              : "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: "12px",
                              marginBottom: "6px",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "15px",
                                fontWeight: 700,
                                lineHeight: 1.45,
                              }}
                            >
                              {event.comment || statusMap[event.status] || event.status}
                            </div>

                            {isLast && (
                              <div
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "999px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  background: "rgba(84,226,176,0.12)",
                                  border: "1px solid rgba(84,226,176,0.18)",
                                  color: "#84F2CB",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Сейчас
                              </div>
                            )}
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
                    )
                  })}
                </div>
              </div>
            </section>
          </>
        )}

        {/* ПОЛЕЗНОЕ */}
        <section
          style={{
            ...cardBase,
            overflow: "hidden",
            marginBottom: "20px",
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
              Полезное
            </div>

            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                letterSpacing: "-0.04em",
              }}
            >
              Информация по заказу
            </div>
          </div>

          <div style={{ padding: "18px 22px 22px" }}>
            <div
              style={{
                ...innerCard,
                padding: "14px",
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

            <div
              style={{
                ...innerCard,
                padding: "18px",
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
                Реальные отзывы клиентов. Можно открыть Telegram-канал и посмотреть больше отзывов.
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

            <div style={{ display: "grid", gap: "10px" }}>
              {[
                {
                  title: "Как работает отслеживание",
                  text:
                    "После оформления заказа ему присваивается номер и код доступа. По ним открывается карточка заказа с текущим статусом и историей обновлений.",
                },
                {
                  title: "Если статус долго не меняется",
                  text:
                    "Небольшие паузы между этапами логистики бывают нормой. Если обновлений долго нет, лучше сразу написать в службу заботы и уточнить детали.",
                },
                {
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

        {/* ПОДДЕРЖКА */}
        <section
          style={{
            ...cardBase,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "22px" }}>
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
                Поддержка
              </div>

              <div
                style={{
                  padding: "8px 14px",
                  borderRadius: "999px",
                  background: "rgba(84,226,176,0.12)",
                  border: "1px solid rgba(84,226,176,0.22)",
                  color: "#84F2CB",
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
                lineHeight: 1.04,
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