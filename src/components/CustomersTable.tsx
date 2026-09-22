"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search } from "lucide-react";
import { CustomerFormModal } from "@/components/CustomerFormModal";
import { ConfirmDelete } from "@/components/ui/ConfirmDelete";
import { ToggleActiveButton } from "@/components/ToggleActiveButton";
import { useToast } from "@/components/ui/Toast";
import type { Customer } from "@/types/database";

export function CustomersTable({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr");
    if (!q) return customers;
    return customers.filter((c) => c.name.toLocaleLowerCase("tr").includes(q));
  }, [customers, search]);

  async function handleDelete(c: Customer) {
    const res = await fetch(`/api/musteriler/${c.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast(body.error ?? "Silinemedi.", "error");
      router.refresh();
      return;
    }
    toast(`${c.name} silindi.`, "success");
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Müşteri ara..."
            className="w-56 rounded border border-line bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60"
          />
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded bg-navy-800 text-white text-sm font-medium px-4 py-2 hover:bg-navy-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Yeni Müşteri
        </button>
      </div>

      <div className="bg-white rounded-md border border-line overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-gold-100/50 text-ink/70 text-left">
              <th className="px-4 py-2.5 font-medium">Müşteri</th>
              <th className="px-4 py-2.5 font-medium">Telefon</th>
              <th className="px-4 py-2.5 font-medium">Adres</th>
              <th className="px-4 py-2.5 font-medium">Durum</th>
              <th className="px-4 py-2.5 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-line hover:bg-gold-100/40 transition-colors">
                <td className="px-4 py-2.5 font-medium text-ink">
                  {c.notes && (
                    <span title={c.notes} className="cursor-help align-middle mr-1.5" aria-label="Notu var">
                      📝
                    </span>
                  )}
                  {c.name}
                </td>
                <td className="px-4 py-2.5 text-ink/70">{c.phone ?? "—"}</td>
                <td className="px-4 py-2.5 text-ink/70">{c.address ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      c.active ? "bg-gold-100 text-accent" : "bg-line text-ink/50"
                    }`}
                  >
                    {c.active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="inline-flex items-center gap-3">
                    <Link href={`/musteriler/${c.id}`} className="text-xs text-gold-600 hover:underline">
                      Yönet
                    </Link>
                    <button
                      onClick={() => {
                        setEditing(c);
                        setFormOpen(true);
                      }}
                      className="p-1 rounded text-ink/40 hover:text-gold-600 hover:bg-gold-100/60 transition-colors"
                      title="Düzenle"
                      aria-label={`${c.name} düzenle`}
                    >
                      <Pencil size={14} />
                    </button>
                    <ToggleActiveButton kind="musteriler" id={c.id} active={c.active} />
                    <ConfirmDelete onConfirm={() => handleDelete(c)} />
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink/40 text-sm">
                  {customers.length === 0
                    ? "Henüz müşteri eklenmemiş. Sağ üstten ilk müşterinizi ekleyin."
                    : "Aramanızla eşleşen müşteri yok."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <CustomerFormModal
        open={formOpen}
        customer={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
