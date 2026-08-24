"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/Badge/Badge";
import { ErrorState } from "@/components/ui/ErrorState/ErrorState";
import { ApiError } from "@/lib/api/client";
import { getPromptHistory } from "@/lib/api/prompt";
import { formatDateTime } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export const PROMPT_HISTORY_QUERY_KEY = ["admin", "prompts", "history"];

export function PromptVersionHistory() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: PROMPT_HISTORY_QUERY_KEY,
    queryFn: getPromptHistory,
  });

  return (
    <section className="mt-xl rounded-lg border border-border-default bg-surface p-lg">
      <h2 className="font-sans text-title-18-bold text-text-primary">
        버전 히스토리
      </h2>

      <div className="mt-lg">
        {isPending && (
          <p className="font-sans text-body-14-regular text-text-secondary">
            불러오는 중이에요...
          </p>
        )}

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
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="whitespace-nowrap px-sm py-sm font-sans text-caption-12-bold text-text-tertiary">
                    버전
                  </th>
                  <th className="whitespace-nowrap px-sm py-sm font-sans text-caption-12-bold text-text-tertiary">
                    배포 일시
                  </th>
                  <th className="px-sm py-sm font-sans text-caption-12-bold text-text-tertiary">
                    수정 내용 요약
                  </th>
                  <th className="whitespace-nowrap px-sm py-sm text-right font-sans text-caption-12-bold text-text-tertiary">
                    기간 전환율
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.versions.map((version) => (
                  <tr
                    key={version.versionId}
                    className={cn(
                      "border-b border-border-default last:border-b-0",
                      version.isActive && "bg-brand-soft",
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

                    <td className="px-sm py-md font-sans text-caption-13-regular text-text-secondary">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
