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
      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        <div className="min-w-0 flex-1 space-y-8">{children}</div>
        {rail ? <div className="hidden w-full max-w-sm shrink-0 space-y-8 lg:block">{rail}</div> : null}
      </div>
    </div>
  );
}
