import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BottomNavigation } from "./BottomNavigation";

const meta = {
  title: "UI/Bottom Navigation",
  component: BottomNavigation,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    active: "home",
  },
  argTypes: {
    active: {
      control: "select",
      options: ["home", "ai", "benefit", "mission", "my"],
    },
  },
} satisfies Meta<typeof BottomNavigation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Home: Story = {};

export const AI: Story = {
  args: {
    active: "ai",
  },
};

export const Benefit: Story = {
  args: {
    active: "benefit",
  },
};

export const Mission: Story = {
  args: {
    active: "mission",
  },
};

export const My: Story = {
  args: {
    active: "my",
  },
};
