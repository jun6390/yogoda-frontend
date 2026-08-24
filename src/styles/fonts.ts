import { Noto_Sans_KR } from "next/font/google";

/*
 * 앱과 Storybook이 동일한 폰트 설정을 사용하도록 한 곳에서 관리함
 */
export const notoSansKr = Noto_Sans_KR({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-kr",
});
