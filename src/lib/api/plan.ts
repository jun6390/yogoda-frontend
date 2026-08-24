import { apiFetch } from "@/lib/api/client";

import type {
  CurrentPlan,
  Plan,
  PlanCancelResult,
  PlanSubscriptionResponse,
  SelectedPlanOptions,
} from "@/types/plan";

export function getPlans() {
  return apiFetch<Plan[]>("/api/plans");
}

export function getComparedPlans() {
  return apiFetch<Plan[]>("/api/plans/me/compare");
}

export function getPlanByCode(code: string) {
  return apiFetch<Plan>(`/api/plans/${code}`);
}

/*
 * 로그인한 사용자의 현재 가입 요금제를 조회함
 * 가입 중인 요금제가 없으면 null을 반환함
 */
export function getCurrentPlan() {
  return apiFetch<CurrentPlan | null>("/api/plans/me/current");
}

export function joinPlan(code: string, selectedOptions: SelectedPlanOptions) {
  return apiFetch<PlanSubscriptionResponse>(`/api/plans/${code}/join`, {
    method: "POST",
    body: {
      selectedOptions,
    },
  });
}

/*
 * 현재 이용 중인 요금제를 다른 요금제로 변경함
 */
export function changePlan(code: string, selectedOptions: SelectedPlanOptions) {
  return apiFetch<PlanSubscriptionResponse>(`/api/plans/${code}/change`, {
    method: "PATCH",
    body: {
      selectedOptions,
    },
  });
}

export function cancelCurrentPlan() {
  return apiFetch<PlanCancelResult | null>("/api/plans/me/current", {
    method: "DELETE",
  });
}
