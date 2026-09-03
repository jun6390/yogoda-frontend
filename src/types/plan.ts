type PlanNetwork = "5G" | "LTE" | "5G/LTE";

type PlanCategory = "mobile" | "tablet" | "premium" | "legacy";

type PlanProductLine = "nerget" | "uplus";

type PlanBenefitCategory =
  "content" | "payment" | "membership" | "device" | "bundle" | "other";

type PlanChoiceBenefitStepType = "choice" | "info";

type PlanChoiceBenefitSection =
  "plus" | "premium" | "detail" | "coupon" | "membership" | "addon" | "other";

type PlanChoiceBenefitDependencyMatch = "any" | "all";

export type SelectedPlanOptions = Record<string, string[]>;

interface PlanDataAllowance {
  display: string;
  amountMb: number | null;
  throttleKbps: number | null;
  sharingDisplay: string | null;
  familyDataDisplay: string | null;
}

interface PlanPromotion {
  badge: string | null;
  effectiveMonthlyFee: number | null;
  maxMonthlyBenefit: number | null;
}

interface PlanBenefitDetail {
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

interface PlanChoiceBenefitDependency {
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

interface PlanSavings {
  amount: number;
  previousMonthlyFee: number;
  newMonthlyFee: number;
}

export interface CurrentPlan {
  planCode: string;
  planName: string;
  currentPlanId: string;
  selectedOptions: SelectedPlanOptions;
  joinedAt: string | null;
  monthlyFee: number;
  savings: PlanSavings | null;
}

export interface PlanSubscriptionResponse extends CurrentPlan {
  message: string;
}

export interface PlanCancelResult {
  message?: string;
  canceledPlanId?: string;
}

type PlanComparisonWinner = "current" | "selected" | "tie" | "none";

export interface PlanComparisonRow {
  label: string;
  current: string;
  selected: string;
  winner: PlanComparisonWinner;
}

export interface PlanComparisonResult {
  rows: PlanComparisonRow[];
  oneLineSummary: string;
  recommendation: "current" | "selected" | "tie";
  summaryReason: string;
}
