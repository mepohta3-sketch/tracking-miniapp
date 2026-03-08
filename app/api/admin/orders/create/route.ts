import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const allowedStatuses = [
  "created",
  "bought_out",
  "to_china_warehouse",
  "to_novosibirsk",
  "delivered",
] as const;

function isAuthorized(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  return !!process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET;
}

function isValidStatus(value: string) {
  return allowedStatuses.includes(value as (typeof allowedStatuses)[number]);
}

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
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const orderNumber = String(body.orderNumber || "").trim();
    const clientName =
      body.clientName === null ||
      body.clientName === undefined ||
      body.clientName === ""
        ? null
        : String(body.clientName);

    const productName = String(body.productName || "").trim();
    const size =
      body.size === null ||
      body.size === undefined ||
      body.size === ""
        ? null
        : String(body.size);

    const status = String(body.status || "created").trim();
    const comment =
      body.comment === null ||
      body.comment === undefined ||
      body.comment === ""
        ? null
        : String(body.comment);

    const accessCode =
      body.accessCode === null ||
      body.accessCode === undefined ||
      body.accessCode === ""
        ? null
        : String(body.accessCode);

    if (!orderNumber) {
      return NextResponse.json({ error: "orderNumber is required" }, { status: 400 });
    }

    if (!productName) {
      return NextResponse.json({ error: "productName is required" }, { status: 400 });
    }

    if (!isValidStatus(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    const { data, error } = await supabaseAdmin.rpc("admin_create_order", {
      p_order_number: orderNumber,
      p_client_name: clientName,
      p_product_name: productName,
      p_size: size,
      p_status: status,
      p_comment: comment,
      p_access_code: accessCode,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, result: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}