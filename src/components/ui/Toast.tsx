"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastContextValue = {
  toast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/** useToast().toast("Kaydedildi") — works in any client component. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const ICONS: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
};

const STYLES: Record<ToastKind, string> = {
  success: "border-teal-500/40 bg-teal-950 text-teal-50",
  error: "border-red-500/40 bg-red-950 text-red-50",
  info: "border-navy-700/60 bg-navy-900 text-white",
};

const ICON_COLORS: Record<ToastKind, string> = {
  success: "text-teal-300",
  error: "text-red-300",
  info: "text-gold-400",
};

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, kind, message }]);
      // Auto-dismiss after 4s (errors linger a bit longer).
      setTimeout(() => dismiss(id), kind === "error" ? 6000 : 4000);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast stack — bottom right, above sticky bars */}
      <div
        className="fixed bottom-24 right-4 z-[60] flex flex-col gap-2 no-print pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              className={`animate-slide-down pointer-events-auto flex items-center gap-2.5 rounded-md border px-4 py-3 shadow-lg max-w-sm text-sm ${STYLES[t.kind]}`}
            >
              <Icon size={16} className={`shrink-0 ${ICON_COLORS[t.kind]}`} />
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="opacity-50 hover:opacity-100 transition-opacity shrink-0"
                aria-label="Kapat"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
