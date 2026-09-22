import { createClient } from "@/lib/supabase/server";
import { CustomersTable } from "@/components/CustomersTable";

export const dynamic = "force-dynamic";

export default async function MusterilerPage() {
  const supabase = await createClient();
  const { data: customers } = await supabase.from("customers").select("*").order("name");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-5">Müşteriler</h1>
      <CustomersTable customers={customers ?? []} />
    </div>
  );
}
