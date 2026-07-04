import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-lg border border-zinc-800 bg-zinc-950 p-6 text-left ${className}`}
    >
      <div className="flex items-start gap-3">
        {icon ? <span className="mt-0.5 text-zinc-600">{icon}</span> : null}
        <div>
          <p className="text-sm font-medium text-zinc-300">{title}</p>
          {description ? (
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          ) : null}
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
