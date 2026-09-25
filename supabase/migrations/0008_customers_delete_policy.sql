-- 0008: customers table had no DELETE policy — RLS silently filtered all
-- deletes (0 rows, no error), so "delete customer" appeared to do nothing.
-- Run this in the Supabase SQL Editor (production + local).

create policy "authenticated delete customers"
  on customers
  for delete
  to authenticated
  using (true);
