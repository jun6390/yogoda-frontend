import { apiFetch } from "./client";

import type { MissionListResponse } from "@/types/mission";

export function getMyMissions() {
  return apiFetch<MissionListResponse>("/api/missions/me");
}

export function joinMission(code: string) {
  return apiFetch(`/api/missions/${encodeURIComponent(code)}/join`, {
    method: "POST",
  });
}

export function claimMissionReward(code: string) {
  return apiFetch(`/api/missions/${encodeURIComponent(code)}/claim`, {
    method: "PATCH",
  });
}
