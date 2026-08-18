import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BottomSheet } from "./BottomSheet";

const meta = {
  title: "UI/Bottom Sheet",
  component: BottomSheet,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    type: "login",
  },
  argTypes: {
    type: {
      control: "select",
      options: ["login", "confirmation", "permission", "place"],
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-[#1f1f1f] p-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BottomSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Login: Story = {};

export const Confirmation: Story = {
  args: {
    type: "confirmation",
  },
};

export const Permission: Story = {
  args: {
    type: "permission",
  },
};

export const Place: Story = {
  args: {
    type: "place",
  },
};
