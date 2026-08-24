"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  List,
  LocateFixed,
  Map,
  MapPin,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { MySubpageHeader } from "./MySubpageHeader";

import { Chip } from "@/components/ui/Chip/Chip";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { Input } from "@/components/ui/Input/Input";
import { NaverMap } from "@/components/ui/NaverMap/NaverMap";
import { Link } from "@/i18n/navigation";
import { getStores } from "@/lib/api/store";
import { cn } from "@/lib/utils";
import type { StoreService } from "@/types/store";

const services: Array<"all" | StoreService> = [
  "all",
  "mobile",
  "internet",
  "payment",
  "support",
  "data_transfer",
];

interface Coordinates {
  latitude: number;
  longitude: number;
}

export function StoreListContent() {
  const t = useTranslations("Stores");
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("");
  const [service, setService] = useState<"all" | StoreService>("all");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedStoreCode, setSelectedStoreCode] = useState<string>();
  const deferredKeyword = useDeferredValue(keyword.trim());
  const storesQuery = useQuery({
    queryKey: ["stores", deferredKeyword, region, service, coordinates],
    queryFn: () =>
      getStores({
        keyword: deferredKeyword || undefined,
        region: region || undefined,
        service: service === "all" ? undefined : service,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
      }),
    retry: false,
  });
  const mapLocations = useMemo(
    () =>
      storesQuery.data?.stores.map((store) => ({
        id: store.code,
        name: store.name,
        latitude: store.coordinates.latitude,
        longitude: store.coordinates.longitude,
      })) ?? [],
    [storesQuery.data?.stores],
  );
  const selectedStore = storesQuery.data?.stores.find(
    (store) => store.code === selectedStoreCode,
  );

  const requestLocation = () => {
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setCoordinates({
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      () => setLocationError(true),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  return (
    <div className="min-h-full bg-background pb-3xl">
      <MySubpageHeader title={t("title")} backLabel={t("back")} />

      <section className="bg-surface px-page py-xl">
        <h2 className="font-sans text-title-20-bold text-text-primary">
          {t("headline")}
        </h2>
        <p className="mt-xs font-sans text-body-14-regular text-text-secondary">
          {t("description")}
        </p>
        <div className="relative mt-lg">
          <Search
            aria-hidden="true"
            className="absolute left-md top-1/2 z-[1] -translate-y-1/2 text-icon-secondary"
            size={19}
          />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className="pl-[40px]"
          />
        </div>
      </section>

      <section className="space-y-lg px-page py-xl">
        <div className="grid grid-cols-2 rounded-lg bg-surface-subtle p-xs">
          {(["map", "list"] as const).map((item) => {
            const Icon = item === "map" ? Map : List;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setView(item)}
                className={cn(
                  "flex min-h-[40px] items-center justify-center gap-sm rounded-sm font-sans text-caption-13-bold",
                  view === item
                    ? "bg-surface text-text-primary shadow-sm"
                    : "text-text-secondary",
                )}
              >
                <Icon size={17} />
                {t(`views.${item}`)}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-sm overflow-x-auto pb-xs">
          <Chip selected={!region} onClick={() => setRegion("")}>
            {t("allRegions")}
          </Chip>
          {storesQuery.data?.regions.map((item) => (
            <Chip
              key={item}
              selected={region === item}
              onClick={() => setRegion(item)}
            >
              {item}
            </Chip>
          ))}
        </div>

        <div className="flex gap-sm overflow-x-auto pb-xs">
          {services.map((item) => (
            <Chip
              key={item}
              selected={service === item}
              onClick={() => setService(item)}
            >
              {t(`services.${item}`)}
            </Chip>
          ))}
        </div>

        <button
          type="button"
          onClick={requestLocation}
          className="flex min-h-[44px] w-full items-center justify-between rounded-lg border border-border-default bg-surface px-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          <span className="flex items-center gap-sm font-sans text-label-14-bold text-text-primary">
            <LocateFixed className="text-icon-brand" size={18} />
            {coordinates ? t("locationApplied") : t("nearbySort")}
          </span>
          <ChevronRight className="text-icon-secondary" size={18} />
        </button>
        {locationError && (
          <p className="font-sans text-caption-12-regular text-error">
            {t("locationError")}
          </p>
        )}

        {storesQuery.isPending ? (
          <StoreListSkeleton />
        ) : storesQuery.isError ? (
          <ErrorState
            title={t("loadError")}
            description={t("loadErrorDescription")}
            retryLabel={t("retry")}
            onRetry={() => storesQuery.refetch()}
          />
        ) : storesQuery.data.stores.length === 0 ? (
          <EmptyState
            heading={t("emptyTitle")}
            description={t("emptyDescription")}
            className="w-full rounded-lg bg-surface"
          />
        ) : view === "map" ? (
          <div className="relative overflow-hidden rounded-lg border border-border-default bg-surface shadow-sm">
            <NaverMap
              locations={mapLocations}
              selectedId={selectedStoreCode}
              onSelect={setSelectedStoreCode}
              className="h-[440px]"
              errorTitle={t("mapError")}
              errorDescription={t("mapErrorDescription")}
            />
            {selectedStore && (
              <Link
                href={`/my/stores/${selectedStore.code}`}
                className="absolute inset-x-md bottom-md flex items-start gap-md rounded-lg border border-border-default bg-surface p-lg shadow-lg"
              >
                <span className="flex size-[40px] shrink-0 items-center justify-center rounded-sm bg-brand-soft text-icon-brand">
                  <MapPin size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="font-sans text-label-14-bold text-text-primary">
                    {selectedStore.name}
                  </strong>
                  <span className="mt-xs block font-sans text-caption-12-regular text-text-secondary">
                    {selectedStore.address}
                  </span>
                </span>
                <ChevronRight className="text-icon-secondary" size={18} />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-sm">
            <p className="font-sans text-caption-12-regular text-text-secondary">
              {t("resultCount", { count: storesQuery.data.stores.length })}
            </p>
            {storesQuery.data.stores.map((store) => (
              <Link
                key={store.code}
                href={`/my/stores/${store.code}`}
                className="flex min-h-[116px] items-start gap-md rounded-lg border border-border-default bg-surface p-lg shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
              >
                <span className="flex size-[40px] shrink-0 items-center justify-center rounded-sm bg-brand-soft text-icon-brand">
                  <MapPin aria-hidden="true" size={21} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-sm">
                    <strong className="font-sans text-label-14-bold text-text-primary">
                      {store.name}
                    </strong>
                    {store.distanceKm !== null && (
                      <span className="shrink-0 font-sans text-caption-12-bold text-text-brand">
                        {t("distance", { distance: store.distanceKm })}
                      </span>
                    )}
                  </span>
                  <span className="mt-xs block font-sans text-caption-12-regular text-text-secondary">
                    {store.address}
                  </span>
                  <span className="mt-sm block font-sans text-caption-12-bold text-text-primary">
                    {t("weekdayHours", { hours: store.hours.weekday })}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="mt-xs shrink-0 text-icon-secondary"
                  size={18}
                />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StoreListSkeleton() {
  return (
    <div className="space-y-sm" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-[116px] animate-pulse rounded-lg bg-surface-subtle"
        />
      ))}
    </div>
  );
}
