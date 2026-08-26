import { apiFetch } from "../client";

import type { DashboardPeriod, DashboardResponse } from "@/types/dashboard";

export function getDashboard(period: DashboardPeriod = "today") {
  return apiFetch<DashboardResponse>(`/api/admin/dashboard?period=${period}`);
}
