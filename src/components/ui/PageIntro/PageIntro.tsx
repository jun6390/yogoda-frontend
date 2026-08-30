import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageIntroProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function PageIntro({
  title,
  description,
  action,
  className,
}: PageIntroProps) {
  return (
    <section
      className={cn(
        "border-b border-border-default bg-surface px-page pb-xl pt-lg",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-lg">
        <h1 className="min-w-0 font-sans text-title-24-bold text-text-primary">
          {title}
        </h1>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {description ? (
        <p className="mt-sm font-sans text-body-14-regular text-text-secondary">
          {description}
        </p>
      ) : null}
    </section>
  );
}
