import type { ReactNode } from "react";

export interface CodeBlockProps {
  children: ReactNode;
  label?: string;
  className?: string;
}

export function CodeBlock({ children, label, className = "" }: CodeBlockProps) {
  return (
    <div className={className}>
      {label ? (
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </p>
      ) : null}
      <pre className="max-h-[32rem] overflow-auto whitespace-pre rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm leading-6 text-zinc-200">
        {children}
      </pre>
    </div>
  );
}
