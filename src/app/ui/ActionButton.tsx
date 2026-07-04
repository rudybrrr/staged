import type { ButtonHTMLAttributes } from "react";

export type ActionButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variantClasses: Record<ActionButtonVariant, string> = {
  primary:
    "border border-zinc-200 bg-zinc-200 text-zinc-900 hover:bg-zinc-100 disabled:border-zinc-800 disabled:bg-zinc-800 disabled:text-zinc-500",
  secondary:
    "border border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-600",
  ghost:
    "border border-transparent bg-transparent text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 disabled:text-zinc-600",
  danger:
    "border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-600",
};

export interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionButtonVariant;
}

export function ActionButton({
  variant = "primary",
  className = "",
  disabled,
  children,
  ...rest
}: ActionButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
