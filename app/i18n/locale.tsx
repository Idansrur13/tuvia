/*
 * תשתית רב-לשוניות גלובלית (פרק 14 באפיון).
 * - useLocale() נותן locale, dir, מתגי שפה, t() לתוכן דינמי ו-tt() למחרוזות ממשק.
 * - החלפת שפה מסנכרנת lang/dir על <html> ושומרת ל-localStorage (העדפה נשמרת).
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Direction, Locale, Localized } from '~/types'
import { LOCALE_DIRECTION } from '~/types'
import { DICTIONARY, type DictKey } from './dictionary'

interface LocaleContextValue {
  locale: Locale
  dir: Direction
  setLocale: (l: Locale) => void
  toggle: () => void
  /** תוכן דינמי רב-לשוני → הערך בשפה הנוכחית. */
  t: (value?: Localized) => string
  /** מחרוזת ממשק לפי מפתח מהמילון. */
  tt: (key: DictKey) => string
  /** פורמט תאריך ISO לפי השפה. */
  formatDate: (iso: string) => string
  /** פורמט שעה (HH:mm) לפי השפה — לצ׳אט והתראות. */
  formatTime: (iso: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)
const STORAGE_KEY = 'locale'

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('he')

  // אתחול מהעדפה שמורה (רץ פעם אחת בצד הלקוח)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'he' || saved === 'en') setLocale(saved)
  }, [])

  // סנכרון <html lang/dir> ושמירת ההעדפה
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = LOCALE_DIRECTION[locale]
    localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const value = useMemo<LocaleContextValue>(() => {
    const intlLocale = locale === 'he' ? 'he-IL' : 'en-US'
    return {
      locale,
      dir: LOCALE_DIRECTION[locale],
      setLocale,
      toggle: () => setLocale((p) => (p === 'he' ? 'en' : 'he')),
      t: (v) => (v ? v[locale] : ''),
      tt: (key) => DICTIONARY[locale][key],
      formatDate: (iso) =>
        new Intl.DateTimeFormat(intlLocale, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(new Date(iso)),
      formatTime: (iso) =>
        new Intl.DateTimeFormat(intlLocale, {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(iso)),
    }
  }, [locale])

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within <LocaleProvider>')
  return ctx
}
