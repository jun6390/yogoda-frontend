/*
 * TypeScript가 CSS 파일 import를 모듈로 인식할 수 있도록 선언함
 * Storybook 등 src 외부의 설정 파일에서도 전역 CSS를 안전하게 import하기 위해 사용함
 */
declare module "*.css";
