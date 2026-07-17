/*
 * לידים — תצוגה מצומצמת + מעקב מתקדם (פרק 13).
 * מקושרים למטפל (assignedToId), לפרויקט/יחידה, ולמקור.
 */
import type { Currency, Lead, LeadHeat, LeadSource, LeadStage } from '~/types'
import { money, stamp } from './util'

/** לידים "מסופרים" — עם היסטוריה מלאה, לצורכי דמו מפורט. */
const CURATED_LEADS: Lead[] = [
  {
    id: 'lead-1',
    role: 'client',
    status: 'active',

    name: 'אבי רוזן',
    email: 'avi@gmail.com',
    phone: '050-1234567',
    countryCode: 'IL',
    source: 'marketplace',
    stage: 'new',
    heat: 'warm',
    score: 62,
    budget: money(4_500_000, 'ILS'),
    projectId: 'tlv-towers',
    assignedToId: 'u-michal',
    lastActivityAt: '2026-07-09T08:00:00Z',
    activities: [
      {
        id: 'act-1',
        at: '2026-07-09T08:00:00Z',
        kind: 'note',
        byUserId: 'u-michal',
        summary: 'ליד נכנס מהמרקטפלייס',
      },
    ],
    nextFollowUpAt: '2026-07-10T09:00:00Z',
    ...stamp('2026-07-09T08:00:00Z'),
  },
  {
    id: 'lead-2',
    name: 'Emma Wilson',
    role: 'client',
    status: 'active',

    email: 'emma.w@gmail.com',
    phone: '+44 7700 900123',
    countryCode: 'GB',
    source: 'aiAssistant',
    stage: 'contacted',
    heat: 'hot',
    score: 84,
    budget: money(400_000, 'EUR'),
    projectId: 'larnaca-bay',
    unitId: 'C-15',
    assignedToId: 'u-mike',
    lastActivityAt: '2026-07-08T14:30:00Z',
    activities: [
      {
        id: 'act-2',
        at: '2026-07-08T14:30:00Z',
        kind: 'call',
        byUserId: 'u-mike',
        summary: 'שיחת היכרות — מתעניינת בפנטהאוז',
      },
      {
        id: 'act-3',
        at: '2026-07-08T14:35:00Z',
        kind: 'stageChange',
        byUserId: 'u-mike',
        summary: 'קודם לשלב "נוצר קשר"',
        fromStage: 'new',
        toStage: 'contacted',
      },
    ],
    nextFollowUpAt: '2026-07-11T10:00:00Z',
    ...stamp('2026-06-28T10:00:00Z', '2026-07-08T14:35:00Z'),
  },
  {
    id: 'lead-3',
    name: 'דוד לוי',
    role: 'client',
    status: 'active',
    email: 'sadgadsfg.w@gmail.com',
    phone: '052-9876543',
    countryCode: 'IL',
    source: 'referral',
    stage: 'negotiation',
    heat: 'hot',
    score: 91,
    budget: money(5_500_000, 'ILS'),
    projectId: 'tlv-towers',
    unitId: 'A-24',
    assignedToId: 'u-yossi',
    lastActivityAt: '2026-07-07T16:00:00Z',
    activities: [
      {
        id: 'act-4',
        at: '2026-07-07T16:00:00Z',
        kind: 'meeting',
        byUserId: 'u-yossi',
        summary: 'פגישה במשרד — דנו במחיר',
      },
    ],
    ...stamp('2026-06-20T09:00:00Z', '2026-07-07T16:00:00Z'),
  },
  {
    id: 'lead-4',
    name: 'Carlos Mendez',
    email: 'carlos.m@gmail.com',
    role: 'client',
    status: 'active',
    phone: '+1 305 555 0134',
    countryCode: 'US',
    source: 'campaign',
    stage: 'won',
    heat: 'hot',
    score: 100,
    budget: money(1_150_000, 'USD'),
    projectId: 'miami-ocean',
    unitId: 'M-142',
    assignedToId: 'u-david-seller',
    lastActivityAt: '2026-06-30T12:00:00Z',
    activities: [
      {
        id: 'act-5',
        at: '2026-06-30T12:00:00Z',
        kind: 'stageChange',
        byUserId: 'u-david-seller',
        summary: 'העסקה נסגרה',
        fromStage: 'negotiation',
        toStage: 'won',
      },
    ],
    ...stamp('2026-05-15T09:00:00Z', '2026-06-30T12:00:00Z'),
  },
  {
    id: 'lead-5',
    name: 'נעמה כץ',
    email: 'naama.k@gmail.com',
    role: 'client',
    status: 'active',
    phone: '053-7778888',
    countryCode: 'IL',
    source: 'manual',
    stage: 'meeting',
    heat: 'warm',
    score: 58,
    budget: money(3_800_000, 'ILS'),
    projectId: 'tlv-towers',
    unitId: 'B-06',
    assignedToId: 'u-michal',
    lastActivityAt: '2026-07-09T07:00:00Z',
    activities: [
      {
        id: 'act-6',
        at: '2026-07-09T07:00:00Z',
        kind: 'meeting',
        byUserId: 'u-michal',
        summary: 'סיור בדירה נקבע להיום',
      },
    ],
    nextFollowUpAt: '2026-07-09T17:00:00Z',
    ...stamp('2026-07-01T09:00:00Z', '2026-07-09T07:00:00Z'),
  },
]

/* ---------- מחולל לידים דטרמיניסטי ----------
 * מדמה מערכת אמיתית עם מאות לידים (עימוד/סינון/מיון בעמוד הלידים).
 * PRNG עם seed קבוע → אותה תוצאה בשרת ובלקוח (בטוח ל-SSR/hydration).
 */

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const BASE = Date.parse('2026-07-09T10:00:00Z')
const DAY = 86_400_000
const rnd = mulberry32(2026)
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]

const FIRST_NAMES = [
  'נועה',
  'איתי',
  'מאיה',
  'עומר',
  'שירה',
  'דניאל',
  'תמר',
  'אלון',
  'יעל',
  'אורי',
  'רוני',
  'ליאור',
  'הילה',
  'גיא',
  'עדי',
  'Sophie',
  'Liam',
  'Olivia',
  'Noah',
  'Mia',
  'Lucas',
  'Emma',
  'Ethan',
]
const LAST_NAMES = [
  'לוי',
  'כהן',
  'מזרחי',
  'פרץ',
  'ביטון',
  'אברהם',
  'פרידמן',
  'שפירא',
  'אזולאי',
  'Smith',
  'Brown',
  'Garcia',
  'Müller',
  'Rossi',
  'Dubois',
]
const COUNTRY_POOL = ['IL', 'IL', 'IL', 'US', 'GB', 'FR', 'DE', 'CY']
const SOURCE_POOL: LeadSource[] = [
  'marketplace',
  'marketplace',
  'aiAssistant',
  'referral',
  'campaign',
  'manual',
]
const STAGE_POOL: LeadStage[] = [
  'new',
  'new',
  'contacted',
  'contacted',
  'meeting',
  'negotiation',
  'won',
  'lost',
]
const ASSIGNEE_POOL = ['u-yossi', 'u-michal', 'u-david-seller', 'u-mike']
const PROJECT_POOL = [
  'tlv-towers',
  'tlv-towers',
  'larnaca-bay',
  'miami-ocean',
  '',
]

const BUDGET_BY_PROJECT: Record<string, [Currency, number, number]> = {
  'tlv-towers': ['ILS', 2_500_000, 8_000_000],
  'larnaca-bay': ['EUR', 250_000, 900_000],
  'miami-ocean': ['USD', 400_000, 2_400_000],
  '': ['ILS', 1_000_000, 5_000_000],
}

const STAGE_SCORE: Record<LeadStage, number> = {
  new: 35,
  contacted: 45,
  meeting: 60,
  negotiation: 80,
  won: 100,
  lost: 10,
}

const GENERATED_LEADS: Lead[] = Array.from({ length: 75 }, (_, i) => {
  const stage = pick(STAGE_POOL)
  const projectId = pick(PROJECT_POOL)
  const [currency, min, max] = BUDGET_BY_PROJECT[projectId]

  const createdAt = new Date(
    BASE - (Math.floor(rnd() * 90) + 1) * DAY,
  ).toISOString()
  const lastActivityAt = new Date(
    BASE - Math.floor(rnd() * 21) * DAY - Math.floor(rnd() * 10) * 3_600_000,
  ).toISOString()

  const heat: LeadHeat =
    stage === 'won' || stage === 'negotiation'
      ? 'hot'
      : rnd() > 0.55
        ? 'warm'
        : rnd() > 0.4
          ? 'cold'
          : 'hot'

  const score = Math.max(
    5,
    Math.min(
      100,
      STAGE_SCORE[stage] +
        (heat === 'hot' ? 10 : heat === 'warm' ? 0 : -10) +
        Math.round(rnd() * 14 - 7),
    ),
  )

  // חלק עם תזכורת מעקב — שליש מהן באיחור, כדי להדגים את הסינון
  const followRoll = rnd()
  const isOpen = stage !== 'won' && stage !== 'lost'
  const nextFollowUpAt =
    isOpen && followRoll < 0.3
      ? new Date(BASE - (Math.floor(rnd() * 6) + 1) * DAY).toISOString()
      : isOpen && followRoll < 0.6
        ? new Date(BASE + (Math.floor(rnd() * 10) + 1) * DAY).toISOString()
        : undefined

  return {
    id: `lead-g${i + 1}`,
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    role: 'client',
    status: 'active',
    email: `lead${i + 1}@example.com`,
    phone: `05${Math.floor(rnd() * 3)}-${1_000_000 + Math.floor(rnd() * 8_999_999)}`,
    countryCode: pick(COUNTRY_POOL),
    source: pick(SOURCE_POOL),
    stage,
    heat,
    score,
    budget: money(
      Math.round((min + rnd() * (max - min)) / 10_000) * 10_000,
      currency,
    ),
    projectId: projectId || undefined,
    assignedToId: pick(ASSIGNEE_POOL),
    activities: [
      {
        id: `act-g${i + 1}`,
        at: createdAt,
        kind: 'note',
        byUserId: 'u-yossi',
        summary: 'ליד נקלט במערכת',
      },
    ],
    nextFollowUpAt,
    lastActivityAt,
    createdAt,
    updatedAt: lastActivityAt,
  }
})

/** כל הלידים — המסופרים + המחוללים. */
export const LEADS: Lead[] = [...CURATED_LEADS, ...GENERATED_LEADS]

export const leadById = (id: string) => LEADS.find((l) => l.id === id)

/** לידים המשויכים למשתמש מסוים (קבלן/מוכר). */
export const leadsAssignedTo = (userId: string) =>
  LEADS.filter((l) => l.assignedToId === userId)
