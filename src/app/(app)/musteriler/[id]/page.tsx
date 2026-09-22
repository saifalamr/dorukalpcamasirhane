import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerProductManager } from "@/components/CustomerProductManager";

export const dynamic = "force-dynamic";

export default async function MusteriDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: customer } = await supabase.from("customers").select("*").eq("id", params.id).maybeSingle();
  if (!customer) notFound();

  const { data: allProducts } = await supabase.from("products").select("*").eq("active", true).order("name");
  const { data: assigned } = await supabase
    .from("customer_products")
    .select("*")
    .eq("customer_id", params.id);

  return (
    <div>
      <div className="mb-6">
        <Link href="/musteriler" className="text-sm text-teal-700 hover:underline">← Müşteriler</Link>
        <h1 className="text-2xl font-semibold text-ink mt-2">{customer.name}</h1>
        <div className="flex gap-4 mt-2 text-sm">
          <Link href={`/rapor?customer=${customer.id}`} className="text-teal-700 hover:underline">Aylık Rapor</Link>
          <Link href={`/fisler?customer=${customer.id}`} className="text-teal-700 hover:underline">Günlük Fişler</Link>
        </div>
      </div>

      <h2 className="text-sm font-medium text-ink/70 mb-3">Malzemeler ve Fiyatlar</h2>
      <CustomerProductManager
        customerId={customer.id}
        allProducts={allProducts ?? []}
        assigned={assigned ?? []}
      />
    </div>
  );
}
