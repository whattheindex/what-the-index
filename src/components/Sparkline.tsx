import type { PricePoint } from "@/lib/types";

type Props = {
  points: PricePoint[];
  width?: number;
  height?: number;
  up: boolean;
};

export function Sparkline({ points, width = 160, height = 40, up }: Props) {
  if (points.length < 2) return <svg width="100%" height={height} />;
  const xs = points.length;
  let min = Infinity;
  let max = -Infinity;
  for (const p of points) {
    if (p.c < min) min = p.c;
    if (p.c > max) max = p.c;
  }
  const range = max - min || 1;
  const stepX = width / (xs - 1);
  let d = "";
  for (let i = 0; i < xs; i++) {
    const x = i * stepX;
    const y = height - ((points[i].c - min) / range) * height;
    d += i === 0 ? `M${x.toFixed(2)},${y.toFixed(2)}` : `L${x.toFixed(2)},${y.toFixed(2)}`;
  }
  const color = up ? "var(--up)" : "var(--down)";
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="block"
      aria-hidden
    >
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
