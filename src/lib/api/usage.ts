import { apiFetch } from "./client";

import type {
  DemoUsageResponse,
  DemoUsageScenario,
  UsageReport,
  UsageRecommendation,
} from "@/types/usage";

export function getMyUsageReport() {
  return apiFetch<UsageReport>("/api/usage/me");
}

export function getMyUsageRecommendation() {
  return apiFetch<UsageRecommendation>("/api/usage/me/recommendation", {
    method: "POST",
  });
}

export function applyDemoUsageScenario(scenario: DemoUsageScenario) {
  return apiFetch<DemoUsageResponse>(`/api/usage/me/demo/${scenario}`, {
    method: "POST",
  });
}
