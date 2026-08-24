import { apiFetch } from "./client";
import type { AttendanceSummary, PointWallet } from "@/types/reward";

export function getAttendance(month: string) {
  return apiFetch<AttendanceSummary>(`/api/rewards/attendance?month=${month}`);
}
export function checkIn() {
  return apiFetch<{ date: string; points: number; wallet: PointWallet }>(
    "/api/rewards/attendance/check-in",
    { method: "POST" },
  );
}
export function getPointWallet() {
  return apiFetch<PointWallet>("/api/rewards/points");
}
