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
    <div className="mx-auto flex h-dvh w-full max-w-[390px] flex-col overflow-hidden">
      {header && <div className="shrink-0">{header}</div>}

      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>

      {bottomNavigation && <div className="shrink-0">{bottomNavigation}</div>}
    </div>
  );
}
