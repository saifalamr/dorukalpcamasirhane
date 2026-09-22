"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { MoneyInput } from "@/components/ui/MoneyInput";
import type { Product } from "@/types/database";

export function ProductFormModal({
  product,
  open,
  onClose,
}: {
  /** Existing product to edit, or null/undefined to create a new one. */
  product?: Product | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<"adet" | "m2">("adet");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!product;

  useEffect(() => {
    if (!open) return;
    if (product) {
      setName(product.name);
      setUnit(product.unit);
      setPrice(product.default_price ? String(product.default_price) : "");
    } else {
      setName("");
      setUnit("adet");
      setPrice("");
    }
    setError(null);
  }, [open, product]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      unit,
      defaultPrice: price === "" ? 0 : parseFloat(price),
    };

    const res = await fetch(isEdit ? `/api/malzemeler/${product!.id}` : "/api/malzemeler", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Bir hata oluştu.");
      return;
    }
    onClose();
    toast(isEdit ? "Malzeme güncellendi." : "Malzeme eklendi.", "success");
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Malzemeyi Düzenle" : "Yeni Malzeme"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Malzeme Adı *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="örn. Çarşaf Büyük"
            className="w-full rounded border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">
            Liste Fiyatı <span className="font-normal text-ink/40">(liste fiyata göre doldurulur)</span>
          </label>
          <MoneyInput value={price} onChange={setPrice} placeholder="0,00" />
          <p className="text-xs text-ink/40 mt-1">
            Müşteriye atanırken bu fiyat önerilir; müşteri sayfasından tek tek değiştirebilirsiniz.
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Birim</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setUnit("adet")}
              className={`rounded border px-3 py-2 text-sm transition-colors ${
                unit === "adet"
                  ? "border-navy-700 bg-gold-100/40 text-accent font-medium"
                  : "border-line bg-white text-ink/60 hover:bg-gold-100/60/50"
              }`}
            >
              Adet
            </button>
            <button
              type="button"
              onClick={() => setUnit("m2")}
              className={`rounded border px-3 py-2 text-sm transition-colors ${
                unit === "m2"
                  ? "border-navy-700 bg-gold-100/40 text-accent font-medium"
                  : "border-line bg-white text-ink/60 hover:bg-gold-100/60/50"
              }`}
            >
              m² (metrekare)
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-4 py-2 text-sm text-ink/60 hover:text-ink hover:bg-gold-100/60 transition-colors"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-navy-800 text-white text-sm font-medium px-4 py-2 hover:bg-navy-700 transition-colors disabled:opacity-60"
          >
            {saving ? "Kaydediliyor..." : isEdit ? "Değişiklikleri Kaydet" : "Malzeme Ekle"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
