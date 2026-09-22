"use client";

import { useState } from "react";

/**
 * Two-step delete: click turns the button into inline "Emin misiniz?" confirm.
 * Used in table rows where a modal would feel heavy.
 */
export function ConfirmDelete({
  onConfirm,
  className = "",
  label = "Sil",
  confirmingLabel = "Emin misiniz?",
  cancelLabel = "Vazgeç",
  deletingLabel = "Siliniyor...",
}: {
  onConfirm: () => Promise<void> | void;
  className?: string;
  label?: string;
  confirmingLabel?: string;
  cancelLabel?: string;
  deletingLabel?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (deleting) {
    return <span className={`text-xs text-ink/40 ${className}`}>{deletingLabel}</span>;
  }

  if (confirming) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <button
          className="text-xs text-red-600 font-medium hover:underline"
          onClick={async () => {
            setDeleting(true);
            await onConfirm();
          }}
        >
          {confirmingLabel}
        </button>
        <button
          className="text-xs text-ink/50 hover:text-ink"
          onClick={() => setConfirming(false)}
        >
          {cancelLabel}
        </button>
      </span>
    );
  }

  return (
    <button
      className={`text-xs text-red-600 hover:underline ${className}`}
      onClick={() => setConfirming(true)}
    >
      {label}
    </button>
  );
}
