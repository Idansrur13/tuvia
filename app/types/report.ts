/*
 * דוחות — לקבלן/מוכר/אדמין בלבד, לא ללקוח (פרק 11).
 */
import type { Id, ISODate, Money } from './common'

/** סוגי הדוחות לפי תפקיד. */
export type ReportType =
  | 'salesByProject' // קבלן: מכירות לפי פרויקט/יחידה
  | 'leadsConversion' // קבלן/מוכר: לידים והמרות
  | 'paymentsForecast' // קבלן: תשלומים וצפי הכנסות
  | 'sellerPerformance' // מוכר: ביצועי מכירה + עמלות
  | 'leadSources' // מוכר: מקורות לידים
  | 'platformOverview' // אדמין: דוח-על רוחבי

/** טווח תאריכים לדוח. */
export interface DateRange {
  from: ISODate
  to: ISODate
}

/** בקשת דוח — סוג, טווח, וסינון לפי ישות. */
export interface ReportRequest {
  type: ReportType
  range: DateRange
  /** סינון אופציונלי לישות (פרויקט/מוכר/קבלן). */
  scope?: { projectId?: Id; sellerId?: Id; contractorId?: Id }
}

/** נקודת נתונים בסדרת גרף/טבלה. */
export interface ReportPoint {
  label: string
  value: number
  money?: Money
}

/** סדרה בודדת (קו/עמודה) בתצוגת הדוח. */
export interface ReportSeries {
  name: string
  points: ReportPoint[]
}

/** תוצאת דוח מלאה — מוצגת כטבלה/גרף, ניתנת לייצוא Excel/PDF. */
export interface ReportResult {
  request: ReportRequest
  generatedAt: ISODate
  series: ReportSeries[]
  /** מדדי סיכום (KPI) לראש הדוח. */
  totals: ReportPoint[]
}

export type ReportExportFormat = 'excel' | 'pdf'
