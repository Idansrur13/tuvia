/*
 * מסע הלקוח והעסקה — הזמנות, עסקאות, מסמכים ותשלומים.
 * פרקים 4 (דשבורד לקוח) ו-6 (מכירות ועסקאות של המוכר).
 */
import type { Id, ISODate, Money, MediaAsset, Timestamps } from './common'

/* ---------- הזמנת לקוח לפורטל (פרק 5 / 4) ---------- */

export type InviteStatus = 'pending' | 'joined' | 'expired' | 'blocked'

export interface Invite extends Timestamps {
  id: Id
  name: string
  email: string
  /** מי הזמין (קבלן/מוכר). */
  invitedById: Id
  projectId?: Id
  unitId?: Id
  status: InviteStatus
  /** תפוגת קישור ההזמנה (לפני הצטרפות). */
  expiresAt?: ISODate
  /**
   * גישה זמנית (פרק 4.1): גישת הלקוח נחסמת בתום 3 חודשים.
   * חידוש רק על ידי המתווך או הקבלן (מאריכים את התאריך).
   */
  accessUntil?: ISODate
}

/* ---------- עסקה (מסע הרכישה מקצה לקצה) ---------- */

/**
 * שלבי העסקה (פרק 16.1):
 * מו"מ ← זכרון דברים (טופס הזמנה) ← הזמנה נשלחה ← הזמנה נחתמה
 * ← הזמנה שולמה ← חתימת חוזה (כאן נכנס התשלום הראשון לפלטפורמה).
 */
export type DealStage =
  | 'negotiation'
  | 'memorandum'
  | 'orderSent'
  | 'orderSigned'
  | 'orderPaid'
  | 'contractSigned'

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
  /**
   * מתי הלקוח הוכנס למערכת ע"י המתווך - לחישוב חלון העמלה
   * של 3 חודשים (פרק 16.3).
   */
  clientSince?: ISODate
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

/* ---------- אישור תשלום דו-שלבי (פרק 16.2) ---------- */

/**
 * בקשת תשלום ← אישור הקבלן ← אישור מנהל הפלטפורמה עם פרטי האישור.
 */
export type PaymentApprovalStatus =
  | 'requested'
  | 'contractorApproved'
  | 'adminConfirmed'
  | 'rejected'

export interface PaymentApproval extends Timestamps {
  id: Id
  dealId: Id
  /** התשלום שאליו מתייחסת הבקשה (אופציונלי). */
  paymentId?: Id
  amount: Money
  /** מי שלח את בקשת התשלום (מוכר/מתווך). */
  requestedById: Id
  status: PaymentApprovalStatus
  contractorApprovedAt?: ISODate
  adminConfirmedAt?: ISODate
  /** פרטי האישור/אסמכתא שמזין מנהל הפלטפורמה. */
  confirmationRef?: string
}

/* ---------- דירוג פלטפורמה (פרק 16.4 - בונוס, סוף roadmap) ---------- */

export interface PlatformRating {
  id: Id
  dealId: Id
  clientId: Id
  /** 1-5 כוכבים. */
  stars: 1 | 2 | 3 | 4 | 5
  comment?: string
  createdAt: ISODate
}