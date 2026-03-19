import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function checkSecret(req: Request) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function POST(req: Request) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const order_number = String(body.order_number || "").trim();
    const client_name = body.client_name || null;
    const telegram_id = body.telegram_id || null;
    const product_name = String(body.product_name || "").trim();
    const size = body.size || null;
    const status = body.status || "created";
    const comment = body.comment || "Заказ оформлен";
    const access_code = String(body.access_code || generateCode()).trim().toUpperCase();

    if (!order_number || !product_name) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        order_number,
        client_name,
        telegram_id,
        product_name,
        size,
        status,
        comment,
        access_code,
      })
      .select("*")
      .single();

    if (error || !order) {
      return NextResponse.json({ error: error?.message || "create failed" }, { status: 500 });
    }

    await supabase.from("order_events").insert({
      order_id: order.id,
      status,
      comment,
    });

    return NextResponse.json({
      ok: true,
      order,
      access_code,
    });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}