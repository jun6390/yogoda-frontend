"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

/*
 * 브라우저 기본 <select>는 펼쳐진 목록 UI를 커스텀할 수 없어서
 * DateRangePicker와 같은 버튼+팝업 방식으로 직접 그림
 */
export function Select<T extends string>({
  value,
  options,
  onChange,
  className,
}: SelectProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? "";

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex h-[40px] w-full items-center justify-between gap-sm rounded-md border border-border-default bg-background px-md",
          "font-sans text-body-14-regular text-text-primary",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary",
        )}
      >
        {selectedLabel}
        <ChevronDown
          aria-hidden="true"
          size={16}
          className={cn(
            "shrink-0 text-text-tertiary transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <ul className="absolute left-0 top-full z-20 mt-xs w-full overflow-hidden rounded-md border border-border-default bg-surface py-xs shadow-md">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex h-[36px] w-full items-center px-md text-left font-sans text-body-14-regular transition-colors",
                  option.value === value
                    ? "bg-brand-soft text-text-brand"
                    : "text-text-primary hover:bg-surface-subtle",
                )}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
