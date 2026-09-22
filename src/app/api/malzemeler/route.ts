import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { name, unit, defaultPrice } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Malzeme adı zorunludur." }, { status: 400 });

  const parsedPrice = Number(defaultPrice);
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: name.trim(),
      unit: unit === "m2" ? "m2" : "adet",
      default_price: Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
