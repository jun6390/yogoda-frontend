import { test, expect } from "playwright/test";
import { api, login } from "./support/auth.mjs";

test("admin can save a draft, deploy and restore a previous version in the temporary database", async ({
  page,
  context,
  request,
}) => {
  const headers = await login(context, request, { admin: true });
  const seed = await request.post(api + "/api/admin/prompts", {
    headers,
    data: { content: "Original test prompt", summary: "Test seed" },
  });
  expect(seed.ok()).toBeTruthy();
  const original = await seed.json();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/admin/prompts");
  const editor = page.getByRole("textbox", {
    name: "프롬프트 내용",
    exact: true,
  });
  await expect(editor).toBeVisible();
  const updated = "Updated test prompt " + Date.now();
  const saved = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/admin/prompts/draft") &&
      r.request().method() === "PUT" &&
      r.status() === 200,
  );
  await editor.fill(updated);
  await saved;
  await page.getByRole("link", { name: "AI 채팅 로그", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/logs$/);
  await page.getByRole("link", { name: "프롬프트 관리", exact: true }).click();
  await expect(editor).toHaveValue(updated);
  await page.reload();
  await expect(editor).toHaveValue(updated);
  const deploy = page.getByRole("button", { name: "저장하고 새 버전 배포" });
  await expect(deploy).toBeDisabled();
  await page
    .getByRole("textbox", { name: "수정 내용 요약", exact: true })
    .fill("E2E update");
  await deploy.click();
  await expect(page.getByText(/버전으로 배포됐어요\./)).toBeVisible();
  expect(
    (
      await (
        await request.get(api + "/api/admin/prompts/active", { headers })
      ).json()
    ).content,
  ).toBe(updated);
  const restore = await request.patch(
    api + `/api/admin/prompts/${original.versionId}/activate`,
    { headers },
  );
  expect(restore.ok()).toBeTruthy();
  expect(
    (
      await (
        await request.get(api + "/api/admin/prompts/active", { headers })
      ).json()
    ).content,
  ).toBe("Original test prompt");
});

test("draft fetch and autosave failures are visible without discarding edits", async ({
  page,
  context,
  request,
}) => {
  const headers = await login(context, request, { admin: true });
  expect(
    (
      await request.post(api + "/api/admin/prompts", {
        headers,
        data: { content: "Error recovery seed", summary: "Seed" },
      })
    ).ok(),
  ).toBeTruthy();
  const endpoint = api + "/api/admin/prompts/draft";
  await page.route(endpoint, (route) =>
    route.fulfill({ status: 503, json: { message: "Test failure" } }),
  );
  await page.goto("/admin/prompts");
  await expect(
    page.getByRole("alert").filter({ hasText: "초안을 불러오지 못했어요" }),
  ).toBeVisible();
  await page.unroute(endpoint);
  await page.getByRole("button", { name: "다시 시도", exact: true }).click();
  const editor = page.getByRole("textbox", {
    name: "프롬프트 내용",
    exact: true,
  });
  await expect(editor).toBeVisible();
  await page.route(endpoint, (route) =>
    route.request().method() === "PUT"
      ? route.fulfill({ status: 503, json: { message: "Test failure" } })
      : route.continue(),
  );
  const draft = "Keep this local draft " + Date.now();
  await editor.fill(draft);
  const saveError = page
    .getByRole("alert")
    .filter({ hasText: "초안을 저장하지 못했어요" });
  await expect(saveError).toBeVisible();
  await expect(editor).toHaveValue(draft);
  await page.unroute(endpoint);
  await page.getByRole("button", { name: "다시 저장", exact: true }).click();
  await expect(saveError).toHaveCount(0);
  await page.reload();
  await expect(editor).toHaveValue(draft);
});
