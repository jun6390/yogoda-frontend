import { apiFetch } from "./client";

import type {
  CouponFilter,
  CouponWallet,
  UseCouponResponse,
} from "@/types/coupon";

export function getMyCoupons(status: CouponFilter = "all") {
  return apiFetch<CouponWallet>(`/api/coupons/me?status=${status}`);
}

export function consumeMyCoupon(couponId: string) {
  return apiFetch<UseCouponResponse>(`/api/coupons/me/${couponId}/use`, {
    method: "PATCH",
  });
}
