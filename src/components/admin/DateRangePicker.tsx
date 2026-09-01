"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatRangeLabel(startDate: string, endDate: string) {
  if (!startDate && !endDate) {
    return "기간 선택";
  }

  if (startDate && endDate) {
    return `${startDate} ~ ${endDate}`;
  }

  return `${startDate || endDate} ~`;
}

/*
 * 필터 바 안에서 쓰는 커스텀 날짜 범위 픽커.
 * 브라우저 기본 <input type="date">는 팝업 UI를 커스텀할 수 없어서
 * 디자인 토큰 기반 달력을 직접 그림
 */
export function DateRangePicker({
  startDate,
  endDate,
  onChange,
}: DateRangePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const changeMonth = (amount: number) => {
    const next = new Date(viewYear, viewMonth - 1 + amount, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth() + 1);
  };

  const handleSelectDate = (dateKey: string) => {
    // 시작일이 없거나 이미 범위가 완성돼 있으면, 이번 클릭을 새 시작일로 잡음
    if (!startDate || endDate) {
      onChange({ startDate: dateKey, endDate: "" });
      return;
    }

    // 시작일보다 이전 날짜를 클릭하면 그걸 새 시작일로 바꿈
    if (dateKey < startDate) {
      onChange({ startDate: dateKey, endDate: "" });
      return;
    }

    onChange({ startDate, endDate: dateKey });
    setIsOpen(false);
  };

  const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex h-[40px] w-70 items-center gap-xs rounded-md border border-border-default bg-background px-md",
          "font-sans text-body-14-regular text-text-primary",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary",
        )}
      >
        <CalendarDays
          aria-hidden="true"
          size={16}
          className="text-text-tertiary"
        />
        {formatRangeLabel(startDate, endDate)}
      </button>

      {isOpen && (
        <section className="absolute left-0 top-full z-20 mt-xs w-70 max-w-[calc(100vw-2rem)] rounded-lg border border-border-default bg-surface p-lg shadow-md">
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="이전 달"
              onClick={() => changeMonth(-1)}
              className="flex size-touch items-center justify-center text-text-secondary"
            >
              <ChevronLeft size={18} />
            </button>
            <strong className="font-sans text-label-14-bold text-text-primary">
              {viewYear}년 {viewMonth}월
            </strong>
            <button
              type="button"
              aria-label="다음 달"
              onClick={() => changeMonth(1)}
              className="flex size-touch items-center justify-center text-text-secondary"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="mt-sm grid grid-cols-7 text-center">
            {WEEKDAYS.map((weekday) => (
              <span
                key={weekday}
                className="py-xs font-sans text-caption-12-regular text-text-tertiary"
              >
                {weekday}
              </span>
            ))}

            {Array.from({ length: firstWeekday }).map((_, index) => (
              <span key={`empty-${index}`} />
            ))}

            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const dateKey = toDateKey(viewYear, viewMonth, day);
              const isStart = dateKey === startDate;
              const isEnd = dateKey === endDate;
              const isInRange =
                startDate &&
                endDate &&
                dateKey > startDate &&
                dateKey < endDate;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => handleSelectDate(dateKey)}
                  className={cn(
                    "mx-auto flex size-[32px] items-center justify-center rounded-full",
                    "font-sans text-caption-13-medium text-text-primary transition-colors",
                    isInRange && "rounded-none bg-brand-soft",
                    (isStart || isEnd) &&
                      "bg-action-primary text-text-on-primary",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
