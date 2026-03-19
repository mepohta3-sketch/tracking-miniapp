import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function validateTelegramInitData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    return { ok: false, user: null };
  }

  const dataCheckString = Array.from(params.entries())
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) {
    return { ok: false, user: null };
  }

  const userRaw = params.get("user");
  if (!userRaw) {
    return { ok: false, user: null };
  }

  try {
    const user = JSON.parse(userRaw);
    return { ok: true, user };
  } catch {
    return { ok: false, user: null };
  }
}

export async function POST(req: Request) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json(
        { error: "Missing TELEGRAM_BOT_TOKEN" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const orderNumber = String(body.orderNumber || "").trim();
    const accessCode = String(body.accessCode || "").trim().toUpperCase();
    const initData = String(body.initData || "").trim();

    if (!orderNumber || !accessCode || !initData) {
      return NextResponse.json(
        { error: "missing fields" },
        { status: 400 }
      );
    }

    const validation = validateTelegramInitData(initData, botToken);

    if (!validation.ok || !validation.user?.id) {
      return NextResponse.json(
        { error: "invalid telegram init data" },
        { status: 401 }
      );
    }

    const telegramId = validation.user.id;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .eq("access_code", accessCode)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "order not found" },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        telegram_id: telegramId,
      })
      .eq("id", order.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: telegramId,
        text:
          `Уведомления подключены ✅\n\n` +
          `Заказ: ${order.order_number}\n` +
          `Товар: ${order.product_name}\n\n` +
          `Теперь я буду присылать обновления по статусу в этот чат.`,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "server error" },
      { status: 500 }
    );
  }
}