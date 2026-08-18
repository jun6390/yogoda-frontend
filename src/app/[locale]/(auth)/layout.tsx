import type { ReactNode } from "react";

import { AppLayout } from "@/components/layout/AppLayout";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <AppLayout>{children}</AppLayout>;
}
