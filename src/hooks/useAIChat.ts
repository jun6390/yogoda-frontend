"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { io, Socket } from "socket.io-client";

import { API_BASE_URL } from "@/lib/api/client";
import { endChatSession, getLatestChatSession } from "@/lib/api/chat";
import { clearChatSessionStorage } from "@/lib/chatSessionStorage";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  GUEST_CHAT_LIMIT,
  useChatHistoryStore,
} from "@/stores/chatHistoryStore";
import { usePersonaStore } from "@/stores/personaStore";
import type {
  ChatMessage,
  PreselectedPlan,
  SignupCollectedData,
} from "@/types/chat";

import { useTypewriter } from "./useTypewriter";

// AI 응답이 이 시간(ms) 안에 오지 않으면 에러로 처리
const RESPONSE_TIMEOUT_MS = 30_000;

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  sender: "ai",
  type: "text",
  text: "안녕하세요! 사용자님에게 딱 맞는 베스트 요금제를 추천해 드릴게요. 평소 데이터 사용량이나 선호하시는 혜택(OTT 등)에 대해 편하게 말씀해 주세요!",
};

function createSignupEntryMessage(
  plan: PreselectedPlan,
  userName?: string,
): ChatMessage {
  let benefits: string[] = [];
  try {
    const raw = sessionStorage.getItem("preselectedPlanBenefits");
    if (raw) benefits = JSON.parse(raw) as string[];
  } catch {
    /* noop */
  }

  const benefitPart =
    benefits.length > 0 ? ` **${benefits.join(", ")}** 혜택과 함께` : "";
  const text = userName
    ? `${userName}님, **${plan.name}** 요금제를 선택하셨군요!${benefitPart} 지금 가입을 도와드릴까요?`
    : `**${plan.name}** 요금제에 관심이 있으시군요! 가입을 진행하려면 먼저 로그인이 필요해요. 로그인 후 함께 가입 절차를 진행해보세요.`;

  return {
    id: `signup-entry-${plan.code}-${Date.now()}`,
    sender: "ai",
    type: "text",
    text,
  };
}

function subscribeToAuthHydration(onStoreChange: () => void) {
  const unsubscribeHydrate = useAuthStore.persist.onHydrate(onStoreChange);
  const unsubscribeFinishHydration =
    useAuthStore.persist.onFinishHydration(onStoreChange);

  return () => {
    unsubscribeHydrate();
    unsubscribeFinishHydration();
  };
}

/*
 * accessToken은 zustand persist로 localStorage에서 비동기 복원(hydration)되므로,
 * 새로고침 직후 첫 렌더의 isLoggedIn만 보고 판단하면 항상 비회원으로 오판해
 * 회원의 DB 대화 내역 복원이 실행되지 않음. hydration 완료 여부를 별도로 구독함
 */
function useAuthHydrated() {
  return useSyncExternalStore(
    subscribeToAuthHydration,
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );
}

export interface UseAIChatOptions {
  /** 요금제 둘러보기 페이지에서 바로 가입할 때 넘겨주는 선택된 요금제 정보 */
  preselectedPlan?: PreselectedPlan;
}

/**
 * AI 상담 채팅의 상태와 소켓 통신을 담당하는 훅.
 * - 로그인 여부에 따라 회원은 DB, 비회원은 로컬 스토리지에서 이전 대화를 복원함
 * - 소켓은 페이지 진입 시 미리 연결해두고 메시지 전송 때마다 재연결하지 않아
 *   첫 응답 도달 시간을 단축함
 * - preselectedPlan이 있으면 히스토리 복원 후 정적 안내 메시지를 추가해
 *   가입 플로우를 즉시 시작함
 */
export function useAIChat({ preselectedPlan }: UseAIChatOptions = {}) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = !!accessToken;

  // 소켓 이벤트 핸들러 클로저에서 isLoggedIn 최신 값을 참조하기 위한 ref
  const isLoggedInRef = useRef(isLoggedIn);
  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  // preselectedPlan ref — 소켓 핸들러 클로저에서 최신 값 참조
  const preselectedPlanRef = useRef(preselectedPlan);
  const [isSignupFlowActive, setIsSignupFlowActive] = useState(
    Boolean(preselectedPlan),
  );
  // 현재 진행 중인 가입 플로우의 단계. currentSignupStepRef(아래에서 선언)와 같은 값을
  // 가리키지만, 이 값은 그보다 앞서 선언돼야 해서 별도 ref로 분리함 — 아래
  // currentSignupStepRef sync 이펙트에서 함께 갱신됨
  const activeSignupStepRef = useRef<string | null>(null);
  // 다른 요금제로 가입 중간에 새 요금제 가입하기를 눌러, 기존 진행을 중단할지 확인이
  // 필요한 상태. 확인/취소 전까지는 preselectedPlanRef를 기존 요금제로 유지함
  const [pendingPlanSwitch, setPendingPlanSwitch] = useState<
    { from: PreselectedPlan; to: PreselectedPlan } | undefined
  >(undefined);
  useEffect(() => {
    const previousPlan = preselectedPlanRef.current;

    // 이미 다른 요금제로 가입이 진행 중인데(단계가 시작됨) 새 요금제 가입하기를 눌러
    // preselectedPlan이 바뀐 경우: 조용히 덮어쓰지 않고 먼저 전환 확인부터 받음
    if (
      preselectedPlan &&
      previousPlan &&
      previousPlan.code !== preselectedPlan.code &&
      activeSignupStepRef.current
    ) {
      setPendingPlanSwitch({ from: previousPlan, to: preselectedPlan });
      return;
    }

    preselectedPlanRef.current = preselectedPlan;
    setIsSignupFlowActive(Boolean(preselectedPlan));
  }, [preselectedPlan]);

  // 가입 플로우 시작 시 웰컴 메시지 없이 빈 상태로 시작하고, AI 첫 메시지를 기다림
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  // 답변 텍스트 스트리밍은 끝났지만, 카드/퀵답변처럼 뒤에 더 올 수 있는 내용을
  // 기다리는 중임을 명시적으로 보여주기 위한 상태 ("loading_extra" 이벤트로 켜짐)
  const [isLoadingExtra, setIsLoadingExtra] = useState(false);
  // 백엔드가 AI 호출 전에 emit하는 문맥별 로딩 문구
  const [thinkingMessage, setThinkingMessage] = useState<string | null>(null);
  // 이전 대화 내역을 불러오는 동안 스켈레톤 UI를 표시하기 위한 상태
  const [isRestoringHistory, setIsRestoringHistory] = useState(true);
  // 초기값은 항상 0으로 시작(SSR-세이프)하고, 마운트 후 useEffect에서
  // localStorage에 저장된 실제 값으로 동기화함
  const [guestChatCount, setGuestChatCount] = useState(0);
  // 비회원이 무료 상담 횟수를 모두 소진한 직후 로그인 유도 팝업을 띄우기 위한 상태
  const [showGuestLimitModal, setShowGuestLimitModal] = useState(false);
  // AI의 질문에 바로 탭해서 답할 수 있는 빠른 답변 후보. 다음 메시지를 보내면 비워짐
  const [quickReplies, setQuickReplies] = useState<string[]>([]);

  // quickReplies가 바뀌면 일반 채팅 한정으로 sessionStorage에 저장 (새로고침 복원용)
  // 빈 배열이 되면 키를 제거해 "사용자가 이미 답변했음"을 표시
  // 복원(init) 완료 전에는 실행하지 않음 — 새로고침 직후 quickReplies가 아직
  // 빈 배열인 첫 렌더에서 이 이펙트가 먼저 돌면, init()이 sessionStorage에서
  // 읽어오기도 전에 저장해둔 값을 지워버리는 경합이 있었음
  useEffect(() => {
    if (isRestoringHistory) return;
    try {
      if (preselectedPlanRef.current) {
        // 가입 플로우 퀵답변: signupQuickReplies 키로 분리 저장
        if (quickReplies.length === 0) {
          sessionStorage.removeItem("signupQuickReplies");
          return;
        }
        sessionStorage.setItem(
          "signupQuickReplies",
          JSON.stringify(quickReplies),
        );
      } else {
        if (quickReplies.length === 0) {
          sessionStorage.removeItem("chatQuickReplies");
          return;
        }
        sessionStorage.setItem(
          "chatQuickReplies",
          JSON.stringify(quickReplies),
        );
      }
    } catch {
      /* noop */
    }
  }, [quickReplies, isRestoringHistory]);
  // 가입 플로우 진행 중 수집된 데이터 (단계별 카드 렌더링에 사용)
  const [signupCollectedData, setSignupCollectedData] =
    useState<SignupCollectedData>({});
  // 최신 signupCollectedData를 동기적으로 참조하기 위한 ref
  // (socket 이벤트 핸들러 내 functional setState 내부에서 setMessages 중첩 호출 시
  //  React StrictMode가 updater를 2회 실행해 카드가 중복 삽입되는 문제를 방지)
  const signupCollectedDataRef = useRef<SignupCollectedData>({});
  // 가입 완료 여부
  const [isSignupComplete, setIsSignupComplete] = useState(false);
  // 현재 가입 단계 (terms_agreement 등에서 입력창 비활성화에 사용)
  const [currentSignupStep, setCurrentSignupStep] = useState<string | null>(
    null,
  );
  // 소켓 핸들러 클로저에서 최신 currentSignupStep을 참조하기 위한 ref.
  // "signup" 이벤트가 같은 단계를 반복해서 보내도(예: 약관 동의 중 다른 질문을
  // 하는 경우) 카드를 중복으로 추가하지 않기 위해 직전 단계와 비교하는 용도
  const currentSignupStepRef = useRef(currentSignupStep);
  useEffect(() => {
    currentSignupStepRef.current = currentSignupStep;
    activeSignupStepRef.current = currentSignupStep;
  }, [currentSignupStep]);

  useEffect(() => {
    if (!preselectedPlan) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 새 요금제 가입을 시작하면 이전 완료 상태를 해제함
    setIsSignupComplete(false);
  }, [preselectedPlan]);

  // signupCollectedData 변경 시 ref 동기화 및 sessionStorage 저장 (새로고침 복원용)
  useEffect(() => {
    signupCollectedDataRef.current = signupCollectedData;
    if (!preselectedPlanRef.current) return;
    try {
      sessionStorage.setItem(
        "signupCollectedData",
        JSON.stringify(signupCollectedData),
      );
    } catch {
      /* noop */
    }
  }, [signupCollectedData]);

  // currentSignupStep 변경 시 sessionStorage에 저장 (새로고침 복원용)
  useEffect(() => {
    if (!preselectedPlanRef.current) return;
    try {
      if (currentSignupStep) {
        sessionStorage.setItem("signupStep", currentSignupStep);
      } else {
        sessionStorage.removeItem("signupStep");
      }
    } catch {
      /* noop */
    }
  }, [currentSignupStep]);

  const socketRef = useRef<Socket | null>(null);
  // 응답 타임아웃 타이머 (30초 안에 done이 안 오면 에러 처리)
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearResponseTimeout = useCallback(() => {
    if (responseTimeoutRef.current !== null) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
  }, []);
  // 대화가 이어질 채팅 세션 id. 소켓 연결 시 auth로 실어 보내면 서버가 같은 세션으로 이어감
  const sessionIdRef = useRef<string | null>(null);
  // 대화 내역 복원(init)이 이미 시작됐는지 추적. 개발 모드 등에서 마운트 effect가
  // 중복 실행되어도 복원은 한 번만 일어나야 함
  const initStartedRef = useRef(false);
  // 현재 수신 중인 AI 응답의 메시지 id. 소켓 이벤트 핸들러에서 어느 말풍선에 쓸지 식별함
  const currentAiMsgIdRef = useRef<string | null>(null);
  // 가입 인삿말을 DB에 저장하는 signup_entry 이벤트를 이미 보낸 요금제 code.
  // boolean이 아니라 code로 추적해야, 한 번 가입 플로우를 탄 뒤 다른 요금제로
  // 다시 진입해도 인삿말이 정상적으로 다시 나옴 (마운트 시 DB 복원 결과로도 세팅됨)
  const signupEntrySentRef = useRef<string | null>(null);
  const isAuthHydrated = useAuthHydrated();

  const appendChars = useCallback((messageId: string, chars: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, text: (msg.text || "") + chars } : msg,
      ),
    );
  }, []);
  const typewriter = useTypewriter(appendChars);

  /*
   * 소켓을 열고 영구 이벤트 핸들러를 등록함.
   * 메시지 전송마다 새로 연결하지 않고 한 번 맺은 연결을 재사용해
   * 핸드셰이크 대기 시간을 제거함
   */

  const openSocket = useCallback(() => {
    if (socketRef.current) return; // 연결 중(connecting)인 소켓도 재사용 — connected 체크만 하면 두 번째 호출 시 중복 소켓이 생성됨

    const apiBase = API_BASE_URL || "http://localhost:8000";
    const { accessToken: token } = useAuthStore.getState();

    const socket = io(`${apiBase}/chat`, {
      transports: ["websocket"],
      auth: {
        token: token ?? undefined,
        sessionId: sessionIdRef.current ?? undefined,
      },
    });
    socketRef.current = socket;

    socket.on(
      "session_created",
      (data: { sessionId: string; promptVersion: string }) => {
        console.log("[AI 채팅] 적용된 프롬프트 버전:", data.promptVersion);
        sessionIdRef.current = data.sessionId;
        if (!isLoggedInRef.current) {
          useChatHistoryStore.getState().setSessionId(data.sessionId);
        }
      },
    );

    socket.on("chunk", (data: string) => {
      if (!currentAiMsgIdRef.current) return;
      // 서버가 정상적으로 응답을 시작했다면 최초 응답 대기 타임아웃은 종료합니다.
      // 가입 완료 후속 DB 처리 중 30초를 넘겨 이미 받은 응답을 오류로 바꾸지 않습니다.
      clearResponseTimeout();
      setIsTyping(false);
      typewriter.push(currentAiMsgIdRef.current, data);
    });

    // 답변 텍스트 스트리밍은 끝났지만, 카드/퀵답변처럼 뒤에 더 올 수 있는 내용을
    // 서버가 준비 중임을 알려줌. plans/signup/quickReplies/done/error 중 먼저
    // 도착하는 이벤트에서 꺼짐
    socket.on("loading_extra", () => {
      setIsLoadingExtra(true);
    });

    socket.on("plans", (data: ChatMessage["plans"]) => {
      setIsLoadingExtra(false);
      const aiMsgId = currentAiMsgIdRef.current;
      if (!aiMsgId) return;
      // 타이핑 애니메이션이 화면에 다 그려진 뒤에 카드를 붙임
      typewriter.onDrain(aiMsgId, () => {
        setMessages((prev) => [
          ...prev,
          {
            id: `${aiMsgId}-plans`,
            sender: "ai",
            type: "plans",
            plans: data,
          },
        ]);
      });
    });

    socket.on("quickReplies", (data: string[]) => {
      setIsLoadingExtra(false);
      typewriter.onDrain(currentAiMsgIdRef.current, () => {
        setQuickReplies(data);
      });
    });

    /*
     * 가입 플로우 단계 이벤트.
     * 각 단계에서 적절한 카드 타입으로 메시지를 추가함.
     */
    socket.on(
      "signup",
      (data: { signupStep: string; signupData: SignupCollectedData }) => {
        const { signupStep, signupData } = data;
        setIsLoadingExtra(false);
        // 같은 단계가 반복해서 와도(예: 약관 동의 중 다른 질문을 하는 경우)
        // 카드를 중복으로 추가하지 않도록, 갱신 전의 이전 단계와 비교함
        const isNewStep = signupStep !== currentSignupStepRef.current;
        setCurrentSignupStep(signupStep);

        // 누적된 수집 데이터 갱신
        setSignupCollectedData((prev) => ({ ...prev, ...signupData }));

        const aiMsgId = currentAiMsgIdRef.current;

        // 단계별 특수 카드 삽입. 타이핑 애니메이션이 화면에 다 그려진 뒤에 붙임
        if (!isNewStep) {
          return;
        }
        if (signupStep === "fraud_warning") {
          typewriter.onDrain(aiMsgId, () => {
            setMessages((prev) => [
              ...prev,
              {
                id: `${aiMsgId ?? Date.now()}-fraud`,
                sender: "ai",
                type: "fraud_warning",
                signupStep: "fraud_warning",
                signupData,
              },
            ]);
          });
        } else if (signupStep === "terms_agreement") {
          typewriter.onDrain(aiMsgId, () => {
            setMessages((prev) => [
              ...prev,
              {
                id: `${aiMsgId ?? Date.now()}-terms`,
                sender: "ai",
                type: "terms",
                signupStep: "terms_agreement",
                signupData,
              },
            ]);
          });
        } else if (signupStep === "identity_verification") {
          typewriter.onDrain(aiMsgId, () => {
            setMessages((prev) => [
              ...prev,
              {
                id: `${aiMsgId ?? Date.now()}-idverify`,
                sender: "ai",
                type: "identity_verification",
                signupStep: "identity_verification",
                signupData,
              },
            ]);
          });
        } else if (signupStep === "final_confirm") {
          // ref(최신 누적 상태)와 현재 턴 signupData를 머지
          // nested setState를 쓰면 React StrictMode에서 updater가 2회 호출돼
          // setMessages도 2회 실행되므로, ref를 통해 분리 호출함
          const merged = { ...signupCollectedDataRef.current, ...signupData };
          setSignupCollectedData(merged);
          typewriter.onDrain(aiMsgId, () => {
            setMessages((prevMsgs) => [
              ...prevMsgs,
              {
                id: `${aiMsgId ?? Date.now()}-summary`,
                sender: "ai" as const,
                type: "signup_summary" as const,
                signupStep: "final_confirm",
                signupData: merged,
                preselectedPlan: preselectedPlanRef.current,
              },
            ]);
          });
        }
      },
    );

    /*
     * 가입 완료 이벤트.
     */
    socket.on(
      "signup_complete",
      (data: { planCode: string; planName: string }) => {
        clearResponseTimeout();
        setIsLoadingExtra(false);
        const pendingMessageId = currentAiMsgIdRef.current;
        if (pendingMessageId) {
          typewriter.stop(pendingMessageId);
          setMessages((prev) =>
            prev.filter(
              (message) =>
                message.id !== pendingMessageId || Boolean(message.text),
            ),
          );
          currentAiMsgIdRef.current = null;
        }
        setIsTyping(false);
        setThinkingMessage(null);
        setIsSignupComplete(true);
        const completedPlan = preselectedPlanRef.current ?? {
          code: data.planCode,
          name: data.planName,
          monthlyFee: 0,
        };
        preselectedPlanRef.current = undefined;
        // 재가입 시 같은 요금제라도 인삿말이 다시 나오도록 초기화
        signupEntrySentRef.current = null;
        setIsSignupFlowActive(false);
        setCurrentSignupStep(null);
        setSignupCollectedData({});
        setQuickReplies([]);
        clearChatSessionStorage();
        setMessages((prev) => [
          ...prev,
          {
            id: `signup-complete-${Date.now()}`,
            sender: "ai",
            type: "signup_complete",
            signupStep: "completed",
            preselectedPlan: completedPlan,
          },
        ]);
      },
    );

    socket.on("thinking", (msg: string) => {
      setThinkingMessage(msg);
    });

    socket.on("done", () => {
      clearResponseTimeout();
      currentAiMsgIdRef.current = null;
      setIsTyping(false);
      setIsLoadingExtra(false);
      setThinkingMessage(null);
      // 소켓은 유지해서 다음 메시지도 핸드셰이크 없이 바로 보낼 수 있게 함
    });

    socket.on("error", () => {
      clearResponseTimeout();
      setIsLoadingExtra(false);
      const aiMsgId = currentAiMsgIdRef.current;
      if (aiMsgId) {
        typewriter.stop(aiMsgId);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId ? { ...msg, type: "error" } : msg,
          ),
        );
        currentAiMsgIdRef.current = null;
      }
      setIsTyping(false);
      setQuickReplies([]);
    });

    socket.on("connect_error", () => {
      clearResponseTimeout();
      setIsLoadingExtra(false);
      const aiMsgId = currentAiMsgIdRef.current;
      if (aiMsgId) {
        typewriter.stop(aiMsgId);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId ? { ...msg, type: "error" } : msg,
          ),
        );
        currentAiMsgIdRef.current = null;
      }
      setIsTyping(false);
      setQuickReplies([]);
    });

    socket.on("disconnect", () => {
      setIsTyping(false);
      socketRef.current = null;
    });
  }, [typewriter, clearResponseTimeout]);

  // 마운트 시 이전 대화 내역 복원 후 소켓 미리 연결
  // accessToken의 hydration이 끝나기 전까지는 로그인 여부를 신뢰할 수 없으므로 대기함
  useEffect(() => {
    if (!isAuthHydrated) return;
    // 개발 모드 등에서 이 effect가 중복 실행되더라도 복원(getLatestChatSession)은
    // 딱 한 번만 일어나야 함. 두 번째 호출이 늦게 응답하면, 그사이 추가된 메시지
    // (가입 인삿말 등)를 덮어써버리는 문제가 있었음
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    async function init() {
      setIsRestoringHistory(true);

      // init() 실행 시점에 preselectedPlanRef.current는 아직 null일 수 있으므로
      // sessionStorage를 직접 읽어 가입 플로우 여부를 판단함
      let signupPlanOnLoad: PreselectedPlan | undefined;
      try {
        const storedPlan = sessionStorage.getItem("preselectedPlan");
        if (storedPlan) {
          signupPlanOnLoad = JSON.parse(storedPlan) as PreselectedPlan;
        }
      } catch {
        /* noop */
      }
      const isSignupFlowOnLoad = Boolean(signupPlanOnLoad);

      if (isLoggedIn) {
        try {
          const { session, messages: dbMessages } =
            await getLatestChatSession();

          // 가입 플로우도 기존 상담의 연장이므로 최초 진입과 재진입 모두 같은
          // DB 세션을 복원하고, 선택한 요금제 안내를 그 뒤에 이어 붙입니다.
          if (session && !session.endedAt && dbMessages.length > 0) {
            sessionIdRef.current = session.id;
            // 같은 요금제의 가입 인삿말이 이미 DB에 저장되어 있다면(=재진입),
            // signup_entry를 다시 저장하지 않도록 표시해둠. 세션 안에 다른
            // 요금제로 시도했던 signup_entry가 섞여 있을 수 있으므로 planCode까지 비교함
            if (
              signupPlanOnLoad &&
              dbMessages.some(
                (m) =>
                  m.messageType === "signup_entry" &&
                  m.signupData?.planCode === signupPlanOnLoad.code,
              )
            ) {
              signupEntrySentRef.current = signupPlanOnLoad.code;
            }
            setMessages([
              WELCOME_MESSAGE,
              ...dbMessages.flatMap((m) => {
                // 카드 타입 메시지 — 텍스트 없이 카드만 렌더링
                if (m.messageType === "fraud_warning") {
                  return [
                    {
                      id: m.id,
                      sender: "ai" as const,
                      type: "fraud_warning" as const,
                      signupStep: "fraud_warning",
                      signupData: {},
                    },
                  ] satisfies ChatMessage[];
                }
                if (m.messageType === "terms") {
                  return [
                    {
                      id: m.id,
                      sender: "ai" as const,
                      type: "terms" as const,
                      signupStep: "terms_agreement",
                      signupData: {},
                    },
                  ] satisfies ChatMessage[];
                }
                if (m.messageType === "identity_verification") {
                  return [
                    {
                      id: m.id,
                      sender: "ai" as const,
                      type: "identity_verification" as const,
                      signupStep: "identity_verification",
                      signupData: {},
                    },
                  ] satisfies ChatMessage[];
                }
                if (m.messageType === "signup_summary") {
                  return [
                    {
                      id: m.id,
                      sender: "ai" as const,
                      type: "signup_summary" as const,
                      signupStep: "final_confirm",
                      signupData:
                        (m.signupData as import("@/types/chat").SignupCollectedData) ??
                        {},
                      preselectedPlan: m.preselectedPlan as
                        import("@/types/chat").PreselectedPlan | undefined,
                    },
                  ] satisfies ChatMessage[];
                }
                if (m.messageType === "signup_complete") {
                  return [
                    {
                      id: m.id,
                      sender: "ai" as const,
                      type: "signup_complete" as const,
                      signupStep: "completed" as const,
                      preselectedPlan: m.preselectedPlan as
                        import("@/types/chat").PreselectedPlan | undefined,
                    },
                  ] satisfies ChatMessage[];
                }

                const textMsg: ChatMessage = {
                  id: m.id,
                  sender: m.role === "user" ? "user" : "ai",
                  type: "text",
                  text: m.content,
                };

                // 요금제 추천 카드가 저장된 메시지는, 실시간 대화 때와 동일하게
                // 텍스트 말풍선 뒤에 카드 메시지를 이어붙여 함께 복원함
                if (m.plans && m.plans.length > 0) {
                  const plansMsg: ChatMessage = {
                    id: `${m.id}-plans`,
                    sender: "ai",
                    type: "plans",
                    plans: m.plans,
                  };
                  return [textMsg, plansMsg];
                }

                return [textMsg];
              }),
            ]);
          }
        } catch (err) {
          console.error("채팅 내역 조회 실패:", err);
        }
      } else {
        const stored = useChatHistoryStore.getState();
        sessionIdRef.current = stored.sessionId;
        setGuestChatCount(stored.guestChatCount);
        if (stored.messages.length > 0) {
          setMessages(stored.messages);
        }
      }

      // 가입 단계 정보는 최초 진입 여부와 관계없이 복원합니다. DB 메시지와 함께
      // 현재 카드의 입력 상태 및 빠른 응답까지 유지되어야 하기 때문입니다.
      if (isSignupFlowOnLoad) {
        try {
          const savedStep = sessionStorage.getItem("signupStep");
          const savedDataRaw = sessionStorage.getItem("signupCollectedData");
          const savedRepliesRaw = sessionStorage.getItem("signupQuickReplies");
          if (savedStep) setCurrentSignupStep(savedStep);
          if (savedDataRaw) {
            setSignupCollectedData(
              JSON.parse(
                savedDataRaw,
              ) as import("@/types/chat").SignupCollectedData,
            );
          }
          if (savedRepliesRaw) {
            setQuickReplies(JSON.parse(savedRepliesRaw) as string[]);
          }
        } catch {
          /* noop */
        }
      }

      // 일반 채팅: 새로고침 전 마지막 퀵 응답 복원
      if (!isSignupFlowOnLoad) {
        try {
          const savedReplies = sessionStorage.getItem("chatQuickReplies");
          if (savedReplies) {
            setQuickReplies(JSON.parse(savedReplies) as string[]);
          }
        } catch {
          /* noop */
        }
      }

      setIsRestoringHistory(false);

      // 대화 내역 복원 후 소켓을 미리 연결해 첫 메시지 응답 속도를 개선함
      openSocket();
    }

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 복원 및 소켓 연결은 hydration 완료 후 한 번만 실행하면 되므로 isLoggedIn, openSocket 변경 시 재실행은 의도적으로 제외함
  }, [isAuthHydrated]);

  // 비회원의 대화 내역을 로컬 스토리지에 동기화 (타자기 효과로 인한 잦은 쓰기를 막기 위해 디바운스)
  useEffect(() => {
    if (isLoggedIn) return;
    if (preselectedPlan) return; // 가입 플로우는 로컬 스토리지에 저장하지 않음

    const timer = setTimeout(() => {
      useChatHistoryStore.getState().setMessages(messages);
    }, 300);

    return () => clearTimeout(timer);
  }, [messages, isLoggedIn, preselectedPlan]);

  // 언마운트 시 소켓/타자기/타임아웃 리소스 정리
  useEffect(() => {
    return () => {
      clearResponseTimeout();
      socketRef.current?.disconnect();
      typewriter.stopAll();
    };
  }, [typewriter, clearResponseTimeout]);

  /*
   * 소켓이 연결돼 있으면 바로 emit하고, 끊겨 있으면 재연결 후 emit함.
   * 페이지 진입 시 미리 연결해두므로 대부분의 경우 대기 없이 바로 전송됨
   */

  const emitMessage = useCallback(
    (text: string, extraPayload?: Record<string, unknown>) => {
      const persona = usePersonaStore.getState();
      const payload = {
        message: text,
        surveyContext: {
          answers: persona.answers,
          analysisResult: persona.analysisResult,
          isSkipped: persona.isSkipped,
        },
        ...extraPayload,
      };

      if (socketRef.current?.connected) {
        socketRef.current.emit("message", payload);
      } else {
        openSocket();
        socketRef.current?.once("connect", () => {
          socketRef.current?.emit("message", payload);
        });
      }
    },
    [openSocket],
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      // 이미 응답을 기다리는 중이면(Enter 키 등으로 폼이 다시 제출된 경우 대비)
      // 새 메시지를 보내지 않음. currentAiMsgIdRef는 state보다 항상 최신값을
      // 즉시 반영하므로 isTyping state를 의존성에 추가하지 않고도 안전하게 확인 가능
      if (currentAiMsgIdRef.current) return;

      // 비회원이 무료 상담 횟수(GUEST_CHAT_LIMIT)를 이미 다 썼다면, 메시지를
      // 보내지 않고(소켓 emit도 하지 않고) 로그인 유도 팝업만 다시 띄움
      if (!isLoggedIn && guestChatCount >= GUEST_CHAT_LIMIT) {
        setShowGuestLimitModal(true);
        return;
      }

      const userMsgId = Date.now().toString();
      const aiMsgId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, sender: "user", type: "text", text },
        { id: aiMsgId, sender: "ai", type: "text", text: "" },
      ]);
      setIsTyping(true);
      setQuickReplies([]);
      currentAiMsgIdRef.current = aiMsgId;

      if (!isLoggedIn) {
        // 한도를 채우는 이번 메시지도 AI 응답은 정상적으로 받아야 하므로, 카운트만
        // 올려두고 팝업은 다음 메시지 전송을 시도할 때 함수 상단 가드에서 띄움
        useChatHistoryStore.getState().incrementGuestChatCount();
        setGuestChatCount((prev) => prev + 1);
      }

      // 가입 플로우 중이면 preselectedPlanCode와 signupCollectedData를 함께 전송
      const extra: Record<string, unknown> = {};
      if (preselectedPlanRef.current) {
        extra.preselectedPlanCode = preselectedPlanRef.current.code;
        extra.signupCollectedData = signupCollectedData;
        extra.currentSignupStep = currentSignupStepRef.current;
      }

      // 30초 안에 done이 안 오면 에러 처리
      clearResponseTimeout();
      responseTimeoutRef.current = setTimeout(() => {
        const timedOutMsgId = currentAiMsgIdRef.current;
        if (timedOutMsgId) {
          typewriter.stop(timedOutMsgId);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === timedOutMsgId ? { ...msg, type: "error" } : msg,
            ),
          );
          currentAiMsgIdRef.current = null;
        }
        setIsTyping(false);
        setIsLoadingExtra(false);
        setQuickReplies([]);
      }, RESPONSE_TIMEOUT_MS);

      emitMessage(text, Object.keys(extra).length > 0 ? extra : undefined);
    },
    [
      isLoggedIn,
      guestChatCount,
      emitMessage,
      signupCollectedData,
      clearResponseTimeout,
      typewriter,
    ],
  );

  /**
   * 유저 말풍선 없이 소켓으로만 메시지를 emit함. (약관 동의 등 UI 버튼으로 진행할 때 사용)
   */

  const sendMessageSilent = useCallback(
    (text: string, extraPayload?: Record<string, unknown>) => {
      if (!text.trim()) return;
      const aiMsgId = Date.now().toString();
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, sender: "ai", type: "text", text: "" },
      ]);
      setIsTyping(true);
      setQuickReplies([]);
      currentAiMsgIdRef.current = aiMsgId;

      const extra: Record<string, unknown> = { ...extraPayload };
      if (preselectedPlanRef.current) {
        extra.preselectedPlanCode = preselectedPlanRef.current.code;
        extra.signupCollectedData = signupCollectedData;
        extra.currentSignupStep = currentSignupStepRef.current;
      }
      // 30초 안에 done이 안 오면 에러 처리
      clearResponseTimeout();
      responseTimeoutRef.current = setTimeout(() => {
        const timedOutMsgId = currentAiMsgIdRef.current;
        if (timedOutMsgId) {
          typewriter.stop(timedOutMsgId);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === timedOutMsgId ? { ...msg, type: "error" } : msg,
            ),
          );
          currentAiMsgIdRef.current = null;
        }
        setIsTyping(false);
        setIsLoadingExtra(false);
        setQuickReplies([]);
      }, RESPONSE_TIMEOUT_MS);

      emitMessage(text, Object.keys(extra).length > 0 ? extra : undefined);
    },
    [emitMessage, signupCollectedData, clearResponseTimeout, typewriter],
  );

  // 요금제 상세에서 AI 가입/변경을 선택하면 가입 인삿말("OO님, OO 요금제를
  // 선택하셨군요! 지금 가입을 도와드릴까요?")을 보여주고 진행 확인 퀵답변을
  // 띄웁니다. 예전에는 500ms 뒤 자동으로 다음 단계까지 넘어갔지만, 이제는
  // 사용자가 실제로 답장(퀵답변 클릭 포함)을 보내야만 다음 단계로 진행합니다.
  useEffect(() => {
    if (
      !preselectedPlan ||
      !isLoggedIn ||
      isRestoringHistory ||
      currentSignupStep ||
      isSignupComplete
    ) {
      return;
    }

    // 같은 요금제로 인삿말이 이미 있다면(DB 복원 포함) 다시 추가하지 않고,
    // 새로고침으로 초기화된 진행 확인 퀵답변만 다시 보여줌
    if (signupEntrySentRef.current === preselectedPlan.code) {
      setQuickReplies((prev) => (prev.length > 0 ? prev : ["네, 진행할게요"]));
      return;
    }
    signupEntrySentRef.current = preselectedPlan.code;

    const entryMessage = createSignupEntryMessage(preselectedPlan, user?.name);
    setMessages((prev) => [...prev, entryMessage]);
    setQuickReplies(["네, 진행할게요"]);

    // 화면에 보여준 인삿말을 그대로 DB에도 저장해, 새로고침해도 실제 대화
    // 내역에서 자연스럽게 복원되도록 함 (LLM 호출 없이 텍스트만 기록)
    const persistEntry = () =>
      socketRef.current?.emit("signup_entry", {
        text: entryMessage.text,
        planCode: preselectedPlan.code,
      });
    openSocket();
    if (socketRef.current?.connected) {
      persistEntry();
    } else {
      socketRef.current?.once("connect", persistEntry);
    }
    // preselectedPlan 객체(code) 자체가 바뀔 때만 실행하면 되므로 user는 의도적으로 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    preselectedPlan,
    isLoggedIn,
    isRestoringHistory,
    currentSignupStep,
    isSignupComplete,
    openSocket,
  ]);

  const closeGuestLimitModal = useCallback(() => {
    setShowGuestLimitModal(false);
  }, []);

  /*
   * 가입 플로우 진행 중 다른 요금제로 새로 가입하기를 눌러 전환 확인이 뜬 경우.
   * confirmPlanSwitch: 기존 요금제 가입 진행 상태를 모두 초기화하고 새 요금제로 시작함.
   * (요금제 상세 페이지의 "AI와 가입하기" 버튼이 sessionStorage의 signupStep/
   * signupCollectedData 등은 이미 지워둔 상태라, 여기서는 이 훅이 들고 있는 메모리상
   * state만 초기화하면 됨 — 아래 entry effect가 이어서 새 요금제 인삿말을 붙여줌)
   * cancelPlanSwitch: 아무것도 바꾸지 않고 확인만 닫음 — preselectedPlanRef가 여전히
   * 기존 요금제를 가리키고 있어 진행 중이던 흐름이 그대로 이어짐
   */
  const confirmPlanSwitch = useCallback(() => {
    if (!pendingPlanSwitch) return;
    preselectedPlanRef.current = pendingPlanSwitch.to;
    signupEntrySentRef.current = null;
    setIsSignupComplete(false);
    setCurrentSignupStep(null);
    setSignupCollectedData({});
    setQuickReplies([]);
    setIsSignupFlowActive(true);
    setPendingPlanSwitch(undefined);
  }, [pendingPlanSwitch]);

  const cancelPlanSwitch = useCallback(() => {
    setPendingPlanSwitch(undefined);
  }, []);

  /*
   * 회원이 "채팅 끝내기"를 누르면 현재 세션을 서버에 종료 처리하고(대화 내역은 삭제하지 않음),
   * 화면을 웰컴 메시지로 초기화함. 소켓을 재연결해 새 세션으로 이어갈 준비를 함
   */

  const endCurrentChat = useCallback(async () => {
    if (!isLoggedIn) return;

    if (sessionIdRef.current) {
      try {
        await endChatSession(sessionIdRef.current);
      } catch (err) {
        console.error("채팅 종료 실패:", err);
        return;
      }
    }

    // sessionId를 비워야 다음 소켓 연결 시 서버가 새 세션을 발급함
    sessionIdRef.current = null;
    socketRef.current?.disconnect();
    socketRef.current = null;
    openSocket();

    preselectedPlanRef.current = undefined;
    signupEntrySentRef.current = null;
    setIsSignupFlowActive(false);
    setCurrentSignupStep(null);
    setSignupCollectedData({});
    clearChatSessionStorage();

    setMessages([WELCOME_MESSAGE]);
    setQuickReplies([]);
  }, [isLoggedIn, openSocket]);

  // sessionIdRef는 마지막으로 "성공"한 응답 기준으로만 갱신되므로, 실패한 턴을 다시 보내도
  // 자동으로 그 직전까지의 대화에 이어붙게 됨 (별도로 히스토리를 잘라낼 필요 없음)

  const retryMessage = useCallback(
    (failedAiMsgId: string) => {
      const failedIdx = messages.findIndex((m) => m.id === failedAiMsgId);
      if (failedIdx <= 0) return;

      const userMsg = messages[failedIdx - 1];
      if (!userMsg?.text) return;

      typewriter.stop(failedAiMsgId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === failedAiMsgId ? { ...msg, type: "text", text: "" } : msg,
        ),
      );
      setIsTyping(true);
      setQuickReplies([]);
      currentAiMsgIdRef.current = failedAiMsgId;

      // 30초 안에 done이 안 오면 에러 처리
      clearResponseTimeout();
      responseTimeoutRef.current = setTimeout(() => {
        const timedOutMsgId = currentAiMsgIdRef.current;
        if (timedOutMsgId) {
          typewriter.stop(timedOutMsgId);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === timedOutMsgId ? { ...msg, type: "error" } : msg,
            ),
          );
          currentAiMsgIdRef.current = null;
        }
        setIsTyping(false);
        setIsLoadingExtra(false);
        setQuickReplies([]);
      }, RESPONSE_TIMEOUT_MS);

      emitMessage(userMsg.text);
    },
    [messages, emitMessage, typewriter, clearResponseTimeout],
  );

  /**
   * "정지" 버튼 클릭 시 호출됨. 서버에는 stop 이벤트를 보내 해당 요청의 남은 emit과
   * DB 저장을 건너뛰게 함. 클라이언트에서는 사용자 말풍선과 AI가 그때까지 받은
   * 텍스트를 채팅에 그대로 남기고(빈 말풍선이었다면 그것만 지움), 재전송하기 쉽도록
   * 사용자가 보냈던 텍스트를 입력창에 되돌릴 수 있게 반환함. (sendMessageSilent로
   * 시작된 요청처럼 유저 말풍선이 없었다면 undefined를 반환함)
   */
  const stopGeneration = useCallback((): string | undefined => {
    const aiMsgId = currentAiMsgIdRef.current;
    if (!aiMsgId) return undefined;

    clearResponseTimeout();
    typewriter.stop(aiMsgId);
    currentAiMsgIdRef.current = null;
    socketRef.current?.emit("stop");

    // 사용자 말풍선은 항상 채팅에 남겨두고, 입력창에도 재전송할 수 있도록 텍스트를
    // 돌려줌. AI 말풍선은 그때까지 받은 텍스트가 있으면 잘린 채로 그대로 남기고,
    // 아직 한 글자도 못 받은 빈 말풍선이었다면(타이핑 인디케이터만 보이던 상태) 지움
    let restoredText: string | undefined;
    setMessages((prev) => {
      const aiIdx = prev.findIndex((msg) => msg.id === aiMsgId);
      if (aiIdx === -1) return prev;

      const prevMsg = prev[aiIdx - 1];
      if (aiIdx > 0 && prevMsg?.sender === "user" && prevMsg.type === "text") {
        restoredText = prevMsg.text;
      }

      const aiMsg = prev[aiIdx];
      if (aiMsg.type === "text" && !aiMsg.text) {
        return prev.filter((_, idx) => idx !== aiIdx);
      }

      return prev;
    });

    setIsTyping(false);
    setIsLoadingExtra(false);
    setThinkingMessage(null);
    setQuickReplies([]);

    return restoredText;
  }, [clearResponseTimeout, typewriter]);

  return {
    messages,
    isTyping,
    isLoadingExtra,
    thinkingMessage,
    isRestoringHistory,
    sendMessage,
    stopGeneration,
    sendMessageSilent,
    retryMessage,
    guestChatCount,
    showGuestLimitModal,
    closeGuestLimitModal,
    isLoggedIn,
    endCurrentChat,
    quickReplies,
    // 가입 플로우 전용
    signupCollectedData,
    isSignupComplete,
    currentSignupStep,
    isSignupFlow: isSignupFlowActive,
    pendingPlanSwitch,
    confirmPlanSwitch,
    cancelPlanSwitch,
  };
}
