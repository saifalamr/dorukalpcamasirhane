import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatTRY, formatDateTR, MONTHS_TR, toISODate } from "@/lib/format";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ customer?: string; year?: string; month?: string }>;

/**
 * Aylık Faturalama — pick a customer + month, see all deliveries, the
 * automatically calculated monthly total (from snapshot prices), and jump
 * to the customer-facing report / irsaliye.
 */
export default async function MonthlyBillingPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const sp = await searchParams;

  const now = new Date();
  const year = parseInt(sp.year ?? String(now.getFullYear()), 10) || now.getFullYear();
  const month = parseInt(sp.month ?? String(now.getMonth() + 1), 10) || now.getMonth() + 1;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const nDays = new Date(year, month, 0).getDate();
  const from = `${monthKey}-01`;
  const to = `${monthKey}-${String(nDays).padStart(2, "0")}`;

  const customerId = sp.customer ?? "";

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name")
    .order("name");

  // Nothing selected yet: show the picker + a hint.
  if (!customerId) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-ink mb-1">Aylık Faturalama</h1>
        <p className="text-sm text-ink/55 mb-6">
          Müşteri ve ay seçin — toplam, o ayın gerçek fiyatlarından otomatik hesaplanır.
        </p>
        <form className="bg-white rounded-md border border-line p-4 flex flex-wrap items-end gap-3 max-w-2xl">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-ink/70 mb-1">Müşteri</label>
            <select name="customer" className="w-full rounded border border-line px-3 py-2 text-sm">
              <option value="">Seçiniz...</option>
              {(customers ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1">Ay</label>
            <select name="month" defaultValue={String(month)} className="rounded border border-line px-3 py-2 text-sm">
              {MONTHS_TR.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1">Yıl</label>
            <select name="year" defaultValue={String(year)} className="rounded border border-line px-3 py-2 text-sm">
              {[year, year - 1, year - 2].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded bg-navy-800 text-white text-sm font-medium px-5 py-2 hover:bg-navy-700"
          >
            Getir
          </button>
        </form>
      </div>
    );
  }

  const [{ data: customer }, recordsRes, itemsRes, paymentsRes] = await Promise.all([
    supabase.from("customers").select("id, name, address, phone").eq("id", customerId).maybeSingle(),
    supabase
      .from("daily_records")
      .select("id, record_date, notes")
      .eq("customer_id", customerId)
      .gte("record_date", from)
      .lte("record_date", to)
      .order("record_date"),
    supabase
      .from("daily_record_items")
      .select(
        "daily_record_id, quantity, unit_price_snapshot, line_total, products(name, unit), daily_records!inner(record_date)"
      )
      .eq("daily_records.customer_id", customerId)
      .gte("daily_records.record_date", from)
      .lte("daily_records.record_date", to),
    supabase
      .from("customer_payments")
      .select("paid_at, amount, note")
      .eq("customer_id", customerId)
      .eq("period_month", `${monthKey}-01`)
      .order("paid_at"),
  ]);

  if (!customer) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-ink mb-4">Aylık Faturalama</h1>
        <p className="text-sm text-red-600">Müşteri bulunamadı.</p>
      </div>
    );
  }

  const records = recordsRes.data ?? [];
  const dateByRecord = new Map(records.map((r) => [r.id, r.record_date]));

  // ===== Per-day delivery summary =====
  const byDate = new Map<string, { qty: number; amount: number; records: number }>();
  for (const it of itemsRes.data ?? []) {
    const anyIt: any = it;
    const date = anyIt.daily_records?.record_date ?? from;
    const e = byDate.get(date) ?? { qty: 0, amount: 0, records: 0 };
    e.qty += Number(anyIt.quantity);
    e.amount += Number(anyIt.line_total);
    byDate.set(date, e);
  }
  for (const r of records) {
    if (!byDate.has(r.record_date)) byDate.set(r.record_date, { qty: 0, amount: 0, records: 1 });
    else {
      const e = byDate.get(r.record_date)!;
      e.records += 1;
    }
  }
  const dayRows = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  // ===== Monthly totals (from snapshot prices — DB-generated line_total) =====
  const totalQty = (itemsRes.data ?? []).reduce((s, i: any) => s + Number(i.quantity), 0);
  const monthlyTotal = (itemsRes.data ?? []).reduce((s, i: any) => s + Number(i.line_total), 0);
  const totalPaid = (paymentsRes.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const deliveryCount = records.length;

  const reportHref = `/musteriler/${customerId}/fatura?year=${year}&month=${month}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Aylık Faturalama</h1>
          <p className="text-sm text-ink/60 mt-0.5">
            {customer.name} — {MONTHS_TR[month - 1]} {year}
          </p>
        </div>
        <Link href="/faturalama" className="text-sm text-gold-600 hover:underline no-print">
          ← Müşteri Değiştir
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-md border border-line p-4 shadow-sm">
          <p className="text-xs text-ink/55">Toplam Sevkiyat (gün)</p>
          <p className="text-xl font-semibold text-accent">{deliveryCount}</p>
        </div>
        <div className="bg-white rounded-md border border-line p-4 shadow-sm">
          <p className="text-xs text-ink/55">Toplam Adet</p>
          <p className="text-xl font-semibold text-accent">{totalQty.toLocaleString("tr-TR")}</p>
        </div>
        <div className="bg-white rounded-md border border-line p-4 shadow-sm">
          <p className="text-xs text-ink/55">Tahsil Edilen</p>
          <p className="text-xl font-semibold text-accent">{formatTRY(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-md border border-line p-4 shadow-sm bg-gold-100/40">
          <p className="text-xs text-ink/55">Aylık Toplam</p>
          <p className="text-xl font-semibold text-accent">{formatTRY(monthlyTotal)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6 no-print">
        <Link
          href={reportHref}
          className="inline-flex items-center gap-2 rounded bg-navy-800 text-white text-sm font-medium px-4 py-2 hover:bg-navy-700 transition-colors"
        >
          Aylık Rapor Oluştur →
        </Link>
        <Link
          href={`/musteriler/${customerId}/ekstre?year=${year}&month=${month}`}
          className="inline-flex items-center gap-2 rounded border border-line bg-white text-sm font-medium px-4 py-2 text-ink hover:bg-gold-100/60 transition-colors"
        >
          Hesap Ekstresi
        </Link>
        <Link
          href={`/fisler/irsaliye-toplu?customer=${customerId}&year=${year}&month=${month}`}
          className="inline-flex items-center gap-2 rounded border border-line bg-white text-sm font-medium px-4 py-2 text-ink hover:bg-gold-100/60 transition-colors"
        >
          Toplu İrsaliye (aylık)
        </Link>
      </div>

      {/* Per-day table */}
      <div className="bg-white rounded-md border border-line overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="bg-gold-100/50 text-ink/70 text-left">
                <th className="px-4 py-2.5 font-medium">Tarih</th>
                <th className="px-4 py-2.5 font-medium text-right">Adet</th>
                <th className="px-4 py-2.5 font-medium text-right">Tutar</th>
                <th className="px-4 py-2.5 font-medium text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {dayRows.map(([date, e]) => {
                // find first record id on this date for the irsaliye link
                const rec = records.find((r) => r.record_date === date);
                return (
                  <tr key={date} className="border-t border-line">
                    <td className="px-4 py-2.5">{formatDateTR(date)}</td>
                    <td className="px-4 py-2.5 text-right">{e.qty.toLocaleString("tr-TR")}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-accent">{formatTRY(e.amount)}</td>
                    <td className="px-4 py-2.5 text-right">
                      {rec && (
                        <Link
                          href={`/fisler/${rec.id}/irsaliye`}
                          className="text-xs text-gold-600 hover:underline"
                        >
                          İrsaliye
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
              {dayRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink/40">
                    Bu ayda sevkiyat yok.
                  </td>
                </tr>
              )}
            </tbody>
            {dayRows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-navy-700 bg-gold-100/40 font-semibold">
                  <td className="px-4 py-2.5">Toplam ({dayRows.length} gün)</td>
                  <td className="px-4 py-2.5 text-right">{totalQty.toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-2.5 text-right text-accent">{formatTRY(monthlyTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
