import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const { productId, unitPrice } = await request.json();
  if (!productId || unitPrice == null || unitPrice < 0) {
    return NextResponse.json({ error: "Geçersiz malzeme veya fiyat." }, { status: 400 });
  }

  const { error } = await supabase
    .from("customer_products")
    .upsert(
      { customer_id: id, product_id: productId, unit_price: unitPrice, active: true },
      { onConflict: "customer_id,product_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
