/**
 * Server-rendered SVG bar chart of daily income. No client JS: tooltips
 * come from native <title>, hover color from CSS. Renders nothing when
 * there is no data or a single day.
 */
export function PeriodChart({ data }: { data: { date: string; amount: number }[] }) {
  const points = data.filter((d) => d.amount > 0);
  if (points.length < 2) return null;

  const max = Math.max(...points.map((d) => d.amount), 1);
  const barW = 26;
  const gap = 8;
  const padX = 34;
  const padTop = 14;
  const height = 160;
  const chartH = height - padTop - 24;
  const width = padX * 2 + points.length * (barW + gap) - gap;

  const bars = points.map((d) => {
    const i = data.indexOf(d);
    const h = Math.max(2, Math.round((d.amount / max) * chartH));
    return {
      ...d,
      x: padX + i * (barW + gap),
      y: padTop + chartH - h,
      h,
      label: `${d.date.slice(8, 10)}.${d.date.slice(5, 7)}`,
    };
  });

  return (
    <div className="overflow-x-auto pb-1">
      <svg width={width} height={height} className="block" role="img" aria-label="Günlük gelir grafiği">
        <line
          x1={padX - 8}
          y1={padTop + chartH}
          x2={width - padX + 8}
          y2={padTop + chartH}
          stroke="#DDD9CE"
          strokeWidth={1}
        />
        {bars.map((b) => (
          <g key={b.date}>
            <title>{`${b.label} — ${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(b.amount)}`}</title>
            <rect
              x={b.x}
              y={b.y}
              width={barW}
              height={b.h}
              rx={3}
              className="fill-navy-700 hover:fill-navy-800 transition-colors cursor-default"
            />
            <text
              x={b.x + barW / 2}
              y={height - 8}
              textAnchor="middle"
              className="fill-ink/50"
              fontSize={9}
            >
              {b.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
