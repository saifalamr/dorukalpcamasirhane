"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Printer, MessageCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function DispatchActions({ fileName, customerName, periodLabel, customerPhone }: {
  fileName: string;
  customerName: string;
  periodLabel: string;
  customerPhone?: string | null;
}) {
  const { toast } = useToast();
  const cached = useRef<Promise<File> | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    cached.current = null;
    setFile(null);
    setFallback(false);
  }, [fileName]);

  function download(value: File) {
    const url = URL.createObjectURL(value);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = value.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function prepare(share: boolean) {
    setBusy(true);
    setFallback(false);
    try {
      if (!cached.current) {
        cached.current = import("@/lib/dispatch-pdf").then(async ({ dispatchNotesToPdf }) =>
          new File([await dispatchNotesToPdf()], `${fileName.replace(/[\\/:*?"<>|]/g, "-")}.pdf`,
            { type: "application/pdf" }));
      }
      const value = await cached.current;
      setFile(value);
      // Sharing uses a second tap after generation so iOS keeps user activation.
      if (!share) download(value);
    } catch (error) {
      cached.current = null;
      toast(error instanceof Error ? error.message : "PDF oluşturulamadı", "error");
    } finally {
      setBusy(false);
    }
  }

  async function shareReady() {
    if (!file) return;
    setBusy(true);
    try {
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        // Called before any await, directly from the user's tap.
        await navigator.share({
          files: [file],
          title: file.name,
          text: `${customerName} — ${periodLabel}`,
        });
        return;
      }
      download(file);
      setFallback(true);
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") {
        download(file);
        setFallback(true);
      }
    } finally {
      setBusy(false);
    }
  }

  const digits = (customerPhone ?? "").replace(/\D/g, "");
  const phone = digits.length === 11 && digits.startsWith("0") ? `90${digits.slice(1)}` : digits;
  const waUrl = `https://wa.me/${phone.length >= 10 ? phone : ""}?text=${encodeURIComponent(
    `${customerName} — ${periodLabel}\nİrsaliye ektedir. Teşekkürler!`
  )}`;

  return (
    <div className="no-print mb-6 flex flex-wrap items-center justify-end gap-2">
      <button type="button" disabled={busy} onClick={() => prepare(false)}
        className="inline-flex items-center gap-2 rounded bg-navy-800 text-white text-sm px-4 py-2 disabled:opacity-60">
        <Download size={15} /> PDF İndir
      </button>
      <button type="button" disabled={busy} onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded border border-line bg-white text-sm px-4 py-2">
        <Printer size={15} /> Yazdır
      </button>
      <button type="button" disabled={busy} onClick={() => file ? shareReady() : prepare(true)}
        className="inline-flex items-center gap-2 rounded bg-[#25D366] text-white text-sm px-4 py-2 disabled:opacity-60">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
        {busy ? "Hazırlanıyor..." : file ? "WhatsApp ile paylaş" : "WhatsApp"}
      </button>
      {file && !fallback && <p role="status" className="w-full text-right text-xs text-ink/60">
        PDF hazır. Göndermek için “WhatsApp ile paylaş” düğmesine dokunun.
      </p>}
      {fallback && <div role="status" className="w-full text-right text-sm">
        PDF indirildi. WhatsApp sohbetini açıp dosyayı ekleyin.{" "}
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="underline">WhatsApp’ı Aç</a>
      </div>}
    </div>
  );
}
