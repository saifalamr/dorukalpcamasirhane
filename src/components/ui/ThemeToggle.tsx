"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Light/dark toggle. Persists to localStorage and sets <html class="dark">.
 * The initial class is applied pre-paint by the inline script in layout.tsx,
 * so this component only flips it.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* private mode: ignore */
    }
  }

  // Neutral square until mounted so server/client markup match.
  return (
    <button
      onClick={toggle}
      disabled={!mounted}
      aria-label={dark ? "Açık temaya geç" : "Koyu temaya geç"}
      title={dark ? "Açık tema" : "Koyu tema"}
      className="p-2 rounded-md border border-navy-800 text-gold-400 hover:bg-navy-800 hover:text-gold-300 transition-colors disabled:opacity-50 shrink-0"
    >
      {mounted && dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
