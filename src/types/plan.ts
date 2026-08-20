export type PlanNetwork = "5G" | "LTE" | "5G/LTE";

export type PlanCategory = "mobile" | "tablet" | "premium" | "legacy";

export type PlanProductLine = "nerget" | "uplus";

export type PlanBenefitCategory =
  "content" | "payment" | "membership" | "device" | "bundle" | "other";

export type PlanChoiceBenefitStepType = "choice" | "info";

export type PlanChoiceBenefitSection =
  "plus" | "premium" | "detail" | "coupon" | "membership" | "addon" | "other";

export type PlanChoiceBenefitDependencyMatch = "any" | "all";

export type SelectedPlanOptions = Record<string, string[]>;

export interface PlanDataAllowance {
  display: string;
  amountMb: number | null;
  throttleKbps: number | null;
  sharingDisplay: string | null;
  familyDataDisplay: string | null;
}

export interface PlanPromotion {
  badge: string | null;
  effectiveMonthlyFee: number | null;
  maxMonthlyBenefit: number | null;
}

export interface PlanBenefitDetail {
  category: PlanBenefitCategory;
  title: string;
  description: string | null;
  monthlyValue: number | null;
}

export interface PlanChoiceBenefitOption {
  code: string;
  title: string;
  description: string | null;
  brand: string | null;
  imageUrl: string | null;
  monthlyValue: number | null;
}

export interface PlanChoiceBenefitDependency {
  stepCode: string;
  optionCodes: string[];
  match: PlanChoiceBenefitDependencyMatch;
}

export interface PlanChoiceBenefit {
  code: string;
  stepType: PlanChoiceBenefitStepType;
  section: PlanChoiceBenefitSection;

  sectionTitle: string | null;
  title: string;
  instruction: string | null;

  selectionCount: number;
  required: boolean;
  sortOrder: number;

  dependsOn: PlanChoiceBenefitDependency[];

  options: PlanChoiceBenefitOption[];
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
  additionalVoice: string | null;
  sms: string;

  membershipTier: string | null;
  smartDeviceBenefit: string | null;

  promotion: PlanPromotion;
  benefitDetails: PlanBenefitDetail[];
  choiceBenefits: PlanChoiceBenefit[];

  isPopular: boolean;
  popularOrder: number | null;

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

export interface JoinPlanResponse {
  message: string;
  planCode: string;
  planName: string;
  currentPlanId: string;
  selectedOptions: SelectedPlanOptions;
  joinedAt: string;
}

export interface CurrentPlan {
  planCode: string;
  planName: string;
  currentPlanId: string;
  selectedOptions: SelectedPlanOptions;
  joinedAt: string | null;
}

export interface PlanSubscriptionResponse extends CurrentPlan {
  message: string;
}
