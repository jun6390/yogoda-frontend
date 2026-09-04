import { expect, it } from "vitest";
import {
  parseSubscriptionForm,
  toLocalDateInput,
} from "../src/lib/subscription-form";

it.each(["", " ", "-1", "NaN", "Infinity", "1e309", "invalid"])(
  "rejects invalid monthly fee %s",
  (fee) => {
    expect(parseSubscriptionForm(fee, "2026-09-03")).toBeNull();
  },
);

it.each([
  "",
  "invalid",
  "2026-02-30",
  "2026-13-01",
  "2026-00-01",
  "2026-09-00",
  "2025-02-29",
])("rejects invalid date %s without throwing", (date) => {
  expect(parseSubscriptionForm("7900", date)).toBeNull();
});

it("retains valid zero, decimal and catalog fees", () => {
  for (const fee of ["0", "7890", "7900.5"]) {
    expect(parseSubscriptionForm(fee, "2024-02-29")).toEqual({
      monthlyFee: Number(fee),
      startedAt: new Date("2024-02-29T00:00:00").toISOString(),
    });
  }
});

it("uses the local calendar date instead of the UTC date", () => {
  const date = new Date(2026, 8, 4, 0, 30);
  date.toISOString = () => {
    throw new Error("UTC conversion must not be used for date input defaults");
  };
  expect(toLocalDateInput(date)).toBe("2026-09-04");
});
