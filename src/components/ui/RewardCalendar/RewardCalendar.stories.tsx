import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RewardCalendar } from "./RewardCalendar";

const markedDates = new Set(["2026-09-01", "2026-09-02", "2026-09-05"]);
const meta = {
  title: "UI/RewardCalendar",
  component: RewardCalendar,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    month: "2026-09",
    markedDates,
    selectedDate: "2026-09-02",
    onMonthChange: () => undefined,
    onDateSelect: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RewardCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dots: Story = {};
export const Stamps: Story = {
  args: {
    markVariant: "stamp",
    stampSrc: "/yogoda-characters/attendance-green.webp",
  },
};
