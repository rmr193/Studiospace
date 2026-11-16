"use client";

import React from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

type Theme = "light" | "dark";

/**
 * App-wide theme provider backed by next-themes. The selected theme is
 * persisted under the same `studiospace-theme` storage key the app has always
 * used, and the hook below keeps the existing `useTheme()` API stable.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="studiospace-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const activeTheme: Theme =
    resolvedTheme === "light" || theme === "light" ? "light" : "dark";

  return {
    theme: activeTheme,
    setTheme: (nextTheme: Theme) => setTheme(nextTheme),
    toggleTheme: () => setTheme(activeTheme === "dark" ? "light" : "dark"),
  };
}
