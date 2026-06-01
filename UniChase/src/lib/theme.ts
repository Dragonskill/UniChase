export type ThemeMode = "light" | "dark"

const themeKey = "unichase.theme"
export const themeChangeEvent = "unichase:theme-change"

function systemTheme(): ThemeMode {
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark"
  }

  return "light"
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light"
  }

  const stored = localStorage.getItem(themeKey)
  return stored === "dark" || stored === "light" ? stored : systemTheme()
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return
  }

  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export function setStoredTheme(theme: ThemeMode) {
  localStorage.setItem(themeKey, theme)
  applyTheme(theme)
  window.dispatchEvent(new Event(themeChangeEvent))
}
