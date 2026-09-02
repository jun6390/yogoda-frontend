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
  // 바로 직전 동일 길이 구간의 dropRate. "이탈 단계 배너"가 maxDropStage(베이스라인
  // 대비 가장 나빠진 단계)를 설명할 때만 쓰고, 퍼널 막대그래프 자체는 안 씀
  baselineDropRate: number | null;
  // baselineDropRate 계산에 쓰인 표본 수. 너무 작으면(예: 5 미만) 그 단계가
  // maxDropStage로 뽑혀도 신뢰하기 어려우므로 프론트에서 배너 노출 여부 판단에 씀
  baselineCount: number;
}

export interface DashboardFunnel {
  totalDropRate: number;
  // 조회 기간에 데이터가 전혀 없거나, 베이스라인보다 나빠진 단계가 하나도
  // 없으면 null로 내려옴
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
