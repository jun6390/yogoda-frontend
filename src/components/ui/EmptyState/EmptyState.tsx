import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  heading: ReactNode;
  description: ReactNode;
}

export function EmptyState({
  heading,
  description,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[342px] flex-col items-center justify-center gap-md px-2xl py-[28px] text-center",
        className,
      )}
      {...props}
    >
      <span className="flex size-[56px] items-center justify-center rounded-full bg-brand-soft">
        <span className="relative h-[20px] w-[24px] rounded-[5px] border-2 border-icon-brand">
          <span className="absolute left-[5px] top-[7px] h-[2px] w-[10px] rounded-full bg-icon-brand" />
        </span>
      </span>
      <p className="w-full font-sans text-title-18-bold text-text-primary">
        {heading}
      </p>
      <p className="w-full font-sans text-caption-13-regular text-text-secondary">
        {description}
      </p>
    </div>
  );
}
