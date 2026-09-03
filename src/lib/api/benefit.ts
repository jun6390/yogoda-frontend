import { apiFetch } from "./client";

import type {
  Benefit,
  BenefitCalendarEvent,
  BenefitFilter,
  BenefitListResponse,
  NearbyBenefitResponse,
} from "@/types/benefit";

export function getNearbyBenefits(coordinates?: {
  latitude: number;
  longitude: number;
}) {
  const params = new URLSearchParams();
  if (coordinates) {
    params.set("latitude", String(coordinates.latitude));
    params.set("longitude", String(coordinates.longitude));
  }
  const search = params.toString();
  return apiFetch<NearbyBenefitResponse>(
    `/api/benefits/nearby${search ? `?${search}` : ""}`,
  );
}

export function getBenefits(category: BenefitFilter = "all") {
  return apiFetch<BenefitListResponse>(`/api/benefits?category=${category}`);
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
