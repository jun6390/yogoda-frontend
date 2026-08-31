export type SubscriptionCategory =
  "ott" | "music" | "shopping" | "delivery" | "other";
export type SubscriptionStatus = "active" | "canceled";

export interface UserSubscription {
  id: string;
  serviceCode: string;
  serviceName: string;
  category: SubscriptionCategory;
  monthlyFee: number;
  status: SubscriptionStatus;
  startedAt: string;
  canceledAt: string | null;
  updatedAt: string;
}

export interface SubscriptionListResponse {
  summary: {
    activeCount: number;
    monthlyTotal: number;
  };
  subscriptions: UserSubscription[];
}

export interface SubscriptionInput {
  serviceCode: string;
  serviceName: string;
  category: SubscriptionCategory;
  monthlyFee: number;
  startedAt: string;
}

export interface SubscriptionMutationResponse {
  message: string;
  subscription: UserSubscription;
}
