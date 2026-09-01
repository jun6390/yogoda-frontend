import { apiFetch } from "../client";

import type {
  ActivatePromptResponse,
  ActivePrompt,
  CreatePromptPayload,
  CreatePromptResponse,
  PromptDetail,
  PromptDraft,
  PromptHistoryParams,
  PromptHistoryResponse,
  SavePromptDraftPayload,
} from "@/types/prompt";

export function getActivePrompt() {
  return apiFetch<ActivePrompt>("/api/admin/prompts/active");
}

export function getPromptDraft() {
  return apiFetch<PromptDraft>("/api/admin/prompts/draft");
}

export function savePromptDraft(payload: SavePromptDraftPayload) {
  return apiFetch<PromptDraft>("/api/admin/prompts/draft", {
    method: "PUT",
    body: payload,
  });
}

export function createPrompt(payload: CreatePromptPayload) {
  return apiFetch<CreatePromptResponse>("/api/admin/prompts", {
    method: "POST",
    body: payload,
  });
}

export function getPromptHistory(params: PromptHistoryParams = {}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));

  const query = search.toString();

  return apiFetch<PromptHistoryResponse>(
    `/api/admin/prompts${query ? `?${query}` : ""}`,
  );
}

export function getPromptDetail(versionId: string) {
  return apiFetch<PromptDetail>(`/api/admin/prompts/${versionId}`);
}

export function activatePromptVersion(versionId: string) {
  return apiFetch<ActivatePromptResponse>(
    `/api/admin/prompts/${versionId}/activate`,
    { method: "PATCH" },
  );
}
