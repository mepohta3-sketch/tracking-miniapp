import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function checkSecret(req: Request) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

const statusMap: Record<string, string> = {
  created: "Заказ оформлен",
  bought_out: "Товар выкуплен",
  to_china_warehouse: "На складе в Китае",
  to_novosibirsk: "Едет в Новосибирск",
  delivered: "Доставлен",
};

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

async function sendTelegramNotification(
  telegramId: number,
  orderNumber: string,
  status: string,
  comment: string | null
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken || !telegramId) {
    return;
  }

  const text =
    `Ваш заказ ${orderNumber} обновлён\n\n` +
    `Новый статус: ${statusMap[status] || status}\n` +
    `${comment ? `Комментарий: ${comment}\n\n` : `\n`}` +
    `Откройте Mini App, чтобы посмотреть историю заказа.`;

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: telegramId,
      text,
    }),
  });
}

export async function GET(req: Request) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .order("order_number", { ascending: true });

  if (ordersError) {
    console.error("GET orders error:", ordersError);
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  const { data: events, error: eventsError } = await supabase
    .from("order_events")
    .select("order_id,status,comment,created_at")
    .order("created_at", { ascending: false });

  if (eventsError) {
    console.error("GET order_events error:", eventsError);
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  const latestByOrderId = new Map<string, any>();

  for (const event of events || []) {
    if (!latestByOrderId.has(event.order_id)) {
      latestByOrderId.set(event.order_id, event);
    }
  }

  const mergedOrders = (orders || []).map((order) => {
    const latest = latestByOrderId.get(order.id);

    return {
      ...order,
      status: latest?.status ?? order.status,
      comment: latest?.comment ?? order.comment,
    };
  });

  return NextResponse.json({ orders: mergedOrders });
}

export async function POST(req: Request) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const orderId = String(body.orderId || "").trim();
    const status = String(body.status || "").trim();
    const comment =
      body.comment === undefined || body.comment === null
        ? null
        : String(body.comment).trim();

    const accessCode =
      body.accessCode === undefined ||
      body.accessCode === null ||
      String(body.accessCode).trim() === ""
        ? null
        : String(body.accessCode).trim().toUpperCase();

    if (!orderId || !status) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const { data: currentOrder, error: currentError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (currentError || !currentOrder) {
      console.error("current order load error:", currentError);
      return NextResponse.json({ error: "order not found" }, { status: 404 });
    }

    if (accessCode && accessCode !== currentOrder.access_code) {
      const { error: codeError } = await supabase
        .from("orders")
        .update({ access_code: accessCode })
        .eq("id", orderId);

      if (codeError) {
        return NextResponse.json({ error: codeError.message }, { status: 500 });
      }
    }

    const { data: lastEvents, error: lastEventError } = await supabase
      .from("order_events")
      .select("status,comment,created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (lastEventError) {
      console.error("last event load error:", lastEventError);
      return NextResponse.json({ error: lastEventError.message }, { status: 500 });
    }

    const lastEvent = lastEvents?.[0] || null;

    const sameStatus = lastEvent?.status === status;
    const sameComment =
      normalizeText(lastEvent?.comment) === normalizeText(comment);

    if (sameStatus && sameComment) {
      console.log("duplicate event skipped:", {
        orderId,
        status,
        comment,
      });

      return NextResponse.json({
        ok: true,
        skipped: true,
        message: "duplicate skipped",
      });
    }

    const { error: insertError } = await supabase
      .from("order_events")
      .insert({
        order_id: orderId,
        status,
        comment,
      });

    if (insertError) {
      console.error("insert event error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    if (currentOrder.telegram_id) {
      await sendTelegramNotification(
        currentOrder.telegram_id,
        currentOrder.order_number,
        status,
        comment
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("POST /api/admin/orders fatal error:", e);
    return NextResponse.json(
      { error: e?.message || "server error" },
      { status: 500 }
    );
  }
}