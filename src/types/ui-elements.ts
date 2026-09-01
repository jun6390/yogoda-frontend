export type UiElement =
  "plan_detail" | "plan_comparison" | "explore_plans" | "signup_button";

export interface UiElementStat {
  element: UiElement;
  label: string;
  impressions: number;
  clicks: number;
  ctr: number;
  ctrChange: number;
  lowCtr: boolean;
}

export interface UiElementsResponse {
  totalImpressions: number;
  overallCtr: number;
  overallCtrChange: number;
  elements: UiElementStat[];
}
