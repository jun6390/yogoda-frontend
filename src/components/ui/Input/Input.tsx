import type { InputHTMLAttributes, Ref } from "react";

import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function Input({
  error = false,
  disabled = false,
  className,
  ref,
  ...props
}: InputProps) {
  return (
    <input
      ref={ref}
      disabled={disabled}
      aria-invalid={error || undefined}
      className={cn(
        "box-border h-[52px] w-full appearance-none rounded-md border bg-surface px-md py-0",
        "type-caption-13-regular text-text-primary",
        "placeholder:opacity-100 placeholder:text-text-secondary",
        "outline-none transition-colors",

        /*
         * Focus 상태는 Figma Input V2의 1.5px 브랜드 테두리와 동일하게 적용함
         */
        "border-border-default focus:border-[1.5px] focus:border-action-primary",
        "focus:placeholder:text-text-primary",

        error &&
          "border-error placeholder:text-text-primary focus:border-error",

        disabled &&
          "cursor-not-allowed text-text-tertiary placeholder:text-text-tertiary",

        className,
      )}
      {...props}
    />
  );
}
