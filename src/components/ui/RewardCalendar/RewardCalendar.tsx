"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

export function RewardCalendar({
  month,
  markedDates,
  selectedDate,
  onMonthChange,
  onDateSelect,
}: {
  month: string;
  markedDates: Set<string>;
  selectedDate?: string;
  onMonthChange: (month: string) => void;
  onDateSelect?: (date: string) => void;
}) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNumber - 1, 1).getDay();
  const days = new Date(year, monthNumber, 0).getDate();
  const changeMonth = (amount: number) => {
    const next = new Date(year, monthNumber - 1 + amount, 1);
    onMonthChange(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  return (
    <section className="rounded-lg bg-surface p-lg shadow-sm">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => changeMonth(-1)}
          className="flex size-touch items-center justify-center text-icon-default"
        >
          <ChevronLeft size={20} />
        </button>
        <strong className="font-sans text-label-14-bold text-text-primary">
          {year}년 {monthNumber}월
        </strong>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() => changeMonth(1)}
          className="flex size-touch items-center justify-center text-icon-default"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center">
        {weekdays.map((day) => (
          <span
            key={day}
            className="py-sm font-sans text-caption-12-regular text-text-tertiary"
          >
            {day}
          </span>
        ))}
        {Array.from({ length: firstDay }).map((_, index) => (
          <span key={`empty-${index}`} />
        ))}
        {Array.from({ length: days }, (_, index) => {
          const day = index + 1;
          const date = `${month}-${String(day).padStart(2, "0")}`;
          const marked = markedDates.has(date);
          return (
            <button
              key={date}
              type="button"
              onClick={() => onDateSelect?.(date)}
              className={cn(
                "relative mx-auto flex size-[40px] items-center justify-center rounded-full font-sans text-caption-13-medium text-text-primary",
                selectedDate === date && "bg-brand-soft text-text-brand",
                marked && "font-bold text-text-brand",
              )}
            >
              <span>{day}</span>
              {marked && (
                <span className="absolute bottom-[3px] size-[4px] rounded-full bg-action-primary" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
