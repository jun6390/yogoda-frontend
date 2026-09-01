// 요금제 추천 카드 한 장 (백엔드 plan-recommendation.service의 PlanCard와 대응)
export interface ChatPlanCard {
  code: string;
  badge: string;
  name: string;
  price: string;
  specs: string;
  savings: string;
  matchRate: string;
}

// 가입 플로우 단계
export type SignupStep =
  | "confirm_plan"
  | "fraud_warning"
  | "terms_agreement"
  | "identity_verification"
  | "select_benefits"
  | "select_payment"
  | "final_confirm"
  | "completed";

// 가입 플로우 중 수집된 데이터 (단계별로 점진적으로 채워짐)
export interface SignupCollectedData {
  fraudWarningAcknowledged?: boolean;
  agreedToTerms?: boolean;
  identityVerified?: boolean;
  phoneNumber?: string;
  name?: string;
  birth?: string;
  selectedBenefits?: Record<string, string[]>;
  paymentMethod?:
    "계좌이체" | "신용카드" | "카카오페이" | "네이버페이" | "토스";
}

// 가입 플로우에서 사용하는 요금제 정보
export interface PreselectedPlan {
  code: string;
  name: string;
  monthlyFee: number;
}

// 채팅 화면에 표시되는 메시지 한 건
export interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  type:
    | "text"
    | "plans"
    | "link"
    | "error"
    | "fraud_warning"
    | "terms"
    | "identity_verification"
    | "signup_summary"
    | "signup_complete";
  text?: string;
  textKey?: string;
  plans?: ChatPlanCard[];
  // 가입 플로우 전용 필드
  signupStep?: SignupStep;
  signupData?: SignupCollectedData;
  preselectedPlan?: PreselectedPlan;
}
