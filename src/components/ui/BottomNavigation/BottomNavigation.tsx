"use client";

import type { HTMLAttributes } from "react";
import { Bot } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { FigmaImage } from "../FigmaImage/FigmaImage";

type BottomNavigationItem = "home" | "ai" | "benefit" | "mission" | "my";
type BottomNavigationLabelKey = "home" | "ai" | "benefits" | "mission" | "my";

interface BottomNavigationProps extends HTMLAttributes<HTMLElement> {
  active?: BottomNavigationItem;
  onValueChange?: (value: BottomNavigationItem) => void;
}

const bottomNavigationItems: Array<{
  value: BottomNavigationItem;
  labelKey: BottomNavigationLabelKey;
  href: "/" | "/ai" | "/benefits" | "/mission" | "/my";
  icon: string;
  activeIcon: string;
}> = [
  {
    value: "home",
    labelKey: "home",
    href: "/",
    icon: "/figma-assets/icon-home-default.svg",
    activeIcon: "/figma-assets/icon-home-active.svg",
  },
  {
    value: "ai",
    labelKey: "ai",
    href: "/ai",
    icon: "/figma-assets/icon-ai-default.svg",
    activeIcon: "/figma-assets/icon-ai-active.svg",
  },
  {
    value: "benefit",
    labelKey: "benefits",
    href: "/benefits",
    icon: "/figma-assets/icon-benefit-default.svg",
    activeIcon: "/figma-assets/icon-benefit-active.svg",
  },
  {
    value: "mission",
    labelKey: "mission",
    href: "/mission",
    icon: "/figma-assets/icon-mission-default.svg",
    activeIcon: "/figma-assets/icon-mission-active.svg",
  },
  {
    value: "my",
    labelKey: "my",
    href: "/my",
    icon: "/figma-assets/icon-my-default.svg",
    activeIcon: "/figma-assets/icon-my-active.svg",
  },
];

export function BottomNavigation({
  active,
  onValueChange,
  className,
  ...props
}: BottomNavigationProps) {
  const t = useTranslations("Navigation");
  const pathname = usePathname();

  const currentActive =
    active ??
    bottomNavigationItems.find((item) => {
      // "/"는 모든 경로의 prefix라 홈 탭만 정확히 일치시킴
      if (item.href === "/") {
        return pathname === "/";
      }

      return pathname === item.href || pathname.startsWith(`${item.href}/`);
    })?.value ??
    "home";

  return (
    <nav
      aria-label={t("primaryMenu")}
      className={cn(
        "flex h-bottom-nav w-full items-center bg-surface py-sm",
        className,
      )}
      {...props}
    >
      {bottomNavigationItems.map((item) => {
        const isActive = currentActive === item.value;

        const itemClassName = cn(
          "flex min-w-0 flex-1 flex-col items-center justify-center gap-xs",
          "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-action-primary",
        );

        const content = (
          <>
            <span className="relative size-[24px] overflow-hidden">
              {item.value === "ai" ? (
                <Bot
                  aria-hidden="true"
                  size={24}
                  strokeWidth={1.8}
                  className={cn(
                    isActive ? "text-action-primary" : "text-icon-secondary",
                  )}
                />
              ) : (
                <FigmaImage
                  alt=""
                  src={isActive ? item.activeIcon : item.icon}
                  className="size-full"
                />
              )}
            </span>

            <span
              className={cn(
                "font-sans text-caption-12-regular text-text-secondary",
                isActive && "text-caption-12-bold text-text-brand",
              )}
            >
              {t(item.labelKey)}
            </span>
          </>
        );

        if (onValueChange) {
          return (
            <button
              key={item.value}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onValueChange(item.value)}
              className={itemClassName}
            >
              {content}
            </button>
          );
        }

        return (
          <Link
            key={item.value}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={itemClassName}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
