"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Headset,
  LocateFixed,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { MySubpageHeader } from "./MySubpageHeader";

import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Button } from "@/components/ui/Button/Button";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { Input } from "@/components/ui/Input/Input";
import {
  MapFilterChips,
  MapViewToggle,
} from "@/components/ui/MapBrowseControls/MapBrowseControls";
import { NaverMap } from "@/components/ui/NaverMap/NaverMap";
import { Select } from "@/components/ui/Select/Select";
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
const STORES_PER_PAGE = 6;

interface Coordinates {
  latitude: number;
  longitude: number;
}

export function StoreListContent() {
  const t = useTranslations("Stores");
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("");
  const [service, setService] = useState<"all" | StoreService>("all");
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [searchCoordinates, setSearchCoordinates] =
    useState<Coordinates | null>(null);
  const [pendingMapCenter, setPendingMapCenter] = useState<Coordinates | null>(
    null,
  );
  const [locationError, setLocationError] = useState(false);
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedStoreCode, setSelectedStoreCode] = useState<string>();
  const [visibleCount, setVisibleCount] = useState(STORES_PER_PAGE);
  const deferredKeyword = useDeferredValue(keyword.trim());

  const storesQuery = useQuery({
    queryKey: ["stores", deferredKeyword, region, service, searchCoordinates],
    queryFn: () =>
      getStores({
        keyword: deferredKeyword || undefined,
        region: region || undefined,
        service: service === "all" ? undefined : service,
        latitude: searchCoordinates?.latitude,
        longitude: searchCoordinates?.longitude,
      }),
    placeholderData: (previousData) => previousData,
    retry: false,
  });
  const stores = useMemo(() => {
    const items = storesQuery.data?.stores ?? [];

    if (!userLocation) return items;

    return items
      .map((store) => ({
        ...store,
        distanceKm: calculateDistanceKm(userLocation, store.coordinates),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [userLocation, storesQuery.data?.stores]);
  const mapLocations = useMemo(
    () =>
      stores.map((store) => ({
        id: store.code,
        name: store.name,
        latitude: store.coordinates.latitude,
        longitude: store.coordinates.longitude,
      })),
    [stores],
  );
  const selectedStore =
    stores.find((store) => store.code === selectedStoreCode) ?? stores[0];
  const activeStoreCode = selectedStore?.code;
  const regions = storesQuery.data?.regions ?? [];
  const showRegionFilter = regions.length > 1;

  const requestLocation = () => {
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setSelectedStoreCode(undefined);
        setVisibleCount(STORES_PER_PAGE);
        const nextLocation = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
        setUserLocation(nextLocation);
        setSearchCoordinates(nextLocation);
        setPendingMapCenter(null);
      },
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
      </section>

      <section className="space-y-md px-page py-xl">
        {view === "list" && (
          <Select
            icon={<Headset size={18} />}
            ariaLabel={t("serviceFilterLabel")}
            value={service}
            onChange={(value) => {
              setService(value as "all" | StoreService);
              setVisibleCount(STORES_PER_PAGE);
            }}
            options={services.map((item) => ({
              value: item,
              label: t(`services.${item}`),
            }))}
          />
        )}
        <div className="relative">
          <Search
            aria-hidden="true"
            className="absolute left-md top-1/2 z-[1] -translate-y-1/2 text-icon-secondary"
            size={19}
          />
          <Input
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setVisibleCount(STORES_PER_PAGE);
            }}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className="pl-[40px]"
          />
        </div>
        {locationError && (
          <p className="font-sans text-caption-12-regular text-error">
            {t("locationError")}
          </p>
        )}

        <MapViewToggle
          value={view}
          onChange={setView}
          labels={{ map: t("views.map"), list: t("views.list") }}
        />
        {showRegionFilter && (
          <Select
            icon={<MapPin size={18} />}
            ariaLabel={t("regionFilterLabel")}
            value={region}
            onChange={(value) => {
              setRegion(value);
              setVisibleCount(STORES_PER_PAGE);
            }}
            options={[
              { value: "", label: t("allRegions") },
              ...regions.map((item) => ({ value: item, label: item })),
            ]}
          />
        )}

        {storesQuery.isPending ? (
          view === "map" ? (
            <div className="h-[440px] animate-pulse rounded-lg border border-border-default bg-surface-subtle shadow-sm" />
          ) : (
            <StoreListSkeleton />
          )
        ) : storesQuery.isError ? (
          <ErrorState
            title={t("loadError")}
            description={t("loadErrorDescription")}
            retryLabel={t("retry")}
            onRetry={() => storesQuery.refetch()}
          />
        ) : stores.length === 0 ? (
          <EmptyState
            heading={t("emptyTitle")}
            description={t("emptyDescription")}
            className="w-full"
          />
        ) : view === "map" ? (
          <div className="relative isolate overflow-hidden rounded-lg border border-border-default bg-surface shadow-sm">
            <NaverMap
              locations={mapLocations}
              center={searchCoordinates ?? userLocation ?? undefined}
              currentLocation={userLocation ?? undefined}
              selectedId={activeStoreCode}
              onSelect={setSelectedStoreCode}
              onCenterChange={(nextCenter) => {
                const baseline =
                  searchCoordinates ?? userLocation ?? mapLocations[0];
                if (!baseline) return;
                setPendingMapCenter(
                  calculateDistanceKm(baseline, nextCenter) >= 0.05
                    ? nextCenter
                    : null,
                );
              }}
              className="h-[440px]"
              errorTitle={t("mapError")}
              errorDescription={t("mapErrorDescription")}
            />
            <MapFilterChips
              value={service}
              options={services.map((item) => ({
                value: item,
                label: t(`services.${item}`),
              }))}
              onChange={(item) => {
                setService(item);
                setSelectedStoreCode(undefined);
                setVisibleCount(STORES_PER_PAGE);
              }}
              overlay
            />
            {pendingMapCenter && (
              <button
                type="button"
                onClick={() => {
                  setSearchCoordinates(pendingMapCenter);
                  setPendingMapCenter(null);
                  setSelectedStoreCode(undefined);
                  setVisibleCount(STORES_PER_PAGE);
                }}
                className="absolute left-md top-[66px] z-[210] flex min-h-[40px] items-center gap-sm whitespace-nowrap rounded-full border border-border-default bg-surface px-lg font-sans text-caption-13-bold text-text-primary shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
              >
                <RefreshCw aria-hidden="true" size={16} />
                {t("searchThisArea")}
              </button>
            )}
            <button
              type="button"
              aria-label={userLocation ? t("locationApplied") : t("nearbySort")}
              title={userLocation ? t("locationApplied") : t("nearbySort")}
              onClick={requestLocation}
              className={cn(
                "absolute right-md z-[210] flex size-touch items-center justify-center rounded-full border border-border-default bg-surface text-icon-brand shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary",
                selectedStore ? "bottom-[108px]" : "bottom-md",
              )}
            >
              <LocateFixed aria-hidden="true" size={20} />
            </button>
            {selectedStore && (
              <Link
                href={`/my/stores/${selectedStore.code}`}
                className="absolute inset-x-md bottom-md z-[200] flex items-start gap-md rounded-lg border border-border-default bg-surface p-lg shadow-lg"
              >
                <span className="flex size-[36px] shrink-0 items-center justify-center rounded-sm bg-brand-soft text-icon-brand">
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
                <ChevronRight
                  className="self-center text-icon-secondary"
                  size={18}
                />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-lg">
            <p className="font-sans text-caption-12-regular text-text-secondary">
              {t("resultCount", { count: stores.length })}
            </p>
            {stores.slice(0, visibleCount).map((store) => (
              <Link
                key={store.code}
                href={`/my/stores/${store.code}`}
                className="flex items-start gap-md rounded-lg border border-border-default bg-surface p-lg shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
              >
                <span className="flex size-[36px] shrink-0 items-center justify-center rounded-sm bg-brand-soft text-icon-brand">
                  <MapPin aria-hidden="true" size={20} />
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
            {visibleCount < stores.length && (
              <Button
                variant="secondary"
                className="h-[44px] w-full py-0 text-label-14-bold"
                onClick={() =>
                  setVisibleCount((count) => count + STORES_PER_PAGE)
                }
              >
                {t("loadMore")}
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function calculateDistanceKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    Math.round(
      earthRadiusKm *
        2 *
        Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)) *
        10,
    ) / 10
  );
}

function StoreListSkeleton() {
  return (
    <div className="space-y-lg" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-[100px] animate-pulse rounded-lg border border-border-default bg-surface-subtle shadow-sm"
        />
      ))}
    </div>
  );
}
