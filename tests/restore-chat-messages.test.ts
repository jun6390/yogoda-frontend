import { expect, it } from "vitest";
import { restoreChatMessages } from "../src/lib/chat/restore-messages";
import type { LatestSessionResponse } from "../src/lib/api/chat";

type Message = LatestSessionResponse["messages"][number];
const message = (overrides: Partial<Message> = {}): Message => ({
  id: "1",
  role: "ai",
  content: "Response",
  createdAt: "2026-09-03T00:00:00Z",
  ...overrides,
});

it("does not restore empty text bubbles", () => {
  expect(restoreChatMessages([message({ content: "  " })])).toEqual([]);
});
it("restores plan cards even when the accompanying text is empty", () => {
  const plans = [
    {
      code: "a",
      badge: "",
      name: "A",
      price: "40000",
      specs: "10GB",
      savings: "",
      matchRate: "",
    },
  ];
  expect(restoreChatMessages([message({ content: "", plans })])).toEqual([
    { id: "1-plans", sender: "ai", type: "plans", plans },
  ]);
});
it("restores text and recommendation cards in the original order", () => {
  const restored = restoreChatMessages([
    message({ role: "user" }),
    message({ id: "2", messageType: "terms" }),
  ]);
  expect(restored.map((m) => [m.sender, m.type])).toEqual([
    ["user", "text"],
    ["ai", "terms"],
  ]);
  expect(restored[1].signupStep).toBe("terms_agreement");
});
it("preserves signup summary data and final completion cards", () => {
  const restored = restoreChatMessages([
    message({
      messageType: "signup_summary",
      signupData: { identityVerified: true },
    }),
    message({ id: "2", messageType: "signup_complete" }),
  ]);
  expect(restored[0].signupData).toEqual({ identityVerified: true });
  expect(restored[1].signupStep).toBe("completed");
});
