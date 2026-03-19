import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function checkSecret(req: Request) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
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

    if (!orderId || !status) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("order load error:", orderError);
      return NextResponse.json({ error: "order not found" }, { status: 404 });
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

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("POST /api/admin/orders fatal error:", e);
    return NextResponse.json(
      { error: e?.message || "server error" },
      { status: 500 }
    );
  }
}