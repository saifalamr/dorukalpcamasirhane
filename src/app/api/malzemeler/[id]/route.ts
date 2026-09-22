import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      return NextResponse.json(
        { error: "Bu malzeme fişlerde veya müşteri listelerinde kullanılıyor, silinemez. Pasifleştirebilirsiniz." },
        { status: 409 }
       );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // Only allow known editable fields through to the update.
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (body.unit === "m2" || body.unit === "adet") patch.unit = body.unit;
  if (body.defaultPrice !== undefined) {
    const p = Number(body.defaultPrice);
    if (Number.isFinite(p) && p >= 0) patch.default_price = p;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Güncellenecek geçerli alan yok." }, { status: 400 });
  }

  const { error } = await supabase.from("products").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
