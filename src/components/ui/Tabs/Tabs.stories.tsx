import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Tabs } from "./Tabs";

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj;

function PlanTabsExample() {
  const [active, setActive] = useState<"explore" | "join">("explore");

  return (
    <div className="w-mobile">
      <Tabs
        items={[
          { value: "explore", label: "요금제 탐색" },
          { value: "join", label: "요금제 가입" },
        ]}
        active={active}
        onValueChange={setActive}
      />
    </div>
  );
}

function ThreeTabsExample() {
  const [active, setActive] = useState<"home" | "attendance" | "twoPlus">(
    "home",
  );

  return (
    <div className="w-mobile">
      <Tabs
        items={[
          { value: "home", label: "홈" },
          { value: "attendance", label: "출석체크" },
          { value: "twoPlus", label: "유플투쁠" },
        ]}
        active={active}
        onValueChange={setActive}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <PlanTabsExample />,
};

export const ThreeItems: Story = {
  render: () => <ThreeTabsExample />,
};
