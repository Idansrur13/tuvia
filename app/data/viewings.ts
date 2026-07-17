/*
 * סיורים וביקורים דמו — "מי מגיע לביקור ולאיזה נכס" (דשבורד המוכר, פרק 6).
 * מקושרים ללידים אמיתיים וליחידות/נכסים מהמאגר. סביב 10.07.2026.
 */
import type { Viewing } from '~/types'
import { stamp } from './util'

export const VIEWINGS: Viewing[] = [
  /* ---------- היום (10.07) ---------- */
  {
    id: 'vw-1',
    sellerId: 'u-michal',
    leadId: 'lead-5', // נעמה כץ
    unitId: 'B-06',
    scheduledAt: '2026-07-10T09:30:00Z',
    durationMin: 45,
    status: 'confirmed',
    note: 'ביקור שני — מגיעה עם ההורים',
    ...stamp('2026-07-08'),
  },
  {
    id: 'vw-2',
    sellerId: 'u-michal',
    leadId: 'lead-1', // אבי רוזן
    unitId: 'lst-1',
    scheduledAt: '2026-07-10T12:00:00Z',
    durationMin: 30,
    status: 'scheduled',
    ...stamp('2026-07-09'),
  },
  {
    id: 'vw-3',
    sellerId: 'u-michal',
    leadId: 'lead-3', // דוד לוי
    unitId: 'A-24',
    scheduledAt: '2026-07-10T16:30:00Z',
    durationMin: 60,
    status: 'confirmed',
    note: 'משא ומתן מתקדם — להביא מחירון עדכני',
    ...stamp('2026-07-07'),
  },
  {
    id: 'vw-4',
    sellerId: 'u-david-seller',
    leadId: 'lead-g2',
    unitId: 'M-201',
    scheduledAt: '2026-07-10T13:00:00Z',
    status: 'scheduled',
    ...stamp('2026-07-09'),
  },

  /* ---------- מחר (11.07) ---------- */
  {
    id: 'vw-5',
    sellerId: 'u-michal',
    leadId: 'lead-g3',
    unitId: 'B-31',
    scheduledAt: '2026-07-11T11:00:00Z',
    durationMin: 45,
    status: 'scheduled',
    note: 'מחפשים פנטהאוז — תקציב גבוה',
    ...stamp('2026-07-09'),
  },
  {
    id: 'vw-6',
    sellerId: 'u-michal',
    leadId: 'lead-g7',
    unitId: 'lst-1',
    scheduledAt: '2026-07-11T17:00:00Z',
    status: 'scheduled',
    ...stamp('2026-07-09'),
  },

  /* ---------- בהמשך ---------- */
  {
    id: 'vw-7',
    sellerId: 'u-michal',
    leadId: 'lead-g12',
    unitId: 'C-15',
    scheduledAt: '2026-07-13T10:00:00Z',
    durationMin: 60,
    status: 'scheduled',
    note: 'שיחת וידאו — הלקוחות מחו״ל',
    ...stamp('2026-07-09'),
  },

  /* ---------- הסתיימו ---------- */
  {
    id: 'vw-8',
    sellerId: 'u-michal',
    leadId: 'lead-g5',
    unitId: 'B-31',
    scheduledAt: '2026-07-09T15:00:00Z',
    status: 'completed',
    note: 'התרשמו מאוד — מתלבטים מול נכס אחר',
    ...stamp('2026-07-07', '2026-07-09'),
  },
  {
    id: 'vw-9',
    sellerId: 'u-michal',
    leadId: 'lead-5',
    unitId: 'B-06',
    scheduledAt: '2026-07-08T10:00:00Z',
    status: 'completed',
    ...stamp('2026-07-06', '2026-07-08'),
  },
  {
    id: 'vw-10',
    sellerId: 'u-michal',
    leadId: 'lead-g9',
    unitId: 'lst-1',
    scheduledAt: '2026-07-07T18:00:00Z',
    status: 'noShow',
    ...stamp('2026-07-05', '2026-07-07'),
  },
]

/** הסיורים של מוכר מסוים, לפי מועד. */
export const viewingsFor = (sellerId: string) =>
  VIEWINGS.filter((v) => v.sellerId === sellerId).sort((a, b) =>
    a.scheduledAt.localeCompare(b.scheduledAt),
  )
