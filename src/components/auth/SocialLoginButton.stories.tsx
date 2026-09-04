import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SocialLoginButton } from "./SocialLoginButton";

const meta = {
  title: "Auth/SocialLoginButton",
  component: SocialLoginButton,
  args: { provider: "google", label: "Google로 계속하기" },
} satisfies Meta<typeof SocialLoginButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Google: Story = {};
export const Naver: Story = {
  args: { provider: "naver", label: "네이버로 계속하기" },
};
export const Kakao: Story = {
  args: { provider: "kakao", label: "카카오로 계속하기" },
};
