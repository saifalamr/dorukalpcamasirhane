import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateTR, formatTRY } from "@/lib/format";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";

export const dynamic = "force-dynamic";

export default async function GunlukFislerPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string; from?: string; to?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const customersQuery = supabase.from("customers").select("id, name").order("name");

  let query = supabase
    .from("daily_records_with_totals")
    .select("id, customer_id, record_date, total_quantity, total_amount, customers(name)")
    .order("record_date", { ascending: false });

  if (params.customer) query = query.eq("customer_id", params.customer);
  if (params.from) query = query.gte("record_date", params.from);
  if (params.to) query = query.lte("record_date", params.to);

  const [{ data: customers }, { data: records }] = await Promise.all([customersQuery, query.limit(200)]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-6">Günlük Fişler</h1>

      <form className="bg-white rounded-md border border-line p-4 mb-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Müşteri</label>
          <select name="customer" defaultValue={params.customer ?? ""} className="rounded border border-line px-3 py-1.5 text-sm">
            <option value="">Tümü</option>
            {(customers ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Başlangıç</label>
          <input type="date" name="from" defaultValue={params.from ?? ""} className="rounded border border-line px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Bitiş</label>
          <input type="date" name="to" defaultValue={params.to ?? ""} className="rounded border border-line px-3 py-1.5 text-sm" />
        </div>
        <button type="submit" className="rounded bg-navy-800 text-white text-sm font-medium px-4 py-1.5 hover:bg-navy-700">
          Filtrele
        </button>
      </form>

      <div className="bg-white rounded-md border border-line overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gold-100/50 text-ink/70 text-left">
              <th className="px-4 py-2.5 font-medium">Tarih</th>
              <th className="px-4 py-2.5 font-medium">Müşteri</th>
              <th className="px-4 py-2.5 font-medium text-right">Toplam Adet</th>
              <th className="px-4 py-2.5 font-medium text-right">Toplam Tutar</th>
              <th className="px-4 py-2.5 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {(records ?? []).map((r: any) => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-4 py-2.5">{formatDateTR(r.record_date)}</td>
                <td className="px-4 py-2.5">{r.customers?.name}</td>
                <td className="px-4 py-2.5 text-right">{Number(r.total_quantity).toLocaleString("tr-TR")}</td>
                <td className="px-4 py-2.5 text-right font-medium text-accent">{formatTRY(Number(r.total_amount))}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className="inline-flex items-center gap-3">
                    <Link href={`/fisler/${r.id}`} className="text-xs text-gold-600 hover:underline">
                      Görüntüle
                    </Link>
                    <DeleteRecordButton id={r.id} />
                  </span>
                </td>
              </tr>
            ))}
            {(records ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink/40 text-sm">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}