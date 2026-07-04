import type { StatusTone } from "./StatusBadge";

const toneClasses: Record<StatusTone, string> = {
  idle: "border-zinc-800 bg-zinc-950 text-zinc-300",
  pass: "border-emerald-900/70 bg-emerald-950/30 text-emerald-100",
  info: "border-zinc-800 bg-zinc-950 text-zinc-300",
  warning: "border-amber-900/70 bg-amber-950/30 text-amber-100",
  fail: "border-red-900/70 bg-red-950/30 text-red-100",
  blocked: "border-red-900/70 bg-red-950/30 text-red-100",
  running: "border-sky-900/70 bg-sky-950/30 text-sky-100",
  preview: "border-zinc-800 bg-zinc-950 text-zinc-300",
  disabled: "border-zinc-800 bg-zinc-950 text-zinc-500",
};

export interface MetricPillProps {
  label: string;
  value: string | number;
  tone?: StatusTone;
  className?: string;
}

export function MetricPill({ label, value, tone = "idle", className = "" }: MetricPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs ${toneClasses[tone]} ${className}`}
    >
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium">{value}</span>
    </span>
  );
}
