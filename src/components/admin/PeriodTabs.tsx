import { cn } from "@/lib/utils";
import type { AdminPeriod } from "@/types/admin";

interface PeriodTabsProps {
  value: AdminPeriod;
  onChange: (value: AdminPeriod) => void;
}

const PERIOD_OPTIONS: { value: AdminPeriod; label: string }[] = [
  { value: "today", label: "오늘" },
  { value: "7d", label: "7일" },
  { value: "30d", label: "30일" },
];

export function PeriodTabs({ value, onChange }: PeriodTabsProps) {
  return (
    <div className="grid grid-cols-3 gap-xs rounded-full bg-surface-subtle p-xs sm:inline-grid">
      {PERIOD_OPTIONS.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "h-9 rounded-full px-lg font-sans transition-colors",
              isSelected
                ? "bg-surface text-label-14-bold text-text-primary shadow-sm"
                : "text-label-14-medium text-text-tertiary",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
