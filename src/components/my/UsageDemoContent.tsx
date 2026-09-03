"use client";

import { useEffect, useState, type ReactNode } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, TrendingDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { MySubpageHeader } from "@/components/my/MySubpageHeader";
import { FloatingToast } from "@/components/ui/Toast/Toast";
import { Link } from "@/i18n/navigation";
import { applyDemoUsageScenario } from "@/lib/api/usage";
import type { DemoUsageScenario } from "@/types/usage";

export function UsageDemoContent() {
  const t = useTranslations("UsageDemo");
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: applyDemoUsageScenario,
    onSuccess: async (_, scenario) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-usage-report"] }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions", "me"] }),
      ]);
      setToastMessage(
        scenario === "usage-drop"
          ? t("dropAppliedToast")
          : t("baselineAppliedToast"),
      );
    },
    onError: () => setToastMessage(t("error")),
  });
  const apply = (scenario: DemoUsageScenario) => mutation.mutate(scenario);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  return (
    <div className="min-h-full bg-background pb-3xl">
      <MySubpageHeader title={t("title")} backLabel={t("back")} />
      <main className="space-y-lg px-page py-lg">
        <section>
          <h1 className="font-sans text-title-20-bold text-text-primary">
            {t("headline")}
          </h1>
          <p className="mt-xs font-sans text-caption-13-regular text-text-secondary">
            {t("description")}
          </p>
        </section>
        <ScenarioCard
          icon={<Activity size={20} />}
          title={t("baselineTitle")}
          description={t("baselineDescription")}
          label={t("applyBaseline")}
          disabled={mutation.isPending}
          onClick={() => apply("baseline")}
        />
        <ScenarioCard
          icon={<TrendingDown size={20} />}
          title={t("dropTitle")}
          description={t("dropDescription")}
          label={t("applyDrop")}
          disabled={mutation.isPending}
          onClick={() => apply("usage-drop")}
        />
        <Link
          href="/my/usage"
          className="flex h-[52px] items-center justify-center rounded-lg bg-action-primary font-sans text-title-16-bold text-text-on-primary"
        >
          {t("viewReport")}
        </Link>
      </main>
      {toastMessage && (
        <FloatingToast message={toastMessage} actionLabel={null} />
      )}
    </div>
  );
}

function ScenarioCard({
  icon,
  title,
  description,
  label,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <section className="rounded-lg border border-border-default bg-surface p-lg shadow-sm">
      <span className="flex size-[40px] items-center justify-center rounded-md bg-icon-brand-soft text-icon-brand">
        {icon}
      </span>
      <h2 className="mt-md font-sans text-title-16-bold text-text-primary">
        {title}
      </h2>
      <p className="mt-xs font-sans text-caption-13-regular text-text-secondary">
        {description}
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="mt-lg h-[44px] w-full rounded-md border border-action-primary font-sans text-label-14-bold text-action-primary disabled:opacity-50"
      >
        {label}
      </button>
    </section>
  );
}
