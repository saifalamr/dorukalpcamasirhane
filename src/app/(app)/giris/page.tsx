"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { formatTRY, toISODate } from "@/lib/format";
import { AlertCircle, Check, ChevronDown, Package, Plus, Save, Users } from "lucide-react";
import type { Customer, Product } from "@/types/database";

type Row = {
  productId: string;
  productName: string;
  unit: string;
  unitPrice: number;
  quantity: string; // kept as string for free-form typing
};

function todayISO() {
  // Local date — toISOString() is UTC and returns yesterday between 00:00–03:00 TRT.
  return toISODate(new Date());
}

export default function GunlukGirisPage() {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState<Row[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);

  // Full catalog for the "Ek Malzeme Ekle" picker.
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [addProductId, setAddProductId] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addPermanent, setAddPermanent] = useState(true);
  const [adding, setAdding] = useState(false);

  // Refs for every quantity input, so keyboard nav can move between them.
  const qtyRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data }, { data: products }] = await Promise.all([
        supabase.from("customers").select("*").eq("active", true).order("name"),
        supabase.from("products").select("*").eq("active", true).order("name"),
      ]);
      if (!cancelled) {
        setCustomers(data ?? []);
        setAllProducts(products ?? []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (!customerId || !date) {
      setRows([]);
      return;
    }

    let cancelled = false;
    setLoadingRows(true);
    setSaved(false);

    (async () => {
      try {
        // One round-trip: assigned products + existing record + its items, all in parallel.
        const [{ data: assigned }, recordResult] = await Promise.all([
          supabase
            .from("customer_products")
            .select("product_id, unit_price, products(name, unit)")
            .eq("customer_id", customerId)
            .eq("active", true),
          supabase
            .from("daily_records")
            .select("id, daily_record_items(product_id, quantity, unit_price_snapshot)")
            .eq("customer_id", customerId)
            .eq("record_date", date)
            .maybeSingle(),
        ]);

        const record = recordResult.data;
        let existingItems: Record<string, { quantity: number; unit_price_snapshot: number }> = {};
        if (record) {
          if (!cancelled) setExistingRecordId(record.id);
          existingItems = Object.fromEntries(
            ((record as any).daily_record_items ?? []).map((i: any) => [
              i.product_id,
              { quantity: i.quantity, unit_price_snapshot: i.unit_price_snapshot },
            ])
          );
        } else {
          if (!cancelled) setExistingRecordId(null);
        }

        if (cancelled) return;

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
        setFocusIdx(null);
      } finally {
        if (!cancelled) setLoadingRows(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customerId, date, supabase]);

  /**
   * Add an item to today's entry on the fly. Optionally saves it to the
   * customer's permanent list (customer_products) at the same time.
   */
  async function handleAddItem() {
    if (!customerId || !addProductId || adding) return;
    if (rows.some((r) => r.productId === addProductId)) {
      // Already in the table — just jump to its quantity field.
      qtyRefs.current[addProductId]?.focus();
      return;
    }
    setAdding(true);
    const product = allProducts.find((p) => p.id === addProductId);
    if (!product) return;

    const price = addPrice === "" ? product.default_price : parseFloat(addPrice);

    // Permanently assign at this price so tomorrow's entry includes it too.
    if (addPermanent) {
      await fetch(`/api/musteriler/${customerId}/urunler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: addProductId, unitPrice: price }),
      });
    }

    setRows((prev) =>
      [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          unitPrice: price,
          quantity: "",
        },
      ].sort((a, b) => a.productName.localeCompare(b.productName, "tr"))
    );
    setSaved(false);
    setAddProductId("");
    setAddPrice("");
    setAdding(false);

    // Focus the new row's quantity field for immediate entry.
    setTimeout(() => qtyRefs.current[product.id]?.focus(), 50);
  }

  function updateQuantity(productId: string, value: string) {
    if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
    setRows((prev) =>
      prev.map((r) => (r.productId === productId ? { ...r, quantity: value } : r))
    );
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

  /** Keyboard flow: Enter or ArrowDown/ArrowUp moves between quantity fields. */
  function handleRowKey(e: React.KeyboardEvent<HTMLInputElement>, idx: number) {
    const last = rows.length - 1;
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      if (idx < last) {
        const next = rows[idx + 1].productId;
        qtyRefs.current[next]?.focus();
        qtyRefs.current[next]?.select();
      } else {
        // Last row: Enter saves.
        (document.getElementById("save-btn") as HTMLButtonElement)?.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (idx > 0) {
        const prev = rows[idx - 1].productId;
        qtyRefs.current[prev]?.focus();
        qtyRefs.current[prev]?.select();
      }
    }
  }

  async function handleSave() {
    if (!customerId || saving) return;
    setSaving(true);
    setSaved(false);
    const items = rows
      .filter((r) => r.quantity !== "" && parseFloat(r.quantity) >= 0)
      .map((r) => ({
        productId: r.productId,
        quantity: parseFloat(r.quantity),
        unitPrice: r.unitPrice,
      }));

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
      toast("Fiş kaydedildi.", "success");
    } else {
      toast("Kaydedilemedi — tekrar deneyin.", "error");
    }
  }

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const filledCount = rows.filter((r) => r.quantity !== "" && parseFloat(r.quantity) > 0).length;

  const itemPicker = (
    <div className="mt-3 max-w-2xl bg-white rounded-md border border-dashed border-line p-3">
      <p className="text-xs font-medium text-ink/60 mb-2 flex items-center gap-1.5">
        <Plus size={13} className="text-gold-600" />
        Listede olmayan bir malzeme ekleyin
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <select
          value={addProductId}
          onChange={(e) => {
            setAddProductId(e.target.value);
            const p = allProducts.find((x) => x.id === e.target.value);
            setAddPrice(p?.default_price ? String(p.default_price) : "");
          }}
          className="rounded border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60 min-w-[180px] flex-1"
        >
          <option value="">Malzeme seçin...</option>
          {allProducts
            .filter((p) => !rows.some((r) => r.productId === p.id))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/50 text-sm">₺</span>
          <input
            type="text"
            inputMode="decimal"
            value={addPrice}
            onChange={(e) => {
              const v = e.target.value.replace(",", ".");
              if (v !== "" && !/^\d*\.?\d*$/.test(v)) return;
              setAddPrice(v);
            }}
            placeholder="Fiyat"
            className="w-28 rounded border border-line bg-white pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60"
          />
        </div>
        <button
          onClick={handleAddItem}
          disabled={!addProductId || adding}
          className="inline-flex items-center gap-1.5 rounded bg-navy-800 text-white text-sm font-medium px-4 py-2 hover:bg-navy-700 transition-colors disabled:opacity-50 shrink-0"
        >
          <Plus size={15} />
          Ekle
        </button>
      </div>
      <label className="mt-2 flex items-center gap-2 text-xs text-ink/60 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={addPermanent}
          onChange={(e) => setAddPermanent(e.target.checked)}
          className="accent-navy-700"
        />
        Bu müşterinin kalıcı listesine de ekle (yarınki giriş için hatırlanır)
      </label>
    </div>
  );

  return (
    <div className="pb-28">
      {/* Header with pickers */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-ink">Günlük Giriş</h1>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1">Müşteri</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="rounded border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60 min-w-[200px]"
            >
              <option value="">Seçiniz...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1">Tarih</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60"
            />
          </div>
        </div>
      </div>

      {existingRecordId && (
        <div className="animate-slide-down flex items-center gap-2 bg-amber-100/70 border border-amber-500/30 text-amber-600 rounded-md px-4 py-2.5 mb-4 text-sm">
          <AlertCircle size={15} className="shrink-0" />
          Bu müşteri ve tarih için kayıt zaten var — düzenliyorsunuz.
        </div>
      )}

      {!customerId ? (
        <div className="bg-white rounded-md border border-line p-10 text-center shadow-sm">
          <Users size={32} className="mx-auto text-ink/25 mb-3" />
          <p className="text-sm text-ink/50">
            Devam etmek için yukarıdan bir müşteri seçin.
          </p>
        </div>
      ) : loadingRows ? (
        <div className="bg-white rounded-md border border-line p-6 space-y-3 max-w-2xl shadow-sm">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 bg-gold-100/40/80 rounded animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="max-w-2xl space-y-3">
          <div className="bg-white rounded-md border border-line p-8 text-center shadow-sm">
            <Package size={28} className="mx-auto text-ink/25 mb-3" />
            <p className="text-sm text-ink/50">
              <span className="font-medium text-ink">{selectedCustomer?.name}</span> için tanımlı malzeme yok —
              hemen aşağıdan bugünün fişine malzeme ekleyebilirsiniz.
            </p>
          </div>
          {itemPicker}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-md border border-line overflow-hidden max-w-2xl shadow-sm">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="bg-gold-100/50 text-ink/70 text-left">
                  <th className="px-4 py-2.5 font-medium">Malzeme</th>
                  <th className="px-4 py-2.5 font-medium text-right">Birim Fiyat</th>
                  <th className="px-4 py-2.5 font-medium text-right w-28">Adet</th>
                  <th className="px-4 py-2.5 font-medium text-right">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const q = parseFloat(r.quantity) || 0;
                  const isFocused = focusIdx === idx;
                  return (
                    <tr
                      key={r.productId}
                      className={`border-t border-line transition-colors ${
                        isFocused ? "bg-gold-100/70" : q > 0 ? "bg-gold-100/40" : ""
                      }`}
                    >
                      <td className={`px-4 py-2 font-medium ${q > 0 ? "text-ink" : "text-ink/70"}`}>
                        {r.productName}
                      </td>
                      <td className="px-4 py-2 text-right text-ink/70">{formatTRY(r.unitPrice)}</td>
                      <td className="px-4 py-2">
                        <input
                          ref={(el) => {
                            qtyRefs.current[r.productId] = el;
                          }}
                          type="text"
                          inputMode="decimal"
                          value={r.quantity}
                          onFocus={() => setFocusIdx(idx)}
                          onBlur={() => setFocusIdx(null)}
                          onChange={(e) => updateQuantity(r.productId, e.target.value)}
                          onKeyDown={(e) => handleRowKey(e, idx)}
                          placeholder="0"
                          className={`w-full rounded border px-2 py-1.5 text-right focus:outline-none focus:ring-2 focus:ring-gold-500/60 transition-colors ${
                            q > 0 ? "border-gold-500/50 bg-gold-100/40/50 font-medium" : "border-line bg-white"
                          }`}
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
                <tr className="border-t-2 border-navy-700 bg-gold-100/40/60 font-semibold">
                  <td className="px-4 py-2.5">Toplam</td>
                  <td></td>
                  <td className="px-4 py-2.5 text-right">
                    {totals.qty.toLocaleString("tr-TR")}
                  </td>
                  <td className="px-4 py-2.5 text-right text-accent">
                    {formatTRY(totals.amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
            </div>
          </div>

          {/* On-the-fly item picker */}
          {itemPicker}

          <p className="text-xs text-ink/40 mt-2 max-w-2xl">
            İpucu: satırlar arasında gezinmek için <kbd className="px-1 rounded border border-line bg-white">Enter</kbd>{" "}
            veya <kbd className="px-1 rounded border border-line bg-white">↓</kbd> kullanın — son satırda Enter
            kaydetmeye götürür.
          </p>
        </>
      )}

      {/* Sticky save bar */}
      {customerId && rows.length > 0 && !loadingRows && (
        <div className="fixed bottom-0 left-0 md:left-60 right-0 z-40 no-print">
          <div className="mx-4 md:mx-8 my-4 max-w-[1400px] bg-navy-950 text-white rounded-lg shadow-xl border border-navy-800 px-4 md:px-5 py-3 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {selectedCustomer?.name}
                <span className="text-gold-100/60 font-normal"> — {date.split("-").reverse().join(".")}</span>
              </p>
              <p className="text-xs text-gold-100/70">
                {filledCount} kalem · {totals.qty.toLocaleString("tr-TR")} adet ·{" "}
                <span className="font-semibold text-white">{formatTRY(totals.amount)}</span>
              </p>
            </div>
            {saved && (
              <span className="animate-slide-down inline-flex items-center gap-1.5 text-sm text-gold-100">
                <Check size={16} className="text-gold-400" /> Kaydedildi
              </span>
            )}
            <button
              id="save-btn"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded bg-navy-700 text-white text-sm font-medium px-5 py-2.5 hover:bg-navy-600 transition-colors disabled:opacity-60 shrink-0"
            >
              {saving ? (
                <>
                  <ChevronDown size={16} className="animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Kaydet
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
