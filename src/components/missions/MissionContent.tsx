"use client";

import { useState, useSyncExternalStore } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight, Gift, Target, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { MissionSubNav } from "./MissionSubNav";

import { Button } from "@/components/ui/Button/Button";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { ProgressBar } from "@/components/ui/ProgressBar/ProgressBar";
import {
  claimMissionReward,
  getMyMissions,
  joinMission,
} from "@/lib/api/mission";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Mission, MissionStatus } from "@/types/mission";

const subscribe = () => () => {};
type MissionView = "active" | "done";

function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function MissionContent({ view = "active" }: { view?: MissionView }) {
  const t = useTranslations("Missions");
  const hydrated = useHydrated();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [selected, setSelected] = useState<Mission | null>(null);
  const isLoggedIn = hydrated && Boolean(accessToken);
  const missionQuery = useQuery({
    queryKey: ["missions", "me"],
    queryFn: getMyMissions,
    enabled: isLoggedIn,
    retry: false,
  });

  const missions = missionQuery.data?.missions.filter((mission) =>
    view === "active"
      ? mission.status === "available" || mission.status === "in_progress"
      : mission.status === "completed" || mission.status === "claimed",
  );

  return (
    <div className="min-h-full bg-background pb-xl">
      <MissionSubNav active={view === "active" ? "progress" : "completed"} />
      <section className="bg-surface px-page pb-xl pt-lg">
        <div className="flex items-start justify-between gap-lg">
          <h1 className="max-w-[280px] font-sans text-title-24-bold text-text-primary">
            {t("headline")}
          </h1>
          <span className="shrink-0 rounded-full bg-brand-soft px-lg py-xs font-sans text-label-14-bold text-text-brand">
            {(missionQuery.data?.totalPoints ?? 0).toLocaleString()}P
          </span>
        </div>
      </section>

      <div className="space-y-xl px-page py-xl">
        {!hydrated || (isLoggedIn && missionQuery.isPending) ? (
          <MissionSkeleton />
        ) : !isLoggedIn ? (
          <EmptyState
            heading={t("loginRequired")}
            description={t("loginDescription")}
          />
        ) : missionQuery.isError ? (
          <ErrorState
            title={t("loadError")}
            description={t("loadErrorDescription")}
            retryLabel={t("retry")}
            onRetry={() => missionQuery.refetch()}
          />
        ) : (
          <>
            <section className="flex items-center justify-between rounded-lg border border-border-default bg-surface px-lg py-md">
              <div>
                <p className="font-sans text-caption-12-regular text-text-secondary">
                  {t("progressSummary")}
                </p>
                <strong className="mt-xs block font-sans text-label-14-bold text-text-primary">
                  {t("progressCount", {
                    active: missionQuery.data?.summary.inProgress ?? 0,
                    pending: missionQuery.data?.summary.completed ?? 0,
                  })}
                </strong>
              </div>
              <span className="flex size-[40px] items-center justify-center rounded-full bg-brand-soft text-icon-brand">
                <Target aria-hidden="true" size={21} />
              </span>
            </section>

            {missions?.length ? (
              <section className="divide-y divide-border-default rounded-lg border border-border-default bg-surface px-lg">
                {missions.map((mission) => (
                  <button
                    key={mission.code}
                    type="button"
                    onClick={() => setSelected(mission)}
                    className="flex min-h-[74px] w-full items-center gap-md py-md text-left"
                  >
                    <span className="flex size-[36px] shrink-0 items-center justify-center rounded-sm bg-brand-soft text-icon-brand">
                      <Target aria-hidden="true" size={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-sans text-label-14-medium text-text-primary">
                        {mission.title}
                      </span>
                      <span className="mt-xs block font-sans text-caption-12-regular text-text-secondary">
                        {t(`status.${mission.status}`)}
                      </span>
                    </span>
                    <span className="shrink-0 font-sans text-caption-13-bold text-text-brand">
                      +{mission.rewardPoints}P
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="shrink-0 text-icon-secondary"
                      size={17}
                    />
                  </button>
                ))}
              </section>
            ) : (
              <EmptyState
                heading={t(`empty.${view}.title`)}
                description={t(`empty.${view}.description`)}
                className="w-full rounded-lg bg-surface"
              />
            )}
          </>
        )}
      </div>

      {selected && (
        <MissionDetail mission={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function MissionDetail({
  mission,
  onClose,
}: {
  mission: Mission;
  onClose: () => void;
}) {
  const t = useTranslations("Missions");
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => getMissionAction(mission.status)(mission.code),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["missions", "me"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-xl">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="mission-title"
        className="w-full max-w-mobile rounded-t-xl bg-background p-page sm:rounded-xl"
      >
        <div className="flex items-start justify-between">
          <span className="flex size-[48px] items-center justify-center rounded-lg bg-brand-soft text-icon-brand">
            <Gift aria-hidden="true" size={24} />
          </span>
          <button
            type="button"
            aria-label={t("close")}
            onClick={onClose}
            className="flex size-touch items-center justify-center text-icon-default"
          >
            <X aria-hidden="true" size={24} />
          </button>
        </div>
        <h2
          id="mission-title"
          className="mt-lg font-sans text-title-20-bold text-text-primary"
        >
          {mission.title}
        </h2>
        <p className="mt-sm font-sans text-body-14-regular text-text-secondary">
          {mission.summary}
        </p>
        <div className="mt-xl rounded-lg bg-surface p-lg">
          <p className="font-sans text-caption-12-bold text-text-tertiary">
            {t("requirement")}
          </p>
          <p className="mt-xs font-sans text-label-14-medium text-text-primary">
            {mission.requirement}
          </p>
          <p className="mt-lg font-sans text-caption-12-bold text-text-tertiary">
            {t("reward")}
          </p>
          <p className="mt-xs font-sans text-label-14-medium text-text-primary">
            {mission.reward} · {mission.rewardPoints}P
          </p>
          {mission.status !== "available" && (
            <div className="mt-lg">
              <ProgressBar value={mission.progress} />
            </div>
          )}
        </div>
        {mission.status === "available" || mission.status === "completed" ? (
          <Button
            className="mt-xl h-[52px] w-full"
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {t(`actions.${mission.status}`)}
          </Button>
        ) : mission.status === "in_progress" ? (
          <div className="mt-xl flex h-[52px] items-center justify-center rounded-lg bg-surface-subtle font-sans text-label-14-bold text-text-secondary">
            {t("waitingForAction")}
          </div>
        ) : (
          <div className="mt-xl flex h-[52px] items-center justify-center gap-sm rounded-lg bg-success-soft font-sans text-label-14-bold text-success">
            <CheckCircle2 size={18} />
            {t("rewardClaimed")}
          </div>
        )}
        {mutation.isError && (
          <p className="mt-sm text-center font-sans text-caption-12-regular text-error">
            {mutation.error.message}
          </p>
        )}
      </section>
    </div>
  );
}

function getMissionAction(status: MissionStatus) {
  if (status === "available") return joinMission;
  return claimMissionReward;
}

function MissionSkeleton() {
  return (
    <div className="space-y-md" aria-hidden="true">
      <div className="h-[96px] animate-pulse rounded-lg bg-surface-subtle" />
      <div className="h-[220px] animate-pulse rounded-lg bg-surface-subtle" />
    </div>
  );
}
