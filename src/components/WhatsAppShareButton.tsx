"use client";

import { useRef, useState } from "react";
import { MessageCircle, FileText, FileSpreadsheet, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { printAreaToPdf } from "@/lib/pdf";

type ShareFormat = "pdf" | "excel";
type FileResult = { blob: Blob; name: string; type: string };

/**
 * WhatsApp share with a format choice (PDF / Excel).
 *
 * Browser rules this component is built around:
 * - navigator.share() must run inside the tap's transient user activation
 *   (a few seconds). Generating a PDF takes longer, so files are
 *   PRE-GENERATED when the menu opens; the share call after the option tap
 *   is instant and the activation is still fresh. This is what makes the
 *   native share sheet (Android/Chrome) actually appear.
 * - Desktop popup blockers reject window.open() after an async delay, so
 *   the desktop fallback shows an in-page "WhatsApp'ı Aç" link instead —
 *   a real anchor the user taps (always allowed).
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
  const [fallback, setFallback] = useState<{ waUrl: string; name: string } | null>(null);
  // Pre-generated files, keyed by format (promises so both formats can race).
  const pregen = useRef<Partial<Record<ShareFormat, Promise<FileResult | null>>>>({});

  async function generate(format: ShareFormat): Promise<FileResult | null> {
    try {
      if (format === "pdf") {
        const blob = await printAreaToPdf();
        return { blob, name: `${fileName}.pdf`, type: "application/pdf" };
      }
      if (!excelUrl) return null;
      const res = await fetch(excelUrl);
      if (!res.ok) throw new Error("Excel oluşturulamadı");
      const blob = await res.blob();
      return {
        blob,
        name: `${fileName}.xlsx`,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
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

  /** Kick off generation as soon as the menu opens (no await — background). */
  function openMenu() {
    setFallback(null);
    setOpen(true);
    if (withPdf && !pregen.current.pdf) pregen.current.pdf = generate("pdf");
    if (withExcel && !pregen.current.excel) pregen.current.excel = generate("excel");
  }

  async function share(format: ShareFormat) {
    setBusy(format);
    try {
      const file = await pregen.current[format];
      if (!file) return;

      const webFile = new File([file.blob], file.name, { type: file.type });

      const nav = navigator as Navigator & {
        canShare?: (d: { files?: File[] }) => boolean;
        share?: (d: { files?: File[]; title?: string; text?: string }) => Promise<void>;
      };

      const tryShare = async (f: File): Promise<boolean> => {
        if (!nav.canShare?.({ files: [f] }) || !nav.share) return false;
        try {
          await nav.share({ files: [f], title: f.name, text: `${customerName} — ${periodLabel}` });
          return true;
        } catch (shareErr) {
          if ((shareErr as DOMException)?.name === "AbortError") return true; // user closed the sheet
          return false;
        }
      };

      // Fresh-tap path: blob is cached, so this call is instant and the
      // transient activation from the option tap is still valid.
      if (await tryShare(webFile)) return;

      // Android/Chrome reject spreadsheet MIME types in the share sheet but
      // accept the same bytes as a generic binary — retry once that way so
      // Excel gets the SAME native share-sheet experience as PDF.
      if (format === "excel") {
        const generic = new File([file.blob], file.name, { type: "application/octet-stream" });
        if (await tryShare(generic)) return;
      }

      // Fallback (desktop / unsupported): download + visible WhatsApp link.
      const url = URL.createObjectURL(file.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setFallback({ waUrl: waChatUrl(), name: file.name });
    } finally {
      setBusy(null);
    }
  }

  if (!withPdf && !withExcel) return null;
  const single = withPdf !== withExcel;

  return (
    <div className="relative no-print">
      <button
        onClick={() => (single ? (openMenu(), share(withPdf ? "pdf" : "excel")) : openMenu())}
        disabled={busy !== null}
        className="inline-flex items-center gap-2 rounded bg-[#25D366] text-white text-sm font-medium px-4 py-2 hover:brightness-95 transition disabled:opacity-60"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
        {busy ? "Hazırlanıyor..." : label}
      </button>

      {open && !single && !fallback && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-60 rounded-lg border border-line bg-white shadow-lg z-40 overflow-hidden animate-slide-down">
            <p className="px-3 pt-2.5 pb-1 text-[11px] text-ink/50">Dosya olarak gönder:</p>
            {withPdf && (
              <button
                onClick={() => { setOpen(false); share("pdf"); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gold-100/60 transition-colors text-left"
              >
                <FileText size={15} className="text-red-600" />
                PDF olarak gönder
              </button>
            )}
            {withExcel && (
              <button
                onClick={() => { setOpen(false); share("excel"); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gold-100/60 transition-colors text-left"
              >
                <FileSpreadsheet size={15} className="text-green-700" />
                Excel olarak gönder
              </button>
            )}
          </div>
        </>
      )}

      {/* Desktop fallback panel: file downloaded, open WhatsApp by real tap. */}
      {fallback && (
        <div className="absolute right-0 mt-2 w-72 rounded-lg border border-line bg-white shadow-lg z-40 p-3 animate-slide-down">
          <p className="text-sm font-medium text-ink flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-green-600" />
            Dosya hazır
          </p>
          <p className="text-xs text-ink/60 mt-1">
            <span className="font-medium">{fallback.name}</span> indirildi. WhatsApp'ı açıp dosyayı sohbete ekleyin:
          </p>
          <a
            href={fallback.waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded bg-[#25D366] text-white text-sm font-medium px-3 py-2 hover:brightness-95 transition"
          >
            <ExternalLink size={14} />
            WhatsApp'ı Aç
          </a>
          <button
            onClick={() => setFallback(null)}
            className="mt-1.5 w-full text-xs text-ink/50 hover:text-ink transition-colors py-1"
          >
            Kapat
          </button>
        </div>
      )}
    </div>
  );
}
