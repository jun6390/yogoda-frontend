import type { AdminPeriod } from "@/types/admin";
import type { DashboardPeriod } from "@/types/dashboard";
import type { SessionListParams } from "@/types/session";

export const ADMIN_PROMPT_QUERY_KEYS = {
  active: ["admin", "prompts", "active"],
  // params 없이 부르면 페이지 구분 없는 짧은 키가 나와서, 배포/롤백 후
  // invalidateQueries에 쓰면 페이지와 상관없이 히스토리 전체가 무효화됨
  history: (params?: { page: number; limit: number }) =>
    params
      ? ["admin", "prompts", "history", params]
      : ["admin", "prompts", "history"],
  detail: (versionId: string) => ["admin", "prompts", "detail", versionId],
};

export const ADMIN_SESSION_QUERY_KEYS = {
  list: (params: SessionListParams) => ["admin", "sessions", "list", params],
  detail: (sessionId: string) => ["admin", "sessions", "detail", sessionId],
};

export const ADMIN_DASHBOARD_QUERY_KEYS = {
  summary: (period: DashboardPeriod) => ["admin", "dashboard", period],
};

export const ADMIN_UI_ELEMENTS_QUERY_KEYS = {
  summary: (period: AdminPeriod) => ["admin", "ui-elements", period],
};
