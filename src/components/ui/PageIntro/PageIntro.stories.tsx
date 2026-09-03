import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PageIntro } from "./PageIntro";

const meta = {
  title: "UI/PageIntro",
  component: PageIntro,
  tags: ["autodocs"],
  args: {
    title: "가까운 U+ 직영 매장을 찾아보세요",
    description: "방문 전에 제공 서비스와 운영시간을 확인할 수 있어요.",
  },
} satisfies Meta<typeof PageIntro>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithAction: Story = {
  args: { action: <button className="text-text-brand">전체 보기</button> },
};
