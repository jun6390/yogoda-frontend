"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

/*
 * 브라우저 내장 Web Speech API(SpeechRecognition) 타입.
 * 표준 lib.dom.d.ts에 아직 포함되어 있지 않아 필요한 범위만 직접 선언함.
 * (크롬/엣지 등 Chromium 계열은 webkitSpeechRecognition으로 노출됨)
 */
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface UseVoiceInputOptions {
  // 인식이 완료된(최종) 구간마다 호출됨. 이어폰 마이크 등 실시간 중간 결과는 넘기지 않음
  onFinalResult: (text: string) => void;
  lang?: string;
}

/*
 * 브라우저 지원 여부는 마운트 이후에만 정확히 알 수 있는 값이라 useSyncExternalStore로 처리함.
 * - 이 값은 구독해서 변경을 감지할 "외부 스토어"가 실제로 있는 게 아니라 한 번 계산하면
 *   끝인 정적 값이라, subscribe는 아무 것도 하지 않는 no-op으로 둠(구독 해제할 것도 없음)
 * - 서버 스냅샷은 항상 false를 반환해 SSR 결과와 하이드레이션 결과를 일치시키고,
 *   클라이언트 스냅샷에서 실제 지원 여부를 계산해 하이드레이션 직후 다시 렌더링되게 함
 *   (useState lazy initializer로는 서버가 만든 false가 하이드레이션 후에도 그대로
 *   남아있어 지원 브라우저에서도 버튼이 계속 안 보이는 문제가 있었음)
 */
function subscribeNoop() {
  return () => {};
}

function getIsSpeechRecognitionSupported() {
  return !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);
}

function getIsSpeechRecognitionSupportedServer() {
  return false;
}

/**
 * 브라우저 내장 음성 인식(Web Speech API)으로 마이크 입력을 텍스트로 변환하는 훅.
 * 사파리/Firefox는 지원하지 않거나 불안정하므로, isSupported로 지원 여부를 먼저 확인해야 함.
 */
export function useVoiceInput({
  onFinalResult,
  lang = "ko-KR",
}: UseVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const isSupported = useSyncExternalStore(
    subscribeNoop,
    getIsSpeechRecognitionSupported,
    getIsSpeechRecognitionSupportedServer,
  );
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // 인식 중 실시간으로 보여줄 임시(미확정) 텍스트
  const [interimText, setInterimText] = useState("");

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const startListening = useCallback(() => {
    // isSupported가 true일 때만(마이크 버튼이 보일 때만) 호출되므로 항상 존재함이 보장됨
    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalText = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalText) {
        onFinalResult(finalText);
      }
      setInterimText(interim);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setInterimText("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [lang, onFinalResult]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    interimText,
    toggleListening,
  };
}
