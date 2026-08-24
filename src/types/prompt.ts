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

export interface PromptVersionSummary {
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

export interface PromptHistoryResponse {
  versions: PromptVersionSummary[];
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

export interface ActivatePromptResponse {
  versionId: string;
  version: string;
  isActive: boolean;
  deployedAt: string;
  deployedBy: string;
  message: string;
}
