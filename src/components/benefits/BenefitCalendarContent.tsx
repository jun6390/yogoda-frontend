"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { BenefitsSubNav } from "./BenefitsSubNav";
import {
  BrandLogo,
  resolveBrandLogoName,
} from "@/components/ui/BrandLogo/BrandLogo";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { FavoriteIcon } from "@/components/ui/FavoriteIcon/FavoriteIcon";
import { PageIntro } from "@/components/ui/PageIntro/PageIntro";
import { RewardCalendar } from "@/components/ui/RewardCalendar/RewardCalendar";
import { FloatingToast } from "@/components/ui/Toast/Toast";
import { getBenefitCalendar, setBenefitSaved } from "@/lib/api/benefit";
import { cn } from "@/lib/utils";
import type { BenefitCalendarEvent } from "@/types/benefit";

type CalendarFilter = "all" | BenefitCalendarEvent["category"];
const filters: CalendarFilter[] = [
  "all",
  "membership",
  "food",
  "culture",
  "shopping",
];

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function BenefitCalendarContent() {
  const t = useTranslations("BenefitCalendar");
  const [month, setMonth] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState<string>();
  const [filter, setFilter] = useState<CalendarFilter>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["benefit-calendar", month],
    queryFn: () => getBenefitCalendar(month),
    retry: false,
  });
  const events = useMemo(
    () =>
      query.data?.events.filter(
        (event) => filter === "all" || event.category === filter,
      ) ?? [],
    [filter, query.data],
  );
  const marked = useMemo(
    () => new Set(events.map((event) => event.date)),
    [events],
  );
  const selectedEvents = events.filter((event) => event.date === selectedDate);
  const saveMutation = useMutation({
    mutationFn: (event: BenefitCalendarEvent) =>
      setBenefitSaved(event.benefitCode, !event.saved),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["benefit-calendar"] }),
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

  return (
    <div className="min-h-full bg-background pb-xl">
      <BenefitsSubNav active="calendar" />
      <PageIntro title={t("title")} description={t("description")} />
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
                setSelectedDate(undefined);
              }}
              className={cn(
                "h-[36px] shrink-0 rounded-full border px-lg font-sans text-caption-13-bold",
                filter === item
                  ? "border-action-primary bg-action-primary text-text-on-primary"
                  : "border-border-default bg-surface text-text-secondary",
              )}
            >
              {t(`filters.${item}`)}
            </button>
          ))}
        </div>
        {query.isError ? (
          <ErrorState
            title={t("error")}
            description={t("errorDescription")}
            retryLabel={t("retry")}
            onRetry={() => query.refetch()}
          />
        ) : (
          <>
            <RewardCalendar
              month={month}
              markedDates={marked}
              selectedDate={selectedDate}
              onMonthChange={(next) => {
                setMonth(next);
                setSelectedDate(undefined);
              }}
              onDateSelect={setSelectedDate}
            />
            <section className="min-w-0">
              <h2 className="font-sans text-title-18-bold text-text-primary">
                {t("monthEvents")}
              </h2>
              {query.isPending ? (
                <div className="mt-md h-[90px] animate-pulse rounded-lg bg-surface-subtle" />
              ) : events.length ? (
                <div className="mt-md flex snap-x gap-md overflow-x-auto pb-sm">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="flex w-[164px] shrink-0 snap-start flex-col items-start rounded-lg border border-border-default bg-surface p-lg text-left shadow-sm"
                    >
                      <div className="flex w-full items-start justify-between gap-sm">
                        <button
                          type="button"
                          aria-label={t("viewDetail")}
                          onClick={() => setSelectedDate(event.date)}
                          className="flex size-[40px] items-center justify-center rounded-sm"
                        >
                          <BrandLogo
                            brand={
                              resolveBrandLogoName(event.brand, event.title) ??
                              "U+"
                            }
                            className="size-[40px]"
                          />
                        </button>
                        <button
                          type="button"
                          aria-label={
                            event.saved ? t("removeSaved") : t("save")
                          }
                          onClick={() => saveMutation.mutate(event)}
                          className={cn(
                            "flex size-[36px] items-center justify-center",
                            event.saved
                              ? "text-action-primary"
                              : "text-action-secondary",
                          )}
                        >
                          <FavoriteIcon selected={event.saved} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedDate(event.date)}
                        className="mt-lg block w-full min-w-0 text-left"
                      >
                        <strong className="block truncate font-sans text-label-14-bold text-text-primary">
                          {event.title}
                        </strong>
                        <span className="mt-xs block font-sans text-caption-12-regular text-text-secondary">
                          {event.date.slice(5).replace("-", ".")} ·{" "}
                          {event.type === "coupon" ? t("expires") : t("opens")}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  heading={t("empty")}
                  description={t("emptyDescription")}
                  className="mt-md w-full rounded-lg bg-surface"
                />
              )}
            </section>
          </>
        )}
      </div>
      {selectedDate && selectedEvents.length > 0 && (
        <CalendarEventModal
          date={selectedDate}
          events={selectedEvents}
          onClose={() => setSelectedDate(undefined)}
          onToggleSaved={(event) => saveMutation.mutate(event)}
        />
      )}
      {toastMessage && (
        <FloatingToast message={toastMessage} actionLabel={null} />
      )}
    </div>
  );
}

function CalendarEventModal({
  date,
  events,
  onClose,
  onToggleSaved,
}: {
  date: string;
  events: BenefitCalendarEvent[];
  onClose: () => void;
  onToggleSaved: (event: BenefitCalendarEvent) => void;
}) {
  const t = useTranslations("BenefitCalendar");
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-lg"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-event-title"
        className="w-full max-w-mobile rounded-xl bg-surface p-2xl shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-lg">
          <div>
            <h2
              id="calendar-event-title"
              className="font-sans text-title-18-bold text-text-primary"
            >
              {t("selected", { date: date.slice(5).replace("-", ".") })}
            </h2>
            <p className="mt-xs font-sans text-caption-13-regular text-text-secondary">
              {t("selectedDescription")}
            </p>
          </div>
          <button
            type="button"
            aria-label={t("close")}
            onClick={onClose}
            className="flex size-touch shrink-0 items-center justify-center text-icon-default"
          >
            <X size={22} />
          </button>
        </div>
        <div className="mt-lg divide-y divide-border-default">
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-md py-lg">
              <BrandLogo
                brand={resolveBrandLogoName(event.brand, event.title) ?? "U+"}
                className="size-[40px]"
              />
              <div className="min-w-0 flex-1">
                <strong className="block font-sans text-label-14-bold text-text-primary">
                  {event.title}
                </strong>
                <p className="mt-xs font-sans text-caption-12-regular text-text-secondary">
                  {event.brand ?? t("uplusMembership")} · {event.value}
                </p>
              </div>
              <button
                type="button"
                aria-label={event.saved ? t("removeSaved") : t("save")}
                onClick={() => onToggleSaved(event)}
                className={cn(
                  "flex size-touch shrink-0 items-center justify-center",
                  event.saved ? "text-action-primary" : "text-action-secondary",
                )}
              >
                <FavoriteIcon selected={event.saved} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
