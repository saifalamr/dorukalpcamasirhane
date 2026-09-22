"use client";

/**
 * Text input that keeps a raw numeric string in state and shows a
 * Turkish-formatted currency preview underneath. Keeps numbers exact
 * (no float drift) while giving instant visual feedback.
 */
export function MoneyInput({
  value,
  onChange,
  placeholder = "0,00",
  className = "",
  autoFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const n = parseFloat(value);
  const preview = !Number.isNaN(n)
    ? new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 2,
      }).format(n)
    : null;

  return (
    <div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/50 text-sm">₺</span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => {
            const v = e.target.value.replace(",", ".");
            if (v !== "" && !/^\d*\.?\d*$/.test(v)) return;
            onChange(v);
          }}
          placeholder={placeholder}
          className={`w-full rounded border border-line bg-white pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/60 ${className}`}
        />
      </div>
      {preview && (
        <p className="text-xs text-ink/50 mt-1">= {preview}</p>
      )}
    </div>
  );
}
