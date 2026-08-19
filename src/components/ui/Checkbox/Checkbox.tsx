import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: ReactNode;
}

export function Checkbox({
  label,
  className,
  disabled,
  ...props
}: CheckboxProps) {
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
        disabled={disabled}
        className="peer sr-only"
        {...props}
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex size-[22px] shrink-0 items-center justify-center rounded-xs bg-border-default",
          "transition-colors",
          "peer-checked:bg-action-primary peer-checked:[&>span]:opacity-100",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary",
          "peer-disabled:bg-surface-subtle",
        )}
      >
        <span className="h-[7px] w-[11px] translate-y-[-1px] rotate-[-45deg] border-b-2 border-l-2 border-text-on-primary opacity-0" />
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
