"use client";

import { useState } from "react";

import { useSearchParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Badge } from "@/components/ui/Badge/Badge";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { Button } from "@/components/admin/Button";
import { DateRangePicker } from "@/components/admin/DateRangePicker";
import { Select } from "@/components/admin/Select";
import {
  AIChatBubble,
  UserChatBubble,
} from "@/components/ui/ChatBubble/ChatBubble";
import { ChatMarkdown } from "@/components/ui/ChatMarkdown/ChatMarkdown";
import { ApiError } from "@/lib/api/client";
import { getSessionDetail, getSessions } from "@/lib/api/admin/session";
import { formatDateTime, formatDuration } from "@/lib/admin/format";
import { ADMIN_SESSION_QUERY_KEYS } from "@/lib/admin/queryKeys";
import { cn } from "@/lib/utils";
import type {
  SessionDropStage,
  SessionListParams,
  SessionStatus,
} from "@/types/session";

const STATUS_OPTIONS: { value: SessionStatus; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "completed", label: "가입 완료" },
  { value: "dropped", label: "이탈" },
];

const DROP_STAGE_OPTIONS: { value: SessionDropStage | "all"; label: string }[] =
  [
    { value: "all", label: "전체 단계" },
    { value: "consultation_started", label: "상담 시작" },
    { value: "recommendation_completed", label: "추천 완료" },
    { value: "plan_comparison_viewed", label: "요금제 비교" },
    { value: "signup_started", label: "가입 신청" },
    { value: "signup_completed", label: "가입 완료" },
  ];

interface FilterState {
  startDate: string;
  endDate: string;
  status: SessionStatus;
  dropStage: SessionDropStage | "all";
  promptVersion: string;
}

const DEFAULT_PERIOD_DAYS = 7;

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// 이탈 대화를 우선 노출하는 게 더 중요해서, 기본값은 "최근 7일 · 이탈"로 좁혀두고
// 필요할 때 "전체"로 넓혀 보도록 함
function getDefaultFilters(): FilterState {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - (DEFAULT_PERIOD_DAYS - 1));

  return {
    startDate: toDateKey(start),
    endDate: toDateKey(today),
    status: "dropped",
    dropStage: "all",
    promptVersion: "",
  };
}

function toListParams(filters: FilterState): SessionListParams {
  return {
    start_date: filters.startDate || undefined,
    end_date: filters.endDate || undefined,
    status: filters.status === "all" ? undefined : filters.status,
    drop_stage: filters.dropStage === "all" ? undefined : filters.dropStage,
    prompt_version: filters.promptVersion
      ? `v${filters.promptVersion}`
      : undefined,
  };
}

const filterInputClassName = cn(
  "h-[40px] rounded-md border border-border-default bg-background px-md",
  "font-sans text-body-14-regular text-text-primary",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary",
);

export function SessionLogContent() {
  // 대시보드의 "해당 로그 보기" 링크에서 ?drop_stage=xxx로 들어오면 그 단계로 미리 필터링해둠
  const searchParams = useSearchParams();
  const initialDropStage =
    (searchParams.get("drop_stage") as SessionDropStage | null) ?? "all";
  const initialFilters: FilterState = {
    ...getDefaultFilters(),
    dropStage: initialDropStage,
  };

  const [draftFilters, setDraftFilters] = useState<FilterState>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(initialFilters);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );

  const listParams = toListParams(appliedFilters);

  const {
    data: listData,
    isPending: isListPending,
    isError: isListError,
    error: listError,
    refetch: refetchList,
  } = useQuery({
    queryKey: ADMIN_SESSION_QUERY_KEYS.list(listParams),
    queryFn: () => getSessions(listParams),
  });

  const {
    data: detail,
    isPending: isDetailPending,
    isError: isDetailError,
    error: detailError,
  } = useQuery({
    queryKey: ADMIN_SESSION_QUERY_KEYS.detail(selectedSessionId ?? ""),
    queryFn: () => getSessionDetail(selectedSessionId!),
    enabled: Boolean(selectedSessionId),
  });

  const handleVersionStep = (delta: number) => {
    setDraftFilters((prev) => {
      const current = prev.promptVersion ? Number(prev.promptVersion) : 0;
      const next = Math.max(0, current + delta);
      return { ...prev, promptVersion: next === 0 ? "" : String(next) };
    });
  };

  const handleApplyFilters = () => setAppliedFilters(draftFilters);

  const handleResetFilters = () => {
    const defaultFilters = getDefaultFilters();
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  return (
    <div className="p-2xl">
      <h1 className="font-sans text-title-24-bold text-text-primary">
        AI 채팅 로그
      </h1>
      <p className="mt-sm font-sans text-body-14-regular text-text-secondary">
        이탈이 발생한 실제 대화를 읽고 프롬프트 개선 지점을 찾으세요
      </p>

      <section className="mt-xl flex flex-wrap items-end gap-md rounded-lg border border-border-default bg-surface p-lg">
        <label className="flex flex-col gap-xs">
          <span className="font-sans text-caption-12-bold text-text-tertiary">
            기간
          </span>
          <DateRangePicker
            startDate={draftFilters.startDate}
            endDate={draftFilters.endDate}
            onChange={(range) =>
              setDraftFilters((prev) => ({ ...prev, ...range }))
            }
          />
        </label>

        <label className="flex flex-col gap-xs">
          <span className="font-sans text-caption-12-bold text-text-tertiary">
            상태
          </span>
          <Select
            value={draftFilters.status}
            options={STATUS_OPTIONS}
            ariaLabel="상태"
            onChange={(status) =>
              setDraftFilters((prev) => ({ ...prev, status }))
            }
            className="w-[140px]"
            triggerClassName="min-h-[40px] rounded-md"
          />
        </label>

        <label className="flex flex-col gap-xs">
          <span className="font-sans text-caption-12-bold text-text-tertiary">
            이탈 단계
          </span>
          <Select
            value={draftFilters.dropStage}
            options={DROP_STAGE_OPTIONS}
            ariaLabel="이탈 단계"
            onChange={(dropStage) =>
              setDraftFilters((prev) => ({ ...prev, dropStage }))
            }
            className="w-[160px]"
            triggerClassName="min-h-[40px] rounded-md"
          />
        </label>

        <label className="flex flex-col gap-xs">
          <span className="font-sans text-caption-12-bold text-text-tertiary">
            프롬프트 버전
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 font-sans text-body-14-regular text-text-tertiary">
              v
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={draftFilters.promptVersion}
              onChange={(e) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  promptVersion: e.target.value.replace(/\D/g, ""),
                }))
              }
              className={cn(filterInputClassName, "w-21 pl-xl pr-2xl")}
            />
            <div className="absolute right-xs top-1/2 flex -translate-y-1/2 flex-col">
              <button
                type="button"
                aria-label="버전 올리기"
                onClick={() => handleVersionStep(1)}
                className="flex h-[16px] w-[20px] items-center justify-center text-text-tertiary hover:text-text-primary"
              >
                <ChevronUp aria-hidden="true" size={12} />
              </button>
              <button
                type="button"
                aria-label="버전 내리기"
                onClick={() => handleVersionStep(-1)}
                className="flex h-[16px] w-[20px] items-center justify-center text-text-tertiary hover:text-text-primary"
              >
                <ChevronDown aria-hidden="true" size={12} />
              </button>
            </div>
          </div>
        </label>

        <div className="flex gap-sm">
          <Button
            className="h-[40px] rounded-md px-lg py-0 text-label-14-bold"
            onClick={handleApplyFilters}
          >
            필터 적용
          </Button>
          <Button
            variant="secondary"
            className="h-[40px] rounded-md px-lg py-0 text-label-14-bold"
            onClick={handleResetFilters}
          >
            초기화
          </Button>
        </div>
      </section>

      <div className="mt-xl flex flex-col gap-lg md:flex-row">
        <section className="flex h-[400px] w-full shrink-0 flex-col rounded-lg border border-border-default bg-surface p-lg md:h-[600px] md:w-[360px]">
          <h2 className="font-sans text-title-18-bold text-text-primary">
            세션 목록
            {listData && (
              <span className="ml-xs font-sans text-caption-13-regular text-text-tertiary">
                총 {listData.totalCount}건 · 이탈 {listData.droppedCount}건
              </span>
            )}
          </h2>

          <div className="mt-md flex-1 overflow-y-auto">
            {isListPending && (
              <p className="font-sans text-body-14-regular text-text-secondary">
                불러오는 중이에요...
              </p>
            )}

            {isListError && (
              <ErrorState
                title="세션 목록을 불러오지 못했어요"
                description={
                  listError instanceof ApiError ? listError.message : undefined
                }
                retryLabel="다시 시도"
                onRetry={() => refetchList()}
              />
            )}

            {listData && listData.sessions.length === 0 && (
              <p className="font-sans text-body-14-regular text-text-secondary">
                조건에 맞는 세션이 없어요.
              </p>
            )}

            {listData && listData.sessions.length > 0 && (
              <ul className="flex flex-col gap-xs">
                {listData.sessions.map((session) => {
                  const isSelected = session.sessionId === selectedSessionId;

                  return (
                    <li key={session.sessionId}>
                      <button
                        type="button"
                        onClick={() => setSelectedSessionId(session.sessionId)}
                        className={cn(
                          "w-full rounded-md border px-md py-sm text-left transition-colors",
                          isSelected
                            ? "border-action-primary bg-brand-soft"
                            : "border-border-default hover:bg-surface-subtle",
                        )}
                      >
                        <div className="flex items-center justify-between gap-sm">
                          <span className="truncate font-sans text-label-14-bold text-text-primary">
                            {session.userName}
                          </span>
                          <Badge
                            variant={
                              session.status === "dropped" ? "error" : "success"
                            }
                          >
                            {session.status === "dropped"
                              ? "이탈"
                              : "가입 완료"}
                          </Badge>
                        </div>

                        <p className="mt-xs font-sans text-caption-12-regular text-text-tertiary">
                          {formatDateTime(session.createdAt)} ·{" "}
                          {session.promptVersion}
                        </p>

                        {session.dropStageLabel && (
                          <p className="mt-xs font-sans text-caption-12-regular text-error">
                            {session.dropStageLabel}에서 이탈
                          </p>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="flex h-[500px] flex-col rounded-lg border border-border-default bg-surface p-lg md:h-[600px] md:flex-1">
          {!selectedSessionId && (
            <p className="font-sans text-body-14-regular text-text-secondary">
              왼쪽 목록에서 세션을 선택하면 대화 내용을 볼 수 있어요.
            </p>
          )}

          {selectedSessionId && isDetailPending && (
            <p className="font-sans text-body-14-regular text-text-secondary">
              불러오는 중이에요...
            </p>
          )}

          {selectedSessionId && isDetailError && (
            <ErrorState
              title="세션 상세를 불러오지 못했어요"
              description={
                detailError instanceof ApiError
                  ? detailError.message
                  : undefined
              }
              retryLabel="다시 시도"
              onRetry={() => refetchList()}
            />
          )}

          {detail && (
            <>
              <header className="flex flex-wrap items-center justify-between gap-md border-b border-border-default pb-md">
                <div>
                  <p className="font-sans text-title-18-bold text-text-primary">
                    {detail.userName}
                  </p>
                  <p className="mt-xs font-sans text-caption-12-regular text-text-tertiary">
                    세션 #{detail.sessionId} ·{" "}
                    {formatDateTime(detail.createdAt)} · {detail.promptVersion}{" "}
                    · 상담 시간 {formatDuration(detail.duration)}
                  </p>
                </div>

                <Badge
                  variant={detail.status === "dropped" ? "error" : "success"}
                >
                  {detail.status === "dropped"
                    ? `${detail.dropStageLabel ?? ""} 이탈`
                    : "가입 완료"}
                </Badge>
              </header>

              <div className="mt-md flex flex-1 flex-col gap-md overflow-y-auto">
                {detail.messages
                  .filter((message) => message.content.trim() !== "")
                  .map((message) => (
                    <div
                      key={message.messageId}
                      className={cn(
                        "flex flex-col gap-xs",
                        message.sender === "user" ? "items-end" : "items-start",
                      )}
                    >
                      {message.sender === "user" ? (
                        <UserChatBubble>{message.content}</UserChatBubble>
                      ) : (
                        <AIChatBubble>
                          <ChatMarkdown>{message.content}</ChatMarkdown>
                        </AIChatBubble>
                      )}
                      <span className="font-sans text-caption-12-regular text-text-tertiary">
                        {formatDateTime(message.createdAt)}
                      </span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
