"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatTRY } from "@/lib/format";
import type { Customer } from "@/types/database";

type Row = {
  productId: string;
  productName: string;
  unit: string;
  unitPrice: number;
  quantity: string; // kept as string for free-form typing
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function GunlukGirisPage() {
  const supabase = useMemo(() => createClient(), []);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState<Row[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("customers")
      .select("*")
      .eq("active", true)
      .order("name")
      .then(({ data }) => setCustomers(data ?? []));
  }, [supabase]);

  useEffect(() => {
    if (!customerId || !date) {
      setRows([]);
      return;
    }
    setLoadingRows(true);
    setSaved(false);

    (async () => {
      const { data: assigned } = await supabase
        .from("customer_products")
        .select("product_id, unit_price, products(name, unit)")
        .eq("customer_id", customerId)
        .eq("active", true);

      const { data: record } = await supabase
        .from("daily_records")
        .select("id")
        .eq("customer_id", customerId)
        .eq("record_date", date)
        .maybeSingle();

      let existingItems: Record<string, { quantity: number; unit_price_snapshot: number }> = {};
      if (record) {
        setExistingRecordId(record.id);
        const { data: items } = await supabase
          .from("daily_record_items")
          .select("product_id, quantity, unit_price_snapshot")
          .eq("daily_record_id", record.id);
        existingItems = Object.fromEntries(
          (items ?? []).map((i) => [i.product_id, { quantity: i.quantity, unit_price_snapshot: i.unit_price_snapshot }])
        );
      } else {
        setExistingRecordId(null);
      }

      const nextRows: Row[] = (assigned ?? [])
        .map((a: any) => {
          const existing = existingItems[a.product_id];
          return {
            productId: a.product_id,
            productName: a.products?.name ?? "",
            unit: a.products?.unit ?? "adet",
            unitPrice: existing ? Number(existing.unit_price_snapshot) : Number(a.unit_price),
            quantity: existing ? String(existing.quantity) : "",
          };
        })
        .sort((a, b) => a.productName.localeCompare(b.productName, "tr"));

      setRows(nextRows);
      setLoadingRows(false);
    })();
  }, [customerId, date, supabase]);

  function updateQuantity(productId: string, value: string) {
    if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
    setRows((prev) => prev.map((r) => (r.productId === productId ? { ...r, quantity: value } : r)));
    setSaved(false);
  }

  const totals = rows.reduce(
    (acc, r) => {
      const q = parseFloat(r.quantity) || 0;
      acc.qty += q;
      acc.amount += q * r.unitPrice;
      return acc;
    },
    { qty: 0, amount: 0 }
  );

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const items = rows
      .filter((r) => r.quantity !== "" && parseFloat(r.quantity) >= 0)
      .map((r) => ({ productId: r.productId, quantity: parseFloat(r.quantity), unitPrice: r.unitPrice }));

    const res = await fetch("/api/gunluk-kayit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, date, items, recordId: existingRecordId }),
    });

    setSaving(false);
    if (res.ok) {
      const body = await res.json();
      setExistingRecordId(body.id);
      setSaved(true);
    }
  }

  const selectedCustomer = customers.find((c) => c.id === customerId);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-6">Günlük Giriş</h1>

      <div className="bg-white rounded-md border border-line p-5 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-ink/80 mb-1">Müşteri</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full rounded border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="">Seçiniz...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/80 mb-1">Tarih</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>
      </div>

      {existingRecordId && (
        <p className="text-xs text-amber-600 mb-3">
          Bu müşteri ve tarih için mevcut bir kayıt bulundu — düzenliyorsunuz.
        </p>
      )}

      {!customerId ? (
        <p className="text-sm text-ink/50">Devam etmek için bir müşteri seçin.</p>
      ) : loadingRows ? (
        <p className="text-sm text-ink/50">Yükleniyor...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-ink/50">
          {selectedCustomer?.name} için tanımlı malzeme yok. Önce{" "}
          <a href="/musteriler" className="text-teal-700 underline">Müşteriler</a> sayfasından malzeme atayın.
        </p>
      ) : (
        <>
          <div className="bg-white rounded-md border border-line overflow-hidden max-w-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-teal-50 text-ink/70 text-left">
                  <th className="px-4 py-2.5 font-medium">Malzeme</th>
                  <th className="px-4 py-2.5 font-medium text-right">Birim Fiyat</th>
                  <th className="px-4 py-2.5 font-medium text-right w-28">Adet</th>
                  <th className="px-4 py-2.5 font-medium text-right">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const q = parseFloat(r.quantity) || 0;
                  return (
                    <tr key={r.productId} className="border-t border-line">
                      <td className="px-4 py-2">{r.productName}</td>
                      <td className="px-4 py-2 text-right text-ink/70">{formatTRY(r.unitPrice)}</td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={r.quantity}
                          onChange={(e) => updateQuantity(r.productId, e.target.value)}
                          className="w-full rounded border border-line px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-ink">
                        {q > 0 ? formatTRY(q * r.unitPrice) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-teal-700 bg-teal-50/60 font-semibold">
                  <td className="px-4 py-2.5">Toplam</td>
                  <td></td>
                  <td className="px-4 py-2.5 text-right">{totals.qty.toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-2.5 text-right text-teal-900">{formatTRY(totals.amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded bg-teal-700 text-white text-sm font-medium px-5 py-2.5 hover:bg-teal-600 transition-colors disabled:opacity-60"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            {saved && <span className="text-sm text-teal-700">Kaydedildi ✓</span>}
          </div>
        </>
      )}
    </div>
  );
}
