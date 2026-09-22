"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search } from "lucide-react";
import { ProductFormModal } from "@/components/ProductFormModal";
import { ConfirmDelete } from "@/components/ui/ConfirmDelete";
import { ToggleActiveButton } from "@/components/ToggleActiveButton";
import { useToast } from "@/components/ui/Toast";
import { formatTRY } from "@/lib/format";
import type { Product } from "@/types/database";

export function ProductsTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr");
    if (!q) return products;
    return products.filter((p) => p.name.toLocaleLowerCase("tr").includes(q));
  }, [products, search]);

  async function handleDelete(p: Product) {
    const res = await fetch(`/api/malzemeler/${p.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast(body.error ?? "Silinemedi.", "error");
      router.refresh();
      return;
    }
    toast(`${p.name} silindi.`, "success");
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
            placeholder="Malzeme ara..."
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
          Yeni Malzeme
        </button>
      </div>

      <div className="bg-white rounded-md border border-line overflow-hidden shadow-sm max-w-2xl">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="bg-gold-100/50 text-ink/70 text-left">
              <th className="px-4 py-2.5 font-medium">Malzeme</th>
              <th className="px-4 py-2.5 font-medium text-right">Liste Fiyatı</th>
              <th className="px-4 py-2.5 font-medium">Birim</th>
              <th className="px-4 py-2.5 font-medium">Durum</th>
              <th className="px-4 py-2.5 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-line hover:bg-gold-100/40 transition-colors">
                <td className="px-4 py-2.5 font-medium text-ink">{p.name}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-ink">
                  {p.default_price > 0 ? formatTRY(p.default_price) : <span className="text-ink/30">—</span>}
                </td>
                <td className="px-4 py-2.5 text-ink/70">{p.unit === "m2" ? "m²" : "adet"}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      p.active ? "bg-gold-100 text-accent" : "bg-line text-ink/50"
                    }`}
                  >
                    {p.active ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className="inline-flex items-center gap-3">
                    <button
                      onClick={() => {
                        setEditing(p);
                        setFormOpen(true);
                      }}
                      className="p-1 rounded text-ink/40 hover:text-gold-600 hover:bg-gold-100/60 transition-colors"
                      title="Düzenle"
                      aria-label={`${p.name} düzenle`}
                    >
                      <Pencil size={14} />
                    </button>
                    <ToggleActiveButton kind="malzemeler" id={p.id} active={p.active} />
                    <ConfirmDelete onConfirm={() => handleDelete(p)} />
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink/40 text-sm">
                  {products.length === 0
                    ? "Henüz malzeme eklenmemiş. Sağ üstten ilk malzemeyi ekleyin."
                    : "Aramanızla eşleşen malzeme yok."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <ProductFormModal
        open={formOpen}
        product={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
