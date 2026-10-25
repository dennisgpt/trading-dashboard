import { cn } from "@/lib/utils";

interface SparklineProps {
  values: readonly number[];
  width?: number;
  height?: number;
  className?: string;
}

/** Tiny line chart; green when the last value is above the first, red otherwise. */
export function Sparkline({ values, width = 48, height = 20, className }: SparklineProps) {
  if (values.length < 2) return <svg width={width} height={height} className={className} aria-hidden />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${(height - 1 - ((v - min) / range) * (height - 2)).toFixed(1)}`).join(" ");
  const rising = values[values.length - 1] >= values[0];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={cn(rising ? "text-up" : "text-down", className)} aria-hidden>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
