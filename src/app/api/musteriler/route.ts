import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const body = await request.json();
  const { name, phone, address, notes } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Müşteri adı zorunludur." }, { status: 400 });

  const { data, error } = await supabase
    .from("customers")
    .insert({ name: name.trim(), phone: phone || null, address: address || null, notes: notes || null })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
