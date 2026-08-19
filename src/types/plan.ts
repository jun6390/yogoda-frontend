export type PlanNetwork = "5G" | "LTE" | "5G/LTE";
export type PlanCategory = "mobile" | "tablet" | "premium" | "legacy";
export type PlanProductLine = "nerget" | "uplus";

export interface PlanDataAllowance {
  display: string;
  amountMb: number | null;
  throttleKbps: number | null;
  sharingDisplay: string | null;
}

export interface Plan {
  _id: string;
  code: string;
  carrier: "LG_U_PLUS";
  productLine: PlanProductLine;
  name: string;
  category: PlanCategory;
  network: PlanNetwork;
  audiences: string[];
  monthlyFee: number;
  discountFee: number | null;
  data: PlanDataAllowance;
  voice: string;
  sms: string;
  membershipTier: string | null;
  perks: string[];
  tags: string[];
  recommendationTags: string[];
  sourceUrl: string;
  sourceCheckedAt: string;
  isActive: boolean;
  sortOrder: number;
  created_at?: string;
  updated_at?: string;
}
