import { expect } from "playwright/test";

export const api = "http://127.0.0.1:8100";

export async function login(context, request, options = {}) {
  const response = await request.post(api + "/__test/fixture", {
    data: options,
  });
  expect(response.ok()).toBeTruthy();
  const fixture = await response.json();
  await context.addCookies([
    {
      name: "refreshToken",
      value: fixture.refreshToken,
      domain: "127.0.0.1",
      path: "/api/auth",
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: "yogoda_authenticated",
      value: "true",
      domain: "127.0.0.1",
      path: "/",
    },
    {
      name: "yogoda_onboarding_completed",
      value: "true",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
  return { Authorization: "Bearer " + fixture.accessToken };
}
