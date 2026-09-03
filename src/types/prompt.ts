export interface ActivePrompt {
  versionId: string;
  version: string;
  content: string;
  isActive: boolean;
  deployedAt: string;
  deployedBy: string;
  conversionRate: number;
  sessionCount: number;
  charCount: number;
}

export interface CreatePromptPayload {
  content: string;
  summary: string;
}

export interface CreatePromptResponse {
  versionId: string;
  version: string;
  content: string;
  summary: string;
  isActive: boolean;
  deployedAt: string;
  deployedBy: string;
}

interface PromptVersionSummary {
  versionId: string;
  version: string;
  summary: string;
  deployedAt: string;
  deployedBy: string;
  conversionRate: number;
  conversionRateChange: number | null;
  sessionCount: number;
  isActive: boolean;
}

export interface PromptHistoryParams {
  page?: number;
  limit?: number;
}

export interface PromptHistoryResponse {
  versions: PromptVersionSummary[];
  totalCount: number;
  page: number;
  limit: number;
}

export interface PromptDetail {
  versionId: string;
  version: string;
  content: string;
  summary: string;
  deployedAt: string;
  deployedBy: string;
  conversionRate: number;
  sessionCount: number;
  isActive: boolean;
  charCount: number;
}

export interface PromptDraft {
  content: string;
  baseVersion: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface SavePromptDraftPayload {
  content: string;
}

export interface ActivatePromptResponse {
  versionId: string;
  version: string;
  isActive: boolean;
  deployedAt: string;
  deployedBy: string;
  message: string;
}
