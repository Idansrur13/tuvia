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
import type { DealType, ListingAvailability, ListingCategory } from './listing'

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
  projectId?: Id
  agentId: Id
  agentRole: 'contractor' | 'seller'
  publishedToMarketplace?: boolean
  /** שם/מספר יחידה כפי שמוצג ("דירה 12, קומה 3"). */
  title: Localized
  description: Localized
  address: Address
  rooms: number
  sqm: number
  floor?: string
  price?: Money
  status: UnitStatus
  /** שריון פעיל, אם קיים (מונע מכירה כפולה — פרק 8.1). */
  reservationId?: Id
  buyerId?: Id
  priceHistory?: PriceChange[]

  dealType: DealType
  category: ListingCategory
  availability: ListingAvailability

  yearBuilt?: number
  parking?: number
  /** תאריך אכלוס/כניסה — ISO או "flexible". */
  entry?: ISODate | 'flexible'
  /** תגית שיווקית ("בלעדיות", "חדש מקבלן"). */
  badge?: Localized
  features: Localized[]
  gallery?: MediaAsset[]
  /** האחראי המוצג ליצירת קשר — קבלן או מוכר. */
}

export interface Project extends Timestamps {
  id: Id
  /** הקבלן (ארגון) שמחזיק במלאי. */
  contractorId: Id
  status: ProjectStatus
  /** שם בינלאומי — מתורגם (פרק 14). */
  name: Localized
  description?: Localized
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
  /** נגזר מהיחידה; ריק ליחידה עצמאית (ללא פרויקט). */
  projectId?: Id
  /** המוכר שביקש את השריון. */
  sellerId: Id
  /** הלקוח שעבורו שוריינה היחידה (אם ידוע). */
  clientId?: Id
  status: ReservationStatus
  /** פקיעת שריון אוטומטית. */
  expiresAt?: ISODate
  note?: string
}
