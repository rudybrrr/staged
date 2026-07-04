import type { ReactNode } from "react";

export type StatusTone =
  | "idle"
  | "pass"
  | "info"
  | "warning"
  | "fail"
  | "blocked"
  | "running"
  | "preview"
  | "disabled";

export type StatusBucket = "neutral" | "ok" | "warn" | "blocked";

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

export interface StatusBadgeProps {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
  icon?: ReactNode;
}

export function StatusBadge({
  tone,
  children,
  className = "",
  dot = false,
  icon,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${bucketClasses[toneBucket[tone]]} ${className}`}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {icon}
      {children}
    </span>
  );
}
