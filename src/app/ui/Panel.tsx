import type { ReactNode } from "react";
import { StatusBadge, type StatusTone } from "./StatusBadge";

export interface PanelProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  status?: { tone: StatusTone; label: ReactNode };
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({
  title,
  description,
  icon,
  status,
  actions,
  children,
  className = "",
}: PanelProps) {
  return (
    <section
      className={`rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          {icon ? <span className="text-zinc-500">{icon}</span> : null}
          <div>
            <h2 className="text-lg font-medium text-zinc-100">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-zinc-500">{description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status ? <StatusBadge tone={status.tone}>{status.label}</StatusBadge> : null}
          {actions}
        </div>
      </div>
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}
