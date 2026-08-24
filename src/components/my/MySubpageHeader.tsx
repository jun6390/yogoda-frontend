"use client";

import { ChevronLeft } from "lucide-react";

import { useRouter } from "@/i18n/navigation";

interface MySubpageHeaderProps {
  title: string;
  backLabel: string;
}

export function MySubpageHeader({ title, backLabel }: MySubpageHeaderProps) {
  const router = useRouter();

  return (
    <div className="relative flex h-[52px] items-center border-b border-border-default bg-surface px-md">
      <button
        type="button"
        aria-label={backLabel}
        onClick={() => router.back()}
        className="flex size-touch items-center justify-center text-icon-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      >
        <ChevronLeft aria-hidden="true" size={24} />
      </button>
      <h1 className="pointer-events-none absolute inset-x-[56px] truncate text-center font-sans text-title-16-bold text-text-primary">
        {title}
      </h1>
    </div>
  );
}
