"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type MissionTab = "attendance" | "progress" | "completed";
const tabs: { value: MissionTab; href: string }[] = [
  { value: "attendance", href: "/mission/attendance" },
  { value: "progress", href: "/mission" },
  { value: "completed", href: "/mission/completed" },
];

export function MissionSubNav({ active }: { active: MissionTab }) {
  const t = useTranslations("Missions.tabs");
  return (
    <nav
      aria-label={t("label")}
      className="sticky top-0 z-10 flex h-touch border-b border-border-default bg-surface"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          href={tab.href}
          aria-current={active === tab.value ? "page" : undefined}
          className={cn(
            "relative flex flex-1 items-center justify-center font-sans text-caption-13-medium text-text-secondary",
            active === tab.value &&
              "text-caption-13-bold text-text-brand after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-action-primary",
          )}
        >
          {t(tab.value)}
        </Link>
      ))}
    </nav>
  );
}
