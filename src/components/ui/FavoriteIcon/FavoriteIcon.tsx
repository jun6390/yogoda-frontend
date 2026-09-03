import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";

interface FavoriteIconProps {
  selected: boolean;
  className?: string;
}

export function FavoriteIcon({ selected, className }: FavoriteIconProps) {
  return (
    <Heart
      aria-hidden="true"
      size={20}
      strokeWidth={2}
      fill={selected ? "currentColor" : "none"}
      className={cn(
        "shrink-0",
        selected ? "text-action-primary" : "text-action-secondary",
        className,
      )}
    />
  );
}
