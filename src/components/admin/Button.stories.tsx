import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./Button";

const meta = {
  title: "Admin/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: "저장하고 새 버전 배포",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "text"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "되돌리기",
  },
};

export const Text: Story = {
  args: {
    variant: "text",
    children: "이 버전으로 되돌리기",
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
    loadingLabel: "배포하는 중...",
  },
};
