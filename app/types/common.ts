/*
 * טיפוסי יסוד משותפים לכל הדומיינים.
 * פרקים 1 (עקרונות) ו-14 (רב-לשוניות) באפיון.
 */

/** מזהה ישות. מחרוזת (UUID/מזהה DB) בכל המערכת. */
export type Id = string

/** חותמת זמן — ISO 8601 (למשל "2026-07-09T10:30:00Z"). */
export type ISODate = string

/* ---------- בינלאומיות ---------- */

/** שפות נתמכות. אנגלית היא ליבה, לא תוספת. */
export type Locale = 'he' | 'en'

/** כיווניות פריסה הנגזרת מהשפה. */
export type Direction = 'rtl' | 'ltr'

export const LOCALE_DIRECTION: Record<Locale, Direction> = {
  he: 'rtl',
  en: 'ltr',
}

/** קודי מטבע ISO 4217 שהמערכת מכירה. */
export type Currency = 'ILS' | 'EUR' | 'USD' | 'GBP' | 'AED'

/** סכום כספי — תמיד עם מטבע, לעולם לא מספר עירום. */
export interface Money {
  amount: number
  currency: Currency
}

/**
 * ערך תלוי-שפה. משמש לתוכן דינמי (כתבות, שמות פרויקטים בינלאומיים וכו').
 * שדה חובה לכל שפה נתמכת כדי למנוע חורים בתרגום.
 */
export type Localized<T = string> = Record<Locale, T>

/** מדינה — קוד ISO + דגל, לתצוגה בינלאומית. */
export interface Country {
  /** קוד ISO 3166-1 alpha-2, למשל "IL" / "CY" / "US". */
  code: string
  /** שם מתורגם לתצוגה. */
  name: Localized
  /** אמוג׳י דגל, למשל "🇮🇱". */
  flag: string
}

/* ---------- גיאוגרפיה (חיפוש במפה, פרק 3.1) ---------- */

export interface GeoPoint {
  lat: number
  lng: number
}

export interface Address {
  country: Country
  city: string
  neighborhood?: string
  street?: string
  point?: GeoPoint
}

/* ---------- תשתית ---------- */

/** קובץ/מדיה מאוחסן (תמונה, מסמך, וידאו). */
export interface MediaAsset {
  id: Id
  url: string
  kind: 'image' | 'video' | 'document'
  name?: string
  /** גודל בבתים. */
  sizeBytes?: number
  mimeType?: string
}

/** עטיפת עימוד סטנדרטית לרשימות גדולות (לידים/נכסים — פרק 15). */
export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/** מטא-נתונים משותפים לכל רשומה נשמרת. */
export interface Timestamps {
  createdAt: ISODate
  updatedAt: ISODate
}