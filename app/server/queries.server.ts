/*
 * שכבת הגישה לנתונים — מחליפה את הפונקציות הסינכרוניות של app/data.
 * כל פונקציה שולפת מ-Postgres וממירה לטיפוסי הדומיין דרך mappers.server.
 */
import { db } from './db.server'
import {
  toDeal,
  toInvite,
  toLead,
  toOrganization,
  toPayment,
  toProject,
  toReservation,
  toUnit,
  toUser,
  toViewing,
} from './mappers.server'
import type {
  Deal,
  Invite,
  Lead,
  Organization,
  Payment,
  Project,
  Reservation,
  Unit,
  User,
  Viewing,
} from '~/types'
export const CURRENT_SELLER_ID = 'u-michal'

/* ---------- משתמשים וארגונים ---------- */

export async function getUsers(): Promise<User[]> {
  return (await db.user.findMany()).map(toUser)
}

export async function userById(id: string): Promise<User | undefined> {
  const r = await db.user.findUnique({ where: { id } })
  return r ? toUser(r) : undefined
}

export async function organizationById(
  id: string,
): Promise<Organization | undefined> {
  const r = await db.organization.findUnique({ where: { id } })
  return r ? toOrganization(r) : undefined
}

/* ---------- פרויקטים ויחידות ---------- */

export async function getProjects(): Promise<Project[]> {
  const rows = await db.project.findMany({
    include: { units: { orderBy: { id: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map(toProject)
}

export async function projectById(id: string): Promise<Project | undefined> {
  const r = await db.project.findUnique({
    where: { id },
    include: { units: { orderBy: { id: 'asc' } } },
  })
  return r ? toProject(r) : undefined
}

export async function unitById(id: string): Promise<Unit | undefined> {
  const r = await db.unit.findUnique({ where: { id } })
  return r ? toUnit(r) : undefined
}

export async function getReservations(): Promise<Reservation[]> {
  return (await db.reservation.findMany()).map(toReservation)
}

/* ---------- מרקטפלייס ---------- */

/** הנכסים הציבוריים — יחידות שפורסמו למרקטפלייס. */
export async function getPublishedUnits(): Promise<Unit[]> {
  const rows = await db.unit.findMany({
    where: { publishedToMarketplace: true },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(toUnit)
}

export async function getUnitsAgent(agentId: string): Promise<Unit[]> {
  const rows = await db.unit.findMany({
    where: { agentId },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(toUnit)
}

/** נכסים נוספים מאותו פרויקט (ציבוריים בלבד). */
export async function sameProjectUnits(unit: Unit): Promise<Unit[]> {
  if (!unit.projectId) return []
  const rows = await db.unit.findMany({
    where: {
      projectId: unit.projectId,
      id: { not: unit.id },
      publishedToMarketplace: true,
    },
  })
  return rows.map(toUnit)
}

/** נכסים דומים — אותה קטגוריה / עיר / סוג עסקה, מדורגים. */
export async function similarUnits(
  unit: Unit,
  excludeIds: string[] = [],
): Promise<Unit[]> {
  const rows = await db.unit.findMany({
    where: {
      id: { notIn: [unit.id, ...excludeIds] },
      publishedToMarketplace: true,
      OR: [
        { category: unit.category },
        { city: unit.address.city },
        { dealType: unit.dealType },
      ],
    },
  })
  const score = (u: Unit) =>
    (u.category === unit.category ? 2 : 0) +
    (u.address.city === unit.address.city ? 1 : 0)
  return rows
    .map(toUnit)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 4)
}

/* ---------- לידים ---------- */

/* הליד נטען תמיד עם המשתמש שלו — הזהות (שם/אימייל/טלפון) חיה שם */
const leadInclude = {
  activities: { orderBy: { at: 'asc' as const } },
  user: true,
}

export async function getLeads(): Promise<Lead[]> {
  const rows = await db.lead.findMany({
    include: leadInclude,
    orderBy: { lastActivityAt: 'desc' },
  })
  return rows.map(toLead)
}

export async function leadById(id: string): Promise<Lead | undefined> {
  const r = await db.lead.findUnique({ where: { id }, include: leadInclude })
  return r ? toLead(r) : undefined
}

export async function leadsAssignedTo(userId: string): Promise<Lead[]> {
  const rows = await db.lead.findMany({
    where: { assignedToId: userId },
    include: leadInclude,
    orderBy: { lastActivityAt: 'desc' },
  })
  return rows.map(toLead)
}

/* ---------- סיורים ---------- */

export async function viewingsFor(sellerId: string): Promise<Viewing[]> {
  const rows = await db.viewing.findMany({
    where: { sellerId },
    orderBy: { scheduledAt: 'asc' },
  })
  return rows.map(toViewing)
}
export async function viewingsForClient(leadId: string): Promise<Viewing[]> {
  const rows = await db.viewing.findMany({
    where: { leadId },
    orderBy: { scheduledAt: 'asc' },
  })
  return rows.map(toViewing)
}

/* ---------- הזמנות ועסקאות ---------- */

export async function getInvites(): Promise<Invite[]> {
  return (await db.invite.findMany({ orderBy: { createdAt: 'desc' } })).map(
    toInvite,
  )
}

const dealInclude = {
  documents: { orderBy: { createdAt: 'asc' as const } },
  payments: { orderBy: { dueDate: 'asc' as const } },
}

export async function getDeals(): Promise<Deal[]> {
  const rows = await db.deal.findMany({
    include: dealInclude,
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(toDeal)
}

export async function dealById(id: string): Promise<Deal | undefined> {
  const r = await db.deal.findUnique({ where: { id }, include: dealInclude })
  return r ? toDeal(r) : undefined
}

/** העסקה שרלוונטית לליד — לפי היחידה שלו, ואם אין לפי הפרויקט. */
export async function dealForLead(
  projectId?: string,
  unitId?: string,
): Promise<Deal | undefined> {
  const r =
    (unitId
      ? await db.deal.findFirst({ where: { unitId }, include: dealInclude })
      : null) ??
    (projectId
      ? await db.deal.findFirst({ where: { projectId }, include: dealInclude })
      : null)
  return r ? toDeal(r) : undefined
}

export async function dealForClient(
  clientId: string,
): Promise<Deal | undefined> {
  const r = await db.deal.findFirst({
    where: { clientId },
    include: dealInclude,
  })
  return r ? toDeal(r) : undefined
}

/**
 * אישור תשלום ע"י המתווך (פרק 16.2) — עד שתהיה סליקה ללקוח, המתווך
 * מאשר ידנית שהתשלום התקבל: סטטוס paid + חותמת מועד התשלום.
 */
export async function markPaymentPaid(paymentId: string): Promise<Payment> {
  const row = await db.payment.update({
    where: { id: paymentId },
    data: { status: 'paid', paidAt: new Date() },
  })
  return toPayment(row)
}

/** יצירת סיור חדש — מחזירה את הסיור שנשמר, כולל ה-id שנוצר ב-DB. */
export async function createViewing(form: FormData): Promise<Viewing> {
  const row = await db.viewing.create({
    data: {
      sellerId: CURRENT_SELLER_ID,
      leadId: String(form.get('lead')),
      unitId: String(form.get('property')),
      scheduledAt: new Date(`${form.get('date')}T${form.get('time')}:00Z`),
      note: String(form.get('note') || '') || undefined,
    },
  })
  return toViewing(row)
}
