import { useState, type ReactNode } from "react";
import { Maximize2 } from "lucide-react";
import { Modal } from "./Modal";

export interface CodeBlockProps {
  children: ReactNode;
  label?: string;
  className?: string;
  collapsible?: boolean;
}

export function CodeBlock({
  children,
  label,
  className = "",
  collapsible = false,
}: CodeBlockProps) {
  const [open, setOpen] = useState(false);

  if (collapsible) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900/60 focus:outline-none focus:ring-2 focus:ring-zinc-500"
        >
          <span className="flex items-center gap-2 text-sm text-zinc-300">
            <Maximize2 className="h-3.5 w-3.5 text-zinc-500" />
            {label ?? "View details"}
          </span>
          <span className="text-xs text-zinc-500">Click to view</span>
        </button>

        <Modal open={open} onClose={() => setOpen(false)} title={label ?? "Details"}>
          <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6 text-zinc-200">
            {children}
          </pre>
        </Modal>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 ${className}`}
    >
      {label ? (
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-3 py-1.5">
          <span className="text-[11px] uppercase tracking-wide text-zinc-500">
            {label}
          </span>
        </div>
      ) : null}
      <pre className="max-h-[32rem] overflow-x-auto overflow-y-auto whitespace-pre p-4 font-mono text-[13px] leading-6 text-zinc-300">
        {children}
      </pre>
    </div>
  );
}
