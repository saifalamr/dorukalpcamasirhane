"use client";

import { useState } from "react";
import { MessageCircle, FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { printAreaToPdf } from "@/lib/pdf";

type ShareFormat = "pdf" | "excel";

/**
 * WhatsApp share with a format choice: PDF (snapshot of this page's
 * .print-area, generated client-side) or Excel (server-generated xlsx).
 *
 * Delivery strategy:
 * 1. Web Share API with files (Android/Chrome) → file goes straight into
 *    the WhatsApp share sheet.
 * 2. Otherwise → file downloads, WhatsApp opens with the chat + prefilled
 *    message and the user attaches the file.
 */
export function WhatsAppShareButton({
  fileName,
  withPdf = true,
  withExcel = false,
  excelUrl,
  customerName,
  periodLabel,
  customerPhone,
  label = "WhatsApp",
}: {
  /** Base file name without extension. */
  fileName: string;
  withPdf?: boolean;
  withExcel?: boolean;
  excelUrl?: string;
  customerName: string;
  periodLabel: string;
  customerPhone?: string | null;
  label?: string;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ShareFormat | null>(null);

  async function generate(format: ShareFormat): Promise<{ blob: Blob; name: string } | null> {
    try {
      if (format === "pdf") {
        const blob = await printAreaToPdf();
        return { blob, name: `${fileName}.pdf` };
      }
      if (!excelUrl) return null;
      const res = await fetch(excelUrl);
      if (!res.ok) throw new Error("Excel oluşturulamadı");
      return { blob: await res.blob(), name: `${fileName}.xlsx` };
    } catch (e) {
      toast(e instanceof Error ? e.message : "Dosya oluşturulamadı", "error");
      return null;
    }
  }

  function waChatUrl(): string {
    const digits = (customerPhone ?? "").replace(/\D/g, "");
    const base = digits.length >= 10 ? `https://wa.me/${digits}` : "https://wa.me/";
    const text = encodeURIComponent(`*${customerName}* — ${periodLabel}\nRapor ektedir. Teşekkürler! 🧺`);
    return `${base}?text=${text}`;
  }

  async function share(format: ShareFormat) {
    setOpen(false);
    setBusy(format);
    try {
      const file = await generate(format);
      if (!file) return;

      const webFile = new File([file.blob], file.name, {
        type:
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const nav = navigator as Navigator & {
        canShare?: (d: { files?: File[] }) => boolean;
        share?: (d: { files?: File[]; title?: string; text?: string }) => Promise<void>;
      };
      if (nav.canShare?.({ files: [webFile] }) && nav.share) {
        await nav.share({ files: [webFile], title: file.name, text: `${customerName} — ${periodLabel}` });
        return;
      }

      // Desktop fallback: download + open chat with prefilled text.
      const url = URL.createObjectURL(file.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      window.open(waChatUrl(), "_blank", "noopener");
      toast("Dosya indirildi — WhatsApp'ta sohbete ekleyin.", "success");
    } finally {
      setBusy(null);
    }
  }

  if (!withPdf && !withExcel) return null;

  const single = withPdf !== withExcel; // only one option → no menu needed

  return (
    <div className="relative no-print">
      <button
        onClick={() => (single ? share(withPdf ? "pdf" : "excel") : setOpen((o) => !o))}
        disabled={busy !== null}
        className="inline-flex items-center gap-2 rounded bg-[#25D366] text-white text-sm font-medium px-4 py-2 hover:brightness-95 transition disabled:opacity-60"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
        {busy ? "Hazırlanıyor..." : label}
      </button>

      {open && !single && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-line bg-white shadow-lg z-40 overflow-hidden animate-slide-down">
            <p className="px-3 pt-2.5 pb-1 text-[11px] text-ink/50">Dosya olarak gönder:</p>
            {withPdf && (
              <button
                onClick={() => share("pdf")}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gold-100/60 transition-colors text-left"
              >
                <FileText size={15} className="text-red-600" />
                PDF olarak gönder
              </button>
            )}
            {withExcel && (
              <button
                onClick={() => share("excel")}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gold-100/60 transition-colors text-left"
              >
                <FileSpreadsheet size={15} className="text-green-700" />
                Excel olarak gönder
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
