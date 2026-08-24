export type CouponStatus = "available" | "used" | "expired";
export type CouponFilter = CouponStatus | "expiring" | "all";

export interface Coupon {
  id: string;
  benefitCode: string;
  title: string;
  partner: string | null;
  brand: string | null;
  summary: string;
  value: string;
  couponNumber: string;
  barcodeValue: string;
  barcodeType: "CODE128";
  status: CouponStatus;
  expiringSoon: boolean;
  issuedAt: string;
  expiresAt: string;
  usedAt: string | null;
}

export interface CouponWallet {
  summary: Record<CouponStatus | "expiring", number>;
  coupons: Coupon[];
}

export interface UseCouponResponse {
  message: string;
  coupon: {
    id: string;
    benefitCode: string | null;
    couponNumber: string;
    status: "used";
    usedAt: string;
  };
}
