"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Clock3,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  Store as StoreIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { MySubpageHeader } from "./MySubpageHeader";

import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { getStore } from "@/lib/api/store";

export function StoreDetailContent({ code }: { code: string }) {
  const t = useTranslations("Stores");
  const storeQuery = useQuery({
    queryKey: ["stores", code],
    queryFn: () => getStore(code),
    retry: false,
  });
  const store = storeQuery.data;

  return (
    <div className="min-h-full bg-background pb-3xl">
      <MySubpageHeader
        title={store?.name ?? t("detailTitle")}
        backLabel={t("back")}
      />

      {storeQuery.isPending ? (
        <div className="space-y-2xl px-page py-xl" aria-hidden="true">
          <div className="h-[176px] animate-pulse rounded-lg border border-border-default bg-surface-subtle shadow-sm" />
          <div className="h-[220px] animate-pulse rounded-lg border border-border-default bg-surface-subtle shadow-sm" />
        </div>
      ) : storeQuery.isError || !store ? (
        <div className="px-page py-xl">
          <ErrorState
            title={t("detailError")}
            description={t("loadErrorDescription")}
            retryLabel={t("retry")}
            onRetry={() => storeQuery.refetch()}
          />
        </div>
      ) : (
        <div className="space-y-2xl px-page py-xl">
          <section className="rounded-lg border border-border-default bg-surface p-lg shadow-sm">
            <span className="flex size-[48px] items-center justify-center rounded-lg bg-brand-soft text-icon-brand">
              <StoreIcon aria-hidden="true" size={25} />
            </span>
            <h1 className="mt-lg font-sans text-title-20-bold text-text-primary">
              {store.name}
            </h1>
            <p className="mt-sm flex items-start gap-sm font-sans text-body-14-regular text-text-secondary">
              <MapPin className="mt-xs shrink-0 text-icon-brand" size={17} />
              {store.address}
            </p>
          </section>

          <section>
            <h2 className="font-sans text-title-16-bold text-text-primary">
              {t("availableServices")}
            </h2>
            <div className="mt-md flex flex-wrap gap-sm">
              {store.services.map((service) => (
                <span
                  key={service}
                  className="rounded-full bg-brand-soft px-md py-sm font-sans text-caption-12-bold text-text-brand"
                >
                  {t(`services.${service}`)}
                </span>
              ))}
            </div>
          </section>

          <section className="divide-y divide-border-default rounded-lg border border-border-default bg-surface px-lg shadow-sm">
            <DetailRow
              icon={<Clock3 size={19} />}
              label={t("weekday")}
              value={store.hours.weekday}
            />
            <DetailRow
              icon={<Clock3 size={19} />}
              label={t("saturday")}
              value={store.hours.saturday ?? t("contactStore")}
            />
            <DetailRow
              icon={<Clock3 size={19} />}
              label={t("sunday")}
              value={store.hours.sunday ?? t("contactStore")}
            />
          </section>

          <section className="grid grid-cols-2 gap-sm">
            {store.phone ? (
              <a
                href={`tel:${store.phone}`}
                className="flex h-[52px] items-center justify-center gap-sm rounded-lg border border-border-default bg-surface font-sans text-label-14-bold text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
              >
                <Phone aria-hidden="true" size={18} />
                {t("call")}
              </a>
            ) : (
              <span className="flex h-[52px] items-center justify-center rounded-lg bg-surface-subtle font-sans text-label-14-bold text-text-tertiary">
                {t("phoneUnavailable")}
              </span>
            )}
            <a
              href={`https://map.naver.com/p/search/${encodeURIComponent(store.address)}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-[52px] items-center justify-center gap-sm rounded-lg bg-action-primary font-sans text-label-14-bold text-text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
            >
              <Navigation aria-hidden="true" size={18} />
              {t("directions")}
              <ExternalLink aria-hidden="true" size={14} />
            </a>
          </section>

          <p className="font-sans text-caption-12-regular text-text-tertiary">
            {t("hoursNotice")}
          </p>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[60px] items-center gap-md py-md">
      <span className="text-icon-brand">{icon}</span>
      <span className="font-sans text-caption-13-medium text-text-secondary">
        {label}
      </span>
      <strong className="ml-auto text-right font-sans text-caption-13-bold text-text-primary">
        {value}
      </strong>
    </div>
  );
}
