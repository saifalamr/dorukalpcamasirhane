import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED = new Set([
  "store_name",
  "store_tagline",
  "phone",
  "address",
  "tax_number",
  "logo_url",
]);

export async function PUT(req: NextRequest) {
  const supabase = await createClient();

  // Must be logged in.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  // Whitelist + trim + null out empties (except logo, which can be a big data URL).
  const patch: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!ALLOWED.has(k)) continue;
    if (k === "logo_url") {
      patch[k] = typeof v === "string" && v ? v : null;
    } else {
      const s = typeof v === "string" ? v.trim() : "";
      patch[k] = s || null;
    }
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  const { error } = await supabase
    .from("app_settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
