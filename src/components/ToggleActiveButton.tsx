"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ToggleActiveButton({
  kind,
  id,
  active,
}: {
  kind: "musteriler" | "malzemeler";
  id: string;
  active: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await fetch(`/api/${kind}/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !active }),
        });
        setLoading(false);
        router.refresh();
      }}
      className="text-xs text-ink/50 hover:text-ink hover:underline disabled:opacity-50"
    >
      {active ? "Pasifleştir" : "Aktifleştir"}
    </button>
  );
}
