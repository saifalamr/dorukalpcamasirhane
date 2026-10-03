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
      <header className="md:hidden sticky top-0 z-40 no-print overflow-hidden bg-[#061B35] text-white">
        <svg viewBox="0 0 430 132" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="header-navy" x2="1" y2="1">
              <stop stopColor="#29435D" />
              <stop offset=".38" stopColor="#0B2545" />
              <stop offset="1" stopColor="#001329" />
            </linearGradient>
            <linearGradient id="header-gold">
              <stop stopColor="#B78A3D" />
              <stop offset=".35" stopColor="#FFE6A0" />
              <stop offset=".7" stopColor="#BB8A3E" />
              <stop offset="1" stopColor="#FFDEA0" />
            </linearGradient>
            <radialGradient id="header-bubble" cx=".28" cy=".2" r=".8">
              <stop stopColor="#ECF5FF" stopOpacity=".85" />
              <stop offset=".15" stopColor="#8BA6BC" stopOpacity=".3" />
              <stop offset=".65" stopColor="#001329" stopOpacity=".05" />
              <stop offset="1" stopColor="#BED4E6" stopOpacity=".55" />
            </radialGradient>
          </defs>
          <path d="M0 0h430v132H0Z" fill="url(#header-navy)" />
          <path d="M0 27c79 77 115 89 237 61S343 41 430 8v111H0Z" fill="#17324B" opacity=".35" />
          <path d="M0 83c85 49 191 32 261 3s116-18 169-51v88H0Z" fill="#001226" opacity=".5" />
          <path d="M0 26c30 36 70 67 113 78M331 87c30-39 63-65 99-78" fill="none" stroke="url(#header-gold)" strokeWidth=".8" />
          <path d="M0 104c122 24 235 0 293-3s91 1 137 8" fill="none" stroke="#A3BED5" strokeOpacity=".17" strokeWidth=".7" />
          {[ [12, 70, 4.5], [19, 86, 2], [87, 69, 2], [100, 81, 6], [116, 95, 1.8], [336, 80, 3.5], [370, 24, 5], [361, 40, 2] ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="url(#header-bubble)" stroke="#DDEAF5" strokeOpacity=".2" strokeWidth=".35" />
          ))}
        </svg>
        <div className="relative h-[116px] px-4 grid grid-cols-[76px_minmax(0,1fr)_76px] items-center gap-2">
          <img src="/doruk-alp-logo.jpeg" alt="Doruk Alp" className="h-[64px] w-[64px] object-contain rounded-[15px] border border-[#DDB96F]/70 shadow-[0_0_16px_rgba(221,185,111,0.12)]" />
          <div className="min-w-0 text-center">
            <div className="font-serif font-bold text-[clamp(14px,4.2vw,22px)] whitespace-nowrap tracking-wide">
              DORUK <span className="text-[#E6C67D]">ALP</span>
            </div>
            <div className="mt-1.5 text-[clamp(7px,2vw,10px)] uppercase tracking-[0.16em] text-[#F2EEE5] whitespace-nowrap">
              Çamaşırhane
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <div className="[&>button]:rounded-xl [&>button]:border-[#DDB96F]/50 [&>button]:bg-[#061A30]/80 [&>button]:shadow-[inset_0_1px_4px_rgba(255,255,255,0.12)] [&>button]:p-2 [&_svg]:h-5 [&_svg]:w-5">
              <ThemeToggle />
            </div>
            <button onClick={() => setDrawerOpen(true)} className="p-1 text-[#E6C67D] hover:text-[#FFE6A0] transition-colors" aria-label="Menüyü aç">
              <Menu size={27} />
            </button>
          </div>
        </div>
        <svg viewBox="0 0 430 24" className="relative block w-full h-[24px] -mt-2 pointer-events-none" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 5c101 16 181 10 265 0S373 0 430 9v15H0Z" fill="#F7F5F0" />
          <path d="M0 5c101 16 181 10 265 0S373 0 430 9" fill="none" stroke="url(#header-gold)" strokeWidth="2.2" />
          <path d="M0 9c101 16 181 10 265 0S373 4 430 13" fill="none" stroke="#FFFFFF" strokeOpacity=".7" strokeWidth="3" />
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
