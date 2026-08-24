"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Flame } from "lucide-react";
import { useTranslations } from "next-intl";
import { MissionSubNav } from "./MissionSubNav";
import { Button } from "@/components/ui/Button/Button";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { RewardCalendar } from "@/components/ui/RewardCalendar/RewardCalendar";
import { checkIn, getAttendance, getPointWallet } from "@/lib/api/reward";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function AttendanceContent() {
  const t = useTranslations("Attendance");
  const [month, setMonth] = useState(currentMonth);
  const queryClient = useQueryClient();
  const attendance = useQuery({
    queryKey: ["attendance", month],
    queryFn: () => getAttendance(month),
    retry: false,
  });
  const wallet = useQuery({
    queryKey: ["points"],
    queryFn: getPointWallet,
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: checkIn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["attendance"] }),
        queryClient.invalidateQueries({ queryKey: ["points"] }),
        queryClient.invalidateQueries({ queryKey: ["missions"] }),
      ]);
    },
  });
  const marked = useMemo(
    () => new Set(attendance.data?.dates ?? []),
    [attendance.data],
  );

  return (
    <div className="min-h-full bg-background pb-xl">
      <MissionSubNav active="attendance" />
      <div className="space-y-xl px-page py-xl">
        <div className="flex items-start justify-between gap-lg">
          <div>
            <h1 className="font-sans text-title-24-bold text-text-primary">
              {t("title")}
            </h1>
            <p className="mt-sm font-sans text-body-14-regular text-text-secondary">
              {t("description")}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-brand-soft px-lg py-xs font-sans text-label-14-bold text-text-brand">
            {(wallet.data?.balance ?? 0).toLocaleString()}P
          </span>
        </div>
        {attendance.isError ? (
          <ErrorState
            title={t("error")}
            description={t("errorDescription")}
            retryLabel={t("retry")}
            onRetry={() => attendance.refetch()}
          />
        ) : (
          <>
            <section className="rounded-lg bg-surface p-lg shadow-sm">
              <div className="flex items-start gap-md">
                <span className="flex size-[44px] items-center justify-center rounded-lg bg-brand-soft text-icon-brand">
                  <CalendarCheck size={23} />
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="font-sans text-title-18-bold text-text-primary">
                    {attendance.data?.checkedInToday
                      ? t("checkedTitle")
                      : t("checkTitle")}
                  </strong>
                  <p className="mt-xs font-sans text-caption-13-regular text-text-secondary">
                    {t("reward", {
                      points: attendance.data?.pointsPerCheckIn ?? 30,
                    })}
                  </p>
                </div>
              </div>
              <div className="mt-lg flex items-center gap-sm font-sans text-caption-13-bold text-text-brand">
                <Flame size={17} />
                {t("streak", { count: attendance.data?.streak ?? 0 })}
              </div>
              <Button
                className="mt-lg h-[48px] w-full"
                disabled={attendance.data?.checkedInToday}
                loading={mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {attendance.data?.checkedInToday ? t("checked") : t("checkIn")}
              </Button>
            </section>
            <RewardCalendar
              month={month}
              markedDates={marked}
              selectedDate={attendance.data?.today}
              onMonthChange={setMonth}
            />
            <p className="text-center font-sans text-caption-13-regular text-text-secondary">
              {t("monthly", { count: attendance.data?.monthlyCount ?? 0 })}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
