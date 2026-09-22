"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Customer } from "@/types/database";

export function CustomerFormModal({
  customer,
  open,
  onClose,
}: {
  /** Existing customer to edit, or null/undefined to create a new one. */
  customer?: Customer | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!customer;

  // Re-sync local field state whenever the modal opens for a different customer.
  useEffect(() => {
    if (!open) return;
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone ?? "");
      setAddress(customer.address ?? "");
      setNotes(customer.notes ?? "");
    } else {
      setName("");
      setPhone("");
      setAddress("");
      setNotes("");
    }
    setError(null);
  }, [open, customer]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      phone: phone.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
    };

    const res = await fetch(isEdit ? `/api/musteriler/${customer!.id}` : "/api/musteriler", {
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
    toast(isEdit ? "Müşteri güncellendi." : "Müşteri eklendi.", "success");
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Müşteriyi Düzenle" : "Yeni Müşteri"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Müşteri Adı *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="örn. OTEL DUYSAN"
            className="w-full rounded border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1">Telefon</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="örn. 0532 000 00 00"
              className="w-full rounded border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1">Adres</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="örn. İstanbul"
              className="w-full rounded border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Notlar</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Fiyat anlaşması, ödeme koşulları, vb."
            className="w-full rounded border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60 resize-none"
          />
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
            {saving ? "Kaydediliyor..." : isEdit ? "Değişiklikleri Kaydet" : "Müşteri Oluştur"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
