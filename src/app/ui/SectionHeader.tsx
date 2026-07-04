import type { ReactNode } from "react";

export interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  icon,
  actions,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        {icon ? <span className="text-zinc-500">{icon}</span> : null}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
