import { apiFetch } from "./client";

import type {
  Benefit,
  BenefitCalendarEvent,
  BenefitFilter,
  BenefitListResponse,
} from "@/types/benefit";

export function getBenefits(category: BenefitFilter = "all") {
  return apiFetch<BenefitListResponse>(`/api/benefits?category=${category}`);
}

export function getBenefit(code: string) {
  return apiFetch<Benefit>(`/api/benefits/${encodeURIComponent(code)}`);
}

export function getSavedBenefits() {
  return apiFetch<{ benefits: Benefit[] }>("/api/benefits/saved/me");
}

export function setBenefitSaved(code: string, saved: boolean) {
  return apiFetch<{ code: string; saved: boolean }>(
    `/api/benefits/${encodeURIComponent(code)}/saved`,
    { method: saved ? "PUT" : "DELETE" },
  );
}

export function getBenefitCalendar(month: string) {
  return apiFetch<{ month: string; events: BenefitCalendarEvent[] }>(
    `/api/rewards/benefit-calendar?month=${month}`,
  );
}
