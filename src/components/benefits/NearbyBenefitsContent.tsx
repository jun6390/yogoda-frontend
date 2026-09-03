"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, LocateFixed, RefreshCw, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { BenefitsSubNav } from "./BenefitsSubNav";
import { BrandLogo } from "@/components/ui/BrandLogo/BrandLogo";
import { Button } from "@/components/ui/Button/Button";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { FavoriteIcon } from "@/components/ui/FavoriteIcon/FavoriteIcon";
import { Input } from "@/components/ui/Input/Input";
import {
  MapFilterChips,
  MapViewToggle,
} from "@/components/ui/MapBrowseControls/MapBrowseControls";
import { NaverMap } from "@/components/ui/NaverMap/NaverMap";
import { PageIntro } from "@/components/ui/PageIntro/PageIntro";
import { FloatingToast } from "@/components/ui/Toast/Toast";
import { getNearbyBenefits, setBenefitSaved } from "@/lib/api/benefit";
import { cn } from "@/lib/utils";

const LOCATIONS_PER_PAGE = 6;
const categories = ["all", "food", "culture", "shopping"] as const;

export function NearbyBenefitsContent() {
  const t = useTranslations("NearbyBenefits");
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>();
  const [actualLocation, setActualLocation] = useState<{
    latitude: number;
    longitude: number;
  }>();
  const [searchLocation, setSearchLocation] = useState<{
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
  const [visibleCount, setVisibleCount] = useState(LOCATIONS_PER_PAGE);
  const [keyword, setKeyword] = useState("");
  const deferredKeyword = useDeferredValue(keyword.trim().toLocaleLowerCase());
  const query = useQuery({
    queryKey: ["nearby-benefits", searchLocation],
    queryFn: () => getNearbyBenefits(searchLocation),
    placeholderData: (previousData) => previousData,
    retry: false,
  });
  const locations = query.data?.locations ?? [];
  const filteredLocations = locations.filter((location) => {
    const matchesCategory =
      category === "all" || location.category === category;
    const searchableText = [
      location.name,
      location.address,
      location.benefit.brand,
      location.benefit.title,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();

    return matchesCategory && searchableText.includes(deferredKeyword);
  });
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
        setActualLocation(nextLocation);
        setSearchLocation(nextLocation);
        setVisibleCount(LOCATIONS_PER_PAGE);
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
    setVisibleCount(LOCATIONS_PER_PAGE);
    setSearchLocation(mapCenter);
    setSearchedMapCenter(mapCenter);
  };

  return (
    <div className="min-h-full bg-background pb-3xl">
      <BenefitsSubNav active="nearby" />
      <PageIntro title={t("title")} description={t("description")} />

      <section className="space-y-md px-page py-xl">
        {locationError && (
          <p className="font-sans text-caption-12-regular text-error">
            {t("locationError")}
          </p>
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
              setSelectedId(undefined);
              setVisibleCount(LOCATIONS_PER_PAGE);
            }}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className="pl-[40px]"
          />
        </div>
        {view === "list" && (
          <MapFilterChips
            value={category}
            options={categories.map((item) => ({
              value: item,
              label: t(`categories.${item}`),
            }))}
            onChange={(item) => {
              setCategory(item);
              setSelectedId(undefined);
              setVisibleCount(LOCATIONS_PER_PAGE);
            }}
          />
        )}
        <MapViewToggle
          value={view}
          onChange={setView}
          labels={{ map: t("views.map"), list: t("views.list") }}
        />
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
      ) : filteredLocations.length === 0 && view === "list" ? (
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
              center={searchLocation}
              currentLocation={actualLocation}
              className="h-[440px]"
              errorTitle={t("mapError")}
              errorDescription={t("mapErrorDescription")}
            />
            <MapFilterChips
              value={category}
              options={categories.map((item) => ({
                value: item,
                label: t(`categories.${item}`),
              }))}
              onChange={(item) => {
                setCategory(item);
                setSelectedId(undefined);
                setVisibleCount(LOCATIONS_PER_PAGE);
              }}
              overlay
            />
            <button
              type="button"
              aria-label={
                actualLocation ? t("locationApplied") : t("useLocation")
              }
              title={actualLocation ? t("locationApplied") : t("useLocation")}
              onClick={requestLocation}
              className={cn(
                "absolute right-md z-[210] flex size-touch items-center justify-center rounded-full border border-border-default bg-surface text-icon-brand shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary",
                selected ? "bottom-[148px]" : "bottom-md",
              )}
            >
              <LocateFixed aria-hidden="true" size={20} />
            </button>
            {hasMovedMap && (
              <button
                type="button"
                onClick={searchCurrentMapArea}
                className="absolute left-md top-[66px] z-[210] flex min-h-[40px] items-center gap-sm whitespace-nowrap rounded-full border border-border-default bg-surface px-lg font-sans text-caption-13-bold text-text-primary shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
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
                  <FavoriteIcon selected={selected.benefit.saved} />
                </button>
              </article>
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-lg px-page py-lg">
          {filteredLocations.slice(0, visibleCount).map((location) => (
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
          {visibleCount < filteredLocations.length && (
            <Button
              variant="secondary"
              className="h-[44px] w-full py-0 text-label-14-bold"
              onClick={() =>
                setVisibleCount((count) => count + LOCATIONS_PER_PAGE)
              }
            >
              {t("loadMore")}
            </Button>
          )}
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
        <FloatingToast message={toastMessage} actionLabel={null} />
      )}
    </div>
  );
}
