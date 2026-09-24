import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

/**
 * Consistent breadcrumb trail for sub-pages, replacing the ad-hoc "←" links.
 * Rendered above the page title; hidden when printing.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Konum" className="no-print flex items-center flex-wrap gap-1 text-xs text-ink/50 mb-2">
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-ink/30" />}
            {c.href && !last ? (
              <Link href={c.href} className="hover:text-gold-600 transition-colors">
                {c.label}
              </Link>
            ) : (
              <span className={last ? "text-ink/70 font-medium" : undefined}>{c.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
