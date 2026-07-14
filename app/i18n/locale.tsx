/*
 * תשתית רב-לשוניות גלובלית (פרק 14 באפיון).
 * - useLocale() נותן locale, dir, מתגי שפה, t() לתוכן דינמי ו-tt() למחרוזות ממשק.
 * - ההעדפה נשמרת ב-cookie כדי שה-loader של ה-root ירנדר בשרת בשפה הנכונה,
 *   ו-<html lang/dir> מרונדרים מה-context ב-root.tsx (בלי מוטציה ידנית).
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
export const LOCALE_COOKIE = 'locale'

export function LocaleProvider({
  children,
  initialLocale = 'en',
}: {
  children: ReactNode
  /* מגיע מה-loader של ה-root (נקרא מה-cookie בשרת); אנגלית ברירת מחדל (פרק 14). */
  initialLocale?: Locale
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale)

  // שמירת ההעדפה ל-cookie כדי שהרינדור הבא בשרת יצא כבר בשפה הנכונה
  useEffect(() => {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
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
