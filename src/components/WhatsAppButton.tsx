"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { formatTRY } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";

/**
 * "Send via WhatsApp": opens WhatsApp (app on mobile, web on desktop) with a
 * pre-filled professional summary of the monthly bill. The full branded PDF
 * is generated from the same page via "PDF İndir" and attached in the chat.
 */
export function WhatsAppButton({
  customerName,
  period,
  monthlyTotal,
  deliveryCount,
  customerPhone,
}: {
  customerName: string;
  period: string;
  monthlyTotal: number;
  deliveryCount: number;
  customerPhone?: string | null;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  function buildMessage() {
    const lines = [
      `*${customerName}* — Aylık Hizmet Raporu`,
      `Dönem: ${period}`,
      "",
      `Sevkiyat günü: ${deliveryCount}`,
      `Aylık toplam: *${formatTRY(monthlyTotal)}*`,
      "",
      "Detaylı rapor ve hesap ekstresi ekteymiş gibi PDF olarak gönderilebilir.",
      "Teşekkürler! 🧺",
    ];
    return lines.join("\n");
  }

  function openWhatsApp() {
    const text = encodeURIComponent(buildMessage());
    // If we know the customer's phone, deep-link the chat; otherwise share picker.
    let base = "https://wa.me/";
    if (customerPhone) {
      const digits = customerPhone.replace(/\D/g, "");
      if (digits.length >= 10) base += digits; // wa.me accepts international digits
    }
    const url = `${base}?text=${text}`;
    window.open(url, "_blank", "noopener");
    toast("WhatsApp açıldı — rapor metni hazır.", "success");
  }

  return (
    <button
      onClick={openWhatsApp}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded bg-[#25D366] text-white text-sm font-medium px-4 py-2 hover:brightness-95 transition disabled:opacity-60"
      title="WhatsApp ile gönder"
    >
      <MessageCircle size={15} />
      WhatsApp ile Gönder
    </button>
  );
}
