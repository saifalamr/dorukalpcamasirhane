# Deployment Guide — Doruk Alp Çamaşırhane

Step-by-step checklist for going live. Estimated total: ~45 minutes
(~1.5h if doing the Frankfurt region migration first).

---

## 0. Prerequisites checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `npx next build` passes
- [ ] `.env.local` is git-ignored (it is — verified)
- [ ] All migrations are ready in `supabase/migrations/`

---

## 1. Database (choose ONE)

### Option A — Keep Sydney (fastest to deploy)
Just make sure all migrations are applied (see step 2). Expect ~300ms
latency per query from Turkey — the app works, but feels sluggish.

### Option B — Migrate to Frankfurt (recommended, ~30 min)
Follow `supabase/migration/README.md`. The new project must have ALL
migrations applied in order, then import data via
`supabase/migration/export-data.sql` → run the generated inserts.
The August history import (`supabase/migration/import-august.sql`)
runs the same way on the new project.

---

## 2. Apply all migrations on the production DB

In Supabase SQL Editor, in order:

1. `supabase/migrations/0001_init.sql` (schema — skip if project already has it)
2. `supabase/migrations/0002_payments.sql`
3. `supabase/migrations/0003_flyer_prices.sql`
4. `supabase/migrations/0004_product_default_price.sql`
5. `supabase/migrations/0005_perf_indexes.sql`
6. `supabase/migrations/0006_reset_movement_data.sql` ⚠️ only if you still
   need to wipe test data — this DELETES all fişler/payments
7. `supabase/migration/import-august.sql` (August history from Excel)
8. `supabase/migration/mq-otel-assign.sql` (M.Q. OTEL price list)

Verify with `supabase/migration/verify.sql`.

---

## 3. Push to GitHub

```bash
git remote add origin https://github.com/<you>/camasirhane.git
git push -u origin main
```

The repo currently has 2 commits and is ready to push. `.env.local` is
ignored — secrets will NOT be uploaded.

---

## 4. Deploy on Vercel

1. vercel.com → sign in with GitHub
2. **Add New → Project** → import the repo
3. Framework preset: **Next.js** (auto-detected)
4. Before deploying, open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from `.env.local` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from `.env.local` |

5. **Deploy** — free tier is plenty for this app

---

## 5. Connect Supabase auth to the new domain

Supabase dashboard → **Authentication → URL Configuration**:

- **Site URL:** `https://<your-app>.vercel.app`
- **Redirect URLs:** add `https://<your-app>.vercel.app/**`

Without this, login works locally but fails in production.

---

## 6. Post-deploy checks

- [ ] Login works on the production URL
- [ ] Daily entry saves (Günlük Giriş)
- [ ] Reports show August history (Raporlar → Geçen Ay)
- [ ] Tahsilat page loads and payments can be recorded
- [ ] Statement PDF downloads (customer page → Hesap Ekstresi → PDF İndir)
- [ ] Dark mode toggle works
- [ ] Mobile layout works (open on a phone)

---

## 7. Security cleanup

- [ ] Change the Supabase login password (it was shared in chat):
      Supabase → Authentication → Users → ⋯ → send reset / set password
- [ ] Optionally enable email confirmation for any new users

---

## Everyday operation

```bash
npm run build && npm start   # production mode locally
npm run dev                  # dev mode (hot reload, slower first loads)
```

If a page 500s after code changes: restart the server
(Ctrl+C, then `npm run build && npm start`). A running server never
picks up a rebuilt bundle on its own.
