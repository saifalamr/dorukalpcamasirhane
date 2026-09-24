import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTR } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { PrintButton } from "@/components/PrintButton";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * İrsaliye — customer-facing delivery note. Price-free by design:
 * products, quantities and dates only. Prices stay in the database for
 * monthly billing; this document never shows them.
 */
export default async function IrsaliyePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const [{ data: record }, settings] = await Promise.all([
    supabase
      .from("daily_records")
      .select("id, record_date, customer_id, customers(name, address, phone)")
      .eq("id", id)
      .maybeSingle(),
    getSettings(),
  ]);

  if (!record) notFound();
  const rec: any = record;
  const customer: any = rec.customers;

  const { data: items } = await supabase
    .from("daily_record_items")
    .select("quantity, products(name, unit)")
    .eq("daily_record_id", id)
    .order("created_at");

  const totalQty = (items ?? []).reduce((s, i: any) => s + Number(i.quantity), 0);
  const brandWords = settings.store_name.trim().split(/\s+/);

  return (
    <div>
      <div className="no-print flex items-center justify-between mb-6">
        <Link href={`/fisler/${id}`} className="text-sm text-gold-600 hover:underline">
          ← Fişe Dön
        </Link>
        <div className="flex items-center gap-2">
          <WhatsAppShareButton
            fileName={`Irsaliye - ${customer?.name ?? ""} - ${rec.record_date}`}
            customerName={customer?.name ?? ""}
            periodLabel={formatDateTR(rec.record_date)}
            customerPhone={customer?.phone}
          />
          <PrintButton
            customerName={customer?.name}
            period={formatDateTR(rec.record_date)}
          />
        </div>
      </div>

      <div className="print-area bg-white rounded-md border border-line max-w-2xl p-8 shadow-sm mx-auto">
        {/* Letterhead */}
        <div
          className="flex items-start justify-between gap-4 rounded-md px-5 py-4 mb-6"
          style={{ background: "#0E1A2B" }}
        >
          <div className="flex items-center gap-3">
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logo_url}
                alt=""
                className="rounded object-contain shrink-0"
                style={{ width: 44, height: 44, background: "#1E3252", border: "1px solid #C9A45C" }}
              />
            ) : (
              <div
                className="rounded flex items-center justify-center shrink-0"
                style={{ width: 44, height: 44, background: "#1E3252", border: "1px solid #C9A45C" }}
              >
                <svg width="27" height="27" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M3 17.5 9.2 8.2l3.4 5 2.1-2.9L21 17.5H3Z" fill="#C9A45C" />
                  <path
                    d="M12 3.2c1.1 1.5 2.3 3.2 2.3 4.6a2.3 2.3 0 1 1-4.6 0c0-1.4 1.2-3.1 2.3-4.6Z"
                    fill="#F4EAD5"
                  />
                </svg>
              </div>
            )}
            <div>
              <p className="text-lg font-bold tracking-tight leading-tight" style={{ color: "#FFFFFF" }}>
                {brandWords[0]}{" "}
                {brandWords.slice(1).join(" ") && (
                  <span style={{ color: "#C9A45C" }}>{brandWords.slice(1).join(" ")}</span>
                )}
              </p>
              <p className="text-[10px] uppercase" style={{ color: "#D8B878", letterSpacing: "0.16em" }}>
                {settings.store_tagline}
              </p>
              {settings.phone && (
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(244,234,213,0.65)" }}>
                  {settings.phone}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p
              className="text-[10px] uppercase font-semibold"
              style={{ color: "#C9A45C", letterSpacing: "0.14em" }}
            >
              İrsaliye / Sevkiyat Fişi
            </p>
            <p className="text-xl font-semibold mt-0.5" style={{ color: "#FFFFFF" }}>
              {customer?.name}
            </p>
            {customer?.address && (
              <p className="text-xs" style={{ color: "rgba(244,234,213,0.75)" }}>
                {customer.address}
              </p>
            )}
            <p className="text-xs mt-1 font-medium" style={{ color: "#D8B878" }}>
              Tarih: {formatDateTR(rec.record_date)}
            </p>
          </div>
        </div>

        {/* Items — quantities only, NO prices */}
        <table className="w-full text-sm mb-6 min-w-[420px]">
          <thead>
            <tr className="text-left text-ink/60 border-b border-line">
              <th className="py-2 font-medium">#</th>
              <th className="py-2 font-medium">Malzeme</th>
              <th className="py-2 font-medium text-right">Adet</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((i: any, idx: number) => (
              <tr key={idx} className="border-b border-line/60">
                <td className="py-2 text-ink/40">{idx + 1}</td>
                <td className="py-2">{i.products?.name}</td>
                <td className="py-2 text-right">
                  {Number(i.quantity).toLocaleString("tr-TR")} {i.products?.unit === "m2" ? "m²" : ""}
                </td>
              </tr>
            ))}
            {(items ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-ink/40">
                  Kalem yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-end mb-10">
          <div className="w-56">
            <div className="flex justify-between text-sm font-medium py-1.5 border-t border-line">
              <span>Toplam Adet</span>
              <span>{totalQty.toLocaleString("tr-TR")}</span>
            </div>
          </div>
        </div>

        {/* Signature strip */}
        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-line">
          <div>
            <p className="text-xs text-ink/50 mb-10">Teslim Eden (İmza)</p>
            <div className="border-t border-line/70" />
          </div>
          <div>
            <p className="text-xs text-ink/50 mb-10">Teslim Alan (İmza)</p>
            <div className="border-t border-line/70" />
          </div>
        </div>

        <p className="text-center text-[11px] text-ink/40 mt-6">
          Bu belge teslim teyidi içindir — fiyatlar aylık hesap ekstresinde gösterilir.
        </p>
      </div>
    </div>
  );
}
