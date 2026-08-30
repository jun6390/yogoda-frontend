"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { MissionSubNav } from "./MissionSubNav";
import { Button } from "@/components/ui/Button/Button";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { PageIntro } from "@/components/ui/PageIntro/PageIntro";
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
      <PageIntro
        title={t("title")}
        description={t("description")}
        action={
          <span className="rounded-full bg-brand-soft px-lg py-xs font-sans text-label-14-bold text-text-brand">
            {(wallet.data?.balance ?? 0).toLocaleString()}P
          </span>
        }
      />
      <div className="space-y-xl px-page py-xl">
        {attendance.isError ? (
          <ErrorState
            title={t("error")}
            description={t("errorDescription")}
            retryLabel={t("retry")}
            onRetry={() => attendance.refetch()}
          />
        ) : (
          <>
            <section className="relative overflow-hidden rounded-lg border border-[#f1dfc8] bg-[#fff6ea] p-lg shadow-sm">
              <Image
                src="/yogoda-characters/attendance-special.webp"
                alt=""
                width={640}
                height={640}
                loading="eager"
                fetchPriority="high"
                sizes="180px"
                className="pointer-events-none absolute -bottom-xs -right-sm size-[clamp(150px,36vw,180px)] object-contain [mask-image:linear-gradient(to_right,transparent_0%,black_16%)]"
              />
              <div className="relative z-[1] max-w-[68%]">
                <strong className="font-sans text-title-18-bold text-[#17171c]">
                  {attendance.data?.checkedInToday
                    ? t("checkedTitle")
                    : t("checkTitle")}
                </strong>
                <p className="mt-xs font-sans text-caption-13-regular text-[#6f6f79]">
                  {t("reward", {
                    points: attendance.data?.pointsPerCheckIn ?? 30,
                  })}
                </p>
              </div>
              <div className="relative z-[1] mt-lg flex max-w-[68%] items-center gap-sm font-sans text-caption-13-bold text-[#6f6f79]">
                <Flame size={17} className="text-warning" />
                {t("streak", { count: attendance.data?.streak ?? 0 })}
              </div>
              <Button
                className="relative z-[1] mt-lg h-[42px] min-w-[144px] px-lg"
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
              markVariant="stamp"
              stampSrc="/yogoda-characters/attendance-green.webp"
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
