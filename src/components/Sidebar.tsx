"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/", label: "Panel" },
  { href: "/giris", label: "Günlük Giriş" },
  { href: "/fisler", label: "Günlük Fişler" },
  { href: "/rapor", label: "Aylık Rapor" },
  { href: "/musteriler", label: "Müşteriler" },
  { href: "/malzemeler", label: "Malzemeler" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="no-print w-60 shrink-0 border-r border-line bg-teal-950 text-teal-50 min-h-screen flex flex-col">
      <div className="px-5 py-6">
        <p className="text-lg font-semibold tracking-tight text-white">Çamaşırhane</p>
        <p className="text-xs text-teal-100/70 mt-0.5">Takip Sistemi</p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-teal-700 text-white font-medium"
                  : "text-teal-100/85 hover:bg-teal-900 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          className="w-full rounded px-3 py-2 text-sm text-left text-teal-100/70 hover:bg-teal-900 hover:text-white transition-colors"
        >
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
