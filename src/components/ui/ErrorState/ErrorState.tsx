import type { HTMLAttributes, ReactNode } from "react";

import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

interface ErrorStateProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  retryLabel: ReactNode;
  onRetry: () => void;
}

export function ErrorState({
  title,
  description,
  retryLabel,
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <section
      role="alert"
      className={cn(
        "rounded-lg border border-border-default bg-surface p-lg shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-md">
        <span className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-error-soft text-error">
          <AlertCircle aria-hidden="true" size={20} strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-sans text-title-16-bold text-text-primary">
            {title}
          </p>
          {description && (
            <p className="mt-xs font-sans text-caption-13-regular text-text-secondary">
              {description}
            </p>
          )}
          <button
            type="button"
            onClick={onRetry}
            className="mt-lg font-sans text-label-14-bold text-text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          >
            {retryLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
