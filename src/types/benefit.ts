export type BenefitCategory = "membership" | "partner" | "discount";
export type BenefitFilter = "all" | BenefitCategory;

export interface Benefit {
  id: string;
  code: string;
  title: string;
  category: string;
  benefitType: string;
  partner: string | null;
  brand: string | null;
  summary: string;
  eligibility: string;
  value: string;
  usageLimit: string | null;
  minMembershipTier: string | null;
  period: { startsAt: string | null; endsAt: string | null };
  tags: string[];
  eligible: boolean;
  reason: string;
  saved: boolean;
}

export interface BenefitCalendarEvent {
  id: string;
  benefitCode: string;
  date: string;
  title: string;
  value: string;
  status: string;
  type: "coupon" | "benefit";
  brand: string | null;
  category: "membership" | "food" | "culture" | "shopping";
  saved: boolean;
}

export interface BenefitListResponse {
  currentMembershipTier: string | null;
  eligibleCount: number;
  benefits: Benefit[];
}
