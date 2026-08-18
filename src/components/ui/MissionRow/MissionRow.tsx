import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface MissionRowProps extends HTMLAttributes<HTMLDivElement> {
  complete?: boolean;
  name: ReactNode;
  point: ReactNode;
}

export function MissionRow({
  complete = false,
  name,
  point,
  className,
  ...props
}: MissionRowProps) {
  return (
    <div
      className={cn(
        "flex w-[350px] items-center justify-between gap-lg",
        complete && "opacity-50",
        className,
      )}
      {...props}
    >
      <p className="min-w-0 truncate font-sans text-body-14-regular text-text-primary">
        {name}
      </p>
      <p className="shrink-0 font-sans text-caption-13-bold text-action-primary">
        {point}
      </p>
    </div>
  );
}
