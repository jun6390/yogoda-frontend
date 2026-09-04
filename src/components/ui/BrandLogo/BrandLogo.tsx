import Image from "next/image";
import { Store } from "lucide-react";

import { cn } from "@/lib/utils";

const brands = {
  "U+": { src: "/brand-logos/uplus.svg", imageClassName: "size-[34px]" },
  "N Pay": {
    src: "/brand-logos/naver-pay.png",
    imageClassName: "size-[34px]",
  },
  네이버페이: {
    src: "/brand-logos/naver-pay.png",
    imageClassName: "size-[34px]",
  },
  배달의민족: {
    src: "/brand-logos/baemin.png",
    imageClassName: "size-[34px]",
  },
  CGV: { src: "/brand-logos/cgv.png", imageClassName: "w-[36px]" },
  스타벅스: {
    src: "/brand-logos/starbucks.png",
    imageClassName: "size-[34px]",
  },
  올리브영: {
    src: "/brand-logos/olive-young.png",
    imageClassName: "size-[34px]",
  },
  GS25: { src: "/brand-logos/gs25.png", imageClassName: "w-[36px]" },
  파리바게뜨: {
    src: "/brand-logos/paris-baguette.png",
    imageClassName: "size-[34px]",
  },
  배스킨라빈스: {
    src: "/brand-logos/baskin-robbins.png",
    imageClassName: "w-[34px]",
  },
} as const;

type BrandKey = keyof typeof brands;

export function resolveBrandLogoName(
  ...candidates: Array<string | null | undefined>
): BrandKey | null {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const matched = Object.keys(brands).find((key) => candidate.includes(key));
    if (matched) return matched as BrandKey;
  }
  return null;
}

export function BrandLogo({
  brand,
  className,
}: {
  brand: string | null;
  className?: string;
}) {
  const resolvedBrand = resolveBrandLogoName(brand);
  const entry = resolvedBrand ? brands[resolvedBrand] : undefined;

  return (
    <span
      role="img"
      aria-label={brand ?? "제휴 매장"}
      className={cn(
        "flex size-[44px] shrink-0 items-center justify-center overflow-hidden rounded-sm",
        entry
          ? "border border-border-default bg-white"
          : "bg-brand-soft text-icon-brand",
        className,
      )}
    >
      {entry ? (
        <Image
          src={entry.src}
          alt=""
          width={40}
          height={40}
          className={cn("h-auto object-contain", entry.imageClassName)}
        />
      ) : (
        <Store aria-hidden="true" size={20} />
      )}
    </span>
  );
}
