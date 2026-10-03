"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Mail, LockKeyhole, ArrowRight, LoaderCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="relative min-h-svh flex items-center justify-center overflow-hidden bg-paper px-5 py-8 sm:py-12">
      <div className="absolute inset-0 laundry-background pointer-events-none" aria-hidden="true" />
      <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[#E6C67D]/10 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#17324B]/5 blur-3xl pointer-events-none" aria-hidden="true" />
      <section className="relative w-full max-w-[400px] overflow-hidden rounded-[28px] border border-[#DDD9CE]/70 bg-white shadow-[0_18px_60px_rgba(6,27,53,0.10)]" aria-labelledby="login-title">
        <div className="relative flex flex-col items-center bg-[linear-gradient(145deg,#203D58_0%,#061B35_65%,#001329_100%)] px-6 pt-7 pb-9 text-center">
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="absolute -right-12 top-10 h-44 w-44 rounded-full border border-[#E6C67D]/15" />
            <div className="absolute -left-16 -top-20 h-52 w-52 rounded-full border border-white/5" />
          </div>
          <img src="/doruk-alp-logo.jpeg" alt="Doruk Alp Çamaşırhane" width={112} height={112} className="relative rounded-[22px] border border-[#E6C67D]/50 shadow-[0_0_28px_rgba(230,198,125,0.08)]" />
          <p className="relative mt-4 text-[11px] font-medium uppercase tracking-[0.22em] text-[#E6C67D]">Takip Sistemi</p>
          <svg viewBox="0 0 400 24" className="absolute bottom-0 left-0 h-6 w-full" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 9c94 19 173 11 254 0s104-7 146 2v13H0Z" fill="white" />
            <path d="M0 9c94 19 173 11 254 0s104-7 146 2" fill="none" stroke="#DDB96F" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="px-6 pb-7 pt-4 sm:px-8 sm:pb-8">
          <h1 id="login-title" className="text-center text-2xl font-semibold tracking-tight text-[#061B35]">Hoş geldiniz</h1>
          <p className="mt-2 mb-7 text-center text-sm text-ink/55">Devam etmek için hesabınıza giriş yapın.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="mb-2 block text-xs font-semibold text-ink/75">E-posta</label>
              <div className="relative">
                <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A68B54]" aria-hidden="true" />
                <input id="login-email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta adresiniz" className="h-12 w-full rounded-xl border border-line bg-[#F7F5F0]/60 pl-11 pr-4 text-[16px] text-ink placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-[#C9A45C] transition-colors" />
              </div>
            </div>
            <div>
              <label htmlFor="login-password" className="mb-2 block text-xs font-semibold text-ink/75">Şifre</label>
              <div className="relative">
                <LockKeyhole size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A68B54]" aria-hidden="true" />
                <input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifreniz" className="h-12 w-full rounded-xl border border-line bg-[#F7F5F0]/60 pl-11 pr-12 text-[16px] text-ink placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-[#C9A45C] transition-colors" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-ink/45 hover:text-[#061B35]">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#C9A45C]/50 bg-[#061B35] text-sm font-semibold text-[#F4EAD5] shadow-[0_4px_12px_rgba(6,27,53,0.12)] hover:bg-[#12314F] transition-colors disabled:opacity-60">
              {loading ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : null}
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              {!loading && <ArrowRight size={17} className="text-[#E6C67D]" aria-hidden="true" />}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
