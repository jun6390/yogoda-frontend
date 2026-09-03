import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { initializeAuth } from "../src/providers/auth-provider";
import { refreshAccessToken } from "../src/lib/api/client";
import { useAuthStore } from "../src/stores/useAuthStore";

const user = {
  userId: "server-user",
  name: "Verified",
  role: "user",
  isNewUser: false,
};
const success = () => Response.json({ accessToken: "memory-token", user });
beforeEach(() => {
  document.cookie = "yogoda_authenticated=; path=/; max-age=0";
  localStorage.removeItem("auth");
  useAuthStore.setState({
    accessToken: null,
    user: null,
    revision: 0,
    isReady: false,
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

it("removes legacy tokens and restores only server-verified identity", async () => {
  localStorage.setItem(
    "auth",
    JSON.stringify({
      state: { accessToken: "old-token", user: { role: "admin" } },
    }),
  );
  const fetchMock = vi.fn().mockResolvedValue(success());
  vi.stubGlobal("fetch", fetchMock);
  await initializeAuth();
  expect(localStorage.getItem("auth")).toBeNull();
  expect(useAuthStore.getState().user).toEqual(user);
  expect(useAuthStore.getState().accessToken).toBe("memory-token");
  expect(fetchMock.mock.calls[0][1].credentials).toBe("include");
});

it("shares concurrent refresh requests without writing tokens to storage", async () => {
  const fetchMock = vi.fn().mockResolvedValue(success());
  vi.stubGlobal("fetch", fetchMock);
  await Promise.all([refreshAccessToken(), refreshAccessToken()]);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem("auth")).toBeNull();
});

it("does not revive a session when a refresh finishes after logout", async () => {
  let resolve!: (response: Response) => void;
  vi.stubGlobal(
    "fetch",
    vi.fn(
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    ),
  );
  const pending = refreshAccessToken();
  useAuthStore.getState().clearAuth();
  resolve(success());
  await expect(pending).rejects.toThrow("로그인 상태가 변경");
  expect(useAuthStore.getState().accessToken).toBeNull();
});

it("allows retry after a temporary session restoration failure", async () => {
  document.cookie = "yogoda_authenticated=true; path=/";
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(success()),
  );
  await expect(initializeAuth()).rejects.toThrow("offline");
  expect(useAuthStore.getState().isReady).toBe(false);
  await initializeAuth();
  expect(useAuthStore.getState().isReady).toBe(true);
});

it("clears expired sessions and never trusts the routing cookie", async () => {
  document.cookie = "yogoda_authenticated=true; path=/";
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        Response.json({ message: "Expired" }, { status: 401 }),
      ),
  );
  await initializeAuth();
  expect(useAuthStore.getState().isReady).toBe(true);
  expect(useAuthStore.getState().accessToken).toBeNull();
  expect(document.cookie).not.toContain("yogoda_authenticated=true");
});

it("does not request a session for a first-time guest", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  await initializeAuth();
  expect(fetchMock).not.toHaveBeenCalled();
  expect(useAuthStore.getState().isReady).toBe(true);
});
