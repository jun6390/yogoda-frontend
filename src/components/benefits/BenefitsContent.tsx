"use client";

import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, MapPin, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import { BenefitRow } from "@/components/ui/BenefitRow/BenefitRow";
import {
  BrandLogo,
  resolveBrandLogoName,
} from "@/components/ui/BrandLogo/BrandLogo";
import { Button } from "@/components/ui/Button/Button";
import { FloatingToast } from "@/components/ui/Toast/Toast";
import { BenefitsSubNav } from "./BenefitsSubNav";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { FavoriteIcon } from "@/components/ui/FavoriteIcon/FavoriteIcon";
import { PageIntro } from "@/components/ui/PageIntro/PageIntro";
import { getBenefits, setBenefitSaved } from "@/lib/api/benefit";
import { useHydrated } from "@/hooks/useHydrated";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Benefit, BenefitFilter } from "@/types/benefit";

const filters: BenefitFilter[] = ["all", "membership", "partner", "discount"];
const BENEFITS_PER_PAGE = 6;

export function BenefitsContent() {
  const t = useTranslations("Benefits");
  const hydrated = useHydrated();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [filter, setFilter] = useState<BenefitFilter>("all");
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(BENEFITS_PER_PAGE);
  const isLoggedIn = hydrated && Boolean(accessToken);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const benefitQuery = useQuery({
    queryKey: ["benefits", filter],
    queryFn: () => getBenefits(filter),
    enabled: isLoggedIn,
    placeholderData: (previousData) => previousData,
    retry: false,
  });

  return (
    <div className="min-h-full bg-background pb-xl">
      <BenefitsSubNav active="all" />
      <PageIntro
        title={t("headline")}
        description={
          benefitQuery.data
            ? t("eligibleSummary", { count: benefitQuery.data.eligibleCount })
            : t("description")
        }
      />

      <div className="space-y-xl px-page py-xl">
        <div
          role="tablist"
          aria-label={t("filterLabel")}
          className="flex gap-sm overflow-x-auto"
        >
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={filter === item}
              onClick={() => {
                setFilter(item);
                setVisibleCount(BENEFITS_PER_PAGE);
              }}
              className={cn(
                "h-[36px] shrink-0 rounded-full border px-lg font-sans text-caption-13-bold transition-colors",
                filter === item
                  ? "border-action-primary bg-action-primary text-text-on-primary"
                  : "border-border-default bg-surface text-text-secondary",
              )}
            >
              {t(`filters.${item}`)}
            </button>
          ))}
        </div>

        {!hydrated || (isLoggedIn && benefitQuery.isPending) ? (
          <BenefitSkeleton />
        ) : !isLoggedIn ? (
          <EmptyState
            heading={t("loginRequired")}
            description={t("loginDescription")}
          />
        ) : benefitQuery.isError ? (
          <ErrorState
            title={t("loadError")}
            description={t("loadErrorDescription")}
            retryLabel={t("retry")}
            onRetry={() => benefitQuery.refetch()}
          />
        ) : benefitQuery.data?.benefits.length ? (
          <section
            aria-labelledby="benefit-list-title"
            className="rounded-lg border border-border-default bg-surface p-lg shadow-sm"
          >
            <div className="mb-xl flex items-center justify-between">
              <h2
                id="benefit-list-title"
                className="font-sans text-title-18-bold text-text-primary"
              >
                {t("popular")}
              </h2>
              {benefitQuery.data.currentMembershipTier && (
                <span className="rounded-full bg-brand-soft px-md py-xs font-sans text-caption-12-bold text-text-brand">
                  {benefitQuery.data.currentMembershipTier}
                </span>
              )}
            </div>
            <div className="space-y-xl">
              {benefitQuery.data.benefits
                .slice(0, visibleCount)
                .map((benefit) => (
                  <button
                    key={benefit.code}
                    type="button"
                    onClick={() => setSelectedBenefit(benefit)}
                    className="block w-full text-left"
                  >
                    <BenefitRow
                      iconClassName="size-[40px] bg-transparent"
                      iconLabel={
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
                      }
                      name={benefit.title}
                      description={benefit.summary}
                      value={
                        <span
                          className={cn(
                            "flex items-center gap-xs",
                            benefit.eligible
                              ? "text-success"
                              : "text-text-tertiary",
                          )}
                        >
                          {benefit.eligible ? t("available") : t("unavailable")}
                          <ChevronRight aria-hidden="true" size={18} />
                        </span>
                      }
                      className="max-w-none"
                    />
                  </button>
                ))}
              {visibleCount < benefitQuery.data.benefits.length && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    setVisibleCount((count) => count + BENEFITS_PER_PAGE)
                  }
                  className="h-[44px] w-full py-0 text-label-14-bold"
                >
                  {t("loadMore")}
                </Button>
              )}
            </div>
          </section>
        ) : (
          <EmptyState
            heading={t("emptyTitle")}
            description={t("emptyDescription")}
          />
        )}

        <Link
          href="/benefits/nearby"
          className="flex items-center justify-between gap-md rounded-lg border border-border-default bg-surface p-lg shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          <div className="flex min-w-0 items-start gap-md">
            <span className="flex size-[36px] shrink-0 items-center justify-center rounded-sm bg-brand-soft text-icon-brand">
              <MapPin aria-hidden="true" size={20} />
            </span>
            <div className="min-w-0">
              <h2 className="font-sans text-label-14-bold text-text-primary">
                {t("nearbyTitle")}
              </h2>
              <p className="mt-xs font-sans text-caption-13-regular text-text-secondary">
                {t("nearbyDescription")}
              </p>
            </div>
          </div>
          <ChevronRight
            aria-hidden="true"
            className="shrink-0 text-icon-secondary"
            size={18}
          />
        </Link>
      </div>

      {selectedBenefit && (
        <BenefitDetail
          benefit={selectedBenefit}
          onClose={() => setSelectedBenefit(null)}
          onSaved={(saved) =>
            setToastMessage(saved ? t("savedToast") : t("removedToast"))
          }
        />
      )}
      {toastMessage && (
        <FloatingToast message={toastMessage} actionLabel={null} />
      )}
    </div>
  );
}

function BenefitDetail({
  benefit,
  onClose,
  onSaved,
}: {
  benefit: Benefit;
  onClose: () => void;
  onSaved: (saved: boolean) => void;
}) {
  const t = useTranslations("Benefits");
  const queryClient = useQueryClient();
  const saveMutation = useMutation({
    mutationFn: () => setBenefitSaved(benefit.code, !benefit.saved),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["benefits"] });
      onSaved(result.saved);
      onClose();
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-xl"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="benefit-title"
        className="w-full max-w-mobile rounded-t-xl bg-background p-page sm:rounded-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-lg">
          <BrandLogo
            brand={
              resolveBrandLogoName(
                benefit.brand,
                benefit.partner,
                benefit.title,
              ) ?? "U+"
            }
          />
          <button
            type="button"
            aria-label={t("close")}
            onClick={onClose}
            className="flex size-touch items-center justify-center text-icon-default"
          >
            <X aria-hidden="true" size={24} />
          </button>
        </div>
        <p className="mt-lg font-sans text-caption-13-regular text-text-secondary">
          {benefit.brand ?? benefit.partner ?? t("benefit")}
        </p>
        <h2
          id="benefit-title"
          className="mt-xs font-sans text-title-20-bold text-text-primary"
        >
          {benefit.title}
        </h2>
        <p className="mt-md font-sans text-body-14-regular text-text-secondary">
          {benefit.summary}
        </p>

        <dl className="mt-xl divide-y divide-border-default rounded-lg bg-surface px-lg">
          <DetailRow label={t("value")} value={benefit.value} />
          <DetailRow label={t("eligibility")} value={benefit.eligibility} />
          {benefit.usageLimit && (
            <DetailRow label={t("usageLimit")} value={benefit.usageLimit} />
          )}
        </dl>

        <div
          className={cn(
            "mt-xl flex items-start gap-sm rounded-lg p-lg",
            benefit.eligible
              ? "bg-success-soft text-success"
              : "bg-surface-subtle text-text-secondary",
          )}
        >
          <Check aria-hidden="true" className="mt-[1px] shrink-0" size={18} />
          <p className="font-sans text-label-14-medium">{benefit.reason}</p>
        </div>
        <Button
          variant="secondary"
          className="mt-md h-[48px] w-full gap-sm"
          loading={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          <FavoriteIcon selected={benefit.saved} />
          {benefit.saved ? t("removeSaved") : t("save")}
        </Button>
      </section>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[56px] items-center justify-between gap-lg py-md">
      <dt className="shrink-0 font-sans text-caption-13-regular text-text-secondary">
        {label}
      </dt>
      <dd className="text-right font-sans text-label-14-medium text-text-primary">
        {value}
      </dd>
    </div>
  );
}

function BenefitSkeleton() {
  return (
    <section
      className="animate-pulse rounded-lg border border-border-default bg-surface p-lg shadow-sm"
      aria-hidden="true"
    >
      <div className="mb-xl flex items-center justify-between">
        <div className="h-[22px] w-[88px] rounded-sm bg-surface-subtle" />
        <div className="h-[25px] w-[52px] rounded-full bg-surface-subtle" />
      </div>
      <div className="space-y-xl">
        {Array.from({ length: BENEFITS_PER_PAGE }).map((_, index) => (
          <div key={index} className="flex h-[40px] items-center gap-md">
            <div className="size-[40px] shrink-0 rounded-sm bg-surface-subtle" />
            <div className="min-w-0 flex-1 space-y-xs">
              <div className="h-[14px] w-2/5 rounded-sm bg-surface-subtle" />
              <div className="h-[12px] w-3/5 rounded-sm bg-surface-subtle" />
            </div>
            <div className="h-[14px] w-[56px] rounded-sm bg-surface-subtle" />
          </div>
        ))}
      </div>
    </section>
  );
}
