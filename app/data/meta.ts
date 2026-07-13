/*
 * מטא-נתונים לתצוגה: תוויות רב-לשוניות וצבעים לסטטוסים.
 * מחליף את UNIT_STATUS / LEAD_STAGES הישנים — עכשיו רב-לשוני (פרק 14).
 */
import type {
  DealStage,
  LeadActivity,
  LeadHeat,
  LeadSource,
  LeadStage,
  Localized,
  UnitStatus,
  ViewingStatus,
} from '~/types'
import { L } from './util'

type BadgeTone = 'primary' | 'neutral' | 'warning' | 'success'

/** תווית + גוון badge לכל סטטוס יחידה. */
export const UNIT_STATUS_META: Record<
  UnitStatus,
  { label: Localized; badge: BadgeTone }
> = {
  available: { label: L('פנויה', 'Available'), badge: 'primary' },
  reserved: { label: L('שוריינה', 'Reserved'), badge: 'neutral' },
  inProcess: { label: L('בתהליך מכירה', 'In process'), badge: 'warning' },
  sold: { label: L('נמכרה', 'Sold'), badge: 'success' },
}

/** שלבי צינור הלידים לפי סדר, עם תווית ונקודת צבע. */
export const LEAD_STAGE_META: Record<
  LeadStage,
  { label: Localized; dot: string; order: number }
> = {
  new: { label: L('חדש', 'New'), dot: 'bg-primary-400', order: 0 },
  contacted: {
    label: L('נוצר קשר', 'Contacted'),
    dot: 'bg-violet-400',
    order: 1,
  },
  meeting: {
    label: L('סיור / פגישה', 'Meeting'),
    dot: 'bg-warning-500',
    order: 2,
  },
  negotiation: {
    label: L('משא ומתן', 'Negotiation'),
    dot: 'bg-orange-400',
    order: 3,
  },
  won: { label: L('נסגר', 'Won'), dot: 'bg-success-500', order: 4 },
  lost: { label: L('אבוד', 'Lost'), dot: 'bg-gray-400', order: 5 },
}

/** שלבי הליד לפי סדר — לרינדור עמודות ה-Kanban. */
export const LEAD_STAGES: LeadStage[] = (
  Object.keys(LEAD_STAGE_META) as LeadStage[]
).sort((a, b) => LEAD_STAGE_META[a].order - LEAD_STAGE_META[b].order)

/** שלבי העסקה שהלקוח רואה בסטטוס ההתקדמות. */
export const DEAL_STAGE_META: Record<
  DealStage,
  { label: Localized; order: number }
> = {
  reserved: { label: L('שריון', 'Reserved'), order: 0 },
  contract: { label: L('חוזה', 'Contract'), order: 1 },
  financing: { label: L('מימון', 'Financing'), order: 2 },
  construction: { label: L('בנייה', 'Construction'), order: 3 },
  handover: { label: L('מסירה', 'Handover'), order: 4 },
  completed: { label: L('הושלם', 'Completed'), order: 5 },
}

/** חום הליד — לתיעדוף בתצוגה המצומצמת (פרק 13). */
export const LEAD_HEAT_META: Record<
  LeadHeat,
  { label: Localized; dot: string; text: string; order: number }
> = {
  hot: { label: L('חם', 'Hot'), dot: 'bg-red-500', text: 'text-red-600', order: 0 },
  warm: {
    label: L('פושר', 'Warm'),
    dot: 'bg-amber-400',
    text: 'text-amber-600',
    order: 1,
  },
  cold: {
    label: L('קר', 'Cold'),
    dot: 'bg-sky-400',
    text: 'text-sky-600',
    order: 2,
  },
}

/** מקורות לידים — לניתוב, סינון ודוחות. */
export const LEAD_SOURCE_META: Record<LeadSource, { label: Localized }> = {
  marketplace: { label: L('מרקטפלייס', 'Marketplace') },
  aiAssistant: { label: L('בוט AI', 'AI assistant') },
  referral: { label: L('המלצה', 'Referral') },
  campaign: { label: L('קמפיין', 'Campaign') },
  manual: { label: L('ידני', 'Manual') },
}

/** סוגי פעילות על כרטיס הליד — ליומן הפעילות. */
export const LEAD_ACTIVITY_META: Record<
  LeadActivity['kind'],
  { label: Localized }
> = {
  call: { label: L('שיחה', 'Call') },
  message: { label: L('הודעה', 'Message') },
  meeting: { label: L('פגישה', 'Meeting') },
  note: { label: L('הערה', 'Note') },
  stageChange: { label: L('שינוי שלב', 'Stage change') },
}

/** סטטוסי סיור/ביקור (דשבורד המוכר). */
export const VIEWING_STATUS_META: Record<
  ViewingStatus,
  { label: Localized; badge: 'primary' | 'success' | 'warning' | 'neutral' }
> = {
  scheduled: { label: L('מתואם', 'Scheduled'), badge: 'primary' },
  confirmed: { label: L('אושר', 'Confirmed'), badge: 'success' },
  completed: { label: L('התקיים', 'Completed'), badge: 'neutral' },
  cancelled: { label: L('בוטל', 'Cancelled'), badge: 'warning' },
  noShow: { label: L('לא הגיע/ה', 'No-show'), badge: 'warning' },
}
