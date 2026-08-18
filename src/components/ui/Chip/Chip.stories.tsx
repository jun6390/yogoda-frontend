import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Chip } from "./Chip";

const meta = {
  title: "UI/Chip",
  component: Chip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: "데이터 부족",
  },
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    selected: true,
    children: "요금 낮추기",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
