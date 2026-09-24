"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Image as ImageIcon, Trash2, Save } from "lucide-react";
import type { AppSettings } from "@/lib/settings";
import { useToast } from "@/components/ui/Toast";

/**
 * Editable store settings. The logo is resized to max 256px on the client and
 * stored as a compact data-URL, so no storage bucket is needed.
 */
export function SettingsForm({ initial }: { initial: AppSettings }) {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    store_name: initial.store_name,
    store_tagline: initial.store_tagline,
    phone: initial.phone ?? "",
    address: initial.address ?? "",
    tax_number: initial.tax_number ?? "",
  });
  const [logo, setLogo] = useState<string | null>(initial.logo_url);
  const [saving, setSaving] = useState(false);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function pickLogo() {
    fileRef.current?.click();
  }

  async function onLogoFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast("Lütfen bir görsel dosyası seçin.", "error");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast("Dosya çok büyük (maks 8 MB).", "error");
      return;
    }
    try {
      const dataUrl = await resizeImage(file, 256);
      setLogo(dataUrl);
    } catch {
      toast("Görsel okunamadı, başka dosya deneyin.", "error");
    }
  }

  async function handleSave() {
    if (!form.store_name.trim()) {
      toast("Mağaza adı boş olamaz.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/ayarlar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, logo_url: logo }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Kaydedilemedi");
      toast("Ayarlar kaydedildi.", "success");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Kaydedilemedi", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Brand card */}
      <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={16} className="text-gold-600" />
          <h2 className="font-medium text-ink">Mağaza Bilgileri</h2>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm text-ink/70">Mağaza Adı</span>
            <input
              className="rounded border border-line bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-gold-500 outline-none"
              value={form.store_name}
              onChange={(e) => set("store_name", e.target.value)}
              maxLength={60}
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="grid gap-1.5">
              <span className="text-sm text-ink/70">Alt Etiket</span>
              <input
                className="rounded border border-line bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-gold-500 outline-none"
                value={form.store_tagline}
                onChange={(e) => set("store_tagline", e.target.value)}
                placeholder="Çamaşırhane"
                maxLength={40}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm text-ink/70">Telefon</span>
              <input
                className="rounded border border-line bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-gold-500 outline-none"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+90 ..."
                maxLength={30}
              />
            </label>
          </div>

          <label className="grid gap-1.5">
            <span className="text-sm text-ink/70">Adres</span>
            <textarea
              className="rounded border border-line bg-white px-3 py-2 text-sm min-h-[64px] focus:ring-2 focus:ring-gold-500/60 focus:border-gold-500 outline-none"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              maxLength={200}
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm text-ink/70">Vergi No (opsiyonel)</span>
            <input
              className="rounded border border-line bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-gold-500 outline-none"
              value={form.tax_number}
              onChange={(e) => set("tax_number", e.target.value)}
              maxLength={20}
            />
          </label>
        </div>
      </section>

      {/* Logo card */}
      <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon size={16} className="text-gold-600" />
          <h2 className="font-medium text-ink">Logo</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg border border-line bg-navy-50 flex items-center justify-center overflow-hidden shrink-0">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-xs text-ink/35">Yok</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={pickLogo}
                className="rounded bg-navy-800 text-white text-sm px-3.5 py-2 hover:bg-navy-700"
              >
                Görsel Seç
              </button>
              {logo && (
                <button
                  type="button"
                  onClick={() => setLogo(null)}
                  className="rounded border border-line text-sm px-3 py-2 hover:bg-red-50 hover:text-red-700 hover:border-red-300 flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> Kaldır
                </button>
              )}
            </div>
            <p className="text-xs text-ink/50">
              PNG / JPG — otomatik 256px'e küçültülür. Ekstrede ve menüde görünür.
            </p>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onLogoFile(f);
            e.target.value = "";
          }}
        />
      </section>

      {/* Sticky save */}
      <div className="sticky bottom-4 z-10">
        <div className="rounded-xl border border-line bg-white/95 backdrop-blur p-3 shadow-lg flex items-center justify-between">
          <p className="text-xs text-ink/50 px-1">Değişiklikler kaydedilince tüm sayfalara yansır.</p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-navy-800 text-white text-sm font-medium px-5 py-2.5 hover:bg-navy-700 disabled:opacity-60 flex items-center gap-2"
          >
            <Save size={15} />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Downscale an image file to a square-ish max-dimension data URL (JPEG). */
function resizeImage(file: File, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
