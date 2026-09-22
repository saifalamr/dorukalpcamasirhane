import { createClient } from "@/lib/supabase/server";
import { ProductsTable } from "@/components/ProductsTable";

export const dynamic = "force-dynamic";

export default async function MalzemelerPage() {
  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("*").order("name");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-5">Malzemeler</h1>
      <ProductsTable products={products ?? []} />
    </div>
  );
}
