"use client";

import { MessageCircle } from "lucide-react";
import { formatDateTR } from "@/lib/format";

/**
 * Quick WhatsApp share from the fiş list: opens the customer's chat with a
 * delivery summary for that day. The price-free İrsaliye PDF can be
 * attached from the fiş detail page.
 */
export function FisWhatsAppLink({
  recordId,
  customerName,
  recordDate,
  totalQty,
  customerPhone,
}: {
  recordId: string;
  customerName: string;
  recordDate: string;
  totalQty: number;
  customerPhone?: string | null;
}) {
  function open() {
    const digits = (customerPhone ?? "").replace(/\D/g, "");
    const base = digits.length >= 10 ? `https://wa.me/${digits}` : "https://wa.me/";
    const text = encodeURIComponent(
      `*${customerName}* — Sevkiyat Bildirimi\nTarih: ${formatDateTR(recordDate)}\nToplam: ${totalQty.toLocaleString("tr-TR")} adet\n\nİrsaliye PDF'i ektedir. İyi günler! 🧺`
    );
    window.open(`${base}?text=${text}`, "_blank", "noopener");
  }

  return (
    <button
      onClick={open}
      className="p-1 rounded text-green-600/70 hover:text-green-600 hover:bg-green-50 transition-colors"
      title="WhatsApp ile sevkiyat bildir"
      aria-label={`${customerName} için WhatsApp gönder`}
    >
      <MessageCircle size={15} />
    </button>
  );
}
