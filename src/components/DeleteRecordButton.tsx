"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteRecordButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (deleting) {
    return <span className="text-xs text-ink/40">Siliniyor...</span>;
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <button
          className="text-xs text-red-600 font-medium"
          onClick={async () => {
            setDeleting(true);
            await fetch(`/api/gunluk-kayit/${id}`, { method: "DELETE" });
            router.refresh();
          }}
        >
          Emin misiniz?
        </button>
        <button className="text-xs text-ink/50" onClick={() => setConfirming(false)}>
          Vazgeç
        </button>
      </span>
    );
  }

  return (
    <button className="text-xs text-red-600 hover:underline" onClick={() => setConfirming(true)}>
      Sil
    </button>
  );
}
