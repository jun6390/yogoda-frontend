import { apiFetch } from "./client";

import type {
  ActivatePromptResponse,
  ActivePrompt,
  CreatePromptPayload,
  CreatePromptResponse,
  PromptDetail,
  PromptHistoryResponse,
} from "@/types/prompt";

export function getActivePrompt() {
  return apiFetch<ActivePrompt>("/api/admin/prompts/active");
}

export function createPrompt(payload: CreatePromptPayload) {
  return apiFetch<CreatePromptResponse>("/api/admin/prompts", {
    method: "POST",
    body: payload,
  });
}

export function getPromptHistory() {
  return apiFetch<PromptHistoryResponse>("/api/admin/prompts");
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
