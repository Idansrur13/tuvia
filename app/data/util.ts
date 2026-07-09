/*
 * כלי עזר משותפים לשכבת נתוני הדמו.
 * שכבה זו היא seed בלבד — כשמתחברים ל-DB אמיתי מחליפים את app/data/*.
 */
import type {
  Country,
  Currency,
  Locale,
  Localized,
  MediaAsset,
  Money,
  Timestamps,
} from '~/types'

/** בונה URL תמונה מ-Unsplash (כמו בקוד הקיים). */
export const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`

let assetSeq = 0
/** עוטף מזהה תמונה ל-MediaAsset מלא. */
export const img = (id: string): MediaAsset => ({
  id: `img-${++assetSeq}`,
  url: IMG(id),
  kind: 'image',
})

/** קיצור ליצירת ערך רב-לשוני. */
export const L = (he: string, en: string): Localized => ({ he, en })

/** קיצור ליצירת סכום כספי. */
export const money = (amount: number, currency: Currency): Money => ({
  amount,
  currency,
})

/** פורמט סכום למטבע ולשפה, ללא ספרות אחרי הנקודה. */
export const formatMoney = (m: Money, locale: Locale = 'he') =>
  new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US', {
    style: 'currency',
    currency: m.currency,
    maximumFractionDigits: 0,
  }).format(m.amount)

/** קיצור למילוי חותמות זמן (ברירת מחדל: updatedAt === createdAt). */
export const stamp = (
  createdAt: string,
  updatedAt = createdAt,
): Timestamps => ({
  createdAt,
  updatedAt,
})

/** מדינות הדמו. */
export const COUNTRIES: Record<string, Country> = {
  IL: { code: 'IL', name: L('ישראל', 'Israel'), flag: '🇮🇱' },
  CY: { code: 'CY', name: L('קפריסין', 'Cyprus'), flag: '🇨🇾' },
  US: { code: 'US', name: L('ארצות הברית', 'United States'), flag: '🇺🇸' },
  GB: { code: 'GB', name: L('בריטניה', 'United Kingdom'), flag: '🇬🇧' },
  FR: { code: 'FR', name: L('צרפת', 'France'), flag: '🇫🇷' },
  DE: { code: 'DE', name: L('גרמניה', 'Germany'), flag: '🇩🇪' },
}
