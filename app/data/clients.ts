/*
 * מסע הלקוח — הזמנות ועסקאות עם מסמכים, תשלומים ואישורי תשלום
 * (פרקים 4, 6, 16).
 */
import type { Deal, Invite, PaymentApproval } from '~/types'
import { img, money, stamp } from './util'

/** חלון הגישה והעמלה (פרקים 4.1, 16.3) - בחודשים. */
export const ACCESS_WINDOW_MONTHS = 3

/** סוף חלון 3 החודשים מתאריך נתון. */
export const accessWindowEnd = (fromIso: string): string => {
  const d = new Date(fromIso)
  d.setMonth(d.getMonth() + ACCESS_WINDOW_MONTHS)
  return d.toISOString()
}

/** האם תאריך נתון עדיין בתוך חלון 3 החודשים. */
export const isWithinWindow = (fromIso?: string, now = new Date()): boolean =>
  !!fromIso && now.getTime() < new Date(accessWindowEnd(fromIso)).getTime()

export const INVITES: Invite[] = [
  {
    id: 'inv-1',
    name: 'רון אלמוג',
    email: 'ron.almog@gmail.com',
    invitedById: 'u-yossi',
    projectId: 'tlv-towers',
    unitId: 'A-12',
    status: 'joined',
    accessUntil: accessWindowEnd('2026-06-12T00:00:00Z'),
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
  /* לקוח שחלון 3 החודשים שלו הסתיים - הגישה נחסמה (פרק 4.1). */
  {
    id: 'inv-4',
    name: 'David Miller',
    email: 'david.m@gmail.com',
    invitedById: 'u-michal',
    projectId: 'larnaca-bay',
    status: 'blocked',
    accessUntil: accessWindowEnd('2026-03-20T00:00:00Z'),
    ...stamp('2026-03-20'),
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
    stage: 'orderPaid',
    price: money(4_650_000, 'ILS'),
    commission: money(93_000, 'ILS'),
    clientSince: '2026-06-12T00:00:00Z',
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
  {
    id: 'deal-2',
    unitId: 'C-08',
    projectId: 'larnaca-bay',
    clientId: 'u-emma',
    contractorId: 'org-bluebay',
    sellerId: 'u-michal',
    stage: 'orderSent',
    price: money(445_000, 'EUR'),
    commission: money(8_900, 'EUR'),
    clientSince: '2026-06-28T00:00:00Z',
    documents: [
      {
        id: 'doc-3',
        dealId: 'deal-2',
        kind: 'contract',
        status: 'pendingSignature',
        file: img('photo-1554224155-6726b3ff858f'),
        requiresSignature: true,
        ...stamp('2026-07-05'),
      },
    ],
    payments: [
      {
        id: 'pay-4',
        dealId: 'deal-2',
        label: 'Deposit',
        amount: money(44_500, 'EUR'),
        dueDate: '2026-07-15T00:00:00Z',
        status: 'due',
      },
    ],
    ...stamp('2026-07-02', '2026-07-08'),
  },
  /*
   * עסקה שנחתמה מחוץ לחלון 3 החודשים (פרק 16.3) -
   * המתווך אינו זכאי לעמלה.
   */
  {
    id: 'deal-3',
    unitId: 'M-142',
    projectId: 'miami-ocean',
    clientId: 'u-ron',
    contractorId: 'org-bluebay',
    sellerId: 'u-michal',
    stage: 'contractSigned',
    price: money(890_000, 'USD'),
    clientSince: '2026-02-01T00:00:00Z',
    documents: [
      {
        id: 'doc-4',
        dealId: 'deal-3',
        kind: 'contract',
        status: 'signed',
        file: img('photo-1554224155-6726b3ff858f'),
        requiresSignature: true,
        signedAt: '2026-06-30T12:00:00Z',
        ...stamp('2026-06-20', '2026-06-30'),
      },
    ],
    payments: [
      {
        id: 'pay-5',
        dealId: 'deal-3',
        label: 'First payment',
        amount: money(89_000, 'USD'),
        dueDate: '2026-07-01T00:00:00Z',
        status: 'paid',
        paidAt: '2026-07-01T10:00:00Z',
      },
    ],
    ...stamp('2026-06-20', '2026-07-01'),
  },
]

/* ---------- אישורי תשלום דו-שלביים (פרק 16.2) ---------- */

export const PAYMENT_APPROVALS: PaymentApproval[] = [
  /* אושר סופית: קבלן אישר ← מנהל אישר עם אסמכתא. */
  {
    id: 'papr-1',
    dealId: 'deal-3',
    paymentId: 'pay-5',
    amount: money(89_000, 'USD'),
    requestedById: 'u-michal',
    status: 'adminConfirmed',
    contractorApprovedAt: '2026-06-30T15:00:00Z',
    adminConfirmedAt: '2026-07-01T10:00:00Z',
    confirmationRef: 'WIRE-88412-US',
    ...stamp('2026-06-30', '2026-07-01'),
  },
  /* ממתין לאישור מנהל הפלטפורמה. */
  {
    id: 'papr-2',
    dealId: 'deal-1',
    paymentId: 'pay-1',
    amount: money(465_000, 'ILS'),
    requestedById: 'u-michal',
    status: 'contractorApproved',
    contractorApprovedAt: '2026-07-10T09:00:00Z',
    ...stamp('2026-07-09', '2026-07-10'),
  },
  /* בקשה חדשה - ממתינה לאישור הקבלן. */
  {
    id: 'papr-3',
    dealId: 'deal-2',
    paymentId: 'pay-4',
    amount: money(44_500, 'EUR'),
    requestedById: 'u-michal',
    status: 'requested',
    ...stamp('2026-07-12'),
  },
]

export const paymentApprovalsForDeal = (dealId: string) =>
  PAYMENT_APPROVALS.filter((p) => p.dealId === dealId)

export const dealById = (id: string) => DEALS.find((d) => d.id === id)

/** העסקה של לקוח מסוים (לדשבורד הלקוח). */
export const dealForClient = (clientId: string) =>
  DEALS.find((d) => d.clientId === clientId)
