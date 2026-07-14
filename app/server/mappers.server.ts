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
  Listing,
  Localized,
  MediaAsset,
  Money,
  Organization,
  Payment,
  PriceChange,
  Project,
  Reservation,
  Unit,
  User,
  Viewing,
} from '~/types'
import type {
  Deal as DbDeal,
  DealDocument as DbDealDocument,
  Invite as DbInvite,
  Lead as DbLead,
  LeadActivity as DbLeadActivity,
  Listing as DbListing,
  Organization as DbOrganization,
  Payment as DbPayment,
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
  point: r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : undefined,
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

export const toUser = (r: DbUser): User => ({
  id: r.id,
  role: r.role,
  status: r.status,
  name: r.name,
  email: r.email,
  phone: r.phone ?? undefined,
  avatar: (r.avatar as MediaAsset | null) ?? undefined,
  preferences: {
    locale: r.locale as User['preferences']['locale'],
    currency: r.currency,
    timeZone: r.timeZone ?? undefined,
  },
  permissions: r.permissions.length
    ? (r.permissions as User['permissions'])
    : undefined,
  organizationId: r.organizationId ?? undefined,
  lastActiveAt: isoOpt(r.lastActiveAt),
  ...stamps(r),
})

/* ---------- פרויקטים ויחידות ---------- */

export const toUnit = (r: DbUnit): Unit => ({
  id: r.id,
  projectId: r.projectId,
  name: r.name,
  rooms: r.rooms,
  sqm: r.sqm,
  floor: r.floor ?? undefined,
  price: money(r.priceAmount, r.priceCurrency),
  status: r.status,
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
  address: toAddress(r),
  cover: r.cover as unknown as MediaAsset,
  gallery: r.gallery as unknown as MediaAsset[],
  units: r.units.map(toUnit),
  ...stamps(r),
})

export const toReservation = (r: DbReservation): Reservation => ({
  id: r.id,
  unitId: r.unitId,
  projectId: r.projectId,
  sellerId: r.sellerId,
  clientId: r.clientId ?? undefined,
  status: r.status,
  expiresAt: isoOpt(r.expiresAt),
  note: r.note ?? undefined,
  ...stamps(r),
})

/* ---------- מרקטפלייס ---------- */

export const toListing = (r: DbListing): Listing => ({
  id: r.id,
  title: r.title as Localized,
  description: r.description as Localized,
  address: toAddress(r),
  dealType: r.dealType,
  category: r.category,
  availability: r.availability,
  price: money(r.priceAmount, r.priceCurrency),
  rooms: r.rooms,
  sqm: r.sqm,
  floor: r.floor ?? undefined,
  yearBuilt: r.yearBuilt ?? undefined,
  parking: r.parking ?? undefined,
  entry: r.entry ?? undefined,
  badge: (r.badge as Localized | null) ?? undefined,
  features: r.features as unknown as Localized[],
  images: r.images as unknown as MediaAsset[],
  projectId: r.projectId ?? undefined,
  unitId: r.unitId ?? undefined,
  agentId: r.agentId,
  agentRole: r.agentRole,
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

export const toLead = (r: DbLead & { activities: DbLeadActivity[] }): Lead => ({
  id: r.id,
  name: r.name,
  email: r.email ?? undefined,
  phone: r.phone ?? undefined,
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
  listingId: r.listingId ?? undefined,
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
