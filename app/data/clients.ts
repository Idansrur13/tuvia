/*
 * מסע הלקוח — הזמנות ועסקאות עם מסמכים ותשלומים (פרקים 4, 6).
 */
import type { Deal, Invite } from '~/types'
import { img, money, stamp } from './util'

export const INVITES: Invite[] = [
  {
    id: 'inv-1',
    name: 'רון אלמוג',
    email: 'ron.almog@gmail.com',
    invitedById: 'u-yossi',
    projectId: 'tlv-towers',
    unitId: 'A-12',
    status: 'joined',
    ...stamp('2026-06-12'),
  },
  {
    id: 'inv-2',
    name: 'Emma Wilson',
    email: 'emma.w@gmail.com',
    invitedById: 'u-mike',
    projectId: 'larnaca-bay',
    status: 'pending',
    expiresAt: '2026-07-28T00:00:00Z',
    ...stamp('2026-06-28'),
  },
  {
    id: 'inv-3',
    name: 'ליאת שמעוני',
    email: 'liat.sh@gmail.com',
    invitedById: 'u-michal',
    projectId: 'tlv-towers',
    status: 'pending',
    ...stamp('2026-07-05'),
  },
]

export const DEALS: Deal[] = [
  {
    id: 'deal-1',
    unitId: 'A-12',
    projectId: 'tlv-towers',
    clientId: 'u-ron',
    contractorId: 'org-tchelet',
    sellerId: 'u-michal',
    stage: 'construction',
    price: money(4_650_000, 'ILS'),
    commission: money(93_000, 'ILS'),
    documents: [
      {
        id: 'doc-1',
        dealId: 'deal-1',
        kind: 'contract',
        status: 'signed',
        file: img('photo-1554224155-6726b3ff858f'),
        requiresSignature: true,
        signedAt: '2026-06-18T10:00:00Z',
        ...stamp('2026-06-15', '2026-06-18'),
      },
      {
        id: 'doc-2',
        dealId: 'deal-1',
        kind: 'approval',
        status: 'pendingSignature',
        file: img('photo-1450101499163-c8848c66ca85'),
        requiresSignature: true,
        ...stamp('2026-07-01'),
      },
    ],
    payments: [
      {
        id: 'pay-1',
        dealId: 'deal-1',
        label: 'מקדמה',
        amount: money(465_000, 'ILS'),
        dueDate: '2026-06-20T00:00:00Z',
        status: 'paid',
        paidAt: '2026-06-20T09:00:00Z',
        receipt: img('photo-1554224154-26032ffc0d07'),
      },
      {
        id: 'pay-2',
        dealId: 'deal-1',
        label: 'תשלום 2/4',
        amount: money(1_500_000, 'ILS'),
        dueDate: '2026-08-01T00:00:00Z',
        status: 'due',
      },
      {
        id: 'pay-3',
        dealId: 'deal-1',
        label: 'תשלום 3/4',
        amount: money(1_500_000, 'ILS'),
        dueDate: '2026-11-01T00:00:00Z',
        status: 'scheduled',
      },
    ],
    ...stamp('2026-06-15', '2026-07-08'),
  },
]

export const dealById = (id: string) => DEALS.find((d) => d.id === id)

/** העסקה של לקוח מסוים (לדשבורד הלקוח). */
export const dealForClient = (clientId: string) =>
  DEALS.find((d) => d.clientId === clientId)
