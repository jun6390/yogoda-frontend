"use client";

import { List, Map } from "lucide-react";

import { cn } from "@/lib/utils";

export type MapBrowseView = "map" | "list";

export function MapViewToggle({
  value,
  onChange,
  labels,
}: {
  value: MapBrowseView;
  onChange: (view: MapBrowseView) => void;
  labels: Record<MapBrowseView, string>;
}) {
  return (
    <div className="grid grid-cols-2 rounded-lg bg-surface-subtle p-xs">
      {(["map", "list"] as const).map((item) => {
        const Icon = item === "map" ? Map : List;
        return (
          <button
            key={item}
            type="button"
            aria-pressed={value === item}
            onClick={() => onChange(item)}
            className={cn(
              "flex min-h-[40px] items-center justify-center gap-sm rounded-sm font-sans text-caption-13-bold",
              value === item
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-secondary",
            )}
          >
            <Icon aria-hidden="true" size={17} />
            {labels[item]}
          </button>
        );
      })}
    </div>
  );
}

export function MapFilterChips<T extends string>({
  options,
  value,
  onChange,
  overlay = false,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  overlay?: boolean;
}) {
  const chips = (
    <div className="flex w-max gap-sm">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-[38px] shrink-0 whitespace-nowrap rounded-full border px-md font-sans text-caption-13-bold shadow-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary",
            value === option.value
              ? "border-action-primary bg-action-primary text-text-on-primary"
              : "border-border-default bg-surface text-text-primary",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  if (!overlay) {
    return <div className="overflow-x-auto">{chips}</div>;
  }

  return (
    <div className="absolute inset-x-0 top-md z-[210] overflow-x-auto px-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips}
    </div>
  );
}
