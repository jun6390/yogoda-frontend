// UI 행동 분석 등 다른 어드민 화면도 같이 쓰는 공용 타입이라 types/admin.ts로 옮기고 재수출함
export type { AdminPeriod as DashboardPeriod } from "./admin";

export type FunnelStage =
  | "consultation_started"
  | "recommendation_completed"
  | "plan_comparison_viewed"
  | "signup_started"
  | "signup_completed";

export interface DashboardKpi {
  consultationCount: number;
  consultationChange: number;
  consultationPrev: number;
  signupCount: number;
  signupChange: number;
  signupPrev: number;
  conversionRate: number;
  conversionRateChange: number;
  conversionRatePrev: number;
}

export interface DashboardFunnelStage {
  stage: FunnelStage;
  label: string;
  count: number;
  entryRate: number;
  dropRate: number | null;
}

export interface DashboardFunnel {
  totalDropRate: number;
  // 조회 기간에 데이터가 전혀 없으면(전부 0건) null로 내려옴
  maxDropStage: FunnelStage | null;
  stages: DashboardFunnelStage[];
}

export interface DashboardPromptConversion {
  version: string;
  conversionRate: number;
  sessionCount: number;
  isActive: boolean;
}

export interface DashboardResponse {
  kpi: DashboardKpi;
  funnel: DashboardFunnel;
  promptConversion: DashboardPromptConversion[];
}
