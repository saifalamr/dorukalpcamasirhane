import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatTRY, formatDateTR, MONTHS_TR, toISODate } from "@/lib/format";
import { PrintButton } from "@/components/PrintButton";
import { derivePaymentStatus } from "@/lib/payment-status";
import { PaymentStatusChip } from "@/components/ui/PaymentStatusChip";
import { StatementLetterhead } from "@/components/StatementLetterhead";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ year?: string; month?: string }>;

type Line = {
  date: string;
  desc: string;
  debit: number; // billed
  credit: number; // paid
};

export default async function CustomerStatementPage({
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

  const [customerRes, recordsRes, itemsRes, paymentsRes, prevBilledRes, prevPaidRes] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).maybeSingle(),
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
        "daily_record_id, product_id, quantity, unit_price_snapshot, line_total, products(name, unit), daily_records!inner(record_date)"
      )
      .eq("daily_records.customer_id", id)
      .gte("daily_records.record_date", from)
      .lte("daily_records.record_date", to),
    supabase
      .from("customer_payments")
      .select("paid_at, amount, note")
      .eq("customer_id", id)
      .eq("period_month", `${monthKey}-01`)
      .order("paid_at"),
    // Opening balance: everything before this month minus everything paid before this month.
    supabase
      .from("daily_records_with_totals")
      .select("total_amount")
      .eq("customer_id", id)
      .lt("record_date", from),
    supabase
      .from("customer_payments")
      .select("amount")
      .eq("customer_id", id)
      .lt("period_month", `${monthKey}-01`),
  ]);

  const customer = customerRes.data;
  if (!customer) notFound();

  const records = recordsRes.data ?? [];
  const dateByRecord = new Map(records.map((r) => [r.id, r.record_date]));

  // Build ledger lines: receipts (fiş) and payments interleaved by date.
  const lines: Line[] = [];

  for (const it of itemsRes.data ?? []) {
    const anyIt: any = it;
    const date = anyIt.daily_records?.record_date ?? from;
    lines.push({
      date,
      desc: "Hizmet (fiş)",
      debit: Number(anyIt.line_total),
      credit: 0,
    });
  }
  for (const p of paymentsRes.data ?? []) {
    lines.push({
      date: p.paid_at,
      desc: p.note ? `Tahsilat — ${p.note}` : "Tahsilat",
      debit: 0,
      credit: Number(p.amount),
    });
  }
  lines.sort((a, b) => a.date.localeCompare(b.date));

  const openingBalance =
    (prevBilledRes.data ?? []).reduce((s, r) => s + Number(r.total_amount), 0) -
    (prevPaidRes.data ?? []).reduce((s, p) => s + Number(p.amount), 0);

  let running = openingBalance;
  const withRunning = lines.map((l) => {
    running += l.debit - l.credit;
    return { ...l, running };
  });

  const monthBilled = withRunning.reduce((s, l) => s + l.debit, 0);
  const monthPaid = withRunning.reduce((s, l) => s + l.credit, 0);
  const closing = openingBalance + monthBilled - monthPaid;
  const status = derivePaymentStatus(monthBilled, monthPaid);

  // Per-product summary for the month.
  const byProduct = new Map<string, { name: string; unit: string; qty: number; amount: number }>();
  for (const it of itemsRes.data ?? []) {
    const anyIt: any = it;
    const e =
      byProduct.get(anyIt.product_id) ??
      { name: anyIt.products?.name ?? "?", unit: anyIt.products?.unit ?? "adet", qty: 0, amount: 0 };
    e.qty += Number(anyIt.quantity);
    e.amount += Number(anyIt.line_total);
    byProduct.set(anyIt.product_id, e);
  }
  const productRows = Array.from(byProduct.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "tr")
  );

  return (
    <div>
      <div className="no-print flex items-center justify-between mb-6">
        <div>
          <Link href={`/musteriler/${id}`} className="text-sm text-gold-600 hover:underline">
            ← {customer.name}
          </Link>
          <h1 className="text-2xl font-semibold text-ink mt-1">
            Ekstre — {MONTHS_TR[month - 1]} {year}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/musteriler/${id}/ekstre?year=${month === 1 ? year - 1 : year}&month=${month === 1 ? 12 : month - 1}`}
            className="rounded border border-line bg-white text-sm px-3 py-2 hover:bg-gold-100/60"
          >
            ← Önceki ay
          </Link>
          <PrintButton customerName={customer.name} period={`${MONTHS_TR[month - 1]} ${year}`} />
        </div>
      </div>
        <div className="print-area bg-white rounded-md border border-line max-w-3xl p-4 md:p-8 shadow-sm mx-auto overflow-x-auto">
        {/* Branded letterhead — always navy/gold, even in dark mode & print */}
        <StatementLetterhead
          customerName={customer.name}
          address={customer.address}
          phone={customer.phone}
          period={`${MONTHS_TR[month - 1]} ${year}`}
          issued={formatDateTR(toISODate(new Date()))}
        />

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="rounded border border-line p-3">
            <p className="text-[11px] text-ink/55">Devreden Bakiye</p>
            <p className="font-semibold text-ink">{formatTRY(openingBalance)}</p>
          </div>
          <div className="rounded border border-line p-3">
            <p className="text-[11px] text-ink/55">Dönem Hizmeti</p>
            <p className="font-semibold text-ink">{formatTRY(monthBilled)}</p>
          </div>
          <div className="rounded border border-line p-3">
            <p className="text-[11px] text-ink/55">Dönem Tahsilat</p>
            <p className="font-semibold text-accent">{formatTRY(monthPaid)}</p>
          </div>
          <div className="rounded border border-line p-3 bg-gold-100/40">
            <p className="text-[11px] text-ink/55">Kalan Bakiye</p>
            <p className={`font-semibold ${closing > 0.009 ? "text-red-700" : "text-accent"}`}>
              {formatTRY(closing)}
            </p>
          </div>
        </div>

        {/* Product summary */}
        {productRows.length > 0 && (
          <>
            <p className="text-sm font-medium text-ink/70 mb-2">Hizmet Özeti</p>
            <table className="w-full text-sm mb-6 min-w-[440px]">
              <thead>
                <tr className="text-left text-ink/60 border-b border-line">
                  <th className="py-1.5 font-medium">Malzeme</th>
                  <th className="py-1.5 font-medium text-right">Adet</th>
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
              </tbody>
            </table>
          </>
        )}

        {/* Ledger */}
        <p className="text-sm font-medium text-ink/70 mb-2">Hesap Hareketleri</p>
        <table className="w-full text-sm mb-6 min-w-[520px]">
          <thead>
            <tr className="text-left text-ink/60 border-b border-line">
              <th className="py-1.5 font-medium">Tarih</th>
              <th className="py-1.5 font-medium">Açıklama</th>
              <th className="py-1.5 font-medium text-right">Borç</th>
              <th className="py-1.5 font-medium text-right">Alacak</th>
              <th className="py-1.5 font-medium text-right">Bakiye</th>
            </tr>
          </thead>
          <tbody>
            {openingBalance !== 0 && (
              <tr className="border-b border-line/60">
                <td className="py-1.5 text-ink/50">{formatDateTR(from)}</td>
                <td className="py-1.5 text-ink/50">Devreden bakiye</td>
                <td className="py-1.5 text-right text-ink/50">—</td>
                <td className="py-1.5 text-right text-ink/50">—</td>
                <td className="py-1.5 text-right font-medium">{formatTRY(openingBalance)}</td>
              </tr>
            )}
            {withRunning.map((l, i) => (
              <tr key={i} className="border-b border-line/60">
                <td className="py-1.5">{formatDateTR(l.date)}</td>
                <td className="py-1.5">{l.desc}</td>
                <td className="py-1.5 text-right">{l.debit > 0 ? formatTRY(l.debit) : "—"}</td>
                <td className="py-1.5 text-right text-gold-600">
                  {l.credit > 0 ? formatTRY(l.credit) : "—"}
                </td>
                <td className="py-1.5 text-right font-medium">{formatTRY(l.running)}</td>
              </tr>
            ))}
            {withRunning.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-ink/40">
                  Bu dönemde hareket yok.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-navy-700 bg-gold-100/40 font-semibold">
              <td className="py-2" colSpan={2}>
                Dönem Toplamı
              </td>
              <td className="py-2 text-right">{formatTRY(monthBilled)}</td>
              <td className="py-2 text-right text-accent">{formatTRY(monthPaid)}</td>
              <td className={`py-2 text-right ${closing > 0.009 ? "text-red-700" : "text-accent"}`}>
                {formatTRY(closing)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="flex items-center justify-between border-t border-line pt-4">
          <PaymentStatusChip status={status} showIcon />
          <p className="text-xs text-ink/40">
            Bakiye ödemeye tabidir — {MONTHS_TR[month - 1]} {year}
          </p>
        </div>
      </div>
    </div>
  );
}
