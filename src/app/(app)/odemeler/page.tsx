import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatTRY, MONTHS_TR } from "@/lib/format";
import { PaymentsTable, type CustomerBalance } from "@/components/PaymentsTable";
import { ChevronLeft, ChevronRight, HandCoins, Wallet, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

function monthRange(year: number, month: number) {
  const nDays = new Date(year, month, 0).getDate();
  return {
    from: `${year}-${String(month).padStart(2, "0")}-01`,
    to: `${year}-${String(month).padStart(2, "0")}-${String(nDays).padStart(2, "0")}`,
  };
}

export default async function OdemelerPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const supabase = await createClient();
  const sp = await searchParams;

  const now = new Date();
  const year = parseInt(sp.year ?? String(now.getFullYear()), 10) || now.getFullYear();
  const month = parseInt(sp.month ?? String(now.getMonth() + 1), 10) || now.getMonth() + 1;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const monthLabel = `${MONTHS_TR[month - 1]} ${year}`;
  const { from, to } = monthRange(year, month);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevHref = `/odemeler?year=${prevYear}&month=${prevMonth}`;
  const nextDate = new Date(year, month, 1); // first day of next month
  const isCurrentOrFuture = nextDate > now;
  const nextHref = isCurrentOrFuture
    ? null
    : `/odemeler?year=${nextDate.getFullYear()}&month=${nextDate.getMonth() + 1}`;

  // Exactly three parallel queries — the selected month only. The previous
  // "prevIncome" query was dead code (never rendered) and the payments query
  // pulled two months of rows when only the selected month is displayed.
  const [customersRes, recordsRes, paymentsRes] = await Promise.all([
    supabase.from("customers").select("id, name").order("name"),
    supabase
      .from("daily_records_with_totals")
      .select("customer_id, total_amount")
      .gte("record_date", from)
      .lte("record_date", to),
    supabase
      .from("customer_payments")
      .select("customer_id, amount")
      .gte("period_month", `${monthKey}-01`)
      .lte("period_month", `${monthKey}-01`),
  ]);

  const customers = customersRes.data ?? [];
  const records = recordsRes.data ?? [];
  const payments = paymentsRes.data ?? [];

  // Billed per customer for the selected month.
  const billedByCustomer = new Map<string, number>();
  for (const r of records) {
    billedByCustomer.set(
      r.customer_id,
      (billedByCustomer.get(r.customer_id) ?? 0) + Number(r.total_amount)
    );
  }

  // Payments per customer for the selected month only.
  const paidByCustomer = new Map<string, number>();
  for (const p of payments) {
    paidByCustomer.set(p.customer_id, (paidByCustomer.get(p.customer_id) ?? 0) + Number(p.amount));
  }

  const rows: CustomerBalance[] = customers.map((c) => {
    const billed = billedByCustomer.get(c.id) ?? 0;
    const paid = paidByCustomer.get(c.id) ?? 0;
    return { customer: c, billed, paid, balance: billed - paid };
  });

  const totalBilled = rows.reduce((s, r) => s + r.billed, 0);
  const totalPaid = rows.reduce((s, r) => s + r.paid, 0);
  const totalOutstanding = rows.reduce((s, r) => s + Math.max(0, r.balance), 0);
  const collectionRate = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Tahsilat</h1>
          <p className="text-sm text-ink/60 mt-0.5">{monthLabel} — müşteri bazında ödeme durumu</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href={prevHref}
            className="p-2 rounded border border-line bg-white hover:bg-gold-100/60 transition-colors"
            aria-label="Önceki ay"
          >
            <ChevronLeft size={16} />
          </Link>
          <span className="text-sm font-medium text-ink px-2 min-w-[110px] text-center">{monthLabel}</span>
          {nextHref ? (
            <Link
              href={nextHref}
              className="p-2 rounded border border-line bg-white hover:bg-gold-100/60 transition-colors"
              aria-label="Sonraki ay"
            >
              <ChevronRight size={16} />
            </Link>
          ) : (
            <span className="p-2 rounded border border-line/50 text-ink/25" aria-disabled>
              <ChevronRight size={16} />
            </span>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-md border border-line p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={15} className="text-gold-600" />
            <p className="text-xs text-ink/55">Kesilen Fatura</p>
          </div>
          <p className="text-xl font-semibold text-ink tabular-nums">{formatTRY(totalBilled)}</p>
        </div>
        <div className="bg-white rounded-md border border-line p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <HandCoins size={15} className="text-gold-600" />
            <p className="text-xs text-ink/55">Tahsil Edilen</p>
          </div>
          <p className="text-xl font-semibold text-accent tabular-nums">{formatTRY(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-md border border-line p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={15} className="text-red-600" />
            <p className="text-xs text-ink/55">Bekleyen Alacak</p>
          </div>
          <p className="text-xl font-semibold text-red-700 tabular-nums">{formatTRY(totalOutstanding)}</p>
        </div>
        <div className="bg-white rounded-md border border-line p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={15} className="text-amber-600" />
            <p className="text-xs text-ink/55">Tahsilat Oranı</p>
          </div>
          <p className="text-xl font-semibold text-ink tabular-nums">{collectionRate.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}%</p>
          <div className="h-1.5 bg-line/50 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-navy-700 rounded-full transition-all"
              style={{ width: `${Math.min(100, collectionRate)}%` }}
            />
          </div>
        </div>
      </div>

      <PaymentsTable rows={rows} monthLabel={monthLabel} monthKey={monthKey} />
    </div>
  );
}
