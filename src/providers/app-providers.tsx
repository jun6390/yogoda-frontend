"use client";

import type { ReactNode } from "react";

import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * 앱 전역에서 사용하는 Client Provider의 진입점임
 * 새로운 전역 Provider는 Root Layout이 아닌 이곳에서 조합함
 *
 * ThemeProvider는 document 루트의 테마 클래스를 관리하므로 바깥쪽에서 관리함
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  );
}
