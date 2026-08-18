import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BenefitRow } from "./BenefitRow";

const meta = {
  title: "UI/Benefit Row",
  component: BenefitRow,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    type: "default",
    name: "혜택 이름",
    description: "혜택 설명",
  },
  argTypes: {
    type: {
      control: "select",
      options: ["default", "free", "price"],
    },
  },
} satisfies Meta<typeof BenefitRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Free: Story = {
  args: {
    type: "free",
  },
};

export const Price: Story = {
  args: {
    type: "price",
  },
};
