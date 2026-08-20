import { useAuthStore } from "@/stores/useAuthStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

interface RefreshResponse {
  accessToken: string;
}

let refreshPromise: Promise<string> | null = null;

function extractMessage(data: unknown): string | null {
  if (data && typeof data === "object" && "message" in data) {
    const { message } = data as { message: unknown };

    return typeof message === "string" ? message : null;
  }

  return null;
}

async function refreshAccessToken(): Promise<string> {
  /*
   * 여러 API 요청에서 동시에 401이 발생하더라도
   * refresh 요청은 한 번만 실행하도록 Promise를 공유함
   */
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = (await response
        .json()
        .catch(() => null)) as RefreshResponse | null;

      if (!response.ok || !data || typeof data.accessToken !== "string") {
        useAuthStore.getState().clearAuth();

        throw new ApiError(
          extractMessage(data) ??
            "로그인이 만료되었어요. 다시 로그인해 주세요.",
          response.status,
        );
      }

      useAuthStore.getState().setAccessToken(data.accessToken);

      return data.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function request(
  path: string,
  accessToken: string | null,
  body: unknown,
  headers: HeadersInit | undefined,
  options: Omit<ApiFetchOptions, "body" | "headers">,
) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function apiFetch<T>(
  path: string,
  { body, headers, ...options }: ApiFetchOptions = {},
): Promise<T> {
  let { accessToken } = useAuthStore.getState();

  let response = await request(path, accessToken, body, headers, options);

  /*
   * access token이 만료됐거나 유효하지 않으면
   * refresh token으로 새 access token을 발급받은 뒤
   * 기존 요청을 한 번만 다시 시도함
   */
  if (response.status === 401) {
    accessToken = await refreshAccessToken();

    response = await request(path, accessToken, body, headers, options);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().clearAuth();
    }

    throw new ApiError(
      extractMessage(data) ?? "요청 처리 중 오류가 발생했어요.",
      response.status,
    );
  }

  return data as T;
}
