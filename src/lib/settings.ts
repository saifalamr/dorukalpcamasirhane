/**
 * App-wide store settings (singleton row in app_settings, id = 1).
 * Server-only: read with getSettings(); write via the /api/ayarlar route.
 */

export type AppSettings = {
  store_name: string;
  store_tagline: string;
  phone: string | null;
  address: string | null;
  tax_number: string | null;
  logo_url: string | null;
};

const DEFAULTS: AppSettings = {
  store_name: "DORUK ALP",
  store_tagline: "Çamaşırhane",
  phone: "+90 507 403 52 26",
  address: null,
  tax_number: null,
  logo_url: null,
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("app_settings")
      .select("store_name, store_tagline, phone, address, tax_number, logo_url")
      .eq("id", 1)
      .maybeSingle();
    // Merge over defaults so a missing column/row never breaks a page.
    return { ...DEFAULTS, ...(data ?? {}) } as AppSettings;
  } catch {
    // Table not migrated yet / offline — brand still renders with defaults.
    return DEFAULTS;
  }
}
