import type { StatusBucket } from "./StatusBadge";
import type { StatusTone } from "./StatusBadge";

const toneBucket: Record<StatusTone, StatusBucket> = {
  idle: "neutral",
  info: "neutral",
  preview: "neutral",
  disabled: "neutral",
  running: "neutral",
  pass: "ok",
  warning: "warn",
  fail: "blocked",
  blocked: "blocked",
};

const bucketClasses: Record<StatusBucket, string> = {
  neutral: "bg-zinc-800/60 text-zinc-300 border-zinc-700",
  ok: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  warn: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  blocked: "bg-red-500/10 text-red-300 border-red-500/20",
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
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${bucketClasses[toneBucket[tone]]} ${className}`}
    >
      <span className="text-zinc-500">{label}</span>
      <span className="tabular-nums">{value}</span>
    </span>
  );
}

export interface MetricProps {
  label: string;
  value: string | number;
  className?: string;
}

export function Metric({ label, value, className = "" }: MetricProps) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-2xl font-semibold tabular-nums text-zinc-50">{value}</span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
    </div>
  );
}
