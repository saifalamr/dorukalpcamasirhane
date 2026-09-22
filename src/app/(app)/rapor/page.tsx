import { createClient } from "@/lib/supabase/server";
import { formatTRY, MONTHS_TR, daysInMonth } from "@/lib/format";

export const dynamic = "force-dynamic";

type Row = {
  productId: string;
  productName: string;
  unit: string;
  byDay: Record<number, number>;
  totalQty: number;
  totalAmount: number;
};

export default async function AylikRaporPage({
  searchParams,
}: {
  searchParams: { customer?: string; year?: string; month?: string };
}) {
  const supabase = createClient();
  const now = new Date();
  const year = parseInt(searchParams.year ?? String(now.getFullYear()), 10);
  const month = parseInt(searchParams.month ?? String(now.getMonth() + 1), 10); // 1-12
  const customerId = searchParams.customer ?? "";

  const { data: customers } = await supabase.from("customers").select("id, name").order("name");

  let rows: Row[] = [];
  let grandTotal = 0;
  const nDays = daysInMonth(year, month);

  if (customerId) {
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(nDays).padStart(2, "0")}`;

    const { data: records } = await supabase
      .from("daily_records")
      .select("id, record_date")
      .eq("customer_id", customerId)
      .gte("record_date", monthStart)
      .lte("record_date", monthEnd);

    const recordIds = (records ?? []).map((r) => r.id);
    const dateByRecord = new Map((records ?? []).map((r) => [r.id, r.record_date]));

    if (recordIds.length > 0) {
      const { data: items } = await supabase
        .from("daily_record_items")
        .select("daily_record_id, product_id, quantity, line_total, products(name, unit)")
        .in("daily_record_id", recordIds);

      const byProduct = new Map<string, Row>();
      for (const item of items ?? []) {
        const anyItem: any = item;
        const dateStr = dateByRecord.get(anyItem.daily_record_id)!;
        const day = parseInt(dateStr.slice(8, 10), 10);

        if (!byProduct.has(anyItem.product_id)) {
          byProduct.set(anyItem.product_id, {
            productId: anyItem.product_id,
            productName: anyItem.products?.name ?? "",
            unit: anyItem.products?.unit ?? "adet",
            byDay: {},
            totalQty: 0,
            totalAmount: 0,
          });
        }
        const row = byProduct.get(anyItem.product_id)!;
        row.byDay[day] = (row.byDay[day] ?? 0) + Number(anyItem.quantity);
        row.totalQty += Number(anyItem.quantity);
        row.totalAmount += Number(anyItem.line_total);
      }

      rows = Array.from(byProduct.values()).sort((a, b) => a.productName.localeCompare(b.productName, "tr"));
      grandTotal = rows.reduce((s, r) => s + r.totalAmount, 0);
    }
  }

  const days = Array.from({ length: nDays }, (_, i) => i + 1);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-6">Aylık Rapor</h1>

      <form className="bg-white rounded-md border border-line p-4 mb-5 flex flex-wrap items-end gap-4 no-print">
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Müşteri</label>
          <select name="customer" defaultValue={customerId} className="rounded border border-line px-3 py-1.5 text-sm">
            <option value="">Seçiniz...</option>
            {(customers ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Ay</label>
          <select name="month" defaultValue={String(month)} className="rounded border border-line px-3 py-1.5 text-sm">
            {MONTHS_TR.map((m, idx) => (
              <option key={m} value={idx + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Yıl</label>
          <input type="number" name="year" defaultValue={year} className="w-24 rounded border border-line px-3 py-1.5 text-sm" />
        </div>
        <button type="submit" className="rounded bg-teal-700 text-white text-sm font-medium px-4 py-1.5 hover:bg-teal-600">
          Göster
        </button>
        {customerId && (
          <a
            href={`/api/excel-export?customer=${customerId}&year=${year}&month=${month}`}
            className="rounded border border-teal-700 text-teal-700 text-sm font-medium px-4 py-1.5 hover:bg-teal-50"
          >
            Excel'e Aktar
          </a>
        )}
      </form>

      {!customerId ? (
        <p className="text-sm text-ink/50">Rapor görüntülemek için bir müşteri seçin.</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-ink/50">{MONTHS_TR[month - 1]} {year} için kayıt bulunamadı.</p>
      ) : (
        <div className="bg-white rounded-md border border-line overflow-x-auto">
          <table className="matrix text-xs w-full">
            <thead>
              <tr className="bg-teal-50 text-ink/70">
                <th className="px-3 py-2 text-left sticky left-0 bg-teal-50 min-w-[140px]">Malzeme</th>
                {days.map((d) => (
                  <th key={d} className="px-2 py-2 text-center min-w-[32px]">{d}</th>
                ))}
                <th className="px-3 py-2 text-right min-w-[80px]">Toplam Adet</th>
                <th className="px-3 py-2 text-right min-w-[90px]">Birim Fiyat</th>
                <th className="px-3 py-2 text-right min-w-[100px]">Toplam Tutar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.productId}>
                  <td className="px-3 py-1.5 font-medium text-ink sticky left-0 bg-white">{r.productName}</td>
                  {days.map((d) => (
                    <td key={d} className="px-2 py-1.5 text-center text-ink/70">
                      {r.byDay[d] ? r.byDay[d].toLocaleString("tr-TR") : ""}
                    </td>
                  ))}
                  <td className="px-3 py-1.5 text-right font-medium">{r.totalQty.toLocaleString("tr-TR")}</td>
                  <td className="px-3 py-1.5 text-right text-ink/70">
                    {formatTRY(r.totalQty > 0 ? r.totalAmount / r.totalQty : 0)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium text-teal-900">{formatTRY(r.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-teal-700 bg-teal-50/60 font-semibold">
                <td className="px-3 py-2 sticky left-0 bg-teal-50/60" colSpan={nDays + 1}>Genel Toplam</td>
                <td></td>
                <td className="px-3 py-2 text-right text-teal-900">{formatTRY(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
