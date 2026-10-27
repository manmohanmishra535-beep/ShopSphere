import { formatINR, formatINRCompact } from "@/lib/format";
import type { AdminStats } from "@/lib/types";

export function RevenueChart({ data }: { data: AdminStats["revenueByDay"] }) {
  const width = 800;
  const height = 240;
  const pad = { top: 16, right: 8, bottom: 28, left: 8 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((point) => point.revenue));
  const step = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const coords = data.map((point, index) => ({
    x: pad.left + index * step,
    y: pad.top + innerH - (point.revenue / max) * innerH,
    ...point,
  }));

  const line = coords.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1]?.x ?? pad.left},${pad.top + innerH} L${pad.left},${pad.top + innerH} Z`;

  const labelEvery = Math.max(1, Math.ceil(data.length / 6));
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>Revenue</span>
        <span className="price-num font-medium text-text">
          {formatINR(data.reduce((sum, point) => sum + point.revenue, 0))} total
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Revenue over the last ${data.length} days, peaking at ${formatINR(max)}`}
        className="h-[220px] w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {gridLines.map((ratio) => {
          const y = pad.top + innerH * ratio;
          return (
            <g key={ratio}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray={ratio === 1 ? undefined : "3 4"} />
              <text x={width - pad.right} y={y - 4} textAnchor="end" fontSize="9" fill="var(--text-muted)">
                {formatINRCompact(max * (1 - ratio))}
              </text>
            </g>
          );
        })}

        <path d={area} fill="url(#revenue-fill)" />
        <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

        {coords.map((point, index) => (
          <g key={point.date}>
            {point.revenue > 0 ? (
              <circle cx={point.x} cy={point.y} r="2.5" fill="var(--bg)" stroke="var(--primary)" strokeWidth="1.8">
                <title>{`${point.label}: ${formatINR(point.revenue)} · ${point.orders} orders`}</title>
              </circle>
            ) : null}
            {index % labelEvery === 0 || index === data.length - 1 ? (
              <text x={point.x} y={height - 8} textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"} fontSize="9" fill="var(--text-muted)">
                {point.label}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    </div>
  );
}
