import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/");
    const orderNumber = decodeURIComponent(parts[parts.length - 1]).trim();
    const accessCode = (url.searchParams.get("code") || "").trim().toUpperCase();

    if (!orderNumber || !accessCode) {
      return NextResponse.json(
        { error: "order number and code required" },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .eq("access_code", accessCode)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "order not found" },
        { status: 404 }
      );
    }

    const { data: events, error: eventsError } = await supabase
      .from("order_events")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });

    if (eventsError) {
      return NextResponse.json(
        { error: "events load failed" },
        { status: 500 }
      );
    }

    const latestEvent =
      events && events.length > 0 ? events[events.length - 1] : null;

    return NextResponse.json({
      order: {
        ...order,
        status: latestEvent?.status ?? order.status,
        comment: latestEvent?.comment ?? order.comment,
      },
      events: events || [],
    });
  } catch (e) {
    return NextResponse.json(
      { error: "server error" },
      { status: 500 }
    );
  }
}