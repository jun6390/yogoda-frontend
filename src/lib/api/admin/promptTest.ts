import { useAuthStore } from "@/stores/useAuthStore";

import {
  API_BASE_URL,
  ApiError,
  extractMessage,
  refreshAccessToken,
} from "../client";

interface StreamPromptTestParams {
  promptContent: string;
  message: string;
  previousInteractionId: string | null;
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}

interface StreamPromptTestResult {
  interactionId: string;
}

/*
 * /test는 POST + Authorization 헤더가 필요해서 브라우저 기본 EventSource(GET 전용,
 * 커스텀 헤더 불가)를 못 씀. fetch + ReadableStream을 직접 파싱해서 SSE를 흉내냄
 */
async function openStream(
  accessToken: string | null,
  params: StreamPromptTestParams,
) {
  return fetch(`${API_BASE_URL}/api/admin/prompts/test`, {
    method: "POST",
    credentials: "include",
    signal: params.signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      promptContent: params.promptContent,
      message: params.message,
      previousInteractionId: params.previousInteractionId,
    }),
  });
}

function parseSseBlock(block: string): { event: string; data: string } | null {
  let event = "message";
  let data = "";

  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      data += line.slice(5).trim();
    }
  }

  return data ? { event, data } : null;
}

export async function streamPromptTest(
  params: StreamPromptTestParams,
): Promise<StreamPromptTestResult> {
  let { accessToken } = useAuthStore.getState();

  let response = await openStream(accessToken, params);

  if (response.status === 401) {
    accessToken = await refreshAccessToken();
    response = await openStream(accessToken, params);
  }

  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => null);

    if (response.status === 401) {
      useAuthStore.getState().clearAuth();
    }

    throw new ApiError(
      extractMessage(data) ?? "요청 처리 중 오류가 발생했어요.",
      response.status,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: StreamPromptTestResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const event = parseSseBlock(block);
      if (!event) {
        continue;
      }

      if (event.event === "chunk") {
        const chunk = JSON.parse(event.data) as { text: string };
        params.onChunk(chunk.text);
      } else if (event.event === "done") {
        result = JSON.parse(event.data) as StreamPromptTestResult;
      } else if (event.event === "error") {
        const errorData = JSON.parse(event.data) as { message: string };
        throw new ApiError(errorData.message, response.status);
      }
    }

    /*
     * done 이벤트를 파싱한 시점에 바로 끝내야 함. reader.read()가 done:true를
     * 돌려줄 때(=서버가 커넥션을 실제로 닫을 때)까지 기다리면, 서버가 마지막
     * 프레임을 보낸 뒤 커넥션을 바로 안 끊는 경우 입력창이 몇 초 더 막혀 있음
     */
    if (result) {
      await reader.cancel().catch(() => {});
      break;
    }
  }

  if (!result) {
    throw new ApiError("스트림이 예기치 않게 종료됐어요.", response.status);
  }

  return result;
}
