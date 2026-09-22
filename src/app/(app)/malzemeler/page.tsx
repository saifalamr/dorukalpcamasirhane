import { createClient } from "@/lib/supabase/server";
import { AddProductForm } from "@/components/AddProductForm";
import { ToggleActiveButton } from "@/components/ToggleActiveButton";

export const dynamic = "force-dynamic";

export default async function MalzemelerPage() {
  const supabase = createClient();
  const { data: products } = await supabase.from("products").select("*").order("name");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-ink">Malzemeler</h1>
        <AddProductForm />
      </div>

      <div className="bg-white rounded-md border border-line overflow-hidden max-w-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-teal-50 text-ink/70 text-left">
              <th className="px-4 py-2.5 font-medium">Malzeme</th>
              <th className="px-4 py-2.5 font-medium">Birim</th>
              <th className="px-4 py-2.5 font-medium">Durum</th>
              <th className="px-4 py-2.5 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-4 py-2.5 font-medium text-ink">{p.name}</td>
                <td className="px-4 py-2.5 text-ink/70">{p.unit === "m2" ? "m²" : "adet"}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded ${p.active ? "bg-teal-100 text-teal-800" : "bg-line text-ink/50"}`}>
                    {p.active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <ToggleActiveButton kind="malzemeler" id={p.id} active={p.active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
