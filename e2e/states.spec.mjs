import { test, expect } from "playwright/test";
import { api, login } from "./support/auth.mjs";

test("comparison without a plan code shows an error instead of loading forever", async ({
  page,
  context,
  request,
}) => {
  await login(context, request);
  await page.goto("/ko/ai/compare");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("notification failure is visible and retry recovers real data", async ({
  page,
  context,
  request,
}) => {
  await login(context, request);
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route(api + "/api/notifications", async (route) => {
    await gate;
    await route.fulfill({
      status: 503,
      json: { message: "Temporary test failure" },
    });
  });
  try {
    await page.goto("/ko/my/coupons");
    await page.getByRole("button", { name: "알림", exact: true }).click();
    const panel = page.getByRole("dialog", { name: "알림", exact: true });
    await expect(
      panel.getByRole("status", { name: "알림을 불러오는 중" }),
    ).toBeVisible();
    await expect(panel.getByText("아직 알림이 없어요")).toHaveCount(0);
    release();
    await expect(panel.getByRole("alert")).toContainText(
      "알림을 불러오지 못했어요.",
    );
    await page.unroute(api + "/api/notifications");
    await panel.getByRole("button", { name: "다시 불러오기" }).click();
    await expect(
      panel.getByText("Test notification", { exact: true }),
    ).toBeVisible();
  } finally {
    release();
  }
});

for (const width of [320, 1280]) {
  test(`notification panel fits ${width}px and exposes keyboard deletion`, async ({
    page,
    context,
    request,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await login(context, request);
    await page.goto("/ko/my/coupons");
    await page.getByRole("button", { name: "알림", exact: true }).click();
    const panel = page.getByRole("dialog", { name: "알림", exact: true });
    const notification = panel
      .getByRole("button")
      .filter({ hasText: "Test notification" });
    await expect(notification).toBeVisible();
    const bounds = await panel.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: test.info().outputPath(`notifications-${width}.png`),
    });
    await notification.focus();
    await notification.press("Delete");
    const deleteButton = panel.getByRole("button", { name: "알림 삭제" });
    await expect(deleteButton).toBeFocused();
    await deleteButton.press("Enter");
    await expect(panel.getByText("아직 알림이 없어요")).toBeVisible();
  });
}

test("non-admin visitors are redirected away from admin screens", async ({
  page,
  context,
  request,
}) => {
  await login(context, request);
  await page.goto("/admin/logs");
  await expect(page).toHaveURL(/\/ko\/?$/);
  await expect(page.getByRole("heading", { name: "세션 로그" })).toHaveCount(0);
});

test("admin screens render empty data and recover from dashboard errors", async ({
  page,
  context,
  request,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const headers = await login(context, request, { admin: true });
  await page.goto("/admin/logs");
  await expect(
    page.getByText("조건에 맞는 세션이 없어요.", { exact: true }),
  ).toBeVisible();
  const endpoint = api + "/api/admin/dashboard*";
  await page.route(endpoint, (route) =>
    route.fulfill({ status: 503, json: { message: "Temporary test failure" } }),
  );
  await page.goto("/admin/dashboard");
  await expect(
    page.getByText("대시보드를 불러오지 못했어요", { exact: true }),
  ).toBeVisible();
  await page.unroute(endpoint);
  const response = page.waitForResponse(
    (response) =>
      response.url().startsWith(api + "/api/admin/dashboard") &&
      response.status() === 200,
  );
  await page.getByRole("button", { name: "다시 시도", exact: true }).click();
  await response;
  await expect(
    page.getByText("대시보드를 불러오지 못했어요", { exact: true }),
  ).toHaveCount(0);
  expect(
    (await request.get(api + "/api/admin/dashboard", { headers })).ok(),
  ).toBeTruthy();
  await page.goto("/admin/ui-analysis");
  await expect(
    page.getByRole("heading", { name: "UI 행동 분석", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("전체 UI 클릭률", { exact: true })).toBeVisible();
});
