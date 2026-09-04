import { test, expect } from "playwright/test";

test("favicon resolves to the existing SVG icon", async ({ request }) => {
  const response = await request.get("/favicon.ico");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
  expect(await response.text()).toContain("<svg");
});

test("guest entry and signup result do not request protected plan or refresh APIs", async ({
  page,
}) => {
  const protectedRequests = [];
  page.on("request", (request) => {
    if (/\/api\/(auth\/refresh|plans\/me\/current)/.test(request.url()))
      protectedRequests.push(request.url());
  });
  await page.goto("/ko/splash");
  await expect(page).toHaveURL(/\/ko\/onboarding/);
  await page.goto("/ko/ai/success");
  await expect(
    page.getByRole("alert").filter({ hasText: "로그인이 필요해요" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "로그인하기", exact: true }).click();
  await expect(page).toHaveURL(/\/ko\/login/);
  await expect(
    page.getByRole("button", { name: "네이버로 계속하기" }),
  ).toBeVisible();
  expect(protectedRequests).toEqual([]);
});
