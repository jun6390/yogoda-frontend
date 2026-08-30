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
  useEffect(() => {
    preselectedPlanRef.current = preselectedPlan;
  }, [preselectedPlan]);

  // 가입 플로우 시작 시 웰컴 메시지 없이 빈 상태로 시작하고, AI 첫 메시지를 기다림
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  // 이전 대화 내역을 불러오는 동안 스켈레톤 UI를 표시하기 위한 상태
  const [isRestoringHistory, setIsRestoringHistory] = useState(true);
  // 초기값은 항상 0으로 시작(SSR-세이프)하고, 마운트 후 useEffect에서
  // localStorage에 저장된 실제 값으로 동기화함
  const [guestChatCount, setGuestChatCount] = useState(0);
  // 비회원이 무료 상담 횟수를 모두 소진한 직후 로그인 유도 팝업을 띄우기 위한 상태
  const [showGuestLimitModal, setShowGuestLimitModal] = useState(false);
  // AI의 질문에 바로 탭해서 답할 수 있는 빠른 답변 후보. 다음 메시지를 보내면 비워짐
  const [quickReplies, setQuickReplies] = useState<string[]>([]);

  // quickReplies가 바뀌면 sessionStorage에 저장 (새로고침 복원용)
  // - 가입 플로우: "signupQuickReplies"
  // - 일반 채팅:   "chatQuickReplies"
  // 빈 배열이 되면 일반 채팅은 키를 제거해 "사용자가 이미 답변했음"을 표시
  useEffect(() => {
    const isSignupFlow = !!preselectedPlanRef.current;
    const storageKey = isSignupFlow ? "signupQuickReplies" : "chatQuickReplies";
    try {
      if (quickReplies.length === 0) {
        if (!isSignupFlow) sessionStorage.removeItem(storageKey);
        return;
      }
      sessionStorage.setItem(storageKey, JSON.stringify(quickReplies));
    } catch {
      /* noop */
    }
  }, [quickReplies]);
  // 가입 플로우 진행 중 수집된 데이터 (단계별 카드 렌더링에 사용)
  const [signupCollectedData, setSignupCollectedData] =
    useState<SignupCollectedData>({});
  // 가입 완료 여부
  const [isSignupComplete, setIsSignupComplete] = useState(false);
  // 현재 가입 단계 (terms_agreement 등에서 입력창 비활성화에 사용)
  const [currentSignupStep, setCurrentSignupStep] = useState<string | null>(
    null,
  );

  // 가입 플로우 중 currentSignupStep이 바뀌면 sessionStorage에 저장 (새로고침 복원용)
  useEffect(() => {
    if (!currentSignupStep) return;
    try {
      sessionStorage.setItem("signupStep", currentSignupStep);
    } catch {
      /* noop */
    }
  }, [currentSignupStep]);

  // signupCollectedData 변경 시 sessionStorage에 저장 (새로고침 복원용)
  useEffect(() => {
    if (!signupCollectedData || Object.keys(signupCollectedData).length === 0)
      return;
    try {
      sessionStorage.setItem(
        "signupCollectedData",
        JSON.stringify(signupCollectedData),
      );
    } catch {
      /* noop */
    }
  }, [signupCollectedData]);

  // sessionStorage 비동기 읽기 등으로 preselectedPlan이 뒤늦게 세팅될 때
  // 히스토리 복원이 이미 완료된 상태에서도 signup-entry 메시지를 추가함
  useEffect(() => {
    if (!preselectedPlan) return;

    // 새로고침 복원: 이전에 진행 중이던 단계와 퀵 응답을 복원
    try {
      const savedStep = sessionStorage.getItem("signupStep");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedStep) setCurrentSignupStep(savedStep);
      const savedReplies = sessionStorage.getItem("signupQuickReplies");
      if (savedReplies) {
        setQuickReplies(JSON.parse(savedReplies) as string[]);
      }
    } catch {
      /* noop */
    }

    // 이미 signup-entry를 보여준 세션이면 재추가하지 않음 (새로고침 방지)
    const entryShown = (() => {
      try {
        return sessionStorage.getItem("signupEntryShown") === "1";
      } catch {
        return false;
      }
    })();
    if (!entryShown) {
      setMessages((prev) => {
        const alreadyAdded = prev.some((m) => m.id.startsWith("signup-entry-"));
        if (alreadyAdded) return prev;
        // 선택한 혜택 목록을 sessionStorage에서 읽어 인삿말에 포함
        let benefits: string[] = [];
        try {
          const raw = sessionStorage.getItem("preselectedPlanBenefits");
          if (raw) benefits = JSON.parse(raw) as string[];
        } catch {
          /* noop */
        }

        const benefitPart =
          benefits.length > 0 ? ` **${benefits.join(", ")}** 혜택과 함께` : "";
        const greetingText = user?.name
          ? `${user.name}님, **${preselectedPlan.name}** 요금제를 선택하셨군요!${benefitPart} 지금 가입을 도와드릴까요?`
          : `**${preselectedPlan.name}** 요금제에 관심이 있으시군요! 가입을 진행하려면 먼저 로그인이 필요해요. 로그인 후 함께 가입 절차를 진행해보세요.`;

        return [
          ...prev,
          {
            id: `signup-entry-${Date.now()}`,
            sender: "ai" as const,
            type: "text" as const,
            text: greetingText,
          },
        ];
      });
      try {
        sessionStorage.setItem("signupEntryShown", "1");
      } catch {
        /* noop */
      }
    }
    // preselectedPlan 객체 자체가 바뀔 때만 실행 (code 기준)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedPlan?.code]);

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
  // 현재 수신 중인 AI 응답의 메시지 id. 소켓 이벤트 핸들러에서 어느 말풍선에 쓸지 식별함
  const currentAiMsgIdRef = useRef<string | null>(null);
  // 킥오프 메시지가 이미 전송됐는지 추적 (중복 전송 방지)
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
        sessionIdRef.current = data.sessionId;
        if (!isLoggedInRef.current) {
          useChatHistoryStore.getState().setSessionId(data.sessionId);
        }
      },
    );

    socket.on("chunk", (data: string) => {
      if (!currentAiMsgIdRef.current) return;
      setIsTyping(false);
      typewriter.push(currentAiMsgIdRef.current, data);
    });

    socket.on("plans", (data: ChatMessage["plans"]) => {
      if (!currentAiMsgIdRef.current) return;
      setMessages((prev) => [
        ...prev,
        {
          id: `${currentAiMsgIdRef.current}-plans`,
          sender: "ai",
          type: "plans",
          plans: data,
        },
      ]);
    });

    socket.on("quickReplies", (data: string[]) => {
      setQuickReplies(data);
    });

    /*
     * 가입 플로우 단계 이벤트.
     * 각 단계에서 적절한 카드 타입으로 메시지를 추가함.
     */
    socket.on(
      "signup",
      (data: { signupStep: string; signupData: SignupCollectedData }) => {
        const { signupStep, signupData } = data;
        setCurrentSignupStep(signupStep);

        // 누적된 수집 데이터 갱신
        setSignupCollectedData((prev) => ({ ...prev, ...signupData }));

        const aiMsgId = currentAiMsgIdRef.current;

        // 단계별 특수 카드 삽입
        if (signupStep === "fraud_warning") {
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
        } else if (signupStep === "terms_agreement") {
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
        } else if (signupStep === "final_confirm") {
          setMessages((prev) => [
            ...prev,
            {
              id: `${aiMsgId ?? Date.now()}-summary`,
              sender: "ai",
              type: "signup_summary",
              signupStep: "final_confirm",
              signupData,
              preselectedPlan: preselectedPlanRef.current,
            },
          ]);
        }
      },
    );

    /*
     * 가입 완료 이벤트.
     */
    socket.on(
      "signup_complete",
      (data: { planCode: string; planName: string }) => {
        setIsSignupComplete(true);
        // 가입 완료 — sessionStorage 정리
        try {
          sessionStorage.removeItem("preselectedPlan");
          sessionStorage.removeItem("signupStep");
          sessionStorage.removeItem("signupQuickReplies");
          sessionStorage.removeItem("signupEntryShown");
          sessionStorage.removeItem("signupCollectedData");
        } catch {
          /* noop */
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `signup-complete-${Date.now()}`,
            sender: "ai",
            type: "signup_complete",
            signupStep: "completed",
            preselectedPlan: preselectedPlanRef.current ?? {
              code: data.planCode,
              name: data.planName,
              monthlyFee: 0,
            },
          },
        ]);
      },
    );

    socket.on("done", () => {
      clearResponseTimeout();
      currentAiMsgIdRef.current = null;
      setIsTyping(false);
      // 소켓은 유지해서 다음 메시지도 핸드셰이크 없이 바로 보낼 수 있게 함
    });

    socket.on("error", () => {
      clearResponseTimeout();
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
  }, [typewriter]);

  // 마운트 시 이전 대화 내역 복원 후 소켓 미리 연결
  // accessToken의 hydration이 끝나기 전까지는 로그인 여부를 신뢰할 수 없으므로 대기함
  useEffect(() => {
    if (!isAuthHydrated) return;

    async function init() {
      // init() 시작 시점의 signupEntryShown 값을 캡처
      // 새 진입(false)과 새로고침(true)을 구분하는 데 사용
      const signupEntryWasShown = (() => {
        try {
          return sessionStorage.getItem("signupEntryShown") === "1";
        } catch {
          return false;
        }
      })();

      setIsRestoringHistory(true);

      if (isLoggedIn) {
        try {
          const { session, messages: dbMessages } =
            await getLatestChatSession();

          // 종료된 세션이면 복원하지 않고 웰컴 메시지로 새로 시작함
          if (session && !session.endedAt && dbMessages.length > 0) {
            sessionIdRef.current = session.id;
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
            // 가입 플로우 + 새 진입(새로고침 아님): greeting이 setMessages에 의해
            // 덮어씌워졌을 수 있으므로 플래그를 초기화해 아래 블록에서 재추가하도록 함
            // 새로고침 시(signupEntryWasShown=true)는 건드리지 않아 중복 방지
            if (preselectedPlanRef.current && !signupEntryWasShown) {
              try {
                sessionStorage.removeItem("signupEntryShown");
              } catch {
                /* noop */
              }
            }
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

      // 가입 플로우: 히스토리 복원 후 정적 안내 메시지 추가
      // 히스토리 복원 후 signup-entry 추가 (미진행 세션만 — entryShown 플래그 없는 경우)
      if (preselectedPlanRef.current) {
        const plan = preselectedPlanRef.current;
        const entryAlreadyShown = (() => {
          try {
            return sessionStorage.getItem("signupEntryShown") === "1";
          } catch {
            return false;
          }
        })();
        if (!entryAlreadyShown) {
          setMessages((prev) => {
            const alreadyAdded = prev.some((m) =>
              m.id.startsWith("signup-entry-"),
            );
            if (alreadyAdded) return prev;
            // 선택한 혜택 및 유저 이름을 포함한 풍부한 인삿말 생성
            const currentUser = useAuthStore.getState().user;
            let benefits: string[] = [];
            try {
              const raw = sessionStorage.getItem("preselectedPlanBenefits");
              if (raw) benefits = JSON.parse(raw) as string[];
            } catch {
              /* noop */
            }
            const benefitPart =
              benefits.length > 0
                ? ` **${benefits.join(", ")}** 혜택과 함께`
                : "";
            const greetingText = currentUser?.name
              ? `${currentUser.name}님, **${plan.name}** 요금제를 선택하셨군요!${benefitPart} 지금 가입을 도와드릴까요?`
              : `**${plan.name}** 요금제에 관심이 있으시군요! 가입을 진행하려면 먼저 로그인이 필요해요. 로그인 후 함께 가입 절차를 진행해보세요.`;
            return [
              ...prev,
              {
                id: `signup-entry-${Date.now()}`,
                sender: "ai",
                type: "text",
                text: greetingText,
              },
            ];
          });
          try {
            sessionStorage.setItem("signupEntryShown", "1");
          } catch {
            /* noop */
          }
        } else {
          // 새로고침 복원: 마지막으로 저장된 퀵 응답과 단계를 복원
          try {
            const savedStep = sessionStorage.getItem("signupStep");
            if (savedStep) setCurrentSignupStep(savedStep);
            const savedReplies = sessionStorage.getItem("signupQuickReplies");
            if (savedReplies)
              setQuickReplies(JSON.parse(savedReplies) as string[]);

            // 진행 중이던 단계의 카드를 히스토리 맨 뒤에 다시 추가
            // (카드는 DB에 저장되지 않아 새로고침 시 사라지므로 여기서 복원)
            if (savedStep === "fraud_warning") {
              setMessages((prev) => [
                ...prev,
                {
                  id: `restore-fraud-${Date.now()}`,
                  sender: "ai" as const,
                  type: "fraud_warning" as const,
                  signupStep: "fraud_warning",
                  signupData: {},
                },
              ]);
            } else if (savedStep === "terms_agreement") {
              setMessages((prev) => [
                ...prev,
                {
                  id: `restore-terms-${Date.now()}`,
                  sender: "ai" as const,
                  type: "terms" as const,
                  signupStep: "terms_agreement",
                  signupData: {},
                },
              ]);
            } else if (savedStep === "final_confirm") {
              // final_confirm: signup_summary 카드 복원
              try {
                const rawData = sessionStorage.getItem("signupCollectedData");
                const restoredData = rawData
                  ? (JSON.parse(rawData) as Record<string, unknown>)
                  : {};
                const rawPlan = sessionStorage.getItem("preselectedPlan");
                const restoredPlan = rawPlan
                  ? (JSON.parse(rawPlan) as {
                      code: string;
                      name: string;
                      monthlyFee: number;
                    })
                  : undefined;
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `restore-summary-${Date.now()}`,
                    sender: "ai" as const,
                    type: "signup_summary" as const,
                    signupStep: "final_confirm",
                    signupData: restoredData,
                    preselectedPlan: restoredPlan,
                  },
                ]);
              } catch {
                /* noop */
              }
            }
          } catch {
            /* noop */
          }
        }
      }

      // 일반 채팅: 새로고침 전 마지막 퀵 응답 복원
      if (!preselectedPlanRef.current) {
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
      // 가입 플로우: openSocket 안에서 session_created 이벤트가 오면 킥오프 자동 전송
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
    (text: string) => {
      if (!text.trim()) return;
      const aiMsgId = Date.now().toString();
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, sender: "ai", type: "text", text: "" },
      ]);
      setIsTyping(true);
      setQuickReplies([]);
      currentAiMsgIdRef.current = aiMsgId;

      const extra: Record<string, unknown> = {};
      if (preselectedPlanRef.current) {
        extra.preselectedPlanCode = preselectedPlanRef.current.code;
        extra.signupCollectedData = signupCollectedData;
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
        setQuickReplies([]);
      }, RESPONSE_TIMEOUT_MS);

      emitMessage(text, Object.keys(extra).length > 0 ? extra : undefined);
    },
    [emitMessage, signupCollectedData, clearResponseTimeout, typewriter],
  );

  const closeGuestLimitModal = useCallback(() => {
    setShowGuestLimitModal(false);
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

    // 가입 플로우 관련 sessionStorage 정리 (다음 채팅에 이전 요금제 정보가 남지 않도록)
    try {
      sessionStorage.removeItem("preselectedPlan");
      sessionStorage.removeItem("preselectedPlanBenefits");
      sessionStorage.removeItem("signupEntryShown");
      sessionStorage.removeItem("signupStep");
      sessionStorage.removeItem("signupQuickReplies");
      sessionStorage.removeItem("signupCollectedData");
    } catch {
      /* noop */
    }

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
        setQuickReplies([]);
      }, RESPONSE_TIMEOUT_MS);

      emitMessage(userMsg.text);
    },
    [messages, emitMessage, typewriter, clearResponseTimeout],
  );

  return {
    messages,
    isTyping,
    isRestoringHistory,
    sendMessage,
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
    isSignupFlow: !!preselectedPlan,
  };
}
