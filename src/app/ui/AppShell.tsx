import type { ReactNode } from "react";

export interface AppShellProps {
  header?: ReactNode;
  children: ReactNode;
  rail?: ReactNode;
  className?: string;
}

export function AppShell({ header, children, rail, className = "" }: AppShellProps) {
  return (
    <div className={`min-h-screen bg-zinc-950 text-zinc-100 ${className}`}>
      {header ? (
        <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
          {header}
        </header>
      ) : null}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-8">{children}</div>
        {rail ? <div className="min-w-0 space-y-8">{rail}</div> : null}
      </div>
    </div>
  );
}
