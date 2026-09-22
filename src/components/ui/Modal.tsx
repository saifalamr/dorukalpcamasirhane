"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * Reusable dialog shell. Mount conditionally; renders nothing when closed.
 * Closes on Escape and on backdrop click.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  width = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    // Move focus into the first input so typing starts immediately.
    const t = setTimeout(() => {
      const firstInput = containerRef.current?.querySelector<HTMLInputElement>(
        "input, select, textarea"
      );
      firstInput?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        className={`bg-paper w-full ${width} rounded-lg shadow-2xl border border-line modal-panel`}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line shrink-0">
          <h2 className="font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-ink/50 hover:text-ink hover:bg-gold-100/60 transition-colors"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 modal-scroll">{children}</div>
      </div>
    </div>
  );
}
