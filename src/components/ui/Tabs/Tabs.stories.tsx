import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Tabs } from "./Tabs";

const meta = {
  title: "UI/Tabs Sub Navigation",
  component: Tabs,
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
      options: ["home", "attendance", "twoPlus"],
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Home: Story = {};

export const Attendance: Story = {
  args: {
    active: "attendance",
  },
};

export const TwoPlus: Story = {
  args: {
    active: "twoPlus",
  },
};
