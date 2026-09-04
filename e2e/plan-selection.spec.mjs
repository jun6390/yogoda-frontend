import { test, expect } from "playwright/test";
import { api, login } from "./support/auth.mjs";

const option = (code, title) => ({
  code,
  title,
  description: null,
  brand: null,
  imageUrl: null,
  monthlyValue: 1000,
});
const step = (code, title, options, dependsOn = []) => ({
  code,
  title,
  options,
  dependsOn,
  stepType: "choice",
  section: "plus",
  sectionTitle: null,
  instruction: null,
  selectionCount: 1,
  required: true,
  sortOrder: code === "base" ? 1 : 2,
});
const plan = {
  _id: "test-plan",
  code: "nerget-59",
  name: "Test 59",
  carrier: "LG_U_PLUS",
  productLine: "nerget",
  category: "mobile",
  network: "5G",
  audiences: [],
  monthlyFee: 59000,
  discountFee: null,
  data: {
    display: "100GB",
    amountMb: 102400,
    throttleKbps: 3000,
    sharingDisplay: null,
    familyDataDisplay: null,
  },
  voice: "Unlimited",
  additionalVoice: null,
  sms: "Unlimited",
  membershipTier: null,
  smartDeviceBenefit: null,
  promotion: {
    badge: null,
    effectiveMonthlyFee: null,
    maxMonthlyBenefit: null,
  },
  benefitDetails: [],
  choiceBenefits: [
    step("base", "Choose a service", [
      option("a", "Streaming"),
      option("b", "Shopping"),
    ]),
    step(
      "child",
      "Choose streaming",
      [option("netflix", "Netflix"), option("tving", "TVING")],
      [{ stepCode: "base", optionCodes: ["a"], match: "any" }],
    ),
  ],
  isPopular: false,
  popularOrder: null,
  perks: [],
  tags: [],
  recommendationTags: [],
  sourceUrl: "https://example.test",
  sourceCheckedAt: "2026-09-03",
  isActive: true,
  sortOrder: 1,
};
async function mockPlans(page, current) {
  await page.route(api + "/api/plans/**", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    return route.fulfill({
      json: pathname.endsWith("/me/current") ? current : plan,
    });
  });
}

for (const { width, locale, dark } of [
  { width: 320, locale: "ko", dark: false },
  { width: 1280, locale: "en", dark: true },
]) {
  test(`dependent benefit selection survives parent changes at ${width}px ${locale}`, async ({
    page,
    context,
    request,
  }) => {
    await login(context, request);
    await page.setViewportSize({ width, height: 900 });
    await mockPlans(page, null);
    await page.goto(`/${locale}/plans/nerget-59?from=chat`);
    if (dark)
      await page.evaluate(() => document.documentElement.classList.add("dark"));
    const streaming = page.getByRole("button", { name: /^Streaming/ });
    await streaming.click();
    const netflix = page.getByRole("button", { name: /^Netflix/ });
    await expect(netflix).toBeVisible();
    await netflix.click();
    await expect(netflix).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /^Shopping/ }).click();
    await expect(netflix).toHaveCount(0);
    await streaming.click();
    await expect(netflix).toHaveAttribute("aria-pressed", "false");
    const button = page.getByRole("link", { name: "채팅으로 돌아가기" });
    const app = await page.locator("main").boundingBox();
    const bounds = await button.boundingBox();
    expect(bounds.x + bounds.width).toBeLessThan(app.x + app.width);
    await page.screenshot({
      path: test.info().outputPath(`plan-${width}-${locale}.png`),
    });
  });
}

test("the subscribed plan cannot start another signup or select benefits", async ({
  page,
  context,
  request,
}) => {
  await login(context, request);
  await mockPlans(page, {
    planCode: plan.code,
    planName: plan.name,
    currentPlanId: "test",
    selectedOptions: {},
    joinedAt: "2026-09-03",
    monthlyFee: plan.monthlyFee,
    savings: null,
  });
  await page.goto("/ko/plans/nerget-59");
  await expect(
    page.getByRole("button", { name: "현재 이용 중인 요금제" }).first(),
  ).toBeDisabled();
  const choices = page.getByRole("button", { name: /^Streaming/ });
  if (await choices.count()) await expect(choices).toBeDisabled();
});
