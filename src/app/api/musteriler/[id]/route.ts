import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;

  // Records are protected (on delete restrict), so a customer with history
  // cannot be deleted — guide the user to deactivating instead.
  const { data: deleted, error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) {
    if (error.code === "23503") {
      return NextResponse.json(
        { error: "Bu müşterinin fiş geçmişi var, silinemez. Müşteriyi pasifleştirebilirsiniz." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // RLS can silently filter a delete (0 rows, no error) — surface that
  // instead of reporting success on a no-op.
  if (!deleted || deleted.length === 0) {
    return NextResponse.json(
      { error: "Silme yetkisi reddedildi veya müşteri bulunamadı." },
      { status: 403 }
    );
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { error } = await supabase.from("customers").update(body).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
