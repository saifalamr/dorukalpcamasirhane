"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, HandCoins, History, Plus, Search, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { PaymentStatusChip, derivePaymentStatus } from "@/components/ui/PaymentStatusChip";
import { formatTRY, formatDateTR, MONTHS_TR, toISODate } from "@/lib/format";
import type { CustomerPayment } from "@/types/database";

export type CustomerBalance = {
  /** Only id + name are needed; pages pass a lean projection. */
  customer: { id: string; name: string };
  billed: number;
  paid: number;
  balance: number;
};

type PaymentDialogState = {
  open: boolean;
  row: CustomerBalance | null;
  history: CustomerPayment[];
  loadingHistory: boolean;
};

function statusChip(balance: number, billed: number) {
  return <PaymentStatusChip status={derivePaymentStatus(billed, billed - balance)} />;
}

export function PaymentsTable({
  rows,
  monthLabel,
  monthKey,
}: {
  rows: CustomerBalance[];
  /** Human label like "Eylül 2026". */
  monthLabel: string;
  /** Machine key like "2026-09" used by the API. */
  monthKey: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<PaymentDialogState>({
    open: false,
    row: null,
    history: [],
    loadingHistory: false,
  });
  // Payment modal fields
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(() => toISODate(new Date()));
  const [note, setNote] = useState("");
  const [payError, setPayError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr");
    if (!q) return rows;
    return rows.filter((r) => r.customer.name.toLocaleLowerCase("tr").includes(q));
  }, [rows, search]);

  async function openPaymentDialog(row: CustomerBalance) {
    setAmount(row.balance > 0.009 ? String(row.balance.toFixed(2)) : "");
    setPaidAt(toISODate(new Date()));
    setNote("");
    setPayError(null);
    setDialog({ open: true, row, history: [], loadingHistory: true });

    const res = await fetch(`/api/odemeler?customer=${row.customer.id}&month=${monthKey}`);
    const body = await res.json().catch(() => ({ payments: [] }));
    setDialog((d) => ({ ...d, history: body.payments ?? [], loadingHistory: false }));
  }

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!dialog.row) return;
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setPayError("Geçerli bir tutar girin.");
      return;
    }
    setPayError(null);
    setSavingId(dialog.row.customer.id);
    const res = await fetch("/api/odemeler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: dialog.row.customer.id,
        amount: value,
        month: monthKey,
        paidAt,
        note: note || null,
      }),
    });
    setSavingId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setPayError(body.error ?? "Kaydedilemedi.");
      return;
    }
    setDialog({ open: false, row: null, history: [], loadingHistory: false });
    router.refresh();
  }

  async function deletePayment(id: string) {
    await fetch(`/api/odemeler/${id}`, { method: "DELETE" });
    setDialog((d) => ({ ...d, history: d.history.filter((h) => h.id !== id) }));
    router.refresh();
  }

  async function collectAll(row: CustomerBalance) {
    if (row.balance <= 0.009) return;
    setSavingId(row.customer.id);
    await fetch("/api/odemeler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: row.customer.id,
        amount: Number(row.balance.toFixed(2)),
        month: monthKey,
        note: `${monthLabel} bakiyesi tamamı`,
      }),
    });
    setSavingId(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Müşteri ara..."
            className="w-56 rounded border border-line bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60"
          />
        </div>
      </div>

      <div className="bg-white rounded-md border border-line overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="bg-gold-100/50 text-ink/70 text-left">
              <th className="px-4 py-2.5 font-medium">Müşteri</th>
              <th className="px-4 py-2.5 font-medium text-right">Kesilen ({monthLabel})</th>
              <th className="px-4 py-2.5 font-medium text-right">Tahsil Edilen</th>
              <th className="px-4 py-2.5 font-medium text-right">Kalan Bakiye</th>
              <th className="px-4 py-2.5 font-medium">Durum</th>
              <th className="px-4 py-2.5 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.customer.id} className="border-t border-line hover:bg-gold-100/40 transition-colors">
                <td className="px-4 py-2.5 font-medium text-ink">{r.customer.name}</td>
                <td className="px-4 py-2.5 text-right text-ink/70">{formatTRY(r.billed)}</td>
                <td className="px-4 py-2.5 text-right text-ink/70">{formatTRY(r.paid)}</td>
                <td className={`px-4 py-2.5 text-right font-medium ${r.balance > 0.009 ? "text-red-700" : "text-accent"}`}>
                  {formatTRY(r.balance)}
                </td>
                <td className="px-4 py-2.5">{statusChip(r.balance, r.billed)}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className="inline-flex items-center gap-3">
                    {r.balance > 0.009 && (
                      <button
                        onClick={() => collectAll(r)}
                        disabled={savingId === r.customer.id}
                        className="inline-flex items-center gap-1 text-xs text-gold-600 hover:underline disabled:opacity-50"
                      >
                        <Check size={13} />
                        Tamamını Al
                      </button>
                    )}
                    <button
                      onClick={() => openPaymentDialog(r)}
                      className="inline-flex items-center gap-1 text-xs text-ink/60 hover:text-ink hover:underline"
                    >
                      <HandCoins size={13} />
                      Tahsilat
                    </button>
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink/40 text-sm">
                  {rows.length === 0
                    ? "Bu ay için fiş kesilen müşteri yok."
                    : "Aramanızla eşleşen müşteri yok."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Payment dialog */}
      <Modal
        open={dialog.open}
        onClose={() => setDialog({ open: false, row: null, history: [], loadingHistory: false })}
        title={dialog.row ? `Tahsilat — ${dialog.row.customer.name}` : ""}
      >
        {dialog.row && (
          <form onSubmit={submitPayment} className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded bg-gold-100/40 p-2.5 text-center">
                <p className="text-[11px] text-ink/55">Kesilen</p>
                <p className="font-semibold text-ink">{formatTRY(dialog.row.billed)}</p>
              </div>
              <div className="rounded bg-gold-100/40 p-2.5 text-center">
                <p className="text-[11px] text-ink/55">Tahsil</p>
                <p className="font-semibold text-ink">{formatTRY(dialog.row.paid)}</p>
              </div>
              <div className="rounded bg-amber-50 p-2.5 text-center">
                <p className="text-[11px] text-ink/55">Kalan</p>
                <p className="font-semibold text-amber-600">{formatTRY(dialog.row.balance)}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1">Tutar *</label>
              <MoneyInput value={amount} onChange={setAmount} autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1">Tahsil Tarihi</label>
              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="w-full rounded border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1">Not</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="örn. nakit, havale, kısmi ödeme"
                className="w-full rounded border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60"
              />
            </div>
            {payError && <p className="text-sm text-red-600">{payError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDialog({ open: false, row: null, history: [], loadingHistory: false })}
                className="rounded px-4 py-2 text-sm text-ink/60 hover:text-ink hover:bg-gold-100/60 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={savingId === dialog.row.customer.id}
                className="rounded bg-navy-800 text-white text-sm font-medium px-4 py-2 hover:bg-navy-700 transition-colors disabled:opacity-60"
              >
                {savingId === dialog.row.customer.id ? "Kaydediliyor..." : "Tahsilatı Kaydet"}
              </button>
            </div>

            {/* History */}
            <div className="border-t border-line pt-3">
              <p className="text-xs font-medium text-ink/60 mb-2 flex items-center gap-1.5">
                <History size={13} /> {monthLabel} tahsilat geçmişi
              </p>
              {dialog.loadingHistory ? (
                <p className="text-xs text-ink/40">Yükleniyor...</p>
              ) : dialog.history.length === 0 ? (
                <p className="text-xs text-ink/40">Kayıt yok.</p>
              ) : (
                <ul className="space-y-1.5">
                  {dialog.history.map((h) => (
                    <li key={h.id} className="flex items-center justify-between text-sm">
                      <span className="text-ink/70">
                        {formatDateTR(h.paid_at)}
                        {h.note ? ` — ${h.note}` : ""}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="font-medium">{formatTRY(Number(h.amount))}</span>
                        <button
                          onClick={() => deletePayment(h.id)}
                          className="p-1 rounded text-ink/30 hover:text-red-600 transition-colors"
                          title="Sil"
                          aria-label="Tahsilatı sil"
                        >
                          <Trash2 size={13} />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
