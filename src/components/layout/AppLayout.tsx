import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  bottomNavigation?: ReactNode;
}

export function AppLayout({
  children,
  header,
  bottomNavigation,
}: AppLayoutProps) {
  return (
    // 390px 디자인 기준이나 큰 모바일은 448px까지 앱 폭 확장함
    <div className="mx-auto flex h-dvh w-full max-w-[448px] flex-col overflow-hidden border-x border-border-strong bg-background shadow-[0_0_32px_rgb(18_20_31_/_8%)]">
      {header && <div className="shrink-0">{header}</div>}

      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>

      {bottomNavigation && <div className="shrink-0">{bottomNavigation}</div>}
    </div>
  );
}
