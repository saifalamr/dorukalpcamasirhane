"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/Sidebar";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("E-posta veya şifre hatalı.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm bg-paper rounded-md shadow-lg p-8">
        <div className="flex items-center gap-3 mb-1">
          <LogoMark size={40} />
          <div>
            <p className="text-lg font-bold tracking-tight text-ink leading-tight">
              DORUK <span className="text-gold-600">ALP</span>
            </p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink/50">Çamaşırhane</p>
          </div>
        </div>
        <p className="text-sm text-ink/60 mt-3 mb-6">Devam etmek için giriş yapın</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">E-posta</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80 mb-1">Şifre</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-navy-900 text-white text-sm font-medium py-2.5 hover:bg-navy-800 transition-colors disabled:opacity-60 border border-gold-500/40"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
