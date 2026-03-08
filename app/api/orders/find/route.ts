import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const orderNumber = String(body.orderNumber || "").trim();
    const accessCode = String(body.accessCode || "").trim().toUpperCase();

    if (!orderNumber || !accessCode) {
      return NextResponse.json(
        { error: "Нужно ввести номер заказа и код" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getAdminClient();

    const { data: orders, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_number, access_code, client_name, product_name, size, status, comment, updated_at"
      )
      .eq("order_number", orderNumber)
      .eq("access_code", accessCode)
      .limit(1);

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    const order = orders?.[0];

    if (!order) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    const { data: events, error: eventError } = await supabaseAdmin
      .from("order_events")
      .select("status, comment, created_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });

    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      order,
      events: events || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}