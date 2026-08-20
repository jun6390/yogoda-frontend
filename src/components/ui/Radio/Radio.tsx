import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
}

export function Radio({ label, className, disabled, ...props }: RadioProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-sm font-sans text-body-14-regular text-text-primary",
        disabled && "cursor-not-allowed text-text-tertiary",
        className,
      )}
    >
      <input
        type="radio"
        disabled={disabled}
        className="peer sr-only"
        {...props}
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex size-[20px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-border-strong bg-transparent",
          "transition-colors peer-checked:border-action-primary peer-checked:bg-action-primary peer-checked:[&>span]:opacity-100",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary",
          "peer-disabled:border-border-default peer-disabled:bg-surface-subtle",
        )}
      >
        <span className="size-sm rounded-full bg-text-on-primary opacity-0 peer-checked:opacity-100" />
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
