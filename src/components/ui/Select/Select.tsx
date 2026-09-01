"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  icon?: ReactNode;
  className?: string;
  triggerClassName?: string;
  openTriggerClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
  selectedOptionClassName?: string;
}

export function Select<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  icon,
  className,
  triggerClassName,
  openTriggerClassName,
  menuClassName,
  optionClassName,
  selectedOptionClassName,
}: SelectProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

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
    <div
      className={cn("relative", isOpen && "z-20", className)}
      ref={containerRef}
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          event.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex min-h-[48px] w-full items-center rounded-lg border bg-surface px-md text-left text-text-primary transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary",
          isOpen
            ? cn("border-action-primary", openTriggerClassName)
            : "border-border-default",
          triggerClassName,
        )}
      >
        {icon && (
          <span aria-hidden="true" className="shrink-0 text-icon-brand">
            {icon}
          </span>
        )}
        <span
          className={cn(
            "min-w-0 flex-1 truncate font-sans text-label-14-bold",
            icon && "px-sm",
          )}
        >
          {selectedLabel}
        </span>
        <ChevronDown
          aria-hidden="true"
          size={18}
          className={cn(
            "shrink-0 text-text-tertiary transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={ariaLabel}
          className={cn(
            "absolute left-0 top-[calc(100%+8px)] w-full overflow-hidden rounded-lg border border-border-default bg-surface p-xs shadow-lg",
            menuClassName,
          )}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                className={cn(
                  "flex min-h-[42px] w-full items-center justify-between gap-sm rounded-sm px-md text-left font-sans text-body-14-regular",
                  "focus-visible:outline-2 focus-visible:outline-action-primary",
                  isSelected
                    ? cn(
                        "bg-brand-soft font-bold text-text-brand",
                        selectedOptionClassName,
                      )
                    : "text-text-primary hover:bg-surface-subtle",
                  optionClassName,
                )}
              >
                <span>{option.label}</span>
                {isSelected && <Check aria-hidden="true" size={17} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
