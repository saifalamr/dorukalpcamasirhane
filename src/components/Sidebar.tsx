"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardEdit,
  Receipt,
  BarChart3,
  Users,
  Package,
  HandCoins,
  LogOut,
  Menu,
  X,
  Home,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV = [
  { href: "/", label: "Panel", icon: Home },
  { href: "/giris", label: "Günlük Giriş", icon: ClipboardEdit },
  { href: "/fisler", label: "Günlük Fişler", icon: Receipt },
  { href: "/rapor", label: "Raporlar", icon: BarChart3 },
  { href: "/odemeler", label: "Tahsilat", icon: HandCoins },
  { href: "/musteriler", label: "Müşteriler", icon: Users },
  { href: "/malzemeler", label: "Malzemeler", icon: Package },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
];

/** DORUK ALP mountain mark — inline SVG from the flyer's logo. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <div
      className="rounded bg-navy-800 border border-gold-500/50 flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" aria-hidden>
        {/* Mountain peaks */}
        <path d="M3 17.5 9.2 8.2l3.4 5 2.1-2.9L21 17.5H3Z" fill="#C9A45C" />
        {/* Water drop */}
        <path
          d="M12 3.2c1.1 1.5 2.3 3.2 2.3 4.6a2.3 2.3 0 1 1-4.6 0c0-1.4 1.2-3.1 2.3-4.6Z"
          fill="#F4EAD5"
        />
      </svg>
    </div>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}              className={`flex items-center gap-2.5 rounded px-3 py-2.5 text-sm transition-colors ${
                active ? "bg-gold-500 text-navy-950 font-semibold" : "hover:bg-navy-800 hover:text-white"
              }`}
              style={active ? undefined : { color: "rgba(244,234,213,0.82)" }}>
              <Icon size={16} style={active ? undefined : { color: "rgba(201,164,92,0.75)" }} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-6 pt-2 flex items-center gap-2">
        <ThemeToggle />
        <LogoutButton />
      </div>
    </>
  );
}

function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    const supabase = await createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={busy}
      className="w-full flex items-center gap-2.5 rounded px-3 py-2.5 text-sm text-left hover:bg-navy-800 transition-colors disabled:opacity-50 flex-1"
      style={{ color: "rgba(244,234,213,0.65)" }}
    >
      <LogOut size={16} style={{ color: "rgba(201,164,92,0.6)" }} />
      Çıkış Yap
    </button>
  );
}

function Brand() {
  return (
    <div className="px-4 py-5 flex items-center gap-3 shrink-0 border-b border-navy-800/70 mb-2 mx-1">
      <LogoMark />
      <div>
        <p className="text-base font-bold tracking-tight text-white leading-tight">
          DORUK <span className="text-gold-500">ALP</span>
        </p>
        <p className="text-[11px] uppercase tracking-[0.14em] text-gold-400/80">Çamaşırhane</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Esc closes the drawer; body scroll locked while open.
  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      {/* ===== Mobile top bar (hidden on md+) ===== */}
      <div className="md:hidden sticky top-0 z-40 no-print bg-navy-950 text-white border-b border-navy-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <LogoMark size={32} />
            <span className="font-bold tracking-tight text-sm">
              DORUK <span className="text-gold-500">ALP</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 -mr-2 rounded hover:bg-navy-800 transition-colors"
              aria-label="Menüyü aç"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* ===== Mobile drawer ===== */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDrawerOpen(false);
          }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-navy-950 border-r border-navy-800 flex flex-col drawer-panel">
            <div className="flex items-center justify-between pl-2 pr-3">
              <Brand />
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded text-gold-400/80 hover:bg-navy-800 hover:text-white transition-colors"
                aria-label="Menüyü kapat"
              >
                <X size={20} />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* ===== Desktop sidebar (hidden below md) ===== */}
      <aside className="no-print hidden md:flex w-60 shrink-0 border-r border-navy-800 bg-navy-950 min-h-screen flex-col">
        <Brand />
        <NavLinks pathname={pathname} />
      </aside>
    </>
  );
}
