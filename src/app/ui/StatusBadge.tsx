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

export interface StatusBadgeProps {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}

export function StatusBadge({ tone, children, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
