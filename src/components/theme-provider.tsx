import React from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps as NextThemesProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: NextThemesProviderProps) {
  return <NextThemesProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false} {...props}>{children}</NextThemesProvider>
}
