/*
 * לידים — תצוגה מצומצמת + מעקב מתקדם (פרק 13).
 * מקושרים למטפל (assignedToId), לפרויקט/יחידה, ולמקור.
 */
import type { Lead } from '~/types'
import { money, stamp } from './util'

export const LEADS: Lead[] = [
  {
    id: 'lead-1',
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

export const leadById = (id: string) => LEADS.find((l) => l.id === id)

/** לידים המשויכים למשתמש מסוים (קבלן/מוכר). */
export const leadsAssignedTo = (userId: string) =>
  LEADS.filter((l) => l.assignedToId === userId)
