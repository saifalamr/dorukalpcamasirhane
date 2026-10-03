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
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV = [
  { href: "/", label: "Panel", icon: Home },
  { href: "/giris", label: "Günlük Giriş", icon: ClipboardEdit },
  { href: "/fisler", label: "Günlük Fişler", icon: Receipt },
  { href: "/rapor", label: "Raporlar", icon: BarChart3 },
  { href: "/faturalama", label: "Aylık Faturalama", icon: FileText },
  { href: "/odemeler", label: "Tahsilat", icon: HandCoins },
  { href: "/musteriler", label: "Müşteriler", icon: Users },
  { href: "/malzemeler", label: "Malzemeler", icon: Package },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
];

// Bottom quick-bar on mobile: the daily pages, one tap each.
const QUICK_NAV = [
  { href: "/", label: "Panel", icon: Home },
  { href: "/giris", label: "Giriş", icon: ClipboardEdit },
  { href: "/fisler", label: "Fişler", icon: Receipt },
  { href: "/faturalama", label: "Fatura", icon: FileText },
  { href: "/musteriler", label: "Müşteri", icon: Users },
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
      <header className="md:hidden sticky top-0 z-40 no-print overflow-hidden bg-navy-950 text-white border-b border-gold-500/30">
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <svg viewBox="0 0 430 96" className="w-full h-full" preserveAspectRatio="none" aria-hidden>
            <circle cx="326" cy="24" r="9" fill="none" stroke="#F4EAD5" strokeWidth="1.5" />
            <circle cx="352" cy="48" r="4" fill="none" stroke="#F4EAD5" strokeWidth="1.2" />
            <path d="M255 77c45-20 92-26 175-16v35H238c4-7 9-13 17-19Z" fill="#16365A" />
          </svg>
        </div>
        <div className="relative flex items-center justify-between px-4 h-[86px]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0">
              <LogoMark size={48} />
            </div>
            <div className="leading-none min-w-0">
              <div className="font-bold tracking-tight text-[17px] whitespace-nowrap">
                DORUK <span className="text-gold-500">ALP</span>
              </div>
              <div className="mt-2 text-[9px] uppercase tracking-[0.24em] text-gold-400/90 whitespace-nowrap">
                Çamaşırhane
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className="h-px w-14 bg-gold-500/80" />
                <span className="h-1 w-1 rounded-full bg-gold-500" />
                <span className="h-px w-7 bg-gold-500/80" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-xl hover:bg-navy-800 transition-colors"
              aria-label="Menüyü aç"
            >
              <Menu size={24} className="text-gold-400" />
            </button>
          </div>
        </div>
        <svg viewBox="0 0 430 14" className="absolute bottom-[-1px] left-0 w-full h-3 pointer-events-none" preserveAspectRatio="none" aria-hidden>
          <path d="M0 9C92 16 147 2 225 8c79 7 127 7 205-4v10H0Z" fill="#F8F6F0" />
          <path d="M0 7C92 14 147 0 225 6c79 7 127 7 205-4" fill="none" stroke="#C9A45C" strokeWidth="1.4" />
        </svg>
      </header>

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

      {/* ===== Mobile bottom quick-bar: daily pages in one tap ===== */}
      <nav className="md:hidden no-print fixed bottom-0 inset-x-0 z-40 bg-navy-950 border-t border-navy-800 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5">
          {QUICK_NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                  active ? "text-gold-400" : "text-gold-100/60"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
