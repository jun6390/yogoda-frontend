import { Store } from "lucide-react";

import { cn } from "@/lib/utils";

const brands = {
  CGV: { label: "CGV", className: "bg-[#e71a0f] text-white" },
  스타벅스: { label: "STARBUCKS", className: "bg-[#00754a] text-white" },
  올리브영: { label: "OLIVE YOUNG", className: "bg-[#9bce26] text-[#17171c]" },
} as const;

export function BrandLogo({
  brand,
  className,
}: {
  brand: string | null;
  className?: string;
}) {
  const entry = brand
    ? Object.entries(brands).find(([key]) => brand.includes(key))?.[1]
    : undefined;

  return (
    <span
      aria-label={brand ?? "제휴 매장"}
      className={cn(
        "flex size-[44px] shrink-0 items-center justify-center rounded-sm px-xs text-center font-sans text-[9px] font-bold leading-tight",
        entry?.className ?? "bg-brand-soft text-icon-brand",
        className,
      )}
    >
      {entry ? entry.label : <Store aria-hidden="true" size={20} />}
    </span>
  );
}
