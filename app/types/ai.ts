/*
 * שכבת ה-AI:
 *  - בוט המלצות שיחתי לאזור הציבורי (פרק 3.3).
 *  - מנוע הייבוא החכם (פרק 12) — הטיפוסים קיימים ב-contractor/import-types
 *    ומיוצאים כאן מחדש כדי לרכז את כל טיפוסי ה-AI במקום אחד.
 */
import type { Id, ISODate, Locale } from './common'

/* ---------- בוט המלצות (פרק 3.3) ---------- */

export type AiRole = 'user' | 'assistant'

export interface AiChatMessage {
  id: Id
  role: AiRole
  content: string
  createdAt: ISODate
  /** נכסים שהומלצו בתשובה זו (אם קיימים). */
  recommendations?: AiRecommendation[]
}

/** המלצה בודדת שהבוט מחזיר — נכס מדורג עם הסבר. */
export interface AiRecommendation {
  listingId: Id
  /** דירוג התאמה 0-100. */
  matchScore: number
  /** הסבר קצר למה הומלץ (בשפת השיחה). */
  reason: string
}

/** שיחה עם הבוט — עם זיכרון הקשר בתוך השיחה. */
export interface AiConversation {
  id: Id
  /** משתמש מחובר → המלצות מבוססות פרופיל. אנונימי → undefined. */
  userId?: Id
  locale: Locale
  messages: AiChatMessage[]
  createdAt: ISODate
}

/* ---------- מנוע ייבוא חכם (פרק 12) ---------- */
/* הטיפוסים האלה שירתו קודם ב-dashboard/import-types.ts (הוסר) ורוכזו לכאן. */

/** סוג השינוי שזוהה מול הנתונים הקיימים. */
export type UnitChange = 'new' | 'priceChanged' | 'sold' | 'unchanged'

export interface ParsedUnit {
  /** מזהה יחידה קיימת אם זוהתה התאמה. */
  unitId: string | null
  name: string
  rooms: number | null
  sqm: number | null
  /** מחיר — null פירושו שהיחידה נמכרה. */
  price: number | null
  buyer: string | null
  change: UnitChange
  /** המחיר הקודם, כשזוהה עדכון מחיר או מכירה. */
  oldPrice?: number
}

export interface ParsedProject {
  /** מזהה פרויקט קיים אם זוהתה התאמה, אחרת null = פרויקט חדש. */
  projectId: string | null
  isNew: boolean
  name: string
  city: string
  country: string
  currency: string
  units: ParsedUnit[]
}

export interface ImportSummary {
  newProjects: number
  newUnits: number
  priceChanges: number
  sold: number
  unchanged: number
}

export interface ImportResult {
  projects: ParsedProject[]
  summary: ImportSummary
}
