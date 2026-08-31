import { apiFetch } from "./client";

import type {
  SubscriptionInput,
  SubscriptionListResponse,
  SubscriptionMutationResponse,
} from "@/types/subscription";

export function getMySubscriptions() {
  return apiFetch<SubscriptionListResponse>("/api/subscriptions/me");
}

export function addMySubscription(input: SubscriptionInput) {
  return apiFetch<SubscriptionMutationResponse>("/api/subscriptions/me", {
    method: "POST",
    body: input,
  });
}

export function reactivateMySubscription(subscriptionId: string) {
  return apiFetch<SubscriptionMutationResponse>(
    `/api/subscriptions/me/${subscriptionId}`,
    { method: "PATCH", body: { status: "active" } },
  );
}

export function cancelMySubscription(subscriptionId: string) {
  return apiFetch<SubscriptionMutationResponse>(
    `/api/subscriptions/me/${subscriptionId}`,
    { method: "DELETE" },
  );
}
