import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { name, unit } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Malzeme adı zorunludur." }, { status: 400 });

  const { data, error } = await supabase
    .from("products")
    .insert({ name: name.trim(), unit: unit === "m2" ? "m2" : "adet" })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
