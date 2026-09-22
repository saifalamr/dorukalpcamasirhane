export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-line/60 rounded mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-white border border-line rounded-md" />
        ))}
      </div>
      <div className="bg-white border border-line rounded-md overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 border-b border-line/60 last:border-b-0" />
        ))}
      </div>
    </div>
  );
}
