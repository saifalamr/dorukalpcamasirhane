import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { productId, unitPrice } = await request.json();
  if (!productId || unitPrice == null || unitPrice < 0) {
    return NextResponse.json({ error: "Geçersiz malzeme veya fiyat." }, { status: 400 });
  }

  const { error } = await supabase
    .from("customer_products")
    .upsert(
      { customer_id: params.id, product_id: productId, unit_price: unitPrice, active: true },
      { onConflict: "customer_id,product_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
