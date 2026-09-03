import { test, expect } from "playwright/test";
import { api, login } from "./support/auth.mjs";

test("an idle notification socket renews its expired access token", async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(80000);
  const headers = await login(context, request, { shortLivedToken: true });
  await page.goto("/ko/my/coupons");
  await expect(page.getByText("Test coupon", { exact: true })).toBeVisible();
  const response = await page.waitForResponse(
    (response) =>
      response.url() === api + "/api/auth/refresh" &&
      response.request().method() === "POST",
    { timeout: 65000 },
  );
  expect(response.ok()).toBeTruthy();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("auth")).state.accessToken,
      ),
    )
    .not.toBe(headers.Authorization.slice(7));
  await page.getByRole("button", { name: "알림", exact: true }).click();
  await expect(
    page.getByText("Test notification", { exact: true }),
  ).toBeVisible();
});

test("unauthenticated MY access redirects to login with security headers", async ({
  page,
}) => {
  const response = await page.goto("/ko/my/coupons");
  await expect(page).toHaveURL(/\/ko\/login/);
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
});

test("coupon use shows a toast and remains used after reload", async ({
  page,
  context,
  request,
}) => {
  const headers = await login(context, request);
  await page.goto("/ko/my/coupons");
  await page.getByText("Test coupon", { exact: true }).click();
  await page
    .getByRole("button", { name: "쿠폰 사용하기", exact: true })
    .click();
  await expect(
    page.getByText("쿠폰 사용이 완료됐어요.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "사용 완료", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.reload();
  await page.getByRole("tab", { name: "사용 완료", exact: true }).click();
  await expect(page.getByText("Test coupon", { exact: true })).toBeVisible();
  const response = await request.get(api + "/api/coupons/me?status=used", {
    headers,
  });
  expect(response.ok()).toBeTruthy();
  expect(JSON.stringify(await response.json())).toContain('"used"');
});

test("read-all becomes disabled and remains read after reload", async ({
  page,
  context,
  request,
}) => {
  await login(context, request);
  await page.goto("/ko/my/coupons");
  await page.getByRole("button", { name: "알림", exact: true }).click();
  const button = page.getByRole("button", { name: "모두 읽음", exact: true });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(button).toBeDisabled();
  await page.reload();
  await page.getByRole("button", { name: "알림", exact: true }).click();
  await expect(button).toBeDisabled();
  await expect(
    page.getByText("Test notification", { exact: true }),
  ).toBeVisible();
});

test("subscription form blocks invalid values and defaults to the local date", async ({
  page,
  context,
  request,
}) => {
  await login(context, request);
  await page.goto("/ko/my/subscriptions");
  await page.getByRole("button", { name: "구독 추가", exact: true }).click();
  const fee = page.getByLabel("월 구독료", { exact: true });
  const date = page.getByLabel("이용 시작일", { exact: true });
  const save = page.getByRole("button", { name: "저장하기", exact: true });
  const today = await page.evaluate(() => {
    const date = new Date();
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  });
  await expect(date).toHaveValue(today);
  for (const value of ["", "-1", "1e309"]) {
    await fee.fill(value);
    await expect(save).toBeDisabled();
  }
  await fee.fill("0");
  await expect(save).toBeEnabled();
  await date.fill("");
  await expect(save).toBeDisabled();
  await date.fill(today);
  await expect(save).toBeEnabled();
});

test("subscription can be added, canceled and reactivated through the UI", async ({
  page,
  context,
  request,
}) => {
  await login(context, request);
  await page.goto("/ko/my/subscriptions");
  await page.getByRole("button", { name: "구독 추가", exact: true }).click();
  await page.getByRole("button", { name: "저장하기", exact: true }).click();
  await expect(
    page.locator("article").getByText("Netflix", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "구독 종료", exact: true }).click();
  await page.getByRole("button", { name: "종료하기", exact: true }).click();
  await page.getByRole("tab", { name: "종료", exact: true }).click();
  await page.getByRole("button", { name: "다시 이용", exact: true }).click();
  await page.getByRole("tab", { name: "이용 중", exact: true }).click();
  await expect(
    page.locator("article").getByText("Netflix", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "구독 종료", exact: true }),
  ).toBeVisible();
});
