"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  Heart,
  List,
  LocateFixed,
  Map,
  RefreshCw,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { BenefitsSubNav } from "./BenefitsSubNav";
import { BrandLogo } from "@/components/ui/BrandLogo/BrandLogo";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { NaverMap } from "@/components/ui/NaverMap/NaverMap";
import { PageIntro } from "@/components/ui/PageIntro/PageIntro";
import { Toast } from "@/components/ui/Toast/Toast";
import { getNearbyBenefits, setBenefitSaved } from "@/lib/api/benefit";
import { cn } from "@/lib/utils";

export function NearbyBenefitsContent() {
  const t = useTranslations("NearbyBenefits");
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>();
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  }>();
  const [mapCenter, setMapCenter] = useState<{
    latitude: number;
    longitude: number;
  }>();
  const [searchedMapCenter, setSearchedMapCenter] = useState<{
    latitude: number;
    longitude: number;
  }>();
  const [locationError, setLocationError] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "list">("map");
  const [category, setCategory] = useState<
    "all" | "food" | "culture" | "shopping"
  >("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const query = useQuery({
    queryKey: ["nearby-benefits", userLocation],
    queryFn: () => getNearbyBenefits(userLocation),
    retry: false,
  });
  const locations = query.data?.locations ?? [];
  const filteredLocations = locations.filter(
    (location) => category === "all" || location.category === category,
  );
  const mapLocations = useMemo(
    () =>
      filteredLocations.map((location) => ({
        id: location.id,
        name: location.name,
        latitude: location.coordinates.latitude,
        longitude: location.coordinates.longitude,
      })),
    [filteredLocations],
  );
  const selected =
    filteredLocations.find((item) => item.id === selectedId) ??
    filteredLocations[0];
  const saveMutation = useMutation({
    mutationFn: ({ code, saved }: { code: string; saved: boolean }) =>
      setBenefitSaved(code, !saved),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["nearby-benefits"] }),
        queryClient.invalidateQueries({ queryKey: ["benefits"] }),
      ]);
      setToastMessage(result.saved ? t("savedToast") : t("removedToast"));
    },
  });

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const requestLocation = () => {
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextLocation = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
        setUserLocation(nextLocation);
        setMapCenter(nextLocation);
        setSearchedMapCenter(nextLocation);
      },
      () => setLocationError(true),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };
  const handleMapCenterChange = useCallback(
    (nextCenter: { latitude: number; longitude: number }) => {
      setMapCenter(nextCenter);
      setSearchedMapCenter((current) => current ?? nextCenter);
    },
    [],
  );
  const hasMovedMap =
    mapCenter &&
    searchedMapCenter &&
    (Math.abs(mapCenter.latitude - searchedMapCenter.latitude) > 0.0001 ||
      Math.abs(mapCenter.longitude - searchedMapCenter.longitude) > 0.0001);

  const searchCurrentMapArea = () => {
    if (!mapCenter) return;
    setSelectedId(undefined);
    setUserLocation(mapCenter);
    setSearchedMapCenter(mapCenter);
  };

  return (
    <div className="min-h-full bg-background pb-3xl">
      <BenefitsSubNav active="nearby" />
      <PageIntro title={t("title")} description={t("description")} />

      <section className="space-y-md px-page py-xl">
        <button
          type="button"
          onClick={requestLocation}
          className="flex min-h-touch w-full items-center gap-sm rounded-lg border border-border-default bg-surface px-lg font-sans text-label-14-bold text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        >
          <LocateFixed className="text-icon-brand" size={18} />
          {userLocation ? t("locationApplied") : t("useLocation")}
        </button>
        {locationError && (
          <p className="mt-sm font-sans text-caption-12-regular text-error">
            {t("locationError")}
          </p>
        )}
        <div className="flex gap-sm overflow-x-auto">
          {(["all", "food", "culture", "shopping"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => {
                setCategory(item);
                setSelectedId(undefined);
              }}
              className={cn(
                "h-[36px] shrink-0 rounded-full border px-lg font-sans text-caption-13-bold transition-colors",
                category === item
                  ? "border-action-primary bg-action-primary text-text-on-primary"
                  : "border-border-default bg-surface text-text-secondary",
              )}
            >
              {t(`categories.${item}`)}
            </button>
          ))}
        </div>
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
      </section>

      {query.isPending ? (
        <div className="px-page pb-xl">
          {view === "map" ? (
            <div className="h-[440px] animate-pulse rounded-lg border border-border-default bg-surface-subtle shadow-sm" />
          ) : (
            <div className="space-y-lg">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[108px] animate-pulse rounded-lg border border-border-default bg-surface-subtle shadow-sm"
                />
              ))}
            </div>
          )}
        </div>
      ) : query.isError ? (
        <div className="px-page py-xl">
          <ErrorState
            title={t("loadError")}
            description={t("loadErrorDescription")}
            retryLabel={t("retry")}
            onRetry={() => query.refetch()}
          />
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="px-page py-xl">
          <EmptyState
            heading={t("empty")}
            description={t("emptyDescription")}
          />
        </div>
      ) : view === "map" ? (
        <section className="px-page pb-xl">
          <div className="relative isolate overflow-hidden rounded-lg border border-border-default bg-surface shadow-sm">
            <NaverMap
              locations={mapLocations}
              selectedId={selected?.id}
              onSelect={setSelectedId}
              onCenterChange={handleMapCenterChange}
              center={userLocation}
              className="h-[440px]"
              errorTitle={t("mapError")}
              errorDescription={t("mapErrorDescription")}
            />
            {hasMovedMap && (
              <button
                type="button"
                onClick={searchCurrentMapArea}
                className="absolute left-md top-md z-[210] flex min-h-[40px] items-center gap-sm rounded-full border border-border-default bg-surface px-lg font-sans text-caption-13-bold text-text-primary shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
              >
                <RefreshCw aria-hidden="true" size={16} />
                {t("searchThisArea")}
              </button>
            )}
            {selected && (
              <article className="absolute inset-x-md bottom-md z-[200] rounded-lg border border-border-default bg-surface p-lg pr-[52px] shadow-lg">
                <button
                  type="button"
                  aria-label={selected.benefit.title}
                  onClick={() => setDetailOpen(true)}
                  className="absolute inset-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
                />
                <div className="pointer-events-none relative z-[1] flex items-start gap-md">
                  <BrandLogo brand={selected.benefit.brand} />
                  <div className="min-w-0 flex-1">
                    <div>
                      <p className="font-sans text-caption-12-regular text-text-secondary">
                        {t(`categories.${selected.category}`)}
                        {selected.distanceKm !== null &&
                          ` · ${t("distance", { distance: selected.distanceKm })}`}
                      </p>
                      <h2 className="mt-xs font-sans text-label-14-bold text-text-primary">
                        {selected.name}
                      </h2>
                    </div>
                    <p className="mt-sm font-sans text-caption-13-bold text-text-brand">
                      {selected.benefit.value}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={
                    selected.benefit.saved ? t("removeSaved") : t("save")
                  }
                  disabled={saveMutation.isPending}
                  onClick={() =>
                    saveMutation.mutate({
                      code: selected.benefit.code,
                      saved: selected.benefit.saved,
                    })
                  }
                  className={cn(
                    "absolute right-xs top-xs z-[2] flex size-touch items-center justify-center",
                    selected.benefit.saved
                      ? "text-action-primary"
                      : "text-action-secondary",
                  )}
                >
                  <Heart
                    size={20}
                    fill={selected.benefit.saved ? "currentColor" : "none"}
                  />
                </button>
              </article>
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-lg px-page py-lg">
          {filteredLocations.map((location) => (
            <button
              key={location.id}
              type="button"
              onClick={() => {
                setSelectedId(location.id);
                setDetailOpen(true);
              }}
              className="flex w-full items-center gap-md rounded-lg border border-border-default bg-surface p-lg text-left shadow-sm"
            >
              <BrandLogo brand={location.benefit.brand} />
              <span className="min-w-0 flex-1">
                <strong className="block font-sans text-label-14-bold text-text-primary">
                  {location.name}
                </strong>
                <span className="mt-xs block font-sans text-caption-12-regular text-text-secondary">
                  {location.address}
                </span>
                <span className="mt-sm block font-sans text-caption-13-bold text-text-brand">
                  {location.benefit.value}
                </span>
              </span>
              <ChevronRight className="text-icon-secondary" size={18} />
            </button>
          ))}
        </section>
      )}
      {detailOpen && selected && (
        <div
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40 sm:items-center sm:p-xl"
          onClick={() => setDetailOpen(false)}
        >
          <article
            role="dialog"
            aria-modal="true"
            aria-labelledby="nearby-benefit-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-mobile rounded-t-xl bg-surface p-page sm:rounded-xl"
          >
            <div className="flex items-start justify-between">
              <BrandLogo
                brand={selected.benefit.brand}
                className="size-[52px]"
              />
              <button
                type="button"
                aria-label={t("close")}
                onClick={() => setDetailOpen(false)}
                className="flex size-touch items-center justify-center text-icon-default"
              >
                <X size={22} />
              </button>
            </div>
            <p className="mt-lg font-sans text-caption-12-regular text-text-secondary">
              {selected.name}
            </p>
            <h2
              id="nearby-benefit-title"
              className="mt-xs font-sans text-title-20-bold text-text-primary"
            >
              {selected.benefit.title}
            </h2>
            <p className="mt-md font-sans text-body-14-regular text-text-secondary">
              {selected.benefit.summary}
            </p>
            <div className="mt-xl rounded-lg bg-surface-subtle p-lg">
              <strong className="font-sans text-label-14-bold text-text-brand">
                {selected.benefit.value}
              </strong>
              <p className="mt-sm font-sans text-caption-12-regular text-text-secondary">
                {selected.address}
              </p>
              {selected.phone && (
                <p className="mt-xs font-sans text-caption-12-regular text-text-secondary">
                  {selected.phone}
                </p>
              )}
            </div>
          </article>
        </div>
      )}
      {toastMessage && (
        <Toast
          message={toastMessage}
          actionLabel={null}
          className="fixed bottom-[88px] left-1/2 z-[70] -translate-x-1/2"
        />
      )}
    </div>
  );
}
