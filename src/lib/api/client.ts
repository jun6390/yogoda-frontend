import { useAuthStore } from "@/stores/useAuthStore";

/*
 * 서버 API의 base URL. REST 요청(fetch)은 빈 문자열이어도 상대경로로 정상 동작하지만,
 * socket.io 연결(useAIChat, useNotifications 등)은 origin이 반드시 필요해 빈 값을 넘길 수
 * 없으므로, 소켓을 여는 쪽에서는 이 값이 비어 있을 때 로컬 개발 서버 주소로 대체해서 씀
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

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

export function extractMessage(data: unknown): string | null {
  if (data && typeof data === "object" && "message" in data) {
    const { message } = data as { message: unknown };

    return typeof message === "string" ? message : null;
  }

  return null;
}

/*
 * JWT의 payload만 디코드해 만료 시각(exp)을 확인함. 서명 검증은 하지 않음 —
 * 이 값은 "지금 갱신이 필요한가"만 판단하는 용도라, 위조된 토큰이어도 실제
 * 요청(Authorization 헤더)이 서버에서 거부되므로 보안에 영향이 없음
 */
export function isAccessTokenNearExpiry(
  token: string,
  bufferSeconds = 30,
): boolean {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(base64)) as { exp?: number };

    if (typeof json.exp !== "number") return true;

    return Date.now() >= json.exp * 1000 - bufferSeconds * 1000;
  } catch {
    return true;
  }
}

export async function refreshAccessToken(): Promise<string> {
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

/*
 * accessToken 유무와 무관하게 refreshToken 쿠키로 서버에 세션 유효성을 직접 확인함
 * (스플래시 등에서 로컬 상태만 보고 로그인 여부를 잘못 판단하지 않도록 사용)
 */
export async function verifySession(): Promise<boolean> {
  try {
    await refreshAccessToken();
    return true;
  } catch {
    return false;
  }
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
