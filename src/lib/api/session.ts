import { apiFetch } from "./client";

import type {
  SessionDetail,
  SessionListParams,
  SessionListResponse,
} from "@/types/session";

export function getSessions(params: SessionListParams = {}) {
  const search = new URLSearchParams();

  if (params.start_date) search.set("start_date", params.start_date);
  if (params.end_date) search.set("end_date", params.end_date);
  if (params.status) search.set("status", params.status);
  if (params.drop_stage) search.set("drop_stage", params.drop_stage);
  if (params.prompt_version)
    search.set("prompt_version", params.prompt_version);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));

  const query = search.toString();

  return apiFetch<SessionListResponse>(
    `/api/admin/sessions${query ? `?${query}` : ""}`,
  );
}

export function getSessionDetail(sessionId: string) {
  return apiFetch<SessionDetail>(
    `/api/admin/sessions/${encodeURIComponent(sessionId)}`,
  );
}
