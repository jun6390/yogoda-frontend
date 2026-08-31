import { apiFetch } from "./client";

import type {
  DemoUsageResponse,
  DemoUsageScenario,
  UsageReport,
} from "@/types/usage";

export function getMyUsageReport() {
  return apiFetch<UsageReport>("/api/usage/me");
}

export function applyDemoUsageScenario(scenario: DemoUsageScenario) {
  return apiFetch<DemoUsageResponse>(`/api/usage/me/demo/${scenario}`, {
    method: "POST",
  });
}
