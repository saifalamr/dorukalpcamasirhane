import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AddCustomerForm } from "@/components/AddCustomerForm";
import { ToggleActiveButton } from "@/components/ToggleActiveButton";

export const dynamic = "force-dynamic";

export default async function MusterilerPage() {
  const supabase = createClient();
  const { data: customers } = await supabase.from("customers").select("*").order("name");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-ink">Müşteriler</h1>
        <AddCustomerForm />
      </div>

      <div className="bg-white rounded-md border border-line overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-teal-50 text-ink/70 text-left">
              <th className="px-4 py-2.5 font-medium">Müşteri</th>
              <th className="px-4 py-2.5 font-medium">Telefon</th>
              <th className="px-4 py-2.5 font-medium">Adres</th>
              <th className="px-4 py-2.5 font-medium">Durum</th>
              <th className="px-4 py-2.5 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {(customers ?? []).map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className="px-4 py-2.5 font-medium text-ink">{c.name}</td>
                <td className="px-4 py-2.5 text-ink/70">{c.phone ?? "—"}</td>
                <td className="px-4 py-2.5 text-ink/70">{c.address ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded ${c.active ? "bg-teal-100 text-teal-800" : "bg-line text-ink/50"}`}>
                    {c.active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="inline-flex items-center gap-3">
                    <Link href={`/musteriler/${c.id}`} className="text-xs text-teal-700 hover:underline">
                      Yönet
                    </Link>
                    <ToggleActiveButton kind="musteriler" id={c.id} active={c.active} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
