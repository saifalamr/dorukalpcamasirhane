import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Item = { productId: string; quantity: number; unitPrice: number };

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const body = await request.json();
  const { customerId, date, items } = body as {
    customerId: string;
    date: string;
    items: Item[];
  };

  if (!customerId || !date) {
    return NextResponse.json(
      { error: "Müşteri ve tarih zorunludur." },
      { status: 400 }
    );
  }
  if (items.some((i) => i.quantity < 0)) {
    return NextResponse.json(
      { error: "Miktar negatif olamaz." },
      { status: 400 }
    );
  }

  // Find-or-create: never create a second daily_record for the same customer + date.
  const { data: existing } = await supabase
    .from("daily_records")
    .select("id")
    .eq("customer_id", customerId)
    .eq("record_date", date)
    .maybeSingle();

  let recordId = existing?.id as string | undefined;

  if (!recordId) {
    const { data: created, error: createError } = await supabase
      .from("daily_records")
      .insert({ customer_id: customerId, record_date: date })
      .select("id")
      .single();
    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    recordId = created.id;
  }

  // Replace all line items for this record with the submitted set.
  // Historical price is preserved via unit_price_snapshot on each item.
  const { error: deleteError } = await supabase
    .from("daily_record_items")
    .delete()
    .eq("daily_record_id", recordId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (items.length > 0) {
    const { error: insertError } = await supabase
      .from("daily_record_items")
      .insert(
        items.map((i) => ({
          daily_record_id: recordId,
          product_id: i.productId,
          quantity: i.quantity,
          unit_price_snapshot: i.unitPrice,
        }))
      );
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id: recordId });
}