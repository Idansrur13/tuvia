/*
 * משתמשים, תפקידים והרשאות.
 * פרקים 2 (מטריצת תפקידים) ו-7 (ניהול משתמשים).
 */
import type { Id, ISODate, Locale, Currency, Timestamps, MediaAsset } from './common'

/** ארבעת התפקידים במערכת. כל תפקיד → דשבורד והרשאות משלו. */
export type Role = 'client' | 'contractor' | 'seller' | 'admin'

/** סטטוס חשבון (ניהול ע"י אדמין — פרק 7). */
export type UserStatus = 'active' | 'invited' | 'suspended'

/**
 * יכולת בדידה שאפשר להעניק/לשלול. ההרשאה בפועל נגזרת מהתפקיד,
 * אך המודל מאפשר override נקודתי ע"י אדמין.
 */
export type Permission =
  | 'marketplace.view'
  | 'projects.manage'
  | 'portfolio.manage'
  | 'leads.manage'
  | 'leads.viewAll'
  | 'chat.use'
  | 'reports.view'
  | 'reports.viewAll'
  | 'articles.manage'
  | 'users.manage'
  | 'ai.import'

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
  avatar?: MediaAsset
  preferences: UserPreferences
  /** override להרשאות שנגזרות מהתפקיד (אופציונלי). */
  permissions?: Permission[]
  /** שיוך לארגון (קבלן/סוכנות). null ללקוח עצמאי / אדמין-על. */
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
  logo?: MediaAsset
  /** אזורי פעילות (למוכר/סוכנות — פרק 6). */
  regions?: string[]
  /** אושר ע"י אדמין להצגה במרקטפלייס. */
  verified: boolean
}