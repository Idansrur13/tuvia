/*
 * טיפוסים משותפים לזרימת הייבוא החכם (משמשים גם בשרת וגם בקליינט).
 */

/** סוג השינוי שזוהה מול הנתונים הקיימים */
export type UnitChange = 'new' | 'priceChanged' | 'sold' | 'unchanged'

export interface ParsedUnit {
  /** מזהה יחידה קיימת אם זוהתה התאמה */
  unitId: string | null
  name: string
  rooms: number | null
  sqm: number | null
  /** מחיר — null פירושו שהיחידה נמכרה */
  price: number | null
  buyer: string | null
  change: UnitChange
  /** המחיר הקודם, כשזוהה עדכון מחיר או מכירה */
  oldPrice?: number
}

export interface ParsedProject {
  /** מזהה פרויקט קיים אם זוהתה התאמה, אחרת null = פרויקט חדש */
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
