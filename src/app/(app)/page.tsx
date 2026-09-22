import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatTRY, toISODate } from "@/lib/format";
import {
  Wallet,
  PackageOpen,
  Users,
  CalendarRange,
  HandCoins,
  AlertCircle,
  ClipboardEdit,
  Users as UsersIcon,
  BarChart3,
  Receipt,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const today = toISODate(now);
  const monthStart = today.slice(0, 7) + "-01";
  const monthKey = today.slice(0, 7);

  const [
    { data: todayRecord },
    { data: monthRecords },
    { count: customerCount },
    { data: monthPayments },
    { data: outstandingRaw },
    { data: customersRaw },
  ] = await Promise.all([
    supabase
      .from("daily_records_with_totals")
      .select("total_quantity, total_amount, customer_id")
      .eq("record_date", today),
    supabase
      .from("daily_records_with_totals")
      .select("total_amount, customer_id")
      .gte("record_date", monthStart)
      .lte("record_date", today),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("active", true),
    supabase
      .from("customer_payments")
      .select("customer_id, amount")
      .gte("period_month", `${monthKey}-01`)
      .lte("period_month", `${monthKey}-01`),
    supabase
      .from("daily_records_with_totals")
      .select("customer_id, total_amount")
      .lt("record_date", monthStart),
    supabase.from("customers").select("id, name"),
  ]);

  // ===== Billing/paid aggregation =====
  const billedByCustomer = new Map<string, number>();
  for (const r of monthRecords ?? []) {
    billedByCustomer.set(r.customer_id, (billedByCustomer.get(r.customer_id) ?? 0) + Number(r.total_amount));
  }
  const paidByCustomer = new Map<string, number>();
  for (const p of monthPayments ?? []) {
    paidByCustomer.set(p.customer_id, (paidByCustomer.get(p.customer_id) ?? 0) + Number(p.amount));
  }

  // Outstanding from previous months (all history before this month).
  const oldBilledByCustomer = new Map<string, number>();
  for (const r of outstandingRaw ?? []) {
    oldBilledByCustomer.set(
      r.customer_id,
      (oldBilledByCustomer.get(r.customer_id) ?? 0) + Number(r.total_amount)
    );
  }
  const customerName = new Map((customersRaw ?? []).map((c) => [c.id, c.name]));

  const thisMonthBilled = Array.from(billedByCustomer.values()).reduce((s, v) => s + v, 0);
  const thisMonthPaid = Array.from(paidByCustomer.values()).reduce((s, v) => s + v, 0);

  // Old outstanding = previous-month billed minus ALL payments attributed to months <= previous.
  const { data: allOldPayments } = await supabase
    .from("customer_payments")
    .select("customer_id, amount")
    .lt("period_month", `${monthKey}-01`);
  const oldPaidByCustomer = new Map<string, number>();
  for (const p of allOldPayments ?? []) {
    oldPaidByCustomer.set(p.customer_id, (oldPaidByCustomer.get(p.customer_id) ?? 0) + Number(p.amount));
  }
  const oldOutstandingByCustomer = new Map<string, number>();
  for (const [cid, billed] of oldBilledByCustomer) {
    const bal = billed - (oldPaidByCustomer.get(cid) ?? 0);
    if (bal > 0.009) oldOutstandingByCustomer.set(cid, bal);
  }
  const oldOutstandingTotal = Array.from(oldOutstandingByCustomer.values()).reduce((s, v) => s + v, 0);

  // This month's outstanding per customer (for the panel): current-month billed
  // minus current-month payments, only where the customer has billing.
  const monthOutstanding = Array.from(billedByCustomer.entries())
    .map(([cid, billed]) => ({ cid, balance: billed - (paidByCustomer.get(cid) ?? 0) }))
    .filter((r) => r.balance > 0.009)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 6);

  const todayQty = (todayRecord ?? []).reduce((s, r) => s + Number(r.total_quantity), 0);
  const todayAmount = (todayRecord ?? []).reduce((s, r) => s + Number(r.total_amount), 0);
  const monthAmount = (monthRecords ?? []).reduce((s, r) => s + Number(r.total_amount), 0);

  const cards = [
    { label: "Bugünün Tutarı", value: formatTRY(todayAmount), Icon: Wallet, danger: false },
    { label: "Bu Ayın Toplamı", value: formatTRY(monthAmount), Icon: CalendarRange, danger: false },
    { label: "Bu Ay Tahsilat", value: formatTRY(thisMonthPaid), Icon: HandCoins, danger: false },
    {
      label: "Bekleyen Alacak (geçmiş)",
      value: formatTRY(oldOutstandingTotal),
      Icon: AlertCircle,
      danger: oldOutstandingTotal > 0.009,
    },
  ];

  const actions = [
    { href: "/giris", label: "Günlük Giriş", Icon: ClipboardEdit },
    { href: "/musteriler", label: "Müşteriler", Icon: UsersIcon },
    { href: "/rapor", label: "Raporlar", Icon: BarChart3 },
    { href: "/odemeler", label: "Tahsilat", Icon: Receipt },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Panel</h1>
          <p className="text-sm text-ink/60 mt-0.5">
            {now.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white rounded-md border border-line p-4 shadow-sm hover:shadow transition-shadow"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <span
                className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                  c.danger ? "bg-red-50 text-red-600" : "bg-gold-100/40 text-gold-600"
                }`}
              >
                <c.Icon size={16} />
              </span>
              <p className="text-xs text-ink/55 leading-tight">{c.label}</p>
            </div>
            <p
              className={`text-[1.35rem] leading-tight font-semibold tracking-tight tabular-nums ${
                c.danger ? "text-red-700" : "text-accent"
              }`}
            >
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Outstanding balances panel */}
        <div className="lg:col-span-2 bg-white rounded-md border border-line p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-ink/70">Bu Ay Ödemesi Bekleyenler</p>
            <Link href="/odemeler" className="text-xs text-gold-600 hover:underline">
              Tahsilat sayfası →
            </Link>
          </div>
          {monthOutstanding.length === 0 ? (
            <p className="text-sm text-ink/40 py-6 text-center">
              Bu ay için bekleyen bakiye yok. 👏
            </p>
          ) : (
            <ul className="divide-y divide-line/60">
              {monthOutstanding.map((r) => (
                <li key={r.cid} className="flex items-center justify-between py-2.5">
                  <span className="text-sm font-medium text-ink">
                    {customerName.get(r.cid) ?? "?"}
                  </span>
                  <span className="inline-flex items-center gap-3">
                    <span className="text-sm font-medium text-red-700">{formatTRY(r.balance)}</span>
                    <Link
                      href={`/odemeler?year=${now.getFullYear()}&month=${now.getMonth() + 1}`}
                      className="p-1 rounded text-ink/30 hover:text-gold-600 transition-colors"
                      title="Tahsilata git"
                    >
                      <ChevronRight size={15} />
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-md border border-line p-4 shadow-sm">
          <p className="text-sm font-medium text-ink/70 mb-3">Hızlı İşlemler</p>
          <div className="flex flex-col gap-2">
            {actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="inline-flex items-center gap-2 rounded border border-line bg-white text-sm font-medium px-4 py-2.5 text-ink hover:bg-gold-100/60 hover:border-gold-500 transition-colors"
              >
                <a.Icon size={15} className="text-gold-600" />
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
