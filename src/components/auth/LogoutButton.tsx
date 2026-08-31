import type { ButtonHTMLAttributes } from "react";

import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";

interface LogoutButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  loadingLabel: string;
  loading?: boolean;
}

export function LogoutButton({
  label,
  loadingLabel,
  loading = false,
  className,
  disabled,
  ...props
}: LogoutButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "flex h-[48px] w-full items-center justify-center gap-sm rounded-lg border border-error/30 bg-transparent",
        "font-sans text-label-14-bold text-error transition-colors hover:bg-error-soft",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary",
        "disabled:text-text-tertiary",
        className,
      )}
      {...props}
    >
      <LogOut aria-hidden="true" size={18} />
      {loading ? loadingLabel : label}
    </button>
  );
}
