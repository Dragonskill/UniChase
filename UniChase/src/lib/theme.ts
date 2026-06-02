export type ThemeMode = "light" | "dark"

const themeKey = "unichase.theme"
export const themeChangeEvent = "unichase:theme-change"

const themeVariables: Record<ThemeMode, Record<string, string>> = {
  light: {
    "--background": "#F6F5F0",
    "--surface": "#FFFFFF",
    "--surface-elevated": "#FFFFFF",
    "--card": "#FFFFFF",
    "--border": "rgba(24, 33, 46, 0.12)",
    "--text-primary": "#18212E",
    "--text-secondary": "#4B5563",
    "--text-muted": "#6B7280",
    "--accent": "#0E9488",
    "--accent-hover": "#14B8A6",
    "--button-bg": "#16263E",
    "--button-text": "#FFFFFF",
    "--button-border": "transparent",
    "--color-navy": "#16263E",
    "--color-navy-light": "#243B5A",
    "--color-teal": "#0E9488",
    "--color-teal-light": "#14B8A6",
    "--color-white": "#FFFFFF",
    "--color-gray-50": "#F9FAFB",
    "--color-gray-100": "#F3F4F6",
    "--color-gray-200": "#E5E7EB",
    "--color-gray-300": "#D1D5DB",
    "--color-gray-400": "#9CA3AF",
    "--color-gray-500": "#6B7280",
    "--color-gray-600": "#4B5563",
    "--color-gray-700": "#374151",
    "--color-gray-800": "#1F2937",
    "--color-gray-900": "#111827",
    "--color-cream": "#F6F5F0",
    "--color-surface": "#FFFFFF",
    "--color-ink": "#18212E",
    "--color-muted": "#6B7280",
    "--color-cream-dark": "#E5E3DC",
    "--shadow-sm": "0 1px 2px rgba(15, 23, 42, 0.08)",
    "--shadow": "0 1px 3px rgba(15, 23, 42, 0.1), 0 1px 2px rgba(15, 23, 42, 0.06)",
    "--shadow-lg": "0 10px 15px rgba(15, 23, 42, 0.1), 0 4px 6px rgba(15, 23, 42, 0.05)",
  },
  dark: {
    "--background": "#111827",
    "--surface": "#17212B",
    "--surface-elevated": "#1F2A37",
    "--card": "#1B2633",
    "--border": "rgba(255, 255, 255, 0.09)",
    "--text-primary": "#F3F7FA",
    "--text-secondary": "#C4D0DC",
    "--text-muted": "#AAB7C4",
    "--accent": "#2DD4BF",
    "--accent-hover": "#5EEAD4",
    "--button-bg": "#244363",
    "--button-text": "#FFFFFF",
    "--button-border": "rgba(255, 255, 255, 0.12)",
    "--color-navy": "#1D3550",
    "--color-navy-light": "#2B4F73",
    "--color-teal": "#2DD4BF",
    "--color-teal-light": "#5EEAD4",
    "--color-white": "#1B2633",
    "--color-gray-50": "#1F2A37",
    "--color-gray-100": "#263545",
    "--color-gray-200": "rgba(255, 255, 255, 0.09)",
    "--color-gray-300": "rgba(255, 255, 255, 0.18)",
    "--color-gray-400": "#AAB7C4",
    "--color-gray-500": "#AAB7C4",
    "--color-gray-600": "#C4D0DC",
    "--color-gray-700": "#C4D0DC",
    "--color-gray-800": "#F3F7FA",
    "--color-gray-900": "#F3F7FA",
    "--color-cream": "#111827",
    "--color-surface": "#17212B",
    "--color-ink": "#F3F7FA",
    "--color-muted": "#AAB7C4",
    "--color-cream-dark": "#243140",
    "--shadow-sm": "0 18px 38px rgba(3, 8, 18, 0.32)",
    "--shadow": "0 18px 38px rgba(3, 8, 18, 0.32)",
    "--shadow-lg": "0 22px 56px rgba(3, 8, 18, 0.38)",
  },
}

const surfaceSelectors = ".bg-surface, .bg-white:not(.hero-carousel-cta)"
const elevatedSurfaceSelectors = ".bg-cream, .bg-cream-dark, .bg-gray-50, .bg-gray-100, .bg-gray-200"

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
  document.documentElement.classList.toggle("theme-dark", theme === "dark")
  document.documentElement.classList.toggle("theme-light", theme === "light")
  Object.entries(themeVariables[theme]).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value)
  })
  if (document.body) {
    document.body.style.backgroundColor = themeVariables[theme]["--background"]
    document.body.style.color = themeVariables[theme]["--text-primary"]
  }

  document.querySelectorAll<HTMLElement>(surfaceSelectors).forEach((element) => {
    if (theme === "dark") {
      element.style.setProperty("background-color", themeVariables.dark["--surface"], "important")
    } else {
      element.style.removeProperty("background-color")
    }
  })

  document.querySelectorAll<HTMLElement>(elevatedSurfaceSelectors).forEach((element) => {
    if (theme === "dark") {
      element.style.setProperty("background-color", themeVariables.dark["--surface-elevated"], "important")
    } else {
      element.style.removeProperty("background-color")
    }
  })
}

export function setStoredTheme(theme: ThemeMode) {
  localStorage.setItem(themeKey, theme)
  applyTheme(theme)
  window.dispatchEvent(new Event(themeChangeEvent))
}
