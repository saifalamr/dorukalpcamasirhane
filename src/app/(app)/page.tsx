import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatTRY } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + "-01";

  const [{ data: todayRecord }, { data: monthRecords }, { count: customerCount }] = await Promise.all([
    supabase
      .from("daily_records_with_totals")
      .select("total_quantity, total_amount")
      .eq("record_date", today),
    supabase
      .from("daily_records_with_totals")
      .select("total_amount")
      .gte("record_date", monthStart)
      .lte("record_date", today),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("active", true),
  ]);

  const todayQty = (todayRecord ?? []).reduce((s, r) => s + Number(r.total_quantity), 0);
  const todayAmount = (todayRecord ?? []).reduce((s, r) => s + Number(r.total_amount), 0);
  const monthAmount = (monthRecords ?? []).reduce((s, r) => s + Number(r.total_amount), 0);

  const cards = [
    { label: "Bugünün Tutarı", value: formatTRY(todayAmount) },
    { label: "Bugünün Adedi", value: todayQty.toLocaleString("tr-TR") },
    { label: "Aktif Müşteri", value: (customerCount ?? 0).toString() },
    { label: "Bu Ayın Toplamı", value: formatTRY(monthAmount) },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Panel</h1>
          <p className="text-sm text-ink/60 mt-0.5">
            {new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-md border border-line p-4">
            <p className="text-xs text-ink/55">{c.label}</p>
            <p className="text-xl font-semibold text-teal-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-sm font-medium text-ink/70 mb-3">Hızlı İşlemler</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/giris" className="rounded bg-teal-700 text-white text-sm font-medium px-4 py-2.5 hover:bg-teal-600 transition-colors">
            Günlük Giriş
          </Link>
          <Link href="/musteriler" className="rounded border border-line bg-white text-sm font-medium px-4 py-2.5 text-ink hover:bg-teal-50 transition-colors">
            Müşteriler
          </Link>
          <Link href="/rapor" className="rounded border border-line bg-white text-sm font-medium px-4 py-2.5 text-ink hover:bg-teal-50 transition-colors">
            Aylık Rapor
          </Link>
          <Link href="/fisler" className="rounded border border-line bg-white text-sm font-medium px-4 py-2.5 text-ink hover:bg-teal-50 transition-colors">
            Günlük Fişler
          </Link>
        </div>
      </div>
    </div>
  );
}
