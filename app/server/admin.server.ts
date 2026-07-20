/*
 * שכבת הנתונים של דשבורד האדמין (פרקים 7, 16.2, 17).
 * שליפות "מעוצבות" (shaped) — הצטרפויות נעשות בשרת כדי שהעמודים
 * לא יטענו את כל הטבלאות רק בשביל שם/כותרת.
 */
import { db } from './db.server'
import {
  toOrganization,
  toPartnerApplication,
  toPaymentApproval,
  toProject,
  toUnit,
  toUser,
} from './mappers.server'
import type {
  DealStage,
  Localized,
  Money,
  Organization,
  OrganizationType,
  PartnerApplication,
  PaymentApproval,
  Project,
  ProjectStatus,
  Role,
  Unit,
  User,
  UserStatus,
} from '~/types'

/** האדמין המחובר (עד שיהיה auth אמיתי). */
export const CURRENT_ADMIN_ID = 'u-admin'

/* ---------- סקירת פלטפורמה ---------- */

export interface AdminOverview {
  pendingApplications: number
  organizations: number
  verifiedOrganizations: number
  users: number
  activeLeads: number
  publishedUnits: number
  awaitingAdminApprovals: number
  /** תצוגה מקדימה לרשימות בעמוד הסקירה */
  recentApplications: PartnerApplication[]
  approvalsPreview: AdminApprovalRow[]
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const [
    pendingApplications,
    organizations,
    verifiedOrganizations,
    users,
    activeLeads,
    publishedUnits,
    awaitingAdminApprovals,
    recentApplications,
    approvalsPreview,
  ] = await Promise.all([
    db.partnerApplication.count({ where: { status: 'pending' } }),
    db.organization.count(),
    db.organization.count({ where: { verified: true } }),
    db.user.count(),
    db.lead.count({ where: { stage: { notIn: ['won', 'lost'] } } }),
    db.unit.count({ where: { publishedToMarketplace: true } }),
    db.paymentApproval.count({ where: { status: 'contractorApproved' } }),
    db.partnerApplication.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    approvalRows({ status: 'contractorApproved' }, 4),
  ])
  return {
    pendingApplications,
    organizations,
    verifiedOrganizations,
    users,
    activeLeads,
    publishedUnits,
    awaitingAdminApprovals,
    recentApplications: recentApplications.map(toPartnerApplication),
    approvalsPreview,
  }
}

/* ---------- בקשות הצטרפות (פרק 17) ---------- */

export async function getPartnerApplications(): Promise<PartnerApplication[]> {
  const rows = await db.partnerApplication.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(toPartnerApplication)
}

/**
 * טיפול בבקשה: אישור מקים ארגון (מאומת) + משתמש איש-קשר במעמד "הוזמן";
 * דחייה שומרת את נימוק האדמין.
 */
export async function reviewPartnerApplication(opts: {
  id: string
  approve: boolean
  byUserId: string
  note?: string
}) {
  const app = await db.partnerApplication.findUniqueOrThrow({
    where: { id: opts.id },
  })
  if (app.status !== 'pending') return

  await db.partnerApplication.update({
    where: { id: opts.id },
    data: {
      status: opts.approve ? 'approved' : 'rejected',
      reviewedById: opts.byUserId,
      reviewedAt: new Date(),
      note: opts.note || undefined,
    },
  })
  if (!opts.approve) return

  /* כינוי אנונימיות רץ (C-103, C-104...) — רק לקבלנים (פרק 17) */
  const alias =
    app.type === 'contractor'
      ? `C-${101 + (await db.organization.count({ where: { type: 'contractor' } }))}`
      : undefined

  const org = await db.organization.create({
    data: {
      type: app.type,
      name: app.companyName,
      alias,
      regions: [app.country],
      verified: true,
    },
  })

  /* איש הקשר הופך למשתמש מוזמן — אם האימייל עוד לא קיים במערכת */
  const existing = await db.user.findUnique({ where: { email: app.email } })
  if (!existing) {
    await db.user.create({
      data: {
        role: app.type === 'contractor' ? 'contractor' : 'seller',
        status: 'invited',
        name: app.contactName,
        email: app.email,
        phone: app.phone,
        organizationId: org.id,
      },
    })
  }
}

/* ---------- ארגונים וצוות ---------- */

export interface AdminOrgRow {
  org: Organization
  members: number
  projects: number
  units: number
  deals: number
}

export async function getOrganizationsAdmin(): Promise<AdminOrgRow[]> {
  const rows = await db.organization.findMany({
    include: {
      _count: { select: { users: true, projects: true, deals: true } },
      projects: { select: { _count: { select: { units: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map((r) => ({
    org: toOrganization(r),
    members: r._count.users,
    projects: r._count.projects,
    units: r.projects.reduce((sum, p) => sum + p._count.units, 0),
    deals: r._count.deals,
  }))
}

export interface AdminOrgDetail {
  org: Organization
  members: User[]
  projects: Project[]
  deals: number
}

export async function organizationAdminById(
  id: string,
): Promise<AdminOrgDetail | undefined> {
  const r = await db.organization.findUnique({
    where: { id },
    include: {
      users: { orderBy: { createdAt: 'asc' } },
      projects: {
        include: { units: { orderBy: { id: 'asc' } } },
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { deals: true } },
    },
  })
  if (!r) return undefined
  return {
    org: toOrganization(r),
    members: r.users.map(toUser),
    projects: r.projects.map(toProject),
    deals: r._count.deals,
  }
}

export async function updateOrganizationProfile(
  id: string,
  data: { name: string; alias?: string; regions: string[] },
) {
  await db.organization.update({
    where: { id },
    data: {
      name: data.name,
      alias: data.alias || null,
      regions: data.regions,
    },
  })
}

export async function setOrganizationVerified(id: string, verified: boolean) {
  await db.organization.update({ where: { id }, data: { verified } })
}

/** הוספת חבר צוות לארגון — נוצר במעמד "הוזמן" עד כניסה ראשונה. */
export async function addOrganizationMember(
  organizationId: string,
  data: { name: string; email: string; phone?: string; role: Role },
): Promise<User | { error: 'emailTaken' }> {
  const existing = await db.user.findUnique({ where: { email: data.email } })
  if (existing) return { error: 'emailTaken' }
  const row = await db.user.create({
    data: {
      role: data.role,
      status: 'invited',
      name: data.name,
      email: data.email,
      phone: data.phone,
      organizationId,
    },
  })
  return toUser(row)
}

/* ---------- משתמשים (פרק 7) ---------- */

export interface AdminUserRow {
  user: User
  orgName?: string
}

export async function getUsersAdmin(): Promise<AdminUserRow[]> {
  const rows = await db.user.findMany({
    include: { organization: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map((r) => ({
    user: toUser(r),
    orgName: r.organization?.name,
  }))
}

export async function setUserStatus(id: string, status: UserStatus) {
  await db.user.update({ where: { id }, data: { status } })
}

export async function setUserRole(id: string, role: Role) {
  await db.user.update({ where: { id }, data: { role } })
}

/* ---------- פיקוח תוכן ---------- */

export interface AdminModeration {
  projects: (Project & { contractorName: string })[]
  /** נכסים עצמאיים (ללא פרויקט) שפורסמו למרקטפלייס */
  standaloneUnits: Unit[]
}

export async function getModerationData(): Promise<AdminModeration> {
  const [projects, units] = await Promise.all([
    db.project.findMany({
      include: {
        units: { orderBy: { id: 'asc' } },
        contractor: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    db.unit.findMany({
      where: { projectId: null, publishedToMarketplace: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])
  return {
    projects: projects.map((r) => ({
      ...toProject(r),
      contractorName: r.contractor.name,
    })),
    standaloneUnits: units.map(toUnit),
  }
}

export async function setProjectStatus(id: string, status: ProjectStatus) {
  await db.project.update({ where: { id }, data: { status } })
}

export async function setUnitPublished(id: string, published: boolean) {
  await db.unit.update({
    where: { id },
    data: { publishedToMarketplace: published },
  })
}

/* ---------- אישורי תשלום דו-שלביים (פרק 16.2) ---------- */

export interface AdminApprovalRow {
  approval: PaymentApproval
  dealStage: DealStage
  dealPrice: Money
  unitTitle: Localized
  clientName: string
  contractorName: string
  requestedByName: string
}

const approvalInclude = {
  requestedBy: { select: { name: true } },
  deal: {
    select: {
      stage: true,
      priceAmount: true,
      priceCurrency: true,
      unit: { select: { title: true } },
      client: { select: { name: true } },
      contractor: { select: { name: true } },
    },
  },
} as const

async function approvalRows(
  where: object,
  take?: number,
): Promise<AdminApprovalRow[]> {
  const rows = await db.paymentApproval.findMany({
    where,
    include: approvalInclude,
    orderBy: { createdAt: 'desc' },
    take,
  })
  return rows.map((r) => ({
    approval: toPaymentApproval(r),
    dealStage: r.deal.stage,
    dealPrice: {
      amount: r.deal.priceAmount,
      currency: r.deal.priceCurrency,
    },
    unitTitle: r.deal.unit.title as Localized,
    clientName: r.deal.client.name,
    contractorName: r.deal.contractor.name,
    requestedByName: r.requestedBy.name,
  }))
}

export async function getPaymentApprovalsAdmin(): Promise<AdminApprovalRow[]> {
  return approvalRows({})
}

/**
 * אישור סופי של מנהל — חותמת זמן + אסמכתא; אם הבקשה מקושרת
 * לתשלום בלוח התשלומים, הוא מסומן כשולם.
 */
export async function confirmPaymentApproval(id: string, ref: string) {
  const approval = await db.paymentApproval.update({
    where: { id },
    data: {
      status: 'adminConfirmed',
      adminConfirmedAt: new Date(),
      confirmationRef: ref || undefined,
    },
  })
  if (approval.paymentId) {
    await db.payment.update({
      where: { id: approval.paymentId },
      data: { status: 'paid', paidAt: new Date() },
    })
  }
}

export async function rejectPaymentApproval(id: string) {
  await db.paymentApproval.update({
    where: { id },
    data: { status: 'rejected' },
  })
}
