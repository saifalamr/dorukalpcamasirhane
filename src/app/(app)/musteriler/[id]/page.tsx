import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerProductManager } from "@/components/CustomerProductManager";

export const dynamic = "force-dynamic";

export default async function MusteriDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const [customerResult, productsResult, assignedResult] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).maybeSingle(),
    supabase.from("products").select("*").eq("active", true).order("name"),
    supabase.from("customer_products").select("*").eq("customer_id", id),
  ]);

  const customer = customerResult.data;
  if (!customer) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/musteriler"
          className="text-sm text-gold-600 hover:underline"
        >
          ← Müşteriler
        </Link>
        <h1 className="text-2xl font-semibold text-ink mt-2">{customer.name}</h1>
        <div className="flex gap-4 mt-2 text-sm">
          <Link
            href={`/musteriler/${customer.id}/ekstre`}
            className="text-gold-600 hover:underline"
          >
            Hesap Ekstresi
          </Link>
          <Link
            href={`/rapor?customer=${customer.id}`}
            className="text-gold-600 hover:underline"
          >
            Aylık Rapor
          </Link>
          <Link
            href={`/fisler?customer=${customer.id}`}
            className="text-gold-600 hover:underline"
          >
            Günlük Fişler
          </Link>
        </div>
      </div>

      <h2 className="text-sm font-medium text-ink/70 mb-3">
        Malzemeler ve Fiyatlar
      </h2>
      <CustomerProductManager
        customerId={customer.id}
        allProducts={productsResult.data ?? []}
        assigned={assignedResult.data ?? []}
      />
    </div>
  );
}