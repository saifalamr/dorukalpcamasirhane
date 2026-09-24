import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateTR, formatTRY } from "@/lib/format";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function FisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: record } = await supabase
    .from("daily_records")
    .select("id, record_date, customer_id, customers(name, address, phone)")
    .eq("id", id)
    .maybeSingle();

  if (!record) notFound();
  const rec: any = record;

  const { data: items } = await supabase
    .from("daily_record_items")
    .select("quantity, unit_price_snapshot, line_total, products(name, unit)")
    .eq("daily_record_id", id)
    .order("created_at");

  const totalQty = (items ?? []).reduce(
    (s, i: any) => s + Number(i.quantity),
    0
  );
  const totalAmount = (items ?? []).reduce(
    (s, i: any) => s + Number(i.line_total),
    0
  );
  const customer: any = rec.customers;

  return (
    <div>
      <div className="no-print flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-ink">Günlük Fiş</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/fisler/${id}/irsaliye`}
            className="inline-flex items-center gap-2 rounded border border-line bg-white text-sm font-medium px-4 py-2 text-ink hover:bg-gold-100/60 transition-colors"
          >
            İrsaliye (Fiyatsız)
          </Link>
          <PrintButton />
        </div>
      </div>

      <div className="print-area bg-white rounded-md border border-line max-w-2xl p-8 shadow-sm">
        <div className="flex items-start justify-between border-b border-line pb-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink/50">
              Günlük Fiş
            </p>
            <p className="text-xl font-semibold text-ink mt-1">
              {customer?.name}
            </p>
            {customer?.address && (
              <p className="text-sm text-ink/60 mt-0.5">{customer.address}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-ink/60">Tarih</p>
            <p className="text-lg font-medium text-ink">
              {formatDateTR(rec.record_date)}
            </p>
          </div>
        </div>

        <table className="w-full text-sm mb-6 min-w-[420px]">
          <thead>
            <tr className="text-left text-ink/60 border-b border-line">
              <th className="py-2 font-medium">Malzeme</th>
              <th className="py-2 font-medium text-right">Adet</th>
              <th className="py-2 font-medium text-right">Birim Fiyat</th>
              <th className="py-2 font-medium text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((i: any, idx: number) => (
              <tr key={idx} className="border-b border-line/60">
                <td className="py-2">{i.products?.name}</td>
                <td className="py-2 text-right">
                  {Number(i.quantity).toLocaleString("tr-TR")}{" "}
                  {i.products?.unit}
                </td>
                <td className="py-2 text-right">
                  {formatTRY(Number(i.unit_price_snapshot))}
                </td>
                <td className="py-2 text-right font-medium">
                  {formatTRY(Number(i.line_total))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between text-sm text-ink/70 py-1">
              <span>Toplam Adet</span>
              <span>{totalQty.toLocaleString("tr-TR")}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-accent py-1 border-t border-line mt-1 pt-2">
              <span>Genel Toplam</span>
              <span>{formatTRY(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}