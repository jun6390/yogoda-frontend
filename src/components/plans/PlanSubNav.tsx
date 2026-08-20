"use client";

import { useTranslations } from "next-intl";

import { Tabs } from "@/components/ui/Tabs/Tabs";
import { usePathname, useRouter } from "@/i18n/navigation";

type PlanMenu = "myPlan" | "explore";

export function PlanSubNav() {
  const t = useTranslations("Home");
  const pathname = usePathname();
  const router = useRouter();

  const items = [
    {
      value: "myPlan",
      label: t("myPlan"),
    },
    {
      value: "explore",
      label: t("planExplore"),
    },
  ] as const;

  const activeMenu: PlanMenu = pathname === "/plans" ? "explore" : "myPlan";

  const handleChange = (value: PlanMenu) => {
    if (value === "myPlan") {
      router.push("/");
      return;
    }

    router.push("/plans");
  };

  return (
    <Tabs items={items} active={activeMenu} onValueChange={handleChange} />
  );
}
