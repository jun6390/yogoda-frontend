"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, Ticket } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { MySubpageHeader } from "@/components/my/MySubpageHeader";
import {
  BrandLogo,
  resolveBrandLogoName,
} from "@/components/ui/BrandLogo/BrandLogo";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { Modal } from "@/components/ui/Modal/Modal";
import { Toast } from "@/components/ui/Toast/Toast";
import { Link } from "@/i18n/navigation";
import { exchangePointProduct, getPointProducts } from "@/lib/api/reward";
import { useAuthStore } from "@/stores/useAuthStore";
import type { PointProduct } from "@/types/point-shop";

const subscribe = () => () => {};

function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

function createRequestKey() {
  return (
    globalThis.crypto?.randomUUID() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

export function PointShopContent() {
  const t = useTranslations("PointShop");
  const locale = useLocale();
  const hydrated = useHydrated();
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<{
    product: PointProduct;
    requestKey: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isLoggedIn = hydrated && Boolean(accessToken);

  const productsQuery = useQuery({
    queryKey: ["rewards", "point-products"],
    queryFn: getPointProducts,
    enabled: isLoggedIn,
    retry: false,
  });

  const exchangeMutation = useMutation({
    mutationFn: ({ product, requestKey }: NonNullable<typeof selected>) =>
      exchangePointProduct(product.code, requestKey),
    onSuccess: async (result, variables) => {
      setSelected(null);
      setToastMessage(
        t("exchangeComplete", { product: variables.product.title }),
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["rewards", "point-products"],
        }),
        queryClient.invalidateQueries({ queryKey: ["points"] }),
        queryClient.invalidateQueries({ queryKey: ["coupons", "me"] }),
      ]);
      queryClient.setQueryData(["points"], result.wallet);
    },
  });

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const balance = productsQuery.data?.balance ?? 0;
  const openExchangeModal = (product: PointProduct) => {
    exchangeMutation.reset();
    setSelected({ product, requestKey: createRequestKey() });
  };
  const closeExchangeModal = () => {
    exchangeMutation.reset();
    setSelected(null);
  };

  return (
    <div className="min-h-full bg-background pb-3xl">
      <MySubpageHeader title={t("title")} backLabel={t("back")} />

      <div className="space-y-xl px-page py-xl">
        {!hydrated ? (
          <PointShopSkeleton />
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
        ) : productsQuery.isPending ? (
          <PointShopSkeleton />
        ) : productsQuery.isError ? (
          <ErrorState
            title={t("loadError")}
            description={t("loadErrorDescription")}
            retryLabel={t("retry")}
            onRetry={() => productsQuery.refetch()}
          />
        ) : (
          <>
            <section className="flex min-h-[112px] items-center justify-between rounded-lg bg-brand-soft px-xl py-lg">
              <div>
                <p className="font-sans text-caption-13-medium text-text-secondary">
                  {t("myPoints")}
                </p>
                <strong className="mt-xs block font-sans text-title-24-bold text-text-brand">
                  {t("points", {
                    points: new Intl.NumberFormat(locale).format(balance),
                  })}
                </strong>
                <p className="mt-xs font-sans text-caption-12-regular text-text-secondary">
                  {t("pointsDescription")}
                </p>
              </div>
              <span className="flex size-[48px] items-center justify-center rounded-full bg-surface text-icon-brand shadow-sm">
                <Coins aria-hidden="true" size={24} />
              </span>
            </section>

            <section>
              <div className="mb-md">
                <h2 className="font-sans text-title-18-bold text-text-primary">
                  {t("productsTitle")}
                </h2>
                <p className="mt-xs font-sans text-caption-13-regular text-text-secondary">
                  {t("productsDescription")}
                </p>
              </div>

              {productsQuery.data?.products.length ? (
                <div className="space-y-lg">
                  {productsQuery.data.products.map((product) => (
                    <PointProductCard
                      key={product.code}
                      product={product}
                      balance={balance}
                      locale={locale}
                      onExchange={() => openExchangeModal(product)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  heading={t("emptyTitle")}
                  description={t("emptyDescription")}
                  className="w-full rounded-lg bg-surface"
                />
              )}
            </section>
          </>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-lg">
          <Modal
            icon={<Ticket aria-hidden="true" size={20} />}
            heading={t("confirmTitle")}
            description={
              exchangeMutation.isError
                ? `${t("confirmDescription", {
                    product: selected.product.title,
                    points: new Intl.NumberFormat(locale).format(
                      selected.product.exchangePoints,
                    ),
                  })}\n${exchangeMutation.error.message}`
                : t("confirmDescription", {
                    product: selected.product.title,
                    points: new Intl.NumberFormat(locale).format(
                      selected.product.exchangePoints,
                    ),
                  })
            }
            primaryLabel={t("confirmExchange")}
            secondaryLabel={t("cancel")}
            primaryLoading={exchangeMutation.isPending}
            onClose={closeExchangeModal}
            onPrimaryClick={() => exchangeMutation.mutate(selected)}
            onSecondaryClick={closeExchangeModal}
          />
        </div>
      )}

      {toastMessage && (
        <Toast
          message={toastMessage}
          actionLabel={null}
          className="fixed bottom-[calc(var(--bottom-nav-height)+var(--spacing-lg))] left-1/2 z-[70] max-w-[calc(100%-32px)] -translate-x-1/2"
        />
      )}
    </div>
  );
}

function PointProductCard({
  product,
  balance,
  locale,
  onExchange,
}: {
  product: PointProduct;
  balance: number;
  locale: string;
  onExchange: () => void;
}) {
  const t = useTranslations("PointShop");
  const brand =
    resolveBrandLogoName(product.brand, product.partner, product.title) ?? "U+";
  const insufficient = balance < product.exchangePoints;

  return (
    <article className="flex min-h-[132px] flex-col justify-between rounded-lg border border-border-default bg-surface p-lg shadow-sm">
      <div className="flex min-w-0 items-start gap-md">
        <BrandLogo brand={brand} className="size-[44px]" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-sans text-label-14-bold text-text-primary">
            {product.title}
          </h3>
          <p className="mt-xs line-clamp-1 font-sans text-caption-13-regular text-text-secondary">
            {product.value}
          </p>
          <p className="mt-xs font-sans text-caption-12-regular text-text-tertiary">
            {t("validity", { days: product.validityDays })}
          </p>
        </div>
      </div>
      <div className="mt-lg flex items-center justify-between gap-md">
        <strong className="font-sans text-label-14-bold text-text-brand">
          {t("points", {
            points: new Intl.NumberFormat(locale).format(
              product.exchangePoints,
            ),
          })}
        </strong>
        <button
          type="button"
          disabled={!product.exchangeable}
          onClick={onExchange}
          className="h-[36px] min-w-[88px] rounded-lg bg-action-primary px-lg font-sans text-caption-13-bold text-text-on-primary transition-colors hover:bg-action-primary-hover disabled:cursor-not-allowed disabled:bg-border-default disabled:text-text-tertiary"
        >
          {product.soldOut
            ? t("soldOut")
            : insufficient
              ? t("notEnoughPoints")
              : t("exchange")}
        </button>
      </div>
    </article>
  );
}

function PointShopSkeleton() {
  return (
    <div className="space-y-xl" aria-hidden="true">
      <div className="h-[112px] animate-pulse rounded-lg bg-surface-subtle" />
      <div className="space-y-lg">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-[132px] animate-pulse rounded-lg bg-surface-subtle"
          />
        ))}
      </div>
    </div>
  );
}
