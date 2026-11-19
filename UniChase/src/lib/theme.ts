export type ThemeMode = "light" | "dark"

const themeKey = "unichase.theme"
export const themeChangeEvent = "unichase:theme-change"

export function getStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(themeKey)
    if (stored === "light" || stored === "dark") return stored
  } catch { /* Browser preferences may be unavailable in private contexts. */ }
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export function setStoredTheme(theme: ThemeMode) {
  try { localStorage.setItem(themeKey, theme) } catch { /* Keep this session usable. */ }
  applyTheme(theme)
  window.dispatchEvent(new Event(themeChangeEvent))
}

export function watchSystemTheme() {
  const media = window.matchMedia("(prefers-color-scheme: dark)")
  const sync = () => {
    applyTheme(getStoredTheme())
    window.dispatchEvent(new Event(themeChangeEvent))
  }
  media.addEventListener("change", sync)
  window.addEventListener("storage", sync)
  return () => {
    media.removeEventListener("change", sync)
    window.removeEventListener("storage", sync)
  }
}
