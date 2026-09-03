export type SessionStatus = "all" | "completed" | "dropped";

export type SessionDropStage =
  | "consultation_started"
  | "recommendation_completed"
  | "plan_comparison_viewed"
  | "signup_started"
  | "signup_completed";

interface SessionListItem {
  sessionId: string;
  userName: string;
  status: "completed" | "dropped";
  dropStage: SessionDropStage | null;
  dropStageLabel: string | null;
  promptVersion: string;
  createdAt: string;
  duration: number;
  chatLogConsent: boolean;
}

export interface SessionListResponse {
  totalCount: number;
  completedCount: number;
  droppedCount: number;
  page: number;
  limit: number;
  sessions: SessionListItem[];
}

export interface SessionListParams {
  start_date?: string;
  end_date?: string;
  status?: SessionStatus;
  drop_stage?: SessionDropStage;
  prompt_version?: string;
  chat_log_consent?: boolean;
  page?: number;
  limit?: number;
}

interface SessionMessage {
  messageId: string;
  sender: "user" | "ai";
  content: string;
  createdAt: string;
}

export interface SessionDetail {
  sessionId: string;
  userName: string;
  status: "completed" | "dropped";
  dropStage: SessionDropStage | null;
  dropStageLabel: string | null;
  promptVersion: string;
  createdAt: string;
  duration: number;
  chatLogConsent: boolean;
  messages: SessionMessage[];
}
