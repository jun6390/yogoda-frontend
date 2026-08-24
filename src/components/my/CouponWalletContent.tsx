"use client";

import { useState, useSyncExternalStore } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, Ticket, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Barcode from "react-barcode";

import { MySubpageHeader } from "@/components/my/MySubpageHeader";
import { Button } from "@/components/ui/Button/Button";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { Modal } from "@/components/ui/Modal/Modal";
import { Link } from "@/i18n/navigation";
import { consumeMyCoupon, getMyCoupons } from "@/lib/api/coupon";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Coupon, CouponFilter } from "@/types/coupon";

const subscribe = () => () => {};
const filters: CouponFilter[] = ["available", "expiring", "used", "expired"];

function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function CouponWalletContent() {
  const t = useTranslations("MyCoupons");
  const locale = useLocale();
  const hydrated = useHydrated();
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<CouponFilter>("available");
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [confirmingUse, setConfirmingUse] = useState(false);
  const isLoggedIn = hydrated && Boolean(accessToken);

  const couponQuery = useQuery({
    queryKey: ["coupons", "me"],
    queryFn: () => getMyCoupons("all"),
    enabled: isLoggedIn,
    retry: false,
  });

  const useCouponMutation = useMutation({
    mutationFn: (couponId: string) => consumeMyCoupon(couponId),
    onSuccess: async () => {
      setConfirmingUse(false);
      setSelectedCoupon(null);
      await queryClient.invalidateQueries({ queryKey: ["coupons", "me"] });
      setFilter("used");
    },
  });

  const coupons = couponQuery.data?.coupons.filter((coupon) => {
    if (filter === "expiring") {
      return coupon.expiringSoon;
    }
    return coupon.status === filter;
  });

  return (
    <div className="min-h-full bg-background pb-3xl">
      <MySubpageHeader title={t("title")} backLabel={t("back")} />

      <div className="space-y-xl px-page py-xl">
        {!hydrated ? (
          <CouponSkeleton />
        ) : !isLoggedIn ? (
          <div className="rounded-lg bg-surface pb-xl text-center">
            <EmptyState
              heading={t("loginRequired")}
              description={t("loginRequiredDescription")}
              className="w-full"
            />
            <Link
              href="/login"
              className="font-sans text-label-14-bold text-text-brand"
            >
              {t("login")}
            </Link>
          </div>
        ) : couponQuery.isPending ? (
          <CouponSkeleton />
        ) : couponQuery.isError ? (
          <ErrorState
            title={t("loadError")}
            description={t("loadErrorDescription")}
            retryLabel={t("retry")}
            onRetry={() => couponQuery.refetch()}
          />
        ) : (
          <>
            <section className="rounded-lg bg-surface p-xl shadow-sm">
              <p className="font-sans text-caption-13-regular text-text-secondary">
                {t("availableCoupons")}
              </p>
              <strong className="mt-xs block font-sans text-title-24-bold text-text-primary">
                {t("couponCount", {
                  count: couponQuery.data?.summary.available ?? 0,
                })}
              </strong>
              <p className="mt-sm font-sans text-caption-12-regular text-text-secondary">
                {t("expiringCount", {
                  count: couponQuery.data?.summary.expiring ?? 0,
                })}
              </p>
            </section>

            <div
              role="tablist"
              aria-label={t("filterLabel")}
              className="grid grid-cols-4 gap-xs rounded-lg bg-surface-subtle p-xs"
            >
              {filters.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={filter === item}
                  onClick={() => setFilter(item)}
                  className={cn(
                    "h-[36px] rounded-sm font-sans text-caption-12-bold transition-colors",
                    filter === item
                      ? "bg-surface text-text-brand shadow-sm"
                      : "text-text-secondary",
                  )}
                >
                  {t(`filters.${item}`)}
                </button>
              ))}
            </div>

            {coupons && coupons.length > 0 ? (
              <section className="space-y-sm">
                {coupons.map((coupon) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    locale={locale}
                    onSelect={() => setSelectedCoupon(coupon)}
                  />
                ))}
              </section>
            ) : (
              <EmptyState
                heading={t(`empty.${filter}.title`)}
                description={t(`empty.${filter}.description`)}
                className="w-full rounded-lg bg-surface"
              />
            )}
          </>
        )}
      </div>

      {selectedCoupon && (
        <CouponDetail
          coupon={selectedCoupon}
          locale={locale}
          onClose={() => setSelectedCoupon(null)}
          onUse={() => setConfirmingUse(true)}
        />
      )}

      {confirmingUse && selectedCoupon && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-lg">
          <Modal
            icon={
              <Ticket
                aria-hidden="true"
                className="text-icon-brand"
                size={22}
              />
            }
            heading={t("useConfirmTitle")}
            description={
              useCouponMutation.isError
                ? `${t("useConfirmDescription")}\n${useCouponMutation.error.message}`
                : t("useConfirmDescription")
            }
            primaryLabel={t("confirmUse")}
            secondaryLabel={t("cancel")}
            primaryLoading={useCouponMutation.isPending}
            onClose={() => setConfirmingUse(false)}
            onPrimaryClick={() => useCouponMutation.mutate(selectedCoupon.id)}
            onSecondaryClick={() => setConfirmingUse(false)}
          />
        </div>
      )}
    </div>
  );
}

function CouponCard({
  coupon,
  locale,
  onSelect,
}: {
  coupon: Coupon;
  locale: string;
  onSelect: () => void;
}) {
  const t = useTranslations("MyCoupons");

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-start gap-lg rounded-lg border border-border-default bg-surface p-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
    >
      <span className="flex size-[40px] shrink-0 items-center justify-center rounded-sm bg-brand-soft text-icon-brand">
        <Ticket aria-hidden="true" size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-md">
          <strong className="font-sans text-label-14-bold text-text-primary">
            {coupon.title}
          </strong>
          <CouponStatusLabel coupon={coupon} />
        </span>
        <span className="mt-xs block font-sans text-caption-13-regular text-text-secondary">
          {coupon.value}
        </span>
        <span className="mt-sm flex items-center gap-xs font-sans text-caption-12-regular text-text-tertiary">
          <Clock3 aria-hidden="true" size={14} />
          {coupon.status === "used" && coupon.usedAt
            ? t("usedAt", { date: formatDate(coupon.usedAt, locale) })
            : t("expiresAt", { date: formatDate(coupon.expiresAt, locale) })}
        </span>
      </span>
    </button>
  );
}

function CouponStatusLabel({ coupon }: { coupon: Coupon }) {
  const t = useTranslations("MyCoupons");
  const status = coupon.expiringSoon ? "expiring" : coupon.status;

  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-sm py-xs font-sans text-micro-11-bold",
        status === "available" && "bg-brand-soft text-text-brand",
        status === "expiring" && "bg-error-soft text-error",
        (status === "used" || status === "expired") &&
          "bg-surface-subtle text-text-secondary",
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
}

function CouponDetail({
  coupon,
  locale,
  onClose,
  onUse,
}: {
  coupon: Coupon;
  locale: string;
  onClose: () => void;
  onUse: () => void;
}) {
  const t = useTranslations("MyCoupons");
  const canUse = coupon.status === "available";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-xl">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="coupon-detail-title"
        className="max-h-[88dvh] w-full max-w-mobile overflow-y-auto rounded-t-xl bg-background p-page sm:rounded-xl"
      >
        <div className="flex items-start justify-between gap-lg">
          <div>
            <p className="font-sans text-caption-13-regular text-text-secondary">
              {coupon.brand || coupon.partner || t("coupon")}
            </p>
            <h2
              id="coupon-detail-title"
              className="mt-xs font-sans text-title-20-bold text-text-primary"
            >
              {coupon.title}
            </h2>
          </div>
          <button
            type="button"
            aria-label={t("close")}
            onClick={onClose}
            className="flex size-touch shrink-0 items-center justify-center text-icon-default"
          >
            <X aria-hidden="true" size={24} />
          </button>
        </div>

        <div className="mt-xl overflow-hidden rounded-lg bg-surface p-lg text-center shadow-sm">
          <div className="overflow-x-auto">
            <Barcode
              value={coupon.barcodeValue}
              format="CODE128"
              width={1.45}
              height={76}
              displayValue={false}
              margin={0}
              background="transparent"
            />
          </div>
          <p className="mt-md font-mono text-body-14-regular text-text-primary">
            {coupon.couponNumber}
          </p>
          <p className="mt-xs font-sans text-caption-12-regular text-text-secondary">
            {t("showBarcode")}
          </p>
        </div>

        <dl className="mt-xl divide-y divide-border-default rounded-lg bg-surface px-lg">
          <DetailRow label={t("benefit")} value={coupon.value} />
          <DetailRow
            label={t("validUntil")}
            value={formatDate(coupon.expiresAt, locale)}
          />
          {coupon.usedAt && (
            <DetailRow
              label={t("usageDate")}
              value={formatDate(coupon.usedAt, locale, true)}
            />
          )}
        </dl>

        {canUse ? (
          <Button className="mt-xl h-[52px] w-full" onClick={onUse}>
            {t("useCoupon")}
          </Button>
        ) : (
          <div className="mt-xl flex h-[52px] items-center justify-center gap-sm rounded-lg bg-surface-subtle font-sans text-label-14-bold text-text-secondary">
            <CheckCircle2 aria-hidden="true" size={18} />
            {t(`status.${coupon.status}`)}
          </div>
        )}
      </section>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[52px] items-center justify-between gap-lg py-md">
      <dt className="font-sans text-caption-13-regular text-text-secondary">
        {label}
      </dt>
      <dd className="text-right font-sans text-label-14-medium text-text-primary">
        {value}
      </dd>
    </div>
  );
}

function CouponSkeleton() {
  return (
    <div className="space-y-md" aria-hidden="true">
      <div className="h-[112px] animate-pulse rounded-lg bg-surface-subtle" />
      <div className="h-[76px] animate-pulse rounded-lg bg-surface-subtle" />
      <div className="h-[108px] animate-pulse rounded-lg bg-surface-subtle" />
    </div>
  );
}

function formatDate(value: string, locale: string, includeTime = false) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    // 만료일은 날짜 기준 정책이라 사용자 시간대 변환으로 다음 날이 되지 않게 함
    ...(!includeTime && { timeZone: "UTC" }),
    ...(includeTime && { hour: "2-digit", minute: "2-digit" }),
  }).format(new Date(value));
}
