import type { ReactNode } from "react";

import { MainShell } from "@/components/layout/MainShell";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return <MainShell>{children}</MainShell>;
}
