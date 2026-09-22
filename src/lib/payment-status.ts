// Shared (server + client safe — no "use client") payment-status logic.
// Kept out of PaymentStatusChip.tsx because server components can import
// helpers from here but cannot call functions defined in a "use client" file.

export type PaymentStatus = "paid" | "partial" | "unpaid" | "none";

/** Derives the status from billed/paid amounts (with float tolerance). */
export function derivePaymentStatus(billed: number, paid: number): PaymentStatus {
  if (billed <= 0.009) return "none";
  const balance = billed - paid;
  if (balance <= 0.009) return "paid";
  if (paid > 0.009) return "partial";
  return "unpaid";
}
