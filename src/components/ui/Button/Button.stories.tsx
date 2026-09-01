import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./Button";

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: "계속하기",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "text", "inChat", "inChatOutline"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "비교하기",
  },
};

export const Text: Story = {
  args: {
    variant: "text",
    children: "자세히 보기",
  },
};

export const InChat: Story = {
  args: {
    variant: "inChat",
    children: "다음",
  },
};

export const InChatOutline: Story = {
  args: {
    variant: "inChatOutline",
    children: "인증번호 전송",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};
