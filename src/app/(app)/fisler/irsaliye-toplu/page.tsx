import { createClient } from "@/lib/supabase/server";
import { formatDateTR, MONTHS_TR } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { PrintButton } from "@/components/PrintButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ customer?: string; year?: string; month?: string }>;

/**
 * Toplu İrsaliye — all of a customer's delivery notes for one month,
 * stacked with page-breaks for batch printing. Price-free like the
 * single İrsaliye.
 */
export default async function BatchIrsaliyePage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const sp = await searchParams;

  const now = new Date();
  const year = parseInt(sp.year ?? String(now.getFullYear()), 10) || now.getFullYear();
  const month = parseInt(sp.month ?? String(now.getMonth() + 1), 10) || now.getMonth() + 1;
  const customerId = sp.customer ?? "";
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const nDays = new Date(year, month, 0).getDate();
  const from = `${monthKey}-01`;
  const to = `${monthKey}-${String(nDays).padStart(2, "0")}`;

  if (!customerId) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-ink mb-4">Toplu İrsaliye</h1>
        <p className="text-sm text-ink/55">Müşteri seçilmemiş.</p>
      </div>
    );
  }

  const [{ data: customer }, recordsRes, settings] = await Promise.all([
    supabase.from("customers").select("id, name, address, phone").eq("id", customerId).maybeSingle(),
    supabase
      .from("daily_records")
      .select(
        "id, record_date, daily_record_items(quantity, products(name, unit))"
      )
      .eq("customer_id", customerId)
      .gte("record_date", from)
      .lte("record_date", to)
      .order("record_date"),
    getSettings(),
  ]);

  const records = recordsRes.data ?? [];
  const periodLabel = `${MONTHS_TR[month - 1]} ${year}`;
  const brandWords = settings.store_name.trim().split(/\s+/);

  return (
    <div>
      <div className="no-print flex flex-wrap items-center justify-between gap-2 mb-6">
        <div>
          <Link href={`/faturalama?customer=${customerId}&year=${year}&month=${month}`} className="text-sm text-gold-600 hover:underline">
            ← Aylık Faturalama
          </Link>
          <h1 className="text-2xl font-semibold text-ink mt-1">
            Toplu İrsaliye — {customer?.name} ({records.length} gün)
          </h1>
          <p className="text-sm text-ink/55">Yazdırın — her irsaliye ayrı sayfaya basılır.</p>
        </div>
        <PrintButton customerName={customer?.name ?? ""} period={periodLabel} />
      </div>

      <div>
        {records.map((rec: any, idx: number) => {
          const items = rec.daily_record_items ?? [];
          const totalQty = items.reduce((s: number, i: any) => s + Number(i.quantity), 0);
          return (
            <div
              key={rec.id}
              className="print-area bg-white rounded-md border border-line max-w-2xl p-6 shadow-sm mx-auto mb-8"
              style={{ breakAfter: "page" }}
            >
              {/* Letterhead */}
              <div className="flex items-start justify-between gap-4 rounded-md px-4 py-3 mb-4" style={{ background: "#0E1A2B" }}>
                <div>
                  <p className="text-base font-bold" style={{ color: "#FFFFFF" }}>
                    {brandWords[0]} <span style={{ color: "#C9A45C" }}>{brandWords.slice(1).join(" ")}</span>
                  </p>
                  <p className="text-[10px]" style={{ color: "#D8B878" }}>
                    {settings.phone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold" style={{ color: "#C9A45C" }}>
                    İRSALİYE / SEVKİYAT FİŞİ
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>
                    {customer?.name}
                  </p>
                  <p className="text-xs font-medium" style={{ color: "#D8B878" }}>
                    {formatDateTR(rec.record_date)}
                  </p>
                </div>
              </div>

              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="text-left text-ink/60 border-b border-line">
                    <th className="py-1.5 font-medium">#</th>
                    <th className="py-1.5 font-medium">Malzeme</th>
                    <th className="py-1.5 font-medium text-right">Adet</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i: any, k: number) => (
                    <tr key={k} className="border-b border-line/60">
                      <td className="py-1.5 text-ink/40">{k + 1}</td>
                      <td className="py-1.5">{i.products?.name}</td>
                      <td className="py-1.5 text-right">
                        {Number(i.quantity).toLocaleString("tr-TR")} {i.products?.unit === "m2" ? "m²" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-end">
                <p className="text-sm font-medium">Toplam: {totalQty.toLocaleString("tr-TR")} adet</p>
                <p className="text-[10px] text-ink/40">
                  {idx + 1} / {records.length}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 mt-6 pt-2 border-t border-line">
                <p className="text-[10px] text-ink/50">Teslim Eden: ______________</p>
                <p className="text-[10px] text-ink/50">Teslim Alan: ______________</p>
              </div>
            </div>
          );
        })}
        {records.length === 0 && (
          <p className="text-sm text-ink/40 text-center py-10">Bu ayda sevkiyat yok.</p>
        )}
      </div>
    </div>
  );
}
