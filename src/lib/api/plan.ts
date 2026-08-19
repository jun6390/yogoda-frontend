import { apiFetch } from "@/lib/api/client";

import type { Plan } from "@/types/plan";

export function getPlans() {
  return apiFetch<Plan[]>("/api/plans");
}

export function getPlanByCode(code: string) {
  return apiFetch<Plan>(`/api/plans/${code}`);
}
