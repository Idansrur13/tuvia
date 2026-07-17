/*
 * משתמשים, תפקידים והרשאות.
 * פרקים 2 (מטריצת תפקידים) ו-7 (ניהול משתמשים).
 */
import type {
  Id,
  ISODate,
  Locale,
  Currency,
  Timestamps,
  MediaAsset,
} from './common'

/** ארבעת התפקידים במערכת. כל תפקיד → דשבורד והרשאות משלו. */
export type Role = 'client' | 'contractor' | 'seller' | 'admin'

/** סטטוס חשבון (ניהול ע"י אדמין — פרק 7). */
export type UserStatus = 'active' | 'invited' | 'suspended'

/** העדפות בינלאומיות ואישיות של המשתמש. */
export interface UserPreferences {
  locale: Locale
  currency: Currency
  /** אזור זמן IANA, למשל "Asia/Jerusalem". */
  timeZone?: string
}

export interface User extends Timestamps {
  id: Id
  role: Role
  status: UserStatus
  name: string
  email: string
  phone?: string
  avatar?: string
  preferences?: UserPreferences

  organizationId?: Id
  lastActiveAt?: ISODate
}

/** סוג הארגון קובע איזה דשבורד ואיזה מלאי שייכים אליו. */
export type OrganizationType = 'contractor' | 'agency'

/** ארגון = חברת קבלן או סוכנות תיווך. מקבץ משתמשים ומלאי. */
export interface Organization extends Timestamps {
  id: Id
  type: OrganizationType
  name: string
  /**
   * אנונימיות קבלנים (פרק 17): באזור הציבורי קבלן מוצג רק
   * במספר/כינוי, ללא שם. לדוגמה: "C-104".
   */
  alias?: string
  logo?: MediaAsset
  /** אזורי פעילות (למוכר/סוכנות — פרק 6). */
  regions?: string[]
  /** אושר ע"י אדמין להצגה במרקטפלייס. */
  verified: boolean
}

/* ---------- בקשת הצטרפות קבלן/מתווך (פרק 17) ---------- */

/** קבלן או מתווך חדש מגיש בקשה; מאושר רק על ידי מנהל. */
export type PartnerApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface PartnerApplication extends Timestamps {
  id: Id
  /** סוג השותף המבקש להצטרף. */
  type: OrganizationType
  companyName: string
  contactName: string
  email: string
  phone?: string
  country: string
  status: PartnerApplicationStatus
  /** האדמין שטיפל בבקשה. */
  reviewedById?: Id
  reviewedAt?: ISODate
  note?: string
}
