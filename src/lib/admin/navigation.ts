import {
  Activity,
  LayoutDashboard,
  MessageSquare,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/logs", label: "AI 채팅 로그", icon: MessageSquare },
  { href: "/admin/ui-analysis", label: "UI 행동 분석", icon: Activity },
  { href: "/admin/prompts", label: "프롬프트 관리", icon: SlidersHorizontal },
];
