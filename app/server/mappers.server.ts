/*
 * שכבת מיפוי: רשומות Prisma ← → טיפוסי הדומיין ב-app/types.
 * מוסכמות (ראו prisma/schema.prisma):
 *   Json ← Localized / MediaAsset / Country / PriceChange[]
 *   amount+currency ← Money
 *   עמודות שטוחות ← Address
 *   DateTime ← ISODate (מחרוזת)
 */
import type {
  Address,
  Country,
  Deal,
  DealDocument,
  Invite,
  Lead,
  LeadActivity,
  Localized,
  MediaAsset,
  Money,
  Organization,
  PartnerApplication,
  Payment,
  PaymentApproval,
  PriceChange,
  Project,
  Reservation,
  Unit,
  User,
  UserPreferences,
  Viewing,
} from '~/types'
import type {
  Deal as DbDeal,
  DealDocument as DbDealDocument,
  Invite as DbInvite,
  Lead as DbLead,
  LeadActivity as DbLeadActivity,
  Organization as DbOrganization,
  PartnerApplication as DbPartnerApplication,
  Payment as DbPayment,
  PaymentApproval as DbPaymentApproval,
  Project as DbProject,
  Reservation as DbReservation,
  Unit as DbUnit,
  User as DbUser,
  Viewing as DbViewing,
} from '../../generated/prisma/client'

const iso = (d: Date) => d.toISOString()
const isoOpt = (d: Date | null | undefined) => (d ? iso(d) : undefined)

const money = (amount: number, currency: string): Money => ({
  amount,
  currency: currency as Money['currency'],
})

const moneyOpt = (
  amount: number | null,
  currency: string | null,
): Money | undefined =>
  amount != null && currency != null ? money(amount, currency) : undefined

type AddressRow = {
  country: unknown
  city: string
  neighborhood: string | null
  street: string | null
  lat: number | null
  lng: number | null
}

const toAddress = (r: AddressRow): Address => ({
  country: r.country as Country,
  city: r.city,
  neighborhood: r.neighborhood ?? undefined,
  street: r.street ?? undefined,
  point:
    r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : undefined,
})

const stamps = (r: { createdAt: Date; updatedAt: Date }) => ({
  createdAt: iso(r.createdAt),
  updatedAt: iso(r.updatedAt),
})

/* ---------- משתמשים וארגונים ---------- */

export const toOrganization = (r: DbOrganization): Organization => ({
  id: r.id,
  type: r.type,
  name: r.name,
  alias: r.alias ?? undefined,
  logo: (r.logo as MediaAsset | null) ?? undefined,
  regions: r.regions.length ? r.regions : undefined,
  verified: r.verified,
  ...stamps(r),
})

export const toPartnerApplication = (
  r: DbPartnerApplication,
): PartnerApplication => ({
  id: r.id,
  type: r.type,
  companyName: r.companyName,
  contactName: r.contactName,
  email: r.email,
  phone: r.phone ?? undefined,
  country: r.country,
  status: r.status,
  reviewedById: r.reviewedById ?? undefined,
  reviewedAt: isoOpt(r.reviewedAt),
  note: r.note ?? undefined,
  ...stamps(r),
})

export const toPaymentApproval = (r: DbPaymentApproval): PaymentApproval => ({
  id: r.id,
  dealId: r.dealId,
  paymentId: r.paymentId ?? undefined,
  amount: money(r.amount, r.currency),
  requestedById: r.requestedById,
  status: r.status,
  contractorApprovedAt: isoOpt(r.contractorApprovedAt),
  adminConfirmedAt: isoOpt(r.adminConfirmedAt),
  confirmationRef: r.confirmationRef ?? undefined,
  ...stamps(r),
})

export const toUser = (r: DbUser): User => ({
  id: r.id,
  role: r.role,
  status: r.status,
  name: r.name,
  email: r.email,
  phone: r.phone ?? undefined,
  /* בעמודה שמור MediaAsset כ-Json; בדומיין — כתובת התמונה בלבד */
  avatar: (r.avatar as MediaAsset | null)?.url ?? undefined,
  preferences: {
    locale: r.locale as UserPreferences['locale'],
    currency: r.currency,
    timeZone: r.timeZone ?? undefined,
  },
  organizationId: r.organizationId ?? undefined,
  lastActiveAt: isoOpt(r.lastActiveAt),
  ...stamps(r),
})

/* ---------- פרויקטים ויחידות ---------- */

/** יחידה = הנכס המלא (מיזוג Listing→Unit): מלאי, כתובת ושדות שיווק. */
export const toUnit = (r: DbUnit): Unit => ({
  id: r.id,
  projectId: r.projectId ?? undefined,
  title: r.title as Localized,
  description: r.description as Localized,
  address: toAddress(r),
  agentId: r.agentId,
  agentRole: r.agentRole,
  publishedToMarketplace: r.publishedToMarketplace,
  dealType: r.dealType,
  category: r.category,
  availability: r.availability,
  rooms: r.rooms,
  sqm: r.sqm,
  floor: r.floor ?? undefined,
  price: moneyOpt(r.priceAmount, r.priceCurrency),
  status: r.status,
  yearBuilt: r.yearBuilt ?? undefined,
  parking: r.parking ?? undefined,
  entry: r.entry ?? undefined,
  badge: (r.badge as Localized | null) ?? undefined,
  features: r.features as unknown as Localized[],
  gallery: (r.gallery as unknown as MediaAsset[] | null) ?? undefined,
  buyerId: r.buyerId ?? undefined,
  reservationId: r.activeReservationId ?? undefined,
  priceHistory: (r.priceHistory as unknown as PriceChange[]).length
    ? (r.priceHistory as unknown as PriceChange[])
    : undefined,
  ...stamps(r),
})

export const toProject = (r: DbProject & { units: DbUnit[] }): Project => ({
  id: r.id,
  contractorId: r.contractorId,
  status: r.status,
  name: r.name as Localized,
  description: (r.description as Localized | null) ?? undefined,
  units: r.units.map(toUnit),
  ...stamps(r),
})

export const toReservation = (r: DbReservation): Reservation => ({
  id: r.id,
  unitId: r.unitId,
  projectId: r.projectId ?? undefined,
  sellerId: r.sellerId,
  clientId: r.clientId ?? undefined,
  status: r.status,
  expiresAt: isoOpt(r.expiresAt),
  note: r.note ?? undefined,
  ...stamps(r),
})

/* ---------- לידים ---------- */

export const toLeadActivity = (r: DbLeadActivity): LeadActivity => ({
  id: r.id,
  at: iso(r.at),
  kind: r.kind,
  byUserId: r.byUserId,
  summary: r.summary,
  fromStage: r.fromStage ?? undefined,
  toStage: r.toStage ?? undefined,
})

/**
 * ליד = הרחבה של User (PK משותף): הזהות מגיעה משורת המשתמש,
 * שדות המסע (שלב/חום/ניקוד/יומן) מטבלת ההרחבה.
 */
export const toLead = (
  r: DbLead & { activities: DbLeadActivity[]; user: DbUser },
): Lead => ({
  ...toUser(r.user),
  countryCode: r.countryCode ?? undefined,
  source: r.source,
  stage: r.stage,
  heat: r.heat,
  score: r.score,
  budget: moneyOpt(r.budgetAmount, r.budgetCurrency),
  projectId: r.projectId ?? undefined,
  unitId: r.unitId ?? undefined,
  assignedToId: r.assignedToId ?? undefined,
  activities: r.activities.map(toLeadActivity),
  nextFollowUpAt: isoOpt(r.nextFollowUpAt),
  lastActivityAt: iso(r.lastActivityAt),
  ...stamps(r),
})

/* ---------- סיורים ---------- */

export const toViewing = (r: DbViewing): Viewing => ({
  id: r.id,
  sellerId: r.sellerId,
  leadId: r.leadId,
  unitId: r.unitId ?? undefined,
  scheduledAt: iso(r.scheduledAt),
  durationMin: r.durationMin ?? undefined,
  status: r.status,
  note: r.note ?? undefined,
  ...stamps(r),
})

/* ---------- הזמנות ועסקאות ---------- */

export const toInvite = (r: DbInvite): Invite => ({
  id: r.id,
  name: r.name,
  email: r.email,
  invitedById: r.invitedById,
  projectId: r.projectId ?? undefined,
  unitId: r.unitId ?? undefined,
  status: r.status,
  expiresAt: isoOpt(r.expiresAt),
  accessUntil: isoOpt(r.accessUntil),
  ...stamps(r),
})

export const toDealDocument = (r: DbDealDocument): DealDocument => ({
  id: r.id,
  dealId: r.dealId,
  kind: r.kind,
  status: r.status,
  file: r.file as unknown as MediaAsset,
  requiresSignature: r.requiresSignature,
  signedAt: isoOpt(r.signedAt),
  ...stamps(r),
})

export const toPayment = (r: DbPayment): Payment => ({
  id: r.id,
  dealId: r.dealId,
  label: r.label,
  amount: money(r.amount, r.currency),
  dueDate: iso(r.dueDate),
  status: r.status,
  paidAt: isoOpt(r.paidAt),
  receipt: (r.receipt as MediaAsset | null) ?? undefined,
})

export const toDeal = (
  r: DbDeal & { documents: DbDealDocument[]; payments: DbPayment[] },
): Deal => ({
  id: r.id,
  unitId: r.unitId,
  projectId: r.projectId,
  clientId: r.clientId,
  contractorId: r.contractorId,
  sellerId: r.sellerId ?? undefined,
  stage: r.stage,
  price: money(r.priceAmount, r.priceCurrency),
  commission: moneyOpt(r.commissionAmount, r.commissionCurrency),
  clientSince: isoOpt(r.clientSince),
  documents: r.documents.map(toDealDocument),
  payments: r.payments.map(toPayment),
  ...stamps(r),
})
