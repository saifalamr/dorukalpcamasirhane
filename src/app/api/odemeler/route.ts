import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/format";

/**
 * GET /api/odemeler?customer=<id>&month=YYYY-MM
 * Returns payments for one customer+month. Without params returns the
 * latest 200 across everyone (used for history panels).
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customer");
  const month = searchParams.get("month"); // YYYY-MM

  if (!customerId || !month) {
    return NextResponse.json({ error: "customer ve month zorunludur." }, { status: 400 });
  }

  const periodMonth = `${month}-01`;
  const { data: payments, error } = await supabase
    .from("customer_payments")
    .select("*")
    .eq("customer_id", customerId)
    .eq("period_month", periodMonth)
    .order("paid_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ payments: payments ?? [] });
}

/**
 * POST /api/odemeler
 * Body: { customerId, amount, month: "YYYY-MM", paidAt?: "YYYY-MM-DD", note? }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const body = await request.json();
  const { customerId, amount, month, paidAt, note } = body as {
    customerId: string;
    amount: number;
    month: string;
    paidAt?: string;
    note?: string | null;
  };

  if (!customerId || !month || typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Müşteri, ay ve pozitif tutar zorunludur." },
      { status: 400 }
    );
  }

  const { data: payment, error } = await supabase
    .from("customer_payments")
    .insert({
      customer_id: customerId,
      amount,
      period_month: `${month}-01`,
      paid_at: paidAt && /^\d{4}-\d{2}-\d{2}$/.test(paidAt) ? paidAt : toISODate(new Date()),
      note: note?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: payment.id });
}
