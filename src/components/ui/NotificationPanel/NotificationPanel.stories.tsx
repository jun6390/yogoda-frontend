import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NotificationPanel } from "./NotificationPanel";

const notifications = [
  {
    id: "usage",
    type: "usage_pattern_changed" as const,
    title: "새 추천이 도착했어요!",
    body: "사용 패턴 변화가 감지되어 새 요금제를 분석할 수 있어요.",
    link: "/my/usage",
    readAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "coupon",
    type: "coupon_expiring" as const,
    title: "쿠폰 만료가 임박했어요",
    body: "보유하신 쿠폰이 3일 후 만료돼요.",
    link: "/my/coupons",
    readAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
];

const meta = {
  title: "UI/NotificationPanel",
  component: NotificationPanel,
  tags: ["autodocs"],
  args: {
    notifications,
    onClose: () => undefined,
    onNotificationClick: async () => undefined,
    onMarkAllAsRead: async () => undefined,
    onNotificationDelete: async () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="relative h-[520px] w-[390px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NotificationPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AllRead: Story = {
  args: {
    notifications: notifications.map((notification) => ({
      ...notification,
      readAt: new Date().toISOString(),
    })),
  },
};
export const Empty: Story = { args: { notifications: [] } };

export const UnknownNotificationType: Story = {
  args: {
    notifications: [
      {
        id: "legacy-notification",
        type: "legacy_unknown_type",
        title: "새로운 알림이 도착했어요",
        body: "지원하지 않는 알림 유형도 기본 아이콘으로 표시돼요.",
        link: null,
        readAt: null,
        createdAt: new Date().toISOString(),
      },
    ],
  },
};
