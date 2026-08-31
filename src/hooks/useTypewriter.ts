import { useCallback, useMemo, useRef } from "react";

type AppendChars = (messageId: string, chars: string) => void;

/**
 * 청크가 한 번에 크게 오더라도 한 글자씩 흘러나오는 것처럼 보이게 하는 타자기 효과.
 * 메시지 id별로 대기 텍스트 큐 & 인터벌을 독립적으로 관리함
 * (지연 없이 실시간으로 응답받는 느낌을 주기 위함).
 */
export function useTypewriter(appendChars: AppendChars) {
  const pendingTextRef = useRef<Record<string, string>>({});
  const timerRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  // 타이핑이 다 끝나기를 기다리는 콜백들 (카드 등 후속 메시지를 늦게 붙이기 위함)
  const drainCallbacksRef = useRef<Record<string, (() => void)[]>>({});

  const runDrainCallbacks = useCallback((messageId: string) => {
    const callbacks = drainCallbacksRef.current[messageId];
    if (!callbacks) return;
    delete drainCallbacksRef.current[messageId];
    callbacks.forEach((cb) => cb());
  }, []);

  // 특정 메시지의 타자기 효과를 중단하고 대기 큐를 비움
  const stop = useCallback((messageId: string) => {
    if (timerRef.current[messageId]) {
      clearInterval(timerRef.current[messageId]);
      delete timerRef.current[messageId];
    }
    delete pendingTextRef.current[messageId];
    delete drainCallbacksRef.current[messageId];
  }, []);

  const stopAll = useCallback(() => {
    Object.values(timerRef.current).forEach(clearInterval);
    timerRef.current = {};
    pendingTextRef.current = {};
    drainCallbacksRef.current = {};
  }, []);

  // 새로 도착한 청크를 대기 큐에 쌓고, 아직 실행 중이 아니면 재생 인터벌을 시작함
  const push = useCallback(
    (messageId: string, chunk: string) => {
      pendingTextRef.current[messageId] =
        (pendingTextRef.current[messageId] || "") + chunk;
      if (timerRef.current[messageId]) return; // 이미 실행 중

      timerRef.current[messageId] = setInterval(() => {
        const pending = pendingTextRef.current[messageId] || "";
        if (!pending) {
          clearInterval(timerRef.current[messageId]);
          delete timerRef.current[messageId];
          runDrainCallbacks(messageId);
          return;
        }

        // 밀린 양이 많으면 한 번에 더 많이 꺼내서 지연이 계속 쌓이지 않도록 함
        const revealCount = Math.max(1, Math.ceil(pending.length / 10));
        pendingTextRef.current[messageId] = pending.slice(revealCount);
        appendChars(messageId, pending.slice(0, revealCount));
      }, 20);
    },
    [appendChars, runDrainCallbacks],
  );

  /**
   * 타자기 효과가 화면에 다 그려질 때까지 기다렸다가 cb를 실행함. 카드처럼 텍스트
   * 말풍선 뒤에 이어붙는 요소가, 서버에서 이벤트가 도착한 시점이 아니라 실제로
   * 타이핑 애니메이션이 눈에 다 보인 시점에 나타나게 하기 위함. 이미 다 그려진
   * 상태(또는 messageId가 없는 경우)라면 즉시 실행함.
   */
  const onDrain = useCallback((messageId: string | null, cb: () => void) => {
    if (!messageId) {
      cb();
      return;
    }
    const stillDrawing = Boolean(
      timerRef.current[messageId] || pendingTextRef.current[messageId],
    );
    if (!stillDrawing) {
      cb();
      return;
    }
    (drainCallbacksRef.current[messageId] ??= []).push(cb);
  }, []);

  return useMemo(
    () => ({ push, stop, stopAll, onDrain }),
    [push, stop, stopAll, onDrain],
  );
}
