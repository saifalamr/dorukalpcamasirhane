import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** DELETE /api/odemeler/[id] — remove a mistaken payment entry. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const { error } = await supabase.from("customer_payments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
