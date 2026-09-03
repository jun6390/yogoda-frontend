import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const typographyTokens = [
  "display-28-bold",
  "title-24-bold",
  "title-20-bold",
  "title-18-bold",
  "title-16-bold",
  "body-14-regular",
  "label-14-bold",
  "label-14-medium",
  "caption-13-regular",
  "caption-13-medium",
  "caption-13-bold",
  "caption-12-regular",
  "caption-12-medium",
  "caption-12-bold",
  "micro-11-regular",
  "micro-11-bold",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: typographyTokens }],
    },
  },
});

/*
 * 조건부 className을 조합하고 Tailwind 클래스 충돌을 정리함
 * Figma 타이포 토큰과 색상 토큰은 둘 다 text-* 형태라 별도 병합 규칙이 필요함
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
