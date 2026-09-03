import { test, expect } from "playwright/test";
import { login } from "./support/auth.mjs";

for (const width of [320, 390, 1920]) {
  test(`back-to-chat stays inside the app at ${width}px`, async ({
    page,
    context,
    request,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await login(context, request);
    await page.goto("/ko/plans?from=chat");
    const button = page.getByRole("link", { name: "채팅으로 돌아가기" });
    await expect(button).toBeVisible();
    const app = await page.locator("main").boundingBox();
    const bounds = await button.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(app.x);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(app.x + app.width - 14);
    expect(app.x + app.width - bounds.x - bounds.width).toBeLessThanOrEqual(17);
    expect(bounds.y + bounds.height).toBeLessThan(900 - 72);
    await expect(button).toHaveAttribute("href", "/ko/ai");
    await page.screenshot({
      path: test.info().outputPath(`back-to-chat-${width}.png`),
    });
    await page.goto("/ko/plans");
    await expect(button).toHaveCount(0);
  });
}
