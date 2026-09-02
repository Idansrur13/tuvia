/*
 * סיורים וביקורים — ניהול "מי מגיע לביקור ולאיזה נכס" של המוכר (פרק 6).
 * כל סיור מקשר ליד ↔ נכס (יחידת קבלן או נכס עצמאי) ↔ מועד.
 */
import type { Id, ISODate, Timestamps } from './common'

export type ViewingStatus =
  'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'noShow'

export interface Viewing extends Timestamps {
  id: Id
  /** המוכר/סוכן שמוביל את הסיור. */
  sellerId: Id
  /** הליד/מתעניין שמגיע לביקור. */
  leadId: Id
  /** הנכס שמראים — יחידה (מלאי קבלן או נכס עצמאי). */
  unitId?: Id
  scheduledAt: ISODate
  /** משך משוער בדקות. */
  durationMin?: number
  status: ViewingStatus
  note?: string
}
