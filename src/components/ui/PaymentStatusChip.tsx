"use client";

import { Check, CircleDollarSign, TriangleAlert } from "lucide-react";
import { derivePaymentStatus, type PaymentStatus } from "@/lib/payment-status";

// Re-export so client components can keep importing both from here.
export { derivePaymentStatus };
export type { PaymentStatus };

const STYLES: Record<PaymentStatus, { label: string; cls: string; Icon: typeof Check | null }> = {
  paid: { label: "Ödendi", cls: "bg-gold-100 text-accent", Icon: Check },
  partial: { label: "Kısmi", cls: "bg-amber-100 text-amber-600", Icon: CircleDollarSign },
  unpaid: { label: "Ödenmedi", cls: "bg-red-100 text-red-700", Icon: TriangleAlert },
  none: { label: "Fiş yok", cls: "bg-line/60 text-ink/50", Icon: null },
};

export function PaymentStatusChip({
  status,
  showIcon = false,
}: {
  status: PaymentStatus;
  showIcon?: boolean;
}) {
  const s = STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${s.cls}`}>
      {showIcon && s.Icon && <s.Icon size={11} />}
      {s.label}
    </span>
  );
}
