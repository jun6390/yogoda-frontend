import type { Preview } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";

import enMessages from "../messages/en.json";
import koMessages from "../messages/ko.json";
import { notoSansKr } from "../src/styles/fonts";

import "../src/app/globals.css";

// 일부 story args는 컴포넌트 props 샘플이라 messages/*.json을 거치지 않음
// Storybook Locale 툴바에서만 영문 preview가 필요해 전역 데코레이터에서 치환함
const storyTextTranslations: Record<string, string> = {
  무료: "Free",
  "3,000원": "KRW 3,000",
  "혜택 이름": "Benefit name",
  "혜택 설명": "Benefit description",
  "데이터 부족": "Not enough data",
  "요금 낮추기": "Lower my bill",
  계속하기: "Continue",
  비교하기: "Compare",
  "자세히 보기": "View details",
  "아직 내용이 없어요": "Nothing here yet",
  "새로운 항목이 생기면 이곳에서 확인할 수 있어요.":
    "New items will appear here.",
  "약관에 동의해요": "I agree to the terms",
  "미션 이름": "Mission name",
  "메시지를 입력하세요": "Enter a message",
  "입력 값을 확인해주세요": "Please check your input",
  "무료 AI 상담을 모두 사용했어요": "You've used all free AI chats",
  "비로그인 상태에서는 AI 상담을\n5회까지 이용할 수 있어요.\n로그인하면 상담을 계속하고\n추천 내역도 저장할 수 있어요.":
    "Without logging in, you can use AI chat\nup to 5 times.\nLog in to keep chatting\nand save your recommendations.",
  "로그인하고 계속하기": "Log in and continue",
  나중에: "Later",
  "항목 이름": "Item name",
  "알림 설정": "Notification settings",
  켜짐: "On",
  "5G 데이터 플러스": "5G Data Plus",
  "59,000원 / 월": "KRW 59,000 / month",
  "80GB · 통화 무제한 · OTT 선택": "80GB · Unlimited calls · OTT option",
  "5G 라이트 70": "5G Lite 70",
  "55,000원 / 월": "KRW 55,000 / month",
  "70GB · 통화 무제한": "70GB · Unlimited calls",
  "섹션 제목": "Section title",
  "전체 보기": "View all",
  "혜택 알림 받기": "Benefit notifications",
  "저장한 혜택에 추가했어요": "Added to saved benefits",
  보러가기: "View",
};

function translateStoryValue(value: unknown): unknown {
  if (typeof value === "string") {
    return storyTextTranslations[value] ?? value;
  }

  if (Array.isArray(value)) {
    return value.map(translateStoryValue);
  }

  if (
    value &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    // ReactNode나 Date 같은 객체는 건드리지 않고 plain object args만 재귀 변환함
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        translateStoryValue(item),
      ]),
    );
  }

  return value;
}

const testEnvironment = (
  import.meta as ImportMeta & { env?: Record<string, string> }
).env;

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - 접근성 위반을 테스트 UI에만 표시함
      // 'error' - 접근성 위반 시 CI 실패 처리함
      // 'off' - 접근성 검사 비활성화함
      test: "error",
    },
  },

  globalTypes: {
    theme: {
      description: "Yogoda 전역 테마",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: "Yogoda locale",
      toolbar: {
        title: "Locale",
        icon: "globe",
        items: [
          { value: "ko", title: "한국어" },
          { value: "en", title: "English" },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    theme: testEnvironment?.VITE_STORYBOOK_THEME === "dark" ? "dark" : "light",
    locale: testEnvironment?.VITE_STORYBOOK_LOCALE === "en" ? "en" : "ko",
  },

  decorators: [
    (Story, context) => {
      const isDark = context.globals.theme === "dark";
      const locale = context.globals.locale === "en" ? "en" : "ko";
      const messages = locale === "en" ? enMessages : koMessages;
      const args =
        locale === "en" ? translateStoryValue(context.args) : context.args;

      return (
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone="Asia/Seoul"
        >
          <div
            className={`${isDark ? "dark" : ""} ${notoSansKr.variable} min-h-screen bg-background font-sans text-text-primary`}
          >
            <Story args={args} />
          </div>
        </NextIntlClientProvider>
      );
    },
  ],
};

export default preview;
