"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/Badge/Badge";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { Button } from "@/components/admin/Button";
import { Modal } from "@/components/admin/Modal";
import { ApiError } from "@/lib/api/client";
import {
  activatePromptVersion,
  getPromptDetail,
  getPromptHistory,
} from "@/lib/api/admin/prompt";
import { formatDateTime } from "@/lib/admin/format";
import { ADMIN_PROMPT_QUERY_KEYS } from "@/lib/admin/queryKeys";
import { cn } from "@/lib/utils";

interface PendingRollback {
  versionId: string;
  version: string;
}

const PAGE_SIZE = 10;

// 페이지가 많아지면 전부 나열하지 않고 현재 페이지 주변 + 처음/끝만 보여주고
// 나머지는 "…"으로 생략함 (예: 1 … 4 5 [6] 7 8 … 15)
function getPageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis");
  }

  pages.push(total);

  return pages;
}

function VersionTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-160 border-collapse text-left">
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index} className="border-b border-border-default">
              <td className="whitespace-nowrap px-sm py-md">
                <div className="h-4 w-14 animate-pulse rounded-full bg-surface-subtle" />
              </td>
              <td className="whitespace-nowrap px-sm py-md">
                <div className="h-4 w-32 animate-pulse rounded-full bg-surface-subtle" />
              </td>
              <td className="px-sm py-md">
                <div className="h-4 w-full max-w-80 animate-pulse rounded-full bg-surface-subtle" />
              </td>
              <td className="px-sm py-md">
                <div className="ml-auto h-4 w-16 animate-pulse rounded-full bg-surface-subtle" />
              </td>
              <td className="px-sm py-md">
                <div className="ml-auto h-4 w-20 animate-pulse rounded-full bg-surface-subtle" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VersionDetailSkeleton() {
  return (
    <div className="mt-lg flex flex-1 flex-col gap-md">
      <div className="h-3 w-40 animate-pulse rounded-full bg-surface-subtle" />
      <div className="h-4 w-3/5 animate-pulse rounded-full bg-surface-subtle" />
      <div className="h-40 w-full animate-pulse rounded-md bg-surface-subtle" />
    </div>
  );
}

export function PromptVersionHistory() {
  const queryClient = useQueryClient();
  const [pendingRollback, setPendingRollback] =
    useState<PendingRollback | null>(null);
  const [page, setPage] = useState(1);
  const [viewingVersionId, setViewingVersionId] = useState<string | null>(null);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ADMIN_PROMPT_QUERY_KEYS.history({ page, limit: PAGE_SIZE }),
    queryFn: () => getPromptHistory({ page, limit: PAGE_SIZE }),
  });

  const totalPages = data
    ? Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE))
    : 1;

  const {
    data: viewingDetail,
    isPending: isDetailPending,
    isError: isDetailError,
  } = useQuery({
    queryKey: ADMIN_PROMPT_QUERY_KEYS.detail(viewingVersionId ?? ""),
    queryFn: () => getPromptDetail(viewingVersionId!),
    enabled: Boolean(viewingVersionId),
  });

  const rollbackMutation = useMutation({
    mutationFn: activatePromptVersion,
    onSuccess: () => {
      setPendingRollback(null);
      queryClient.invalidateQueries({
        queryKey: ADMIN_PROMPT_QUERY_KEYS.active,
      });
      queryClient.invalidateQueries({
        queryKey: ADMIN_PROMPT_QUERY_KEYS.history(),
      });
    },
  });

  const rollingBackVersionId = rollbackMutation.isPending
    ? rollbackMutation.variables
    : undefined;

  const handleConfirmRollback = () => {
    if (!pendingRollback) {
      return;
    }

    rollbackMutation.mutate(pendingRollback.versionId);
  };

  return (
    <section className="rounded-lg rounded-tr-none border border-border-default bg-surface p-2xl">
      <div className="flex items-center justify-between gap-md">
        <h2 className="font-sans text-title-18-bold text-text-primary">
          버전 히스토리
        </h2>

        {data && (
          <p className="shrink-0 font-sans text-caption-12-regular text-text-tertiary">
            총 {data.totalCount.toLocaleString("ko-KR")}개
          </p>
        )}
      </div>

      <div className="mt-lg">
        {isPending && <VersionTableSkeleton />}

        {isError && (
          <ErrorState
            title="버전 히스토리를 불러오지 못했어요"
            description={error instanceof ApiError ? error.message : undefined}
            retryLabel="다시 시도"
            onRetry={() => refetch()}
          />
        )}

        {data && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 border-collapse text-left">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="whitespace-nowrap px-sm py-sm font-sans text-caption-12-bold text-text-tertiary">
                    버전
                  </th>
                  <th className="whitespace-nowrap px-sm py-sm font-sans text-caption-12-bold text-text-tertiary">
                    배포 일시
                  </th>
                  <th className="min-w-70 px-sm py-sm font-sans text-caption-12-bold text-text-tertiary">
                    수정 내용 요약
                  </th>
                  <th className="whitespace-nowrap px-sm py-sm text-right font-sans text-caption-12-bold text-text-tertiary">
                    기간 전환율
                  </th>
                  <th className="whitespace-nowrap px-sm py-sm text-right font-sans text-caption-12-bold text-text-tertiary">
                    액션
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.versions.map((version) => (
                  <tr
                    key={version.versionId}
                    onClick={() => setViewingVersionId(version.versionId)}
                    className={cn(
                      "cursor-pointer border-b border-border-default transition-colors last:border-b-0 hover:bg-surface-subtle",
                      version.isActive && "bg-brand-soft hover:bg-brand-soft",
                    )}
                  >
                    <td className="whitespace-nowrap px-sm py-md font-sans text-label-14-bold text-text-primary">
                      <span className="flex items-center gap-xs">
                        {version.version}
                        {version.isActive && (
                          <Badge variant="accent">운영중</Badge>
                        )}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-sm py-md font-sans text-caption-13-regular text-text-secondary">
                      {formatDateTime(version.deployedAt)} ·{" "}
                      {version.deployedBy}
                    </td>

                    <td
                      title={version.summary}
                      className="max-w-0 truncate px-sm py-md font-sans text-caption-13-regular text-text-secondary"
                    >
                      {version.summary}
                    </td>

                    <td className="whitespace-nowrap px-sm py-md text-right font-sans text-label-14-bold text-text-primary">
                      {version.conversionRate}%
                      {version.conversionRateChange !== null && (
                        <span
                          className={cn(
                            "ml-xs font-sans text-caption-12-regular",
                            version.conversionRateChange >= 0
                              ? "text-success"
                              : "text-error",
                          )}
                        >
                          {version.conversionRateChange >= 0 ? "▲" : "▼"}{" "}
                          {Math.abs(version.conversionRateChange).toFixed(1)}
                          %p
                        </span>
                      )}
                    </td>

                    <td
                      className="whitespace-nowrap px-sm py-md text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {version.isActive ? (
                        <span className="font-sans text-caption-12-regular text-text-tertiary">
                          현재 버전
                        </span>
                      ) : (
                        <Button
                          variant="text"
                          className="px-sm py-xs text-caption-12-bold text-text-secondary hover:bg-surface-subtle hover:text-text-primary"
                          loading={rollingBackVersionId === version.versionId}
                          loadingLabel="되돌리는 중..."
                          disabled={rollbackMutation.isPending}
                          onClick={() =>
                            setPendingRollback({
                              versionId: version.versionId,
                              version: version.version,
                            })
                          }
                        >
                          이 버전으로 되돌리기
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.totalCount > 0 && (
          <div className="mt-md flex justify-center">
            <div className="flex shrink-0 items-center gap-xs">
              <button
                type="button"
                aria-label="이전 페이지"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="flex size-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft aria-hidden="true" size={16} />
              </button>

              {getPageNumbers(page, totalPages).map((pageNumber, index) =>
                pageNumber === "ellipsis" ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="flex size-9 items-center justify-center font-sans text-caption-12-regular text-text-tertiary"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={pageNumber}
                    type="button"
                    aria-label={`${pageNumber}페이지로 이동`}
                    aria-current={pageNumber === page ? "page" : undefined}
                    onClick={() => setPage(pageNumber)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-md font-sans text-caption-12-bold transition-colors",
                      pageNumber === page
                        ? "bg-surface-subtle text-text-primary"
                        : "text-text-secondary hover:bg-surface-subtle",
                    )}
                  >
                    {pageNumber}
                  </button>
                ),
              )}

              <button
                type="button"
                aria-label="다음 페이지"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                className="flex size-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronRight aria-hidden="true" size={16} />
              </button>
            </div>
          </div>
        )}

        {rollbackMutation.isError && (
          <p className="mt-sm font-sans text-caption-12-regular text-error">
            {rollbackMutation.error instanceof ApiError
              ? rollbackMutation.error.message
              : "되돌리기 중 오류가 발생했어요."}
          </p>
        )}
      </div>

      {pendingRollback && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-lg"
          onMouseDown={() => setPendingRollback(null)}
        >
          <Modal
            onMouseDown={(e) => e.stopPropagation()}
            icon={<RotateCcw aria-hidden="true" size={20} />}
            heading={`${pendingRollback.version} 버전으로 되돌릴까요?`}
            description="지금 즉시 사용자 앱에 반영돼요."
            primaryLabel="되돌리기"
            secondaryLabel="취소"
            primaryLoading={rollbackMutation.isPending}
            onClose={() => setPendingRollback(null)}
            onPrimaryClick={handleConfirmRollback}
            onSecondaryClick={() => setPendingRollback(null)}
          />
        </div>
      )}

      {viewingVersionId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-lg"
          onMouseDown={() => setViewingVersionId(null)}
        >
          <div
            onMouseDown={(event) => event.stopPropagation()}
            className="flex max-h-[80vh] w-full max-w-160 flex-col rounded-lg bg-surface p-2xl shadow-md"
          >
            <div className="flex items-center justify-between gap-md border-b border-border-default pb-lg">
              <div className="flex items-center gap-sm">
                <h3 className="font-sans text-title-18-bold text-text-primary">
                  {viewingDetail?.version ?? "프롬프트 상세"}
                </h3>
                {viewingDetail?.isActive && (
                  <Badge variant="accent">운영중</Badge>
                )}
              </div>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setViewingVersionId(null)}
                className="flex size-touch shrink-0 items-center justify-center text-text-secondary"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>

            {isDetailPending && <VersionDetailSkeleton />}

            {isDetailError && (
              <p className="mt-lg font-sans text-caption-12-regular text-error">
                프롬프트 상세를 불러오지 못했어요.
              </p>
            )}

            {viewingDetail && (
              <>
                <div className="mt-lg">
                  <p className="font-sans text-caption-12-regular text-text-tertiary">
                    {formatDateTime(viewingDetail.deployedAt)} ·{" "}
                    {viewingDetail.deployedBy}
                  </p>
                  <p className="mt-xs font-sans text-body-14-regular text-text-secondary">
                    {viewingDetail.summary}
                  </p>
                </div>

                <pre className="mt-lg flex-1 overflow-y-auto whitespace-pre-wrap rounded-md border border-border-default bg-background p-md font-sans text-body-14-regular text-text-primary">
                  {viewingDetail.content}
                </pre>

                {!viewingDetail.isActive && (
                  <div className="mt-lg flex justify-end">
                    <Button
                      variant="secondary"
                      className="h-10 rounded-md px-lg py-0 text-label-14-bold"
                      onClick={() => {
                        setPendingRollback({
                          versionId: viewingDetail.versionId,
                          version: viewingDetail.version,
                        });
                        setViewingVersionId(null);
                      }}
                    >
                      이 버전으로 되돌리기
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
