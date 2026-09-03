"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { BenefitsSubNav } from "./BenefitsSubNav";
import {
  BrandLogo,
  resolveBrandLogoName,
} from "@/components/ui/BrandLogo/BrandLogo";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { Modal } from "@/components/ui/Modal/Modal";
import { PageIntro } from "@/components/ui/PageIntro/PageIntro";
import { FloatingToast } from "@/components/ui/Toast/Toast";
import { getSavedBenefits, setBenefitSaved } from "@/lib/api/benefit";
import type { Benefit } from "@/types/benefit";

export function SavedBenefitsContent() {
  const t = useTranslations("SavedBenefits");
  const queryClient = useQueryClient();
  const [pendingRemoval, setPendingRemoval] = useState<Benefit | null>(null);
  const [showRemovedToast, setShowRemovedToast] = useState(false);
  const query = useQuery({
    queryKey: ["benefits", "saved"],
    queryFn: getSavedBenefits,
    retry: false,
  });
  const remove = useMutation({
    mutationFn: (code: string) => setBenefitSaved(code, false),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["benefits"] });
      setPendingRemoval(null);
      setShowRemovedToast(true);
    },
  });
  useEffect(() => {
    if (!showRemovedToast) return;
    const timer = window.setTimeout(() => setShowRemovedToast(false), 2500);
    return () => window.clearTimeout(timer);
  }, [showRemovedToast]);
  return (
    <div className="min-h-full bg-background pb-xl">
      <BenefitsSubNav active="saved" />
      <PageIntro title={t("title")} description={t("description")} />
      <div className="space-y-xl px-page py-xl">
        {query.isPending ? (
          <div className="animate-pulse space-y-lg" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex h-[84px] items-center gap-md rounded-lg border border-border-default bg-surface p-lg shadow-sm"
              >
                <div className="size-[40px] shrink-0 rounded-sm bg-surface-subtle" />
                <div className="min-w-0 flex-1 space-y-xs">
                  <div className="h-[14px] w-2/5 rounded-sm bg-surface-subtle" />
                  <div className="h-[12px] w-3/5 rounded-sm bg-surface-subtle" />
                </div>
                <div className="size-touch shrink-0 rounded-full bg-surface-subtle" />
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            title={t("error")}
            description={t("errorDescription")}
            retryLabel={t("retry")}
            onRetry={() => query.refetch()}
          />
        ) : query.data?.benefits.length ? (
          <section className="space-y-lg">
            {query.data.benefits.map((benefit) => (
              <div
                key={benefit.code}
                className="flex items-center gap-md rounded-lg border border-border-default bg-surface p-lg shadow-sm"
              >
                <BrandLogo
                  brand={
                    resolveBrandLogoName(
                      benefit.brand,
                      benefit.partner,
                      benefit.title,
                    ) ?? "U+"
                  }
                  className="size-[40px]"
                />
                <div className="min-w-0 flex-1">
                  <strong className="block truncate font-sans text-label-14-bold text-text-primary">
                    {benefit.title}
                  </strong>
                  <span className="mt-xs block truncate font-sans text-caption-12-regular text-text-secondary">
                    {benefit.summary}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label={t("remove")}
                  onClick={() => setPendingRemoval(benefit)}
                  className="flex size-touch items-center justify-center text-icon-secondary"
                >
                  <Trash2 size={19} />
                </button>
              </div>
            ))}
          </section>
        ) : (
          <EmptyState
            heading={t("empty")}
            description={t("emptyDescription")}
            className="w-full"
          />
        )}
      </div>
      {pendingRemoval && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-lg"
          onMouseDown={() => setPendingRemoval(null)}
        >
          <Modal
            icon={
              <Trash2
                aria-hidden="true"
                size={21}
                className="text-action-primary"
              />
            }
            heading={t("removeTitle")}
            description={t("removeDescription", {
              title: pendingRemoval.title,
            })}
            primaryLabel={t("confirmRemove")}
            secondaryLabel={t("cancel")}
            primaryLoading={remove.isPending}
            onClose={() => setPendingRemoval(null)}
            onPrimaryClick={() => remove.mutate(pendingRemoval.code)}
            onSecondaryClick={() => setPendingRemoval(null)}
          />
        </div>
      )}
      {showRemovedToast && (
        <FloatingToast message={t("removedToast")} actionLabel={null} />
      )}
    </div>
  );
}
