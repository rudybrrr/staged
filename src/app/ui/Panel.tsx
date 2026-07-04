import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { StatusBadge, type StatusTone } from "./StatusBadge";

export type PanelVariant = "default" | "emphasis" | "inset";

export interface PanelProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  status?: { tone: StatusTone; label: ReactNode };
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: PanelVariant;
  collapsible?: boolean;
  defaultOpen?: boolean;
  summary?: ReactNode;
}

const variantClasses: Record<PanelVariant, string> = {
  default: "rounded-xl border border-zinc-800 bg-zinc-900/60 p-5",
  emphasis:
    "rounded-xl border border-zinc-700 bg-zinc-900 p-5 ring-1 ring-inset ring-white/5",
  inset: "rounded-lg border border-zinc-800/80 bg-zinc-950 p-4",
};

export function Panel({
  title,
  description,
  icon,
  status,
  actions,
  children,
  className = "",
  variant = "default",
  collapsible = false,
  defaultOpen = true,
  summary,
}: PanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = collapsible ? open : true;

  return (
    <section className={`${variantClasses[variant]} ${className}`}>
      <div
        className={`flex items-start justify-between gap-4 ${
          isOpen ? "border-b border-zinc-800/60 pb-4" : ""
        } ${collapsible ? "cursor-pointer select-none" : ""}`}
        onClick={collapsible ? () => setOpen((prev) => !prev) : undefined}
        onKeyDown={
          collapsible
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setOpen((prev) => !prev);
                }
              }
            : undefined
        }
        role={collapsible ? "button" : undefined}
        tabIndex={collapsible ? 0 : undefined}
        aria-expanded={collapsible ? isOpen : undefined}
      >
        <div className="flex items-center gap-2">
          {icon ? <span className="text-zinc-500">{icon}</span> : null}
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-zinc-400">{description}</p>
            ) : null}
            {!isOpen && summary ? (
              <p className="mt-1 text-sm text-zinc-500">{summary}</p>
            ) : null}
          </div>
        </div>
        <div
          className="flex items-center gap-2"
          onClick={collapsible ? (event) => event.stopPropagation() : undefined}
        >
          {status ? <StatusBadge tone={status.tone}>{status.label}</StatusBadge> : null}
          {actions}
          {collapsible ? (
            <ChevronDown
              className={`h-4 w-4 text-zinc-500 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          ) : null}
        </div>
      </div>
      {isOpen ? <div className="mt-5 space-y-6">{children}</div> : null}
    </section>
  );
}
