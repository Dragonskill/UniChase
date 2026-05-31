/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { getStoredLanguage, setStoredLanguage } from "@/lib/storage"

export type Language = "en" | "ko" | "ru" | "uz"

const labels = {
  en: {
    university: "University",
    reviews: "Reviews",
    news: "News",
    careers: "Careers",
    community: "Community",
    dashboard: "Dashboard",
    match: "Best Match",
    search: "Search...",
    login: "Login",
    signup: "Sign up",
    contact: "Contact",
    saved: "Saved",
    compare: "Compare",
  },
  ko: {
    university: "대학교",
    reviews: "후기",
    news: "뉴스",
    careers: "커리어",
    community: "커뮤니티",
    dashboard: "대시보드",
    match: "추천",
    search: "검색...",
    login: "로그인",
    signup: "가입",
    contact: "문의",
    saved: "저장됨",
    compare: "비교",
  },
  ru: {
    university: "Университеты",
    reviews: "Отзывы",
    news: "Новости",
    careers: "Карьера",
    community: "Сообщество",
    dashboard: "Кабинет",
    match: "Подбор",
    search: "Поиск...",
    login: "Войти",
    signup: "Регистрация",
    contact: "Контакты",
    saved: "Сохранено",
    compare: "Сравнить",
  },
  uz: {
    university: "Universitet",
    reviews: "Sharhlar",
    news: "Yangiliklar",
    careers: "Karyera",
    community: "Hamjamiyat",
    dashboard: "Kabinet",
    match: "Moslik",
    search: "Qidirish...",
    login: "Kirish",
    signup: "Ro'yxatdan o'tish",
    contact: "Aloqa",
    saved: "Saqlangan",
    compare: "Taqqoslash",
  },
} satisfies Record<Language, Record<string, string>>

type I18nContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: keyof typeof labels.en) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = getStoredLanguage()
    return ["en", "ko", "ru", "uz"].includes(stored) ? (stored as Language) : "en"
  })

  const value = useMemo<I18nContextValue>(() => {
    const setLanguage = (nextLanguage: Language) => {
      setLanguageState(nextLanguage)
      setStoredLanguage(nextLanguage)
    }

    return {
      language,
      setLanguage,
      t: (key) => labels[language][key] || labels.en[key],
    }
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider")
  }

  return context
}
