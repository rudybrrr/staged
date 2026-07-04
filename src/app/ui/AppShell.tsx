import type { ReactNode } from "react";

export interface AppShellProps {
  header?: ReactNode;
  pipeline?: ReactNode;
  children: ReactNode;
  rail?: ReactNode;
  className?: string;
}

const RAIL_STICKY_CLASSES = {
  none: "",
  header: "lg:sticky lg:top-16 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto",
  pipeline: "lg:sticky lg:top-11 lg:max-h-[calc(100vh-2.75rem)] lg:overflow-y-auto",
  both: "lg:sticky lg:top-[6.75rem] lg:max-h-[calc(100vh-6.75rem)] lg:overflow-y-auto",
} as const;

export function AppShell({
  header,
  pipeline,
  children,
  rail,
  className = "",
}: AppShellProps) {
  const stickyKey = header && pipeline ? "both" : header ? "header" : pipeline ? "pipeline" : "none";
  const railStickyClasses = RAIL_STICKY_CLASSES[stickyKey];

  return (
    <div className={`min-h-screen bg-zinc-950 text-zinc-100 ${className}`}>
      {header ? (
        <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
          {header}
        </header>
      ) : null}
      {pipeline ? (
        <div
          className={`sticky z-[5] overflow-x-auto border-b border-zinc-800 bg-zinc-900/40 backdrop-blur ${header ? "top-16" : "top-0"}`}
        >
          <div className="mx-auto max-w-7xl">{pipeline}</div>
        </div>
      ) : null}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-8">{children}</div>
        {rail ? (
          <div className={`min-w-0 space-y-8 ${railStickyClasses}`}>{rail}</div>
        ) : null}
      </div>
    </div>
  );
}
