import React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme, type ThemeProviderProps as NextThemesProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: NextThemesProviderProps) {
  return (
    <NextThemesProvider attribute="class" enableSystem={false} {...props}>
      {children}
    </NextThemesProvider>
  )
}

export function useTheme() {
  const { theme, setTheme } = useNextTheme();
  return { theme: theme ?? 'light', setTheme };
}
