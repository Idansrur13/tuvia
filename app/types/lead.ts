/*
 * לידים — תצוגה מצומצמת + מעקב מתקדם (פרק 13).
 * נפח הלידים גבוה, לכן המודל תומך בקומפקטיות, ניקוד, פעילות וניתוב.
 */
import type { Id, ISODate, Money, Timestamps } from './common'

/** שלבי צינור הלידים. */
export type LeadStage =
  | 'new'
  | 'contacted'
  | 'meeting'
  | 'negotiation'
  | 'won'
  | 'lost'

/** מקור הליד — משפיע על ניקוד וניתוב (פרק 8.2). */
export type LeadSource =
  | 'marketplace'
  | 'aiAssistant'
  | 'referral'
  | 'campaign'
  | 'manual'

/** חום הליד — לתיעדוף בתצוגה המצומצמת. */
export type LeadHeat = 'cold' | 'warm' | 'hot'

/** רשומת פעילות על כרטיס הליד (שיחה/הודעה/פגישה/הערה). */
export interface LeadActivity {
  id: Id
  at: ISODate
  kind: 'call' | 'message' | 'meeting' | 'note' | 'stageChange'
  /** מי ביצע. */
  byUserId: Id
  summary: string
  /** לשינוי שלב: מאיפה/לאן. */
  fromStage?: LeadStage
  toStage?: LeadStage
}

export interface Lead extends Timestamps {
  id: Id
  name: string
  email?: string
  phone?: string
  /** קוד מדינה ISO לתצוגת דגל בינלאומית. */
  countryCode?: string
  source: LeadSource
  stage: LeadStage
  heat: LeadHeat
  /** ניקוד 0-100 המחושב ממקור/פעילות/תקציב. */
  score: number
  budget?: Money
  /** שיוך לפרויקט/יחידה שהתעניין בהם. */
  projectId?: Id
  unitId?: Id
  /** המטפל בליד (קבלן/מוכר) — נקבע בניתוב האוטומטי. */
  assignedToId?: Id
  activities: LeadActivity[]
  /** תזכורת מעקב הבאה. */
  nextFollowUpAt?: ISODate
  lastActivityAt: ISODate
}

/**
 * תצוגה שמורה בצינור הלידים (״לידים חמים השבוע״ וכו') — פרק 13.1.
 * מסננים + תצוגה, לשליפה מהירה חוזרת.
 */
export interface SavedLeadView {
  id: Id
  ownerId: Id
  name: string
  display: 'compact' | 'kanban'
  filters: LeadFilters
}

/** מסנני צינור הלידים. */
export interface LeadFilters {
  stages?: LeadStage[]
  sources?: LeadSource[]
  heat?: LeadHeat[]
  assignedToId?: Id
  projectId?: Id
  /** חיפוש חופשי בשם/טלפון/מייל. */
  query?: string
  /** ליד עם תזכורת מעקב שעברה. */
  overdueOnly?: boolean
}