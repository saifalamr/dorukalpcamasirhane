import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatTRY, formatDateTR } from "@/lib/format";
import {
  PERIOD_LABELS,
  resolveRange,
  previousRange,
  eachDay,
  daysCount,
  parsePeriod,
  type PeriodKey,
} from "@/lib/report-periods";
import { PeriodChart } from "@/components/PeriodChart";
import { derivePaymentStatus } from "@/lib/payment-status";
import { PaymentStatusChip } from "@/components/ui/PaymentStatusChip";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Wallet,
  PackageOpen,
  Receipt,
  CalendarCheck,
  Lightbulb,
  FileSpreadsheet,
  Trophy,
} from "lucide-react";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  period?: string;
  from?: string;
  to?: string;
  customer?: string;
}>;

function Delta({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-[11px] px-1.5 py-0.5 rounded bg-gold-100 text-accent font-medium">yeni</span>;
  }
  if (Math.abs(pct) < 0.5) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-ink/50">
        <Minus size={11} /> değişmedi
      </span>
    );
  }
  const up = pct > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
        up ? "text-gold-600" : "text-red-600"
      }`}
    >
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? "+" : ""}
      {pct.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}%
    </span>
  );
}

function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return cur > 0 ? null : 0;
  return ((cur - prev) / prev) * 100;
}

export default async function RaporPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const sp = await searchParams;

  const period = parsePeriod(sp.period);
  const customerId = sp.customer ?? "";
  const range = resolveRange(period, sp.from, sp.to);
  const prev = previousRange(range);

  const [{ data: customers }, { data: curRecords }, { data: prevRecords }, { data: periodPayments }] = await Promise.all([
    supabase.from("customers").select("id, name").order("name"),
    supabase
      .from("daily_records_with_totals")
      .select("id, customer_id, record_date, total_quantity, total_amount, customers(name)")
      .gte("record_date", range.from)
      .lte("record_date", range.to)
      .order("record_date")
      .then((r) => (customerId ? { data: (r.data ?? []).filter((x: any) => x.customer_id === customerId) } : r)),
    supabase
      .from("daily_records_with_totals")
      .select("total_quantity, total_amount, customer_id")
      .gte("record_date", prev.from)
      .lte("record_date", prev.to)
      .then((r) => (customerId ? { data: (r.data ?? []).filter((x: any) => x.customer_id === customerId) } : r)),
    // Payments attributed to the months covered by the selected range.
    supabase
      .from("customer_payments")
      .select("customer_id, amount")
      .gte("period_month", `${range.from.slice(0, 7)}-01`)
      .lte("period_month", `${range.to.slice(0, 7)}-01`),
  ]);

  const cur: any[] = curRecords ?? [];
  const prv: any[] = prevRecords ?? [];

  // ===== KPIs =====
  const income = cur.reduce((s, r) => s + Number(r.total_amount), 0);
  const qty = cur.reduce((s, r) => s + Number(r.total_quantity), 0);
  const receiptCount = cur.length;
  const activeDays = new Set(cur.map((r) => r.record_date)).size;
  const nDays = daysCount(range);

  const prevIncome = prv.reduce((s, r) => s + Number(r.total_amount), 0);
  const prevQty = prv.reduce((s, r) => s + Number(r.total_quantity), 0);
  const prevCount = prv.length;
  const prevActiveDays = new Set(prv.map((r: any) => r.record_date)).size;

  // ===== Daily chart data =====
  const dayMap = new Map<string, number>();
  for (const d of eachDay(range)) dayMap.set(d, 0);
  for (const r of cur) dayMap.set(r.record_date, (dayMap.get(r.record_date) ?? 0) + Number(r.total_amount));
  const chartData = Array.from(dayMap.entries()).map(([date, amount]) => ({ date, amount }));

  // ===== Top customers (scope = all) =====
  const paidByCustomer = new Map<string, number>();
  for (const p of periodPayments ?? []) {
    paidByCustomer.set(p.customer_id, (paidByCustomer.get(p.customer_id) ?? 0) + Number(p.amount));
  }
  const byCustomer = new Map<string, { name: string; amount: number; paid: number }>();
  for (const r of cur) {
    const id = r.customer_id;
    const name = r.customers?.name ?? "?";
    const e = byCustomer.get(id) ?? { name, amount: 0, paid: paidByCustomer.get(id) ?? 0 };
    e.amount += Number(r.total_amount);
    byCustomer.set(id, e);
  }
  const topCustomers = Array.from(byCustomer.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  // ===== Top products =====
  const itemRecordIds = cur.map((r) => r.id);
  const byProduct = new Map<string, { name: string; qty: number; amount: number }>();
  if (itemRecordIds.length > 0) {
    const { data: items } = await supabase
      .from("daily_record_items")
      .select("daily_record_id, product_id, quantity, line_total, products(name)")
      .in("daily_record_id", itemRecordIds);
    for (const it of items ?? []) {
      const anyIt: any = it;
      const e = byProduct.get(anyIt.product_id) ?? { name: anyIt.products?.name ?? "?", qty: 0, amount: 0 };
      e.qty += Number(anyIt.quantity);
      e.amount += Number(anyIt.line_total);
      byProduct.set(anyIt.product_id, e);
    }
  }
  const topProducts = Array.from(byProduct.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  // ===== Insights =====
  let bestDay: { date: string; amount: number } | null = null;
  for (const [date, amount] of dayMap) {
    if (amount > 0 && (!bestDay || amount > bestDay.amount)) bestDay = { date, amount };
  }
  const WEEKDAYS_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const weekdayTotals = new Array(7).fill(0) as number[];
  for (const r of cur) {
    const wd = new Date(r.record_date + "T00:00:00").getDay();
    weekdayTotals[wd] += Number(r.total_amount);
  }
  let bestWeekday: { name: string; amount: number } | null = null;
  for (let wd = 0; wd < 7; wd++) {
    if (weekdayTotals[wd] > 0 && (!bestWeekday || weekdayTotals[wd] > bestWeekday.amount)) {
      bestWeekday = { name: WEEKDAYS_TR[wd], amount: weekdayTotals[wd] };
    }
  }

  const periodLabel =
    period === "custom"
      ? `${formatDateTR(range.from)} – ${formatDateTR(range.to)}`
      : PERIOD_LABELS[period];

  const maxCustAmount = topCustomers[0]?.amount ?? 1;
  const maxProdAmount = topProducts[0]?.amount ?? 1;
  const selectedCustomer = (customers ?? []).find((c) => c.id === customerId);

  const chipHref = (p: PeriodKey) => {
    const params = new URLSearchParams();
    params.set("period", p);
    if (customerId) params.set("customer", customerId);
    return `/rapor?${params.toString()}`;
  };

  const kpis = [
    { label: "Toplam Gelir", value: formatTRY(income), delta: pctChange(income, prevIncome), Icon: Wallet },
    { label: "Toplam Adet", value: qty.toLocaleString("tr-TR"), delta: pctChange(qty, prevQty), Icon: PackageOpen },
    { label: "Fiş Sayısı", value: receiptCount.toLocaleString("tr-TR"), delta: pctChange(receiptCount, prevCount), Icon: Receipt },
    { label: "Çalışılan Gün", value: `${activeDays} / ${nDays}`, delta: pctChange(activeDays, prevActiveDays), Icon: CalendarCheck },
  ];

  return (
    <div>
      {/* Header + filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Raporlar</h1>
          <p className="text-sm text-ink/60 mt-0.5">
            {selectedCustomer ? `${selectedCustomer.name} — ` : "Tüm müşteriler — "}
            {periodLabel}
          </p>
        </div>
        <div className="flex gap-1.5 no-print">
          {(["today", "week", "month", "lastmonth"] as PeriodKey[]).map((p) => (
            <Link
              key={p}
              href={chipHref(p)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p
                  ? "bg-navy-800 text-white"
                  : "bg-white border border-line text-ink/60 hover:bg-gold-100/60 hover:text-ink"
              }`}
            >
              {PERIOD_LABELS[p]}
            </Link>
          ))}
        </div>
      </div>

      <form className="bg-white rounded-md border border-line p-4 mb-5 flex flex-wrap items-end gap-3 no-print">
        <input type="hidden" name="period" value={period === "custom" ? "custom" : period} />
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Müşteri</label>
          <select name="customer" defaultValue={customerId} className="rounded border border-line px-3 py-1.5 text-sm max-w-[200px]">
            <option value="">Tüm müşteriler</option>
            {(customers ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Başlangıç</label>
          <input type="date" name="from" defaultValue={sp.from ?? ""} className="rounded border border-line px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Bitiş</label>
          <input type="date" name="to" defaultValue={sp.to ?? ""} className="rounded border border-line px-3 py-1.5 text-sm" />
        </div>
        <button
          type="submit"
          className="rounded bg-navy-800 text-white text-sm font-medium px-4 py-1.5 hover:bg-navy-700"
        >
          Uygula
        </button>
        <p className="text-xs text-ink/40 ml-auto self-center hidden lg:block">
          İki tarih seçip uygularsanız özel aralık moduna geçer.
        </p>
      </form>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-md border border-line p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <k.Icon size={15} className="text-gold-600" />
              <p className="text-xs text-ink/55">{k.label}</p>
            </div>
            <p className="text-xl font-semibold text-accent">{k.value}</p>
            <div className="mt-1">
              <Delta pct={k.delta} />
              <span className="text-[11px] text-ink/40 ml-1">önceki döneme göre</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-md border border-line p-4 shadow-sm">
          <p className="text-sm font-medium text-ink/70 mb-3">Günlük Gelir</p>
          {chartData.length >= 2 ? (
            <PeriodChart data={chartData} />
          ) : (
            <p className="text-sm text-ink/40 py-8 text-center">Grafik için yeterli gün yok.</p>
          )}
        </div>
        <div className="bg-white rounded-md border border-line p-4 shadow-sm">
          <p className="text-sm font-medium text-ink/70 mb-3 flex items-center gap-1.5">
            <Lightbulb size={15} className="text-amber-600" /> Özet Bilgiler
          </p>
          <ul className="space-y-2.5 text-sm">
            <li className="flex justify-between gap-2">
              <span className="text-ink/60">Günlük ortalama</span>
              <span className="font-medium">{formatTRY(income / nDays)}</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-ink/60">Fiş başına ortalama</span>
              <span className="font-medium">{formatTRY(receiptCount > 0 ? income / receiptCount : 0)}</span>
            </li>
            {bestDay && (
              <li className="flex justify-between gap-2">
                <span className="text-ink/60">En iyi gün</span>
                <span className="font-medium text-accent">
                  {formatDateTR(bestDay.date)} ({formatTRY(bestDay.amount)})
                </span>
              </li>
            )}
            {bestWeekday && bestWeekday.amount > 0 && (
              <li className="flex justify-between gap-2">
                <span className="text-ink/60">En verimli gün</span>
                <span className="font-medium text-accent">{(bestWeekday as any).name}</span>
              </li>
            )}
            <li className="flex justify-between gap-2 border-t border-line pt-2.5">
              <span className="text-ink/60">Önceki dönem geliri</span>
              <span className="font-medium">{formatTRY(prevIncome)}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {!customerId && (
          <div className="bg-white rounded-md border border-line p-4 shadow-sm">
            <p className="text-sm font-medium text-ink/70 mb-3 flex items-center gap-1.5">
              <Trophy size={15} className="text-amber-600" /> En Çok Gelir Getiren Müşteriler
            </p>
            {topCustomers.length === 0 ? (
              <p className="text-sm text-ink/40 py-4 text-center">Bu dönemde kayıt yok.</p>
            ) : (
              <ul className="space-y-2.5">
                {topCustomers.map((c, i) => {
                  const status = derivePaymentStatus(c.amount, c.paid);
                  return (
                    <li key={c.name}>
                      <div className="flex items-baseline justify-between text-sm mb-1">
                        <span className="font-medium text-ink inline-flex items-center gap-2">
                          <span className="text-ink/40">{i + 1}.</span>
                          {c.name}
                          <PaymentStatusChip status={status} />
                        </span>
                        <span className="text-right">
                          <span className="font-medium text-accent">{formatTRY(c.amount)}</span>
                          {status !== "paid" && status !== "none" && (
                            <span className="block text-[11px] text-ink/50">
                              {formatTRY(c.paid)} tahsil edildi
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-1.5 bg-line/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-navy-700 rounded-full"
                          style={{ width: `${Math.max(4, (c.amount / maxCustAmount) * 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        <div className="bg-white rounded-md border border-line p-4 shadow-sm">
          <p className="text-sm font-medium text-ink/70 mb-3 flex items-center gap-1.5">
            <PackageOpen size={15} className="text-gold-600" /> En Çok Hasılat Getiren Malzemeler
          </p>
          {topProducts.length === 0 ? (
            <p className="text-sm text-ink/40 py-4 text-center">Bu dönemde kayıt yok.</p>
          ) : (
            <ul className="space-y-2.5">
              {topProducts.map((p, i) => (
                <li key={p.name}>
                  <div className="flex items-baseline justify-between text-sm mb-1">
                    <span className="font-medium text-ink">
                      <span className="text-ink/40 mr-1.5">{i + 1}.</span>
                      {p.name}
                      <span className="text-ink/40 font-normal ml-1.5 text-xs">
                        {p.qty.toLocaleString("tr-TR")} adet
                      </span>
                    </span>
                    <span className="font-medium text-accent">{formatTRY(p.amount)}</span>
                  </div>
                  <div className="h-1.5 bg-line/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.max(4, (p.amount / maxProdAmount) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Excel export (customer-specific, monthly) */}
      {customerId && (
        <div className="flex items-center justify-between bg-white rounded-md border border-line p-4 mb-6 no-print">
          <p className="text-sm text-ink/60">
            Bu müşterinin Excel matrisini indirmek için dönem seçin (aylık görünüm önerilir).
          </p>
          {period === "month" || period === "lastmonth" ? (
            <a
              href={`/api/excel-export?customer=${customerId}&year=${range.from.slice(0, 4)}&month=${Number(
                range.from.slice(5, 7)
              )}`}
              className="inline-flex items-center gap-2 rounded border border-navy-700 text-gold-600 text-sm font-medium px-4 py-2 hover:bg-gold-100/60 transition-colors shrink-0"
            >
              <FileSpreadsheet size={15} />
              Excel'e Aktar
            </a>
          ) : (
            <Link
              href={`/rapor?period=month&customer=${customerId}`}
              className="inline-flex items-center gap-2 rounded border border-line text-ink/60 text-sm font-medium px-4 py-2 hover:bg-gold-100/60 transition-colors shrink-0"
            >
              <FileSpreadsheet size={15} />
              Aylık görünüme geç
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
