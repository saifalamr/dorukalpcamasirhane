import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatTRY, formatDateTR, MONTHS_TR } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { PrintButton } from "@/components/PrintButton";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ year?: string; month?: string }>;

/**
 * Aylık Fatura Raporu — customer-facing monthly report WITH prices.
 * Distinct from the İrsaliye (price-free delivery note): this document is
 * the billing document, suitable for WhatsApp/PDF handoff.
 */
export default async function MonthlyReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const { id } = await params;
  const sp = await searchParams;

  const now = new Date();
  const year = parseInt(sp.year ?? String(now.getFullYear()), 10) || now.getFullYear();
  const month = parseInt(sp.month ?? String(now.getMonth() + 1), 10) || now.getMonth() + 1;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const nDays = new Date(year, month, 0).getDate();
  const from = `${monthKey}-01`;
  const to = `${monthKey}-${String(nDays).padStart(2, "0")}`;

  const [{ data: customer }, recordsRes, itemsRes, settings] = await Promise.all([
    supabase.from("customers").select("id, name, address, phone").eq("id", id).maybeSingle(),
    supabase
      .from("daily_records")
      .select("id, record_date")
      .eq("customer_id", id)
      .gte("record_date", from)
      .lte("record_date", to)
      .order("record_date"),
    supabase
      .from("daily_record_items")
      .select(
        "daily_record_id, quantity, unit_price_snapshot, line_total, products(name, unit), daily_records!inner(record_date)"
      )
      .eq("daily_records.customer_id", id)
      .gte("daily_records.record_date", from)
      .lte("daily_records.record_date", to),
    getSettings(),
  ]);

  if (!customer) notFound();

  // ===== Per-product summary (the main table of the report) =====
  type ProdRow = { name: string; unit: string; qty: number; amount: number };
  const byProduct = new Map<string, ProdRow>();
  const byDate = new Map<string, { qty: number; amount: number }>();

  for (const it of itemsRes.data ?? []) {
    const anyIt: any = it;
    const date = anyIt.daily_records?.record_date ?? from;

    const p =
      byProduct.get(anyIt.product_id) ??
      { name: anyIt.products?.name ?? "?", unit: anyIt.products?.unit ?? "adet", qty: 0, amount: 0 };
    p.qty += Number(anyIt.quantity);
    p.amount += Number(anyIt.line_total);
    byProduct.set(anyIt.product_id, p);

    const d = byDate.get(date) ?? { qty: 0, amount: 0 };
    d.qty += Number(anyIt.quantity);
    d.amount += Number(anyIt.line_total);
    byDate.set(date, d);
  }

  const productRows = Array.from(byProduct.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "tr")
  );
  const dayRows = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  const monthlyTotal = productRows.reduce((s, p) => s + p.amount, 0);
  const totalQty = productRows.reduce((s, p) => s + p.qty, 0);
  const deliveryCount = (recordsRes.data ?? []).length;
  const periodLabel = `${MONTHS_TR[month - 1]} ${year}`;

  return (
    <div>
      <div className="no-print flex flex-wrap items-center justify-between gap-2 mb-6">
        <div>
          <Link href={`/faturalama?customer=${id}&year=${year}&month=${month}`} className="text-sm text-gold-600 hover:underline">
            ← Aylık Faturalama
          </Link>
          <h1 className="text-2xl font-semibold text-ink mt-1">Aylık Rapor — {periodLabel}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WhatsAppButton
            customerName={customer.name}
            period={periodLabel}
            monthlyTotal={monthlyTotal}
            deliveryCount={deliveryCount}
            customerPhone={customer.phone}
          />
          <PrintButton customerName={customer.name} period={periodLabel} />
        </div>
      </div>

      <div className="print-area bg-white rounded-md border border-line max-w-3xl p-4 md:p-8 shadow-sm mx-auto overflow-x-auto">
        {/* ===== Letterhead (branded, from Ayarlar) ===== */}
        <div
          className="flex items-start justify-between gap-4 rounded-md px-5 py-4 mb-6"
          style={{ background: "#0E1A2B" }}
        >
          <div className="flex items-center gap-3">
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logo_url}
                alt=""
                className="rounded object-contain shrink-0"
                style={{ width: 44, height: 44, background: "#1E3252", border: "1px solid #C9A45C" }}
              />
            ) : (
              <div
                className="rounded flex items-center justify-center shrink-0"
                style={{ width: 44, height: 44, background: "#1E3252", border: "1px solid #C9A45C" }}
              >
                <svg width="27" height="27" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M3 17.5 9.2 8.2l3.4 5 2.1-2.9L21 17.5H3Z" fill="#C9A45C" />
                  <path
                    d="M12 3.2c1.1 1.5 2.3 3.2 2.3 4.6a2.3 2.3 0 1 1-4.6 0c0-1.4 1.2-3.1 2.3-4.6Z"
                    fill="#F4EAD5"
                  />
                </svg>
              </div>
            )}
            <div>
              <p className="text-lg font-bold tracking-tight leading-tight" style={{ color: "#FFFFFF" }}>
                {settings.store_name.split(/\s+/)[0]}{" "}
                {settings.store_name.split(/\s+/).slice(1).join(" ") && (
                  <span style={{ color: "#C9A45C" }}>
                    {settings.store_name.split(/\s+/).slice(1).join(" ")}
                  </span>
                )}
              </p>
              <p className="text-[10px] uppercase" style={{ color: "#D8B878", letterSpacing: "0.16em" }}>
                {settings.store_tagline}
              </p>
              {settings.phone && (
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(244,234,213,0.65)" }}>
                  {settings.phone}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p
              className="text-[10px] uppercase font-semibold"
              style={{ color: "#C9A45C", letterSpacing: "0.14em" }}
            >
              Aylık Hizmet Raporu
            </p>
            <p className="text-xl font-semibold mt-0.5" style={{ color: "#FFFFFF" }}>
              {customer.name}
            </p>
            {customer.address && (
              <p className="text-xs" style={{ color: "rgba(244,234,213,0.75)" }}>
                {customer.address}
              </p>
            )}
            <p className="text-xs mt-1 font-medium" style={{ color: "#D8B878" }}>
              Dönem: {periodLabel}
            </p>
          </div>
        </div>

        {/* ===== Summary ===== */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded border border-line p-3">
            <p className="text-[11px] text-ink/55">Sevkiyat Günü</p>
            <p className="font-semibold text-ink">{deliveryCount}</p>
          </div>
          <div className="rounded border border-line p-3">
            <p className="text-[11px] text-ink/55">Toplam Adet</p>
            <p className="font-semibold text-ink">{totalQty.toLocaleString("tr-TR")}</p>
          </div>
          <div className="rounded border border-line p-3 bg-gold-100/40">
            <p className="text-[11px] text-ink/55">Aylık Toplam</p>
            <p className="font-semibold text-accent">{formatTRY(monthlyTotal)}</p>
          </div>
        </div>

        {/* ===== Product totals (with prices) ===== */}
        <p className="text-sm font-medium text-ink/70 mb-2">Hizmet Detayı</p>
        <table className="w-full text-sm mb-6 min-w-[480px]">
          <thead>
            <tr className="text-left text-ink/60 border-b border-line">
              <th className="py-1.5 font-medium">Malzeme</th>
              <th className="py-1.5 font-medium text-right">Toplam Adet</th>
              <th className="py-1.5 font-medium text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {productRows.map((p) => (
              <tr key={p.name} className="border-b border-line/60">
                <td className="py-1.5">{p.name}</td>
                <td className="py-1.5 text-right">
                  {p.qty.toLocaleString("tr-TR")} {p.unit === "m2" ? "m²" : ""}
                </td>
                <td className="py-1.5 text-right">{formatTRY(p.amount)}</td>
              </tr>
            ))}
            {productRows.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-ink/40">
                  Bu dönemde hizmet yok.
                </td>
              </tr>
            )}
          </tbody>
          {productRows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-navy-700 bg-gold-100/40 font-semibold">
                <td className="py-2" colSpan={2}>
                  Aylık Toplam
                </td>
                <td className="py-2 text-right text-accent">{formatTRY(monthlyTotal)}</td>
              </tr>
            </tfoot>
          )}
        </table>

        {/* ===== Daily delivery breakdown ===== */}
        {dayRows.length > 0 && (
          <>
            <p className="text-sm font-medium text-ink/70 mb-2">Günlük Sevkiyatlar</p>
            <table className="w-full text-sm mb-6 min-w-[420px]">
              <thead>
                <tr className="text-left text-ink/60 border-b border-line">
                  <th className="py-1.5 font-medium">Tarih</th>
                  <th className="py-1.5 font-medium text-right">Adet</th>
                  <th className="py-1.5 font-medium text-right">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {dayRows.map(([date, e]) => (
                  <tr key={date} className="border-b border-line/60">
                    <td className="py-1.5">{formatDateTR(date)}</td>
                    <td className="py-1.5 text-right">{e.qty.toLocaleString("tr-TR")}</td>
                    <td className="py-1.5 text-right">{formatTRY(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <p className="text-center text-[11px] text-ink/40 mt-6">
          {settings.store_name} — {periodLabel} dönemi hizmet bedeli ödemeye tabidir.
        </p>
      </div>
    </div>
  );
}
