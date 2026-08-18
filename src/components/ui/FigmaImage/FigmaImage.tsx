/* eslint-disable @next/next/no-img-element */
import type { ImgHTMLAttributes } from "react";

type FigmaImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  alt: string;
  src: string;
};

/*
 * Figma에서 추출한 asset은 CSS token 크기와 원본 비율을 그대로 맞춰야 함
 * Next Image 최적화보다 일반 img가 Storybook/앱 양쪽에서 예측 가능함
 */
export function FigmaImage({ alt, ...props }: FigmaImageProps) {
  return <img alt={alt} {...props} />;
}
