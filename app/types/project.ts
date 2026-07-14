/*
 * פרויקטים ויחידות — מלאי הקבלן, המסונכרן למוכרים ולמרקטפלייס.
 * פרקים 5 (דשבורד קבלן) ו-8 (סנכרון קבלן↔מוכר).
 */
import type {
  Id,
  ISODate,
  Localized,
  Money,
  Address,
  MediaAsset,
  Timestamps,
} from './common'

/** סטטוס יחידה. מקור האמת לסנכרון המלאי (פרק 8.1). */
export type UnitStatus = 'available' | 'reserved' | 'inProcess' | 'sold'

/** סטטוס פרסום פרויקט — דורש אישור אדמין לפני מרקטפלייס (פרק 7). */
export type ProjectStatus = 'draft' | 'pending' | 'published' | 'archived'

/** רשומת שינוי מחיר — היסטוריה מלאה לצורך סנכרון והתראות. */
export interface PriceChange {
  at: ISODate
  from: Money
  to: Money
  /** מי שינה (משתמש) או "import" ממנוע ה-AI. */
  changedBy: Id | 'import'
}

export interface Unit extends Timestamps {
  id: Id
  projectId: Id
  /** שם/מספר יחידה כפי שמוצג ("דירה 12, קומה 3"). */
  name: string
  rooms: number
  sqm: number
  floor?: string
  price: Money
  status: UnitStatus
  gallery?: MediaAsset[]
  /** מזהה הרוכש (לקוח) אם הוקצה. */
  buyerId?: Id
  /** שריון פעיל, אם קיים (מונע מכירה כפולה — פרק 8.1). */
  reservationId?: Id
  priceHistory?: PriceChange[]
}

export interface Project extends Timestamps {
  id: Id
  /** הקבלן (ארגון) שמחזיק במלאי. */
  contractorId: Id
  status: ProjectStatus
  /** שם בינלאומי — מתורגם (פרק 14). */
  name: Localized
  description?: Localized
  address: Address
  cover: MediaAsset
  gallery: MediaAsset[]
  units: Unit[]
}

/**
 * שריון/הזמנת יחידה על ציר קבלן↔מוכר (פרק 8.1).
 * מוכר מבקש → קבלן מאשר/דוחה. שכבת הנעילה מונעת מכירה כפולה.
 */
export type ReservationStatus =
  'requested' | 'approved' | 'rejected' | 'expired'

export interface Reservation extends Timestamps {
  id: Id
  unitId: Id
  projectId: Id
  /** המוכר שביקש את השריון. */
  sellerId: Id
  /** הלקוח שעבורו שוריינה היחידה (אם ידוע). */
  clientId?: Id
  status: ReservationStatus
  /** פקיעת שריון אוטומטית. */
  expiresAt?: ISODate
  note?: string
}
