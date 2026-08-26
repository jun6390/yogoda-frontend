import type { SessionListParams } from "@/types/session";

export const ADMIN_PROMPT_QUERY_KEYS = {
  active: ["admin", "prompts", "active"],
  history: ["admin", "prompts", "history"],
} as const;

export const ADMIN_SESSION_QUERY_KEYS = {
  list: (params: SessionListParams) => ["admin", "sessions", "list", params],
  detail: (sessionId: string) => ["admin", "sessions", "detail", sessionId],
};
