import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { useAIChat } from "../src/hooks/useAIChat";
import { useAuthStore } from "../src/stores/useAuthStore";
import { useChatHistoryStore } from "../src/stores/chatHistoryStore";
import type { PreselectedPlan } from "../src/types/chat";

const fake = vi.hoisted(() => {
  type Listener = (...args: unknown[]) => void;
  const listeners = new Map<string, Set<Listener>>();
  const socket = {
    connected: true,
    active: true,
    on: vi.fn((event: string, fn: Listener) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(fn);
      return socket;
    }),
    once: vi.fn((event: string, fn: Listener) => {
      const once: Listener = (...args) => {
        socket.off(event, once);
        fn(...args);
      };
      Object.assign(once, { original: fn });
      return socket.on(event, once);
    }),
    off: vi.fn((event: string, fn: Listener) => {
      for (const listener of listeners.get(event) ?? [])
        if (
          listener === fn ||
          (listener as Listener & { original?: Listener }).original === fn
        )
          listeners.get(event)!.delete(listener);
      return socket;
    }),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  const server = (event: string, ...args: unknown[]) => {
    for (const listener of [...(listeners.get(event) ?? [])]) listener(...args);
  };
  return { socket, server, listeners, io: vi.fn(() => socket) };
});
vi.mock("socket.io-client", () => ({ io: fake.io }));
vi.mock("../src/lib/api/client", () => ({
  API_BASE_URL: "http://127.0.0.1:8100",
  isAccessTokenNearExpiry: () => false,
  refreshAccessToken: vi.fn(),
  apiFetch: vi.fn(),
}));
vi.mock("../src/hooks/useAuthHydrated", () => ({
  useAuthHydrated: () => true,
}));

let root: Root;
let container: HTMLDivElement;
let chat: ReturnType<typeof useAIChat>;
function Probe({ plan }: { plan?: PreselectedPlan }) {
  const value = useAIChat({ preselectedPlan: plan });
  useEffect(() => {
    chat = value;
  }, [value]);
  return null;
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.clearAllMocks();
  fake.listeners.clear();
  fake.socket.connected = true;
  fake.socket.active = true;
  sessionStorage.clear();
  useAuthStore.setState({ accessToken: null, user: null });
  useChatHistoryStore.getState().clearMessages();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

it("keeps one socket across a transient disconnect and retries the original turn", async () => {
  await act(async () => root.render(<Probe />));
  await act(async () => chat.sendMessage("Compare plans"));
  const payload = fake.socket.emit.mock.calls.find(
    ([event]) => event === "message",
  )![1];
  await act(async () => {
    fake.socket.connected = false;
    fake.server("disconnect", "transport close");
  });
  const failed = chat.messages.find((message) => message.type === "error")!;
  expect(failed).toBeDefined();
  await act(async () => chat.retryMessage(failed.id));
  expect(fake.io).toHaveBeenCalledTimes(1);
  await act(async () => {
    fake.socket.connected = true;
    fake.server("connect");
  });
  expect(
    fake.socket.emit.mock.calls.filter(([event]) => event === "message"),
  ).toEqual([
    ["message", payload],
    ["message", payload],
  ]);
});

it("retries a silent signup action with its original plan and confirmation payload", async () => {
  const plan = {
    code: "nerget-59",
    name: "Test",
    monthlyFee: 59000,
    recommendedByAI: true,
  };
  await act(async () => root.render(<Probe plan={plan} />));
  await act(async () =>
    chat.sendMessageSilent("Identity confirmed", { identityVerified: true }),
  );
  const payload = fake.socket.emit.mock.calls.find(
    ([event]) => event === "message",
  )![1];
  expect(payload).toMatchObject({
    preselectedPlanCode: plan.code,
    identityVerified: true,
  });
  await act(async () => fake.server("error"));
  const failed = chat.messages.find((message) => message.type === "error")!;
  await act(async () => chat.retryMessage(failed.id));
  expect(
    fake.socket.emit.mock.calls
      .filter(([event]) => event === "message")
      .at(-1)![1],
  ).toEqual(payload);
});

it("does not send a stopped or failed queued turn after reconnect", async () => {
  await act(async () => root.render(<Probe />));
  fake.socket.connected = false;
  await act(async () => chat.sendMessage("Pending"));
  await act(async () => fake.server("connect_error"));
  await act(async () => {
    fake.socket.connected = true;
    fake.server("connect");
  });
  expect(
    fake.socket.emit.mock.calls.filter(([event]) => event === "message"),
  ).toHaveLength(0);
  fake.socket.connected = false;
  await act(async () => chat.sendMessageSilent("Pending action"));
  await act(async () => chat.stopGeneration());
  await act(async () => {
    fake.socket.connected = true;
    fake.server("connect");
  });
  expect(
    fake.socket.emit.mock.calls.filter(([event]) => event === "message"),
  ).toHaveLength(0);
});

it("blocks repeated silent submits and removes pending callbacks on unmount", async () => {
  await act(async () => root.render(<Probe />));
  fake.socket.connected = false;
  await act(async () => {
    chat.sendMessageSilent("Confirm");
    chat.sendMessageSilent("Confirm");
  });
  expect(fake.socket.once).toHaveBeenCalledTimes(1);
  await act(async () => root.render(null));
  fake.socket.connected = true;
  fake.server("connect");
  expect(
    fake.socket.emit.mock.calls.filter(([event]) => event === "message"),
  ).toHaveLength(0);
});
