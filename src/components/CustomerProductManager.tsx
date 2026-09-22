"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatTRY } from "@/lib/format";
import type { CustomerProduct, Product } from "@/types/database";

export function CustomerProductManager({
  customerId,
  allProducts,
  assigned,
}: {
  customerId: string;
  allProducts: Product[];
  assigned: CustomerProduct[];
}) {
  const router = useRouter();
  const [newProductId, setNewProductId] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});

  const assignedMap = useMemo(() => new Map(assigned.map((a) => [a.product_id, a])), [assigned]);
  const availableToAdd = allProducts.filter((p) => !assignedMap.has(p.id));
  const productName = (id: string) => allProducts.find((p) => p.id === id)?.name ?? "";

  function selectNewProduct(id: string) {
    setNewProductId(id);
    // Prefill with the catalog's list price so entry is usually just a click on Ekle.
    const selected = allProducts.find((p) => p.id === id);
    setNewPrice(selected?.default_price ? String(selected.default_price) : "");
  }

  async function addProduct() {
    if (!newProductId || newPrice === "") return;
    setSaving(true);
    await fetch(`/api/musteriler/${customerId}/urunler`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: newProductId, unitPrice: parseFloat(newPrice) }),
    });
    setSaving(false);
    setNewProductId("");
    setNewPrice("");
    router.refresh();
  }

  async function savePrice(productId: string) {
    const value = priceEdits[productId];
    if (value === undefined) return;
    await fetch(`/api/musteriler/${customerId}/urunler/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unit_price: parseFloat(value) }),
    });
    router.refresh();
  }

  async function toggleActive(productId: string, active: boolean) {
    await fetch(`/api/musteriler/${customerId}/urunler/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    router.refresh();
  }

  return (
    <div>
      <div className="bg-white rounded-md border border-line overflow-hidden mb-4">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="bg-gold-100/50 text-ink/70 text-left">
              <th className="px-4 py-2.5 font-medium">Malzeme</th>
              <th className="px-4 py-2.5 font-medium text-right w-40">Birim Fiyat</th>
              <th className="px-4 py-2.5 font-medium">Durum</th>
              <th className="px-4 py-2.5 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {assigned.map((a) => (
              <tr key={a.id} className="border-t border-line">
                <td className="px-4 py-2.5">{productName(a.product_id)}</td>
                <td className="px-4 py-2.5 text-right">
                  <input
                    type="text"
                    inputMode="decimal"
                    defaultValue={a.unit_price}
                    onChange={(e) => setPriceEdits((prev) => ({ ...prev, [a.product_id]: e.target.value }))}
                    onBlur={() => savePrice(a.product_id)}
                    className="w-24 rounded border border-line px-2 py-1 text-right"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded ${a.active ? "bg-gold-100 text-accent" : "bg-line text-ink/50"}`}>
                    {a.active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => toggleActive(a.product_id, a.active)} className="text-xs text-ink/50 hover:underline">
                    {a.active ? "Pasifleştir" : "Aktifleştir"}
                  </button>
                </td>
              </tr>
            ))}
            {assigned.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink/40 text-sm">
                  Henüz malzeme atanmadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {availableToAdd.length > 0 && (
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1">Malzeme Ekle</label>
            <select
              value={newProductId}
              onChange={(e) => selectNewProduct(e.target.value)}
              className="rounded border border-line px-3 py-1.5 text-sm"
            >
              <option value="">Seçiniz...</option>
              {availableToAdd.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1">Birim Fiyat</label>
            <input
              type="text"
              inputMode="decimal"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-28 rounded border border-line px-3 py-1.5 text-sm"
            />
          </div>
          <button
            onClick={addProduct}
            disabled={saving}
            className="rounded bg-navy-800 text-white text-sm font-medium px-4 py-1.5 hover:bg-navy-700 disabled:opacity-60"
          >
            Ekle
          </button>
        </div>
      )}
    </div>
  );
}
