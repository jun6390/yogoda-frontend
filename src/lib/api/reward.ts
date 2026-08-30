import { apiFetch } from "./client";
import type { AttendanceSummary, PointWallet } from "@/types/reward";
import type {
  PointExchangeResponse,
  PointProductsResponse,
} from "@/types/point-shop";

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

export function getPointProducts() {
  return apiFetch<PointProductsResponse>("/api/rewards/point-products");
}

export function exchangePointProduct(productCode: string, requestKey: string) {
  return apiFetch<PointExchangeResponse>(
    `/api/rewards/point-products/${productCode}/exchange`,
    {
      method: "POST",
      headers: { "Idempotency-Key": requestKey },
    },
  );
}
