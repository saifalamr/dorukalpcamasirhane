"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded bg-teal-700 text-white text-sm font-medium px-4 py-2 hover:bg-teal-600 transition-colors"
    >
      Yazdır
    </button>
  );
}
