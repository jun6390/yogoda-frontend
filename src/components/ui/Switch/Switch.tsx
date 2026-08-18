import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
}

export function Switch({ label, className, disabled, ...props }: SwitchProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-sm font-sans text-body-14-regular text-text-primary",
        disabled && "cursor-not-allowed text-text-tertiary",
        className,
      )}
    >
      <input
        type="checkbox"
        role="switch"
        disabled={disabled}
        className="peer sr-only"
        {...props}
      />
      <span
        data-theme-transition
        aria-hidden="true"
        className={cn(
          "flex h-[24px] w-[40px] shrink-0 items-center rounded-full bg-border-strong p-[2px]",
          "transition-colors duration-300 ease-out peer-checked:bg-action-primary peer-checked:[&>span]:translate-x-[16px]",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary",
          "peer-disabled:bg-border-default",
        )}
      >
        <span
          data-theme-transition
          className="size-[20px] rounded-full bg-surface shadow-sm transition-transform duration-300 ease-out"
        />
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
