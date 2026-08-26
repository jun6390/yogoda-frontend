import { apiFetch } from "../client";

import type { AdminPeriod } from "@/types/admin";
import type { UiElementsResponse } from "@/types/ui-elements";

export function getUiElements(period: AdminPeriod = "today") {
  return apiFetch<UiElementsResponse>(
    `/api/admin/ui-elements?period=${period}`,
  );
}
