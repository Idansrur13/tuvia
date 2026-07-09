/*
 * מסע הלקוח והעסקה — הזמנות, עסקאות, מסמכים ותשלומים.
 * פרקים 4 (דשבורד לקוח) ו-6 (מכירות ועסקאות של המוכר).
 */
import type { Id, ISODate, Money, MediaAsset, Timestamps } from './common'

/* ---------- הזמנת לקוח לפורטל (פרק 5 / 4) ---------- */

export type InviteStatus = 'pending' | 'joined' | 'expired'

export interface Invite extends Timestamps {
  id: Id
  name: string
  email: string
  /** מי הזמין (קבלן/מוכר). */
  invitedById: Id
  projectId?: Id
  unitId?: Id
  status: InviteStatus
  expiresAt?: ISODate
}

/* ---------- עסקה (מסע הרכישה מקצה לקצה) ---------- */

/** שלבי העסקה שהלקוח רואה בסקירה ובסטטוס ההתקדמות. */
export type DealStage =
  | 'reserved'
  | 'contract'
  | 'financing'
  | 'construction'
  | 'handover'
  | 'completed'

export interface Deal extends Timestamps {
  id: Id
  unitId: Id
  projectId: Id
  clientId: Id
  /** המטפל בעסקה — קבלן ו/או מוכר. */
  contractorId: Id
  sellerId?: Id
  stage: DealStage
  price: Money
  /** עמלת המוכר, אם רלוונטי (פרק 6 / 11). */
  commission?: Money
  documents: DealDocument[]
  payments: Payment[]
}

/* ---------- מסמכים וחוזה (פרק 4) ---------- */

export type DocumentKind = 'contract' | 'appendix' | 'approval' | 'receipt' | 'other'
export type DocumentStatus = 'draft' | 'pendingSignature' | 'signed'

export interface DealDocument extends Timestamps {
  id: Id
  dealId: Id
  kind: DocumentKind
  status: DocumentStatus
  file: MediaAsset
  /** נדרשת חתימה/אישור דיגיטלי של הלקוח. */
  requiresSignature: boolean
  signedAt?: ISODate
}

/* ---------- תשלומים (פרק 4) ---------- */

export type PaymentStatus = 'scheduled' | 'due' | 'paid' | 'overdue'

export interface Payment {
  id: Id
  dealId: Id
  /** תיאור התשלום ("מקדמה", "תשלום 2/4"). */
  label: string
  amount: Money
  dueDate: ISODate
  status: PaymentStatus
  paidAt?: ISODate
  receipt?: MediaAsset
}