import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Switch } from "./Switch";

const meta = {
  title: "UI/Toggle Switch",
  component: Switch,
  args: { "aria-label": "혜택 알림 받기" },
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Off: Story = {};

export const On: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const WithLabel: Story = {
  args: {
    label: "혜택 알림 받기",
  },
};
