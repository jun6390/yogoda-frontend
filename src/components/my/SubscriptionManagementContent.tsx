"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clapperboard,
  Music2,
  PackageCheck,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { MySubpageHeader } from "@/components/my/MySubpageHeader";
import { Button } from "@/components/ui/Button/Button";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { Input } from "@/components/ui/Input/Input";
import { Modal } from "@/components/ui/Modal/Modal";
import { Select } from "@/components/ui/Select/Select";
import {
  addMySubscription,
  cancelMySubscription,
  getMySubscriptions,
  reactivateMySubscription,
} from "@/lib/api/subscription";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/useHydrated";
import { useAuthStore } from "@/stores/useAuthStore";
import type {
  SubscriptionCategory,
  SubscriptionInput,
  SubscriptionStatus,
  UserSubscription,
} from "@/types/subscription";

const subscriptionLogos = {
  netflix: {
    src: "/brand-logos/netflix-app.png",
    className: "size-full object-cover",
  },
  tving: {
    src: "/brand-logos/tving-app.png",
    className: "size-full object-cover",
  },
};

function resolveSubscriptionLogo(subscription: UserSubscription) {
  const identity = `${subscription.serviceCode} ${subscription.serviceName}`
    .trim()
    .toLowerCase();

  if (identity.includes("netflix") || identity.includes("넷플릭스")) {
    return subscriptionLogos.netflix;
  }

  if (identity.includes("tving") || identity.includes("티빙")) {
    return subscriptionLogos.tving;
  }

  return null;
}

const serviceCatalog: Array<
  SubscriptionInput & { monthlyFee: number; category: SubscriptionCategory }
> = [
  {
    serviceCode: "netflix",
    serviceName: "Netflix",
    category: "ott",
    monthlyFee: 17_000,
    startedAt: "",
  },
  {
    serviceCode: "tving",
    serviceName: "TVING",
    category: "ott",
    monthlyFee: 7_900,
    startedAt: "",
  },
  {
    serviceCode: "disney-plus",
    serviceName: "Disney+",
    category: "ott",
    monthlyFee: 13_900,
    startedAt: "",
  },
  {
    serviceCode: "youtube-premium",
    serviceName: "YouTube Premium",
    category: "music",
    monthlyFee: 14_900,
    startedAt: "",
  },
  {
    serviceCode: "spotify",
    serviceName: "Spotify",
    category: "music",
    monthlyFee: 11_900,
    startedAt: "",
  },
  {
    serviceCode: "coupang-wow",
    serviceName: "쿠팡 와우",
    category: "shopping",
    monthlyFee: 7_890,
    startedAt: "",
  },
  {
    serviceCode: "baemin-club",
    serviceName: "배민클럽",
    category: "delivery",
    monthlyFee: 3_990,
    startedAt: "",
  },
];

export function SubscriptionManagementContent() {
  const t = useTranslations("MySubscriptions");
  const locale = useLocale();
  const hydrated = useHydrated();
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const isLoggedIn = hydrated && Boolean(accessToken);
  const [filter, setFilter] = useState<SubscriptionStatus>("active");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCode, setSelectedCode] = useState(
    serviceCatalog[0].serviceCode,
  );
  const [monthlyFee, setMonthlyFee] = useState(
    String(serviceCatalog[0].monthlyFee),
  );
  const [startedAt, setStartedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [cancelTarget, setCancelTarget] = useState<UserSubscription | null>(
    null,
  );

  const query = useQuery({
    queryKey: ["subscriptions", "me"],
    queryFn: getMySubscriptions,
    enabled: isLoggedIn,
    retry: false,
  });
  const selectedService =
    serviceCatalog.find((service) => service.serviceCode === selectedCode) ??
    serviceCatalog[0];
  const subscriptions = useMemo(
    () =>
      (query.data?.subscriptions ?? []).filter(
        (subscription) => subscription.status === filter,
      ),
    [filter, query.data?.subscriptions],
  );
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["subscriptions", "me"] });
  const addMutation = useMutation({
    mutationFn: () =>
      addMySubscription({
        serviceCode: selectedService.serviceCode,
        serviceName: selectedService.serviceName,
        category: selectedService.category,
        monthlyFee: Number(monthlyFee),
        startedAt: new Date(`${startedAt}T00:00:00`).toISOString(),
      }),
    onSuccess: async () => {
      await invalidate();
      setFilter("active");
      setIsAdding(false);
    },
  });
  const statusMutation = useMutation({
    mutationFn: (subscription: UserSubscription) =>
      subscription.status === "active"
        ? cancelMySubscription(subscription.id)
        : reactivateMySubscription(subscription.id),
    onSuccess: async () => {
      setCancelTarget(null);
      await invalidate();
    },
  });
  const formatPrice = (value: number) =>
    new Intl.NumberFormat(locale).format(value);
  const serviceOptions = serviceCatalog.map((service) => ({
    value: service.serviceCode,
    label: service.serviceName,
  }));

  return (
    <div className="min-h-full bg-background pb-3xl">
      <MySubpageHeader title={t("title")} backLabel={t("back")} />
      <div className="space-y-xl px-page py-xl">
        {!hydrated || (isLoggedIn && query.isPending) ? (
          <SubscriptionSkeleton />
        ) : !isLoggedIn ? (
          <EmptyState
            heading={t("loginRequired")}
            description={t("loginDescription")}
            className="w-full"
          />
        ) : query.isError ? (
          <ErrorState
            title={t("loadError")}
            description={t("loadErrorDescription")}
            retryLabel={t("retry")}
            onRetry={() => query.refetch()}
          />
        ) : (
          <>
            <section className="rounded-lg border border-border-default bg-surface p-lg shadow-sm">
              <div className="flex items-end justify-between gap-lg">
                <div>
                  <p className="font-sans text-caption-13-regular text-text-secondary">
                    {t("activeSubscriptions")}
                  </p>
                  <strong className="mt-xs block font-sans text-title-24-bold text-text-primary">
                    {t("subscriptionCount", {
                      count: query.data?.summary.activeCount ?? 0,
                    })}
                  </strong>
                </div>
                <div className="text-right">
                  <p className="font-sans text-caption-12-regular text-text-secondary">
                    {t("monthlyTotal")}
                  </p>
                  <strong className="mt-xs block font-sans text-title-18-bold text-text-brand">
                    {t("monthlyPrice", {
                      amount: formatPrice(
                        query.data?.summary.monthlyTotal ?? 0,
                      ),
                    })}
                  </strong>
                </div>
              </div>
            </section>

            <p className="rounded-md bg-surface-subtle p-md font-sans text-caption-12-regular text-text-secondary">
              {t("notice")}
            </p>

            <Button
              variant="secondary"
              onClick={() => setIsAdding((open) => !open)}
              className="h-[48px] w-full gap-sm py-0 text-label-14-bold"
            >
              <Plus aria-hidden="true" size={18} />
              {t("addSubscription")}
            </Button>

            {isAdding && (
              <section className="space-y-lg rounded-lg border border-border-default bg-surface p-lg shadow-sm">
                <h2 className="font-sans text-title-18-bold text-text-primary">
                  {t("addTitle")}
                </h2>
                <label className="block space-y-sm">
                  <span className="font-sans text-caption-12-bold text-text-secondary">
                    {t("service")}
                  </span>
                  <Select
                    value={selectedCode}
                    options={serviceOptions}
                    onChange={(code) => {
                      setSelectedCode(code);
                      const service = serviceCatalog.find(
                        (item) => item.serviceCode === code,
                      );
                      if (service) setMonthlyFee(String(service.monthlyFee));
                    }}
                    ariaLabel={t("service")}
                  />
                </label>
                <label className="block space-y-sm">
                  <span className="font-sans text-caption-12-bold text-text-secondary">
                    {t("monthlyFee")}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    value={monthlyFee}
                    onChange={(event) => setMonthlyFee(event.target.value)}
                  />
                </label>
                <label className="block space-y-sm">
                  <span className="font-sans text-caption-12-bold text-text-secondary">
                    {t("startedAt")}
                  </span>
                  <Input
                    type="date"
                    value={startedAt}
                    onChange={(event) => setStartedAt(event.target.value)}
                  />
                </label>
                {addMutation.isError && (
                  <p className="font-sans text-caption-12-regular text-error">
                    {addMutation.error.message}
                  </p>
                )}
                <Button
                  onClick={() => addMutation.mutate()}
                  loading={addMutation.isPending}
                  disabled={
                    !startedAt ||
                    monthlyFee.trim() === "" ||
                    Number(monthlyFee) < 0
                  }
                  className="h-[48px] w-full py-0 text-label-14-bold"
                >
                  {t("save")}
                </Button>
              </section>
            )}

            <div
              role="tablist"
              aria-label={t("filterLabel")}
              className="grid grid-cols-2 gap-xs rounded-lg bg-surface-subtle p-xs"
            >
              {(["active", "canceled"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  role="tab"
                  aria-selected={filter === status}
                  onClick={() => setFilter(status)}
                  className={cn(
                    "h-[40px] rounded-sm font-sans text-caption-13-bold transition-colors",
                    filter === status
                      ? "bg-surface text-text-brand shadow-sm"
                      : "text-text-secondary",
                  )}
                >
                  {t(`filters.${status}`)}
                </button>
              ))}
            </div>

            {subscriptions.length ? (
              <section className="space-y-lg">
                {subscriptions.map((subscription) => (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    price={formatPrice(subscription.monthlyFee)}
                    category={t(`categories.${subscription.category}`)}
                    actionLabel={
                      subscription.status === "active"
                        ? t("cancel")
                        : t("reactivate")
                    }
                    pending={statusMutation.isPending}
                    onAction={() =>
                      subscription.status === "active"
                        ? setCancelTarget(subscription)
                        : statusMutation.mutate(subscription)
                    }
                  />
                ))}
              </section>
            ) : (
              <EmptyState
                heading={t(`empty.${filter}.title`)}
                description={t(`empty.${filter}.description`)}
                className="w-full"
              />
            )}
          </>
        )}
      </div>

      {cancelTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-lg"
          onMouseDown={() => setCancelTarget(null)}
        >
          <Modal
            heading={t("cancelTitle", { name: cancelTarget.serviceName })}
            description={t("cancelDescription")}
            primaryLabel={t("confirmCancel")}
            secondaryLabel={t("keep")}
            primaryLoading={statusMutation.isPending}
            onClose={() => setCancelTarget(null)}
            onPrimaryClick={() => statusMutation.mutate(cancelTarget)}
            onSecondaryClick={() => setCancelTarget(null)}
          />
        </div>
      )}
    </div>
  );
}

function SubscriptionCard({
  subscription,
  price,
  category,
  actionLabel,
  pending,
  onAction,
}: {
  subscription: UserSubscription;
  price: string;
  category: string;
  actionLabel: string;
  pending: boolean;
  onAction: () => void;
}) {
  const t = useTranslations("MySubscriptions");
  const Icon =
    subscription.category === "ott"
      ? Clapperboard
      : subscription.category === "music"
        ? Music2
        : subscription.category === "delivery"
          ? PackageCheck
          : ShoppingBag;
  const logo = resolveSubscriptionLogo(subscription);

  return (
    <article className="flex items-start gap-md rounded-lg border border-border-default bg-surface p-lg shadow-sm">
      <span
        className={cn(
          "flex size-[40px] shrink-0 items-center justify-center overflow-hidden rounded-sm",
          logo ? "bg-white" : "bg-brand-soft text-icon-brand",
        )}
      >
        {logo ? (
          <Image
            src={logo.src}
            alt=""
            width={40}
            height={40}
            className={logo.className}
          />
        ) : (
          <Icon aria-hidden="true" size={20} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-md">
          <div className="min-w-0">
            <strong className="block truncate font-sans text-label-14-bold text-text-primary">
              {subscription.serviceName}
            </strong>
            <span className="mt-xs block font-sans text-caption-12-regular text-text-secondary">
              {category}
            </span>
          </div>
          <strong className="shrink-0 font-sans text-caption-13-bold text-text-primary">
            {t("monthlyPrice", { amount: price })}
          </strong>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={onAction}
          className={cn(
            "mt-md min-h-[36px] rounded-full border px-md font-sans text-caption-12-bold",
            subscription.status === "active"
              ? "border-error/30 text-error"
              : "border-border-default text-text-brand",
          )}
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
}

function SubscriptionSkeleton() {
  return (
    <div className="animate-pulse space-y-xl" aria-hidden="true">
      <div className="h-[88px] rounded-lg border border-border-default bg-surface-subtle" />
      <div className="h-[48px] rounded-md bg-surface-subtle" />
      <div className="h-[48px] rounded-lg border border-border-default bg-surface-subtle" />
      <div className="grid grid-cols-2 gap-xs rounded-lg bg-surface-subtle p-xs">
        <div className="h-[40px] rounded-sm bg-surface" />
        <div className="h-[40px] rounded-sm bg-surface" />
      </div>
      <div className="space-y-lg">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="h-[124px] rounded-lg border border-border-default bg-surface-subtle"
          />
        ))}
      </div>
    </div>
  );
}
