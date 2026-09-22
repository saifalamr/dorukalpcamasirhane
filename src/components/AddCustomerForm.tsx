"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddCustomerForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/musteriler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, address }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Bir hata oluştu.");
      return;
    }
    setName(""); setPhone(""); setAddress(""); setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded bg-teal-700 text-white text-sm font-medium px-4 py-2 hover:bg-teal-600 transition-colors"
      >
        + Müşteri Ekle
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-md border border-line p-4 mb-5 flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-ink/70 mb-1">Müşteri Adı *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="rounded border border-line px-3 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-ink/70 mb-1">Telefon</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded border border-line px-3 py-1.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-ink/70 mb-1">Adres</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} className="rounded border border-line px-3 py-1.5 text-sm" />
      </div>
      {error && <p className="text-xs text-red-600 w-full">{error}</p>}
      <button type="submit" disabled={saving} className="rounded bg-teal-700 text-white text-sm font-medium px-4 py-1.5 hover:bg-teal-600 disabled:opacity-60">
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink/50 px-2">
        İptal
      </button>
    </form>
  );
}
