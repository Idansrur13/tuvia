/*
 * שכבת הגישה לנתונים — מחליפה את הפונקציות הסינכרוניות של app/data.
 * כל פונקציה שולפת מ-Postgres וממירה לטיפוסי הדומיין דרך mappers.server.
 */
import { db } from './db.server'
import {
  toDeal,
  toInvite,
  toLead,
  toListing,
  toOrganization,
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
  Listing,
  Organization,
  Project,
  Reservation,
  Unit,
  User,
  Viewing,
} from '~/types'

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
    include: { units: { orderBy: { name: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map(toProject)
}

export async function projectById(id: string): Promise<Project | undefined> {
  const r = await db.project.findUnique({
    where: { id },
    include: { units: { orderBy: { name: 'asc' } } },
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

export async function getListings(): Promise<Listing[]> {
  const rows = await db.listing.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map(toListing)
}

export async function listingById(id: string): Promise<Listing | undefined> {
  const r = await db.listing.findUnique({ where: { id } })
  return r ? toListing(r) : undefined
}

/** נכסים נוספים מאותו פרויקט. */
export async function sameProjectListings(
  listing: Listing,
): Promise<Listing[]> {
  if (!listing.projectId) return []
  const rows = await db.listing.findMany({
    where: { projectId: listing.projectId, id: { not: listing.id } },
  })
  return rows.map(toListing)
}

/** נכסים דומים — אותה קטגוריה / עיר / סוג עסקה, מדורגים. */
export async function similarListings(
  listing: Listing,
  excludeIds: string[] = [],
): Promise<Listing[]> {
  const rows = await db.listing.findMany({
    where: {
      id: { notIn: [listing.id, ...excludeIds] },
      OR: [
        { category: listing.category },
        { city: listing.address.city },
        { dealType: listing.dealType },
      ],
    },
  })
  const score = (l: Listing) =>
    (l.category === listing.category ? 2 : 0) +
    (l.address.city === listing.address.city ? 1 : 0)
  return rows
    .map(toListing)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 4)
}

/* ---------- לידים ---------- */

const leadInclude = { activities: { orderBy: { at: 'asc' as const } } }

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

export async function dealForClient(clientId: string): Promise<Deal | undefined> {
  const r = await db.deal.findFirst({
    where: { clientId },
    include: dealInclude,
  })
  return r ? toDeal(r) : undefined
}
