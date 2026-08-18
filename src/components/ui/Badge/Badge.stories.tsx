import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "./Badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: "D-7",
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Accent: Story = {
  args: {
    variant: "accent",
    children: "BEST",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "무료",
  },
};

export const Price: Story = {
  args: {
    variant: "price",
    children: "3,000원",
  },
};
