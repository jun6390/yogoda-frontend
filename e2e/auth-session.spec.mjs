import { test, expect } from "playwright/test";
import { api, login } from "./support/auth.mjs";

test("session restores after reload without persisted access tokens", async ({
  page,
  context,
  request,
}) => {
  await login(context, request);
  await page.goto("/ko/my/coupons");
  await expect(page.getByText("Test coupon", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Test coupon", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("auth"))).toBeNull();
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "refreshToken=",
  );
});

test("session restoration failure offers retry and recovers", async ({
  page,
  context,
  request,
}) => {
  await login(context, request);
  const endpoint = api + "/api/auth/refresh";
  await page.route(endpoint, (route) =>
    route.fulfill({ status: 503, json: { message: "Temporary outage" } }),
  );
  await page.goto("/ko/my/coupons");
  await expect(page.getByText("로그인 상태를 확인하지 못했어요")).toBeVisible();
  await page.unroute(endpoint);
  await page.getByRole("button", { name: "다시 시도", exact: true }).click();
  await expect(page.getByText("Test coupon", { exact: true })).toBeVisible();
});

test("expired refresh cookie cannot authenticate a routing marker", async ({
  page,
  context,
  request,
}) => {
  await login(context, request);
  await context.clearCookies({ name: "refreshToken" });
  await page.goto("/ko/my/coupons");
  await expect(
    page.getByText("로그인이 필요해요", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Test coupon", { exact: true })).toHaveCount(0);
  expect(
    (await context.cookies()).some(
      (cookie) => cookie.name === "yogoda_authenticated",
    ),
  ).toBe(false);
});
