import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Headphones } from "lucide-react";

import { Select } from "./Select";

const options = [
  { value: "all", label: "전체 서비스" },
  { value: "ott", label: "OTT" },
  { value: "music", label: "음악" },
];

const meta = {
  title: "UI/Select",
  component: Select,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    value: "all",
    options,
    ariaLabel: "서비스 선택",
    onChange: () => undefined,
    className: "w-[320px]",
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <Select {...args} value={value} onChange={setValue} />;
  },
};
export const WithIcon: Story = { args: { icon: <Headphones size={18} /> } };
