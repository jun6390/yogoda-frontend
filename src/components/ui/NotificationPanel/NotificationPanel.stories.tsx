import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NotificationPanel } from "./NotificationPanel";

const meta = {
  title: "UI/Notification Panel",
  component: NotificationPanel,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onClose: () => undefined,
    onNotificationClick: async () => undefined,
    onMarkAllAsRead: async () => undefined,
    onNotificationDelete: async () => undefined,
  },
} satisfies Meta<typeof NotificationPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

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
