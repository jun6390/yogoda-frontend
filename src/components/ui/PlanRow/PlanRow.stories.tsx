import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PlanRow } from "./PlanRow";

const meta = {
  title: "UI/Plan Row",
  component: PlanRow,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    recommended: true,
    name: "5G 데이터 플러스",
    price: "59,000원 / 월",
    description: "80GB · 통화 무제한 · OTT 선택",
  },
} satisfies Meta<typeof PlanRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Recommended: Story = {};

export const Default: Story = {
  args: {
    recommended: false,
    name: "5G 라이트 70",
    price: "55,000원 / 월",
    description: "70GB · 통화 무제한",
  },
};
