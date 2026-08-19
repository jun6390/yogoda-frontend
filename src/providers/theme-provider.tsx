"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (
    value:
      ThemePreference | ((currentTheme: ThemePreference) => ThemePreference),
  ) => void;
}

const STORAGE_KEY = "theme";
const DISABLE_TRANSITIONS_STYLE_ID = "yogoda-disable-theme-transitions";
const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(theme: ThemePreference, systemTheme: ResolvedTheme) {
  return theme === "system" ? systemTheme : theme;
}

function disableThemeTransitions() {
  const existingStyle = document.getElementById(DISABLE_TRANSITIONS_STYLE_ID);

  if (existingStyle) {
    existingStyle.remove();
  }

  const style = document.createElement("style");
  style.id = DISABLE_TRANSITIONS_STYLE_ID;
  style.textContent =
    "*:not([data-theme-transition]),*:not([data-theme-transition])::before,*:not([data-theme-transition])::after{transition:none!important;animation:none!important}";
  document.head.appendChild(style);

  window.getComputedStyle(document.documentElement);

  // 테마 전환 순간 배경/텍스트 transition이 섞이면 흰색 깜빡임처럼 보임
  // data-theme-transition으로 표시한 작은 토글 모션만 살리고 두 frame 뒤 제거함
  requestAnimationFrame(() => {
    requestAnimationFrame(() => style.remove());
  });
}

function applyTheme(resolvedTheme: ResolvedTheme, disableTransitions = false) {
  if (disableTransitions) {
    disableThemeTransitions();
  }

  const root = document.documentElement;
  root.classList.toggle("dark", resolvedTheme === "dark");
  root.style.colorScheme = resolvedTheme;
}

function readStoredTheme(): ThemePreference {
  try {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    return isThemePreference(storedTheme) ? storedTheme : "system";
  } catch {
    return "system";
  }
}

function storeTheme(theme: ThemePreference) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // 제한된 브라우징 모드에서는 localStorage가 비활성화될 수 있음
  }
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemePreference>(() =>
    typeof window === "undefined" ? "system" : readStoredTheme(),
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    typeof window === "undefined" ? "light" : getSystemTheme(),
  );

  useLayoutEffect(() => {
    const nextSystemTheme = getSystemTheme();
    const storedTheme = readStoredTheme();

    // inline script를 렌더링하지 않기 때문에 hydration 직후 직접 보정함
    // suppressHydrationWarning과 함께 써서 초기 class 차이로 인한 경고를 피함
    applyTheme(resolveTheme(storedTheme, nextSystemTheme));
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = () => {
      const nextSystemTheme = getSystemTheme();
      setSystemTheme(nextSystemTheme);

      if (readStoredTheme() === "system") {
        applyTheme(nextSystemTheme, true);
      }
    };

    media.addEventListener("change", handleSystemThemeChange);

    return () => {
      media.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      const nextTheme = isThemePreference(event.newValue)
        ? event.newValue
        : "system";
      const nextSystemTheme = getSystemTheme();

      // 여러 탭을 동시에 열어도 마지막으로 선택한 테마를 맞춤
      setThemeState(nextTheme);
      setSystemTheme(nextSystemTheme);
      applyTheme(resolveTheme(nextTheme, nextSystemTheme), true);
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const setTheme = useCallback<ThemeContextValue["setTheme"]>((value) => {
    setThemeState((currentTheme) => {
      const nextTheme =
        typeof value === "function" ? value(currentTheme) : value;
      const nextSystemTheme = getSystemTheme();

      storeTheme(nextTheme);
      setSystemTheme(nextSystemTheme);
      applyTheme(resolveTheme(nextTheme, nextSystemTheme), true);

      return nextTheme;
    });
  }, []);

  const resolvedTheme = resolveTheme(theme, systemTheme);

  const contextValue = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, setTheme, theme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
