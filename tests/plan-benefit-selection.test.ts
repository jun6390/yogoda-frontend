import { expect, it } from "vitest";
import {
  getActiveSteps,
  getProgressiveSteps,
  sanitizeSelections,
} from "../src/lib/plan-benefit-selection";
import type { PlanChoiceBenefit } from "../src/types/plan";

const step = (
  code: string,
  overrides: Partial<PlanChoiceBenefit> = {},
): PlanChoiceBenefit => ({
  code,
  stepType: "choice",
  section: "plus",
  sectionTitle: null,
  title: code,
  instruction: null,
  selectionCount: 1,
  required: true,
  sortOrder: 0,
  dependsOn: [],
  options: ["a", "b"].map((code) => ({
    code,
    title: code,
    description: null,
    brand: null,
    imageUrl: null,
    monthlyValue: null,
  })),
  ...overrides,
});
const steps = [
  step("base"),
  step("dependent", {
    dependsOn: [{ stepCode: "base", optionCodes: ["a"], match: "any" }],
  }),
  step("info", { stepType: "info" }),
];

it("reveals eligible steps progressively and stops at the first unfinished choice", () => {
  expect(
    getProgressiveSteps(getActiveSteps(steps, {}), {}).map((s) => s.code),
  ).toEqual(["base"]);
  const selected = { base: ["a"] };
  expect(
    getProgressiveSteps(getActiveSteps(steps, selected), selected).map(
      (s) => s.code,
    ),
  ).toEqual(["base", "dependent"]);
});
it("drops selections when their parent option changes without mutating input", () => {
  const selected = { base: ["b"], dependent: ["a"], unknown: ["a"] };
  expect(sanitizeSelections(steps, selected)).toEqual({ base: ["b"] });
  expect(selected.dependent).toEqual(["a"]);
});
it("validates all-match dependencies and selection limits", () => {
  const list = [
    step("base", { selectionCount: 2 }),
    step("child", {
      dependsOn: [{ stepCode: "base", optionCodes: ["a", "b"], match: "all" }],
    }),
  ];
  expect(getActiveSteps(list, { base: ["a"] })).toHaveLength(1);
  expect(getActiveSteps(list, { base: ["a", "b"] })).toHaveLength(2);
  expect(
    sanitizeSelections(list, {
      base: ["invalid", "a", "b"],
      child: ["a", "b"],
    }),
  ).toEqual({ base: ["a", "b"], child: ["a"] });
});
