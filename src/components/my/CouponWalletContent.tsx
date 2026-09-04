"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Barcode from "react-barcode";

import { MySubpageHeader } from "@/components/my/MySubpageHeader";
import { Button } from "@/components/ui/Button/Button";
import {
  BrandLogo,
  resolveBrandLogoName,
} from "@/components/ui/BrandLogo/BrandLogo";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { FloatingToast } from "@/components/ui/Toast/Toast";
import { Link } from "@/i18n/navigation";
import { useHydrated } from "@/hooks/useHydrated";
import { consumeMyCoupon, getMyCoupons } from "@/lib/api/coupon";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Coupon, CouponFilter } from "@/types/coupon";

const filters: CouponFilter[] = ["available", "expiring", "used", "expired"];

export function CouponWalletContent() {
  const t = useTranslations("MyCoupons");
  const locale = useLocale();
  const hydrated = useHydrated();
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<CouponFilter>("available");
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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
      setSelectedCoupon(null);
      setToastMessage(t("useComplete"));
      await queryClient.invalidateQueries({ queryKey: ["coupons", "me"] });
      setFilter("used");
    },
    onError: () => setToastMessage(t("useFailed")),
  });

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

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
          <div className="rounded-lg border border-border-default bg-surface pb-lg text-center shadow-sm">
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
            <section className="relative min-h-[144px] overflow-hidden rounded-lg bg-[#d9e2f1] p-lg shadow-sm">
              <div className="relative z-10 max-w-[58%]">
                <p className="font-sans text-caption-13-medium text-text-on-cool-surface">
                  {t("availableCoupons")}
                </p>
                <strong className="mt-xs block font-sans text-title-24-bold text-text-strong-on-cool-surface">
                  {t("couponCount", {
                    count: couponQuery.data?.summary.available ?? 0,
                  })}
                </strong>
                <p className="mt-sm font-sans text-caption-12-regular text-text-on-cool-surface">
                  {t("expiringCount", {
                    count: couponQuery.data?.summary.expiring ?? 0,
                  })}
                </p>
              </div>

              <div
                aria-hidden="true"
                className="absolute top-0 right-sm flex h-full w-[48%] items-center justify-end"
              >
                <Image
                  src="/yogoda-banners/coupon-character-transparent.png"
                  loading="eager"
                  alt=""
                  width={700}
                  height={379}
                  className="h-auto w-full object-contain"
                />
              </div>
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
              <section className="space-y-lg">
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
                className="w-full"
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
          isUsing={useCouponMutation.isPending}
          onUse={() => useCouponMutation.mutate(selectedCoupon.id)}
        />
      )}

      {toastMessage && (
        <FloatingToast message={toastMessage} actionLabel={null} />
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
  const brand =
    resolveBrandLogoName(coupon.brand, coupon.partner, coupon.title) ?? "U+";

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-start gap-lg rounded-lg border border-border-default bg-surface p-lg text-left shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
    >
      <BrandLogo brand={brand} className="size-[40px]" />
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
  isUsing,
  onClose,
  onUse,
}: {
  coupon: Coupon;
  locale: string;
  isUsing: boolean;
  onClose: () => void;
  onUse: () => void;
}) {
  const t = useTranslations("MyCoupons");
  const canUse = coupon.status === "available";
  const brand =
    resolveBrandLogoName(coupon.brand, coupon.partner, coupon.title) ?? "U+";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-xl"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="coupon-detail-title"
        className="max-h-[88dvh] w-full max-w-mobile overflow-y-auto rounded-t-xl bg-background p-page sm:rounded-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-lg">
          <div className="flex min-w-0 items-start gap-md">
            <BrandLogo brand={brand} />
            <div className="min-w-0">
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

        <div className="mt-xl overflow-hidden rounded-lg border border-border-default bg-surface p-lg text-center shadow-sm">
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
          <Button
            className="mt-xl h-[52px] w-full"
            loading={isUsing}
            onClick={onUse}
          >
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
    <div className="animate-pulse space-y-xl" aria-hidden="true">
      <div className="min-h-[144px] rounded-lg bg-surface-subtle p-lg">
        <div className="h-[14px] w-[96px] rounded-sm bg-border-default" />
        <div className="mt-sm h-[28px] w-[48px] rounded-sm bg-border-default" />
        <div className="mt-sm h-[12px] w-[110px] rounded-sm bg-border-default" />
      </div>
      <div className="grid grid-cols-4 gap-xs rounded-lg bg-surface-subtle p-xs">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[36px] rounded-sm bg-surface" />
        ))}
      </div>
      <div className="space-y-lg">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="h-[108px] rounded-lg border border-border-default bg-surface-subtle"
          />
        ))}
      </div>
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
