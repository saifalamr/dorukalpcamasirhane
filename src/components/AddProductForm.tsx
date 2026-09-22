"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddProductForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<"adet" | "m2">("adet");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/malzemeler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, unit }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Bir hata oluştu.");
      return;
    }
    setName(""); setUnit("adet"); setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded bg-teal-700 text-white text-sm font-medium px-4 py-2 hover:bg-teal-600 transition-colors">
        + Malzeme Ekle
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-md border border-line p-4 mb-5 flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-ink/70 mb-1">Malzeme Adı *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="rounded border border-line px-3 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-ink/70 mb-1">Birim</label>
        <select value={unit} onChange={(e) => setUnit(e.target.value as "adet" | "m2")} className="rounded border border-line px-3 py-1.5 text-sm">
          <option value="adet">adet</option>
          <option value="m2">m²</option>
        </select>
      </div>
      {error && <p className="text-xs text-red-600 w-full">{error}</p>}
      <button type="submit" disabled={saving} className="rounded bg-teal-700 text-white text-sm font-medium px-4 py-1.5 hover:bg-teal-600 disabled:opacity-60">
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink/50 px-2">İptal</button>
    </form>
  );
}
