import { MONTHS_TR } from "@/lib/format";

export default function OdemelerLoading() {
  const now = new Date();
  const monthLabel = `${MONTHS_TR[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="h-7 w-40 bg-gold-100/40 rounded animate-pulse" />
          <div className="h-4 w-56 bg-gold-100/40/70 rounded animate-pulse mt-2" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-9 h-9 rounded bg-gold-100/40 animate-pulse" />
          <div className="w-[110px] h-5 rounded bg-gold-100/40 animate-pulse" />
          <div className="w-9 h-9 rounded bg-gold-100/40 animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-md border border-line p-4 shadow-sm">
            <div className="h-3.5 w-20 bg-gold-100/40 rounded animate-pulse mb-3" />
            <div className="h-6 w-24 bg-gold-100/40 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-md border border-line overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-gold-100/40/60 flex items-center justify-between">
          <div className="h-4 w-48 bg-gold-100 rounded animate-pulse" />
          <div className="h-7 w-36 bg-gold-100 rounded animate-pulse" />
        </div>
        <div className="px-4 py-2 space-y-0">
          <p className="text-xs text-ink/30 text-right py-2">{monthLabel}</p>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-t border-line/60">
              <div className="h-4 w-32 bg-gold-100/40 rounded animate-pulse" />
              <div className="flex gap-8">
                <div className="h-4 w-16 bg-gold-100/40/70 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gold-100/40/70 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gold-100/40 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
