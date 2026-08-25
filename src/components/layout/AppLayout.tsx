import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  bottomNavigation?: ReactNode;
  // 헤더 바로 아래 떠 있는 알림 패널처럼, main의 스크롤/overflow에 영향받지 않고
  // 앱 폭 기준으로 절대 위치해야 하는 오버레이용 슬롯
  overlay?: ReactNode;
}

export function AppLayout({
  children,
  header,
  bottomNavigation,
  overlay,
}: AppLayoutProps) {
  return (
    // 390px 디자인 기준이나 큰 모바일은 448px까지 앱 폭 확장함
    <div className="relative mx-auto flex h-dvh w-full max-w-[448px] flex-col overflow-hidden border-x border-border-strong bg-background shadow-[0_0_32px_rgb(18_20_31_/_8%)]">
      {header && <div className="shrink-0">{header}</div>}

      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>

      {bottomNavigation && <div className="shrink-0">{bottomNavigation}</div>}

      {overlay}
    </div>
  );
}
