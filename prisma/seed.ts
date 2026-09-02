/*
 * Seed — מזרים את נתוני הדמו מ-app/data אל Postgres, עם אותם מזהים,
 * כך שכל הקישורים הפנימיים (lead→unit→project וכו') נשמרים.
 * הרצה:  npm run db:seed   (מנקה ומזרים מחדש — אידמפוטנטי)
 */
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import { ORGANIZATIONS, USERS, PARTNER_APPLICATIONS } from '../app/data/users'
import { PROJECTS, RESERVATIONS } from '../app/data/projects'
import { UNITS } from '../app/data/units'
import { LEADS } from '../app/data/leads'
import { VIEWINGS } from '../app/data/viewings'
import { INVITES, DEALS, PAYMENT_APPROVALS } from '../app/data/clients'
import { CONVERSATIONS, MESSAGES } from '../app/data/chat'
import type { Address, Money } from '../app/types'

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  }),
})

const date = (s?: string) => (s ? new Date(s) : undefined)
const addr = (a: Address) => ({
  country: a.country as object,
  city: a.city,
  neighborhood: a.neighborhood,
  street: a.street,
  lat: a.point?.lat,
  lng: a.point?.lng,
})
const stamps = (r: { createdAt: string; updatedAt: string }) => ({
  createdAt: new Date(r.createdAt),
  updatedAt: new Date(r.updatedAt),
})
const moneyCols = (m: Money) => ({ amount: m.amount, currency: m.currency })

async function main() {
  /* ניקוי בסדר הפוך לתלויות */
  await db.chatMessage.deleteMany()
  await db.conversationParticipant.deleteMany()
  await db.conversation.deleteMany()
  await db.paymentApproval.deleteMany()
  await db.payment.deleteMany()
  await db.dealDocument.deleteMany()
  await db.deal.deleteMany()
  await db.invite.deleteMany()
  await db.viewing.deleteMany()
  await db.leadActivity.deleteMany()
  await db.lead.deleteMany()
  await db.reservation.deleteMany()
  await db.unit.deleteMany()
  await db.project.deleteMany()
  await db.partnerApplication.deleteMany()
  await db.user.deleteMany()
  await db.organization.deleteMany()

  /* ארגונים ומשתמשים */
  await db.organization.createMany({
    data: ORGANIZATIONS.map((o) => ({
      id: o.id,
      type: o.type,
      name: o.name,
      alias: o.alias,
      logo: o.logo as object | undefined,
      regions: o.regions ?? [],
      verified: o.verified,
      ...stamps(o),
    })),
  })

  await db.user.createMany({
    data: USERS.map((u) => ({
      id: u.id,
      role: u.role,
      status: u.status,
      name: u.name,
      email: u.email,
      phone: u.phone,
      locale: u.preferences?.locale ?? 'he',
      currency: u.preferences?.currency ?? 'ILS',
      timeZone: u.preferences?.timeZone,
      organizationId: u.organizationId,
      lastActiveAt: date(u.lastActiveAt),
      ...stamps(u),
    })),
  })

  /* פרויקטים */
  await db.project.createMany({
    data: PROJECTS.map((p) => ({
      id: p.id,
      status: p.status,
      name: p.name,
      description: p.description,
      contractorId: p.contractorId,
      ...stamps(p),
    })),
  })

  /* יחידות — קולקשן אחד (מלאי קבלן + נכסים עצמאיים) */
  await db.unit.createMany({
    data: UNITS.map((u) => ({
      id: u.id,
      projectId: u.projectId,
      title: u.title,
      description: u.description,
      ...addr(u.address),
      agentId: u.agentId,
      agentRole: u.agentRole,
      publishedToMarketplace: u.publishedToMarketplace ?? false,
      dealType: u.dealType,
      category: u.category,
      availability: u.availability,
      rooms: u.rooms,
      sqm: u.sqm,
      floor: u.floor,
      priceAmount: u.price?.amount,
      priceCurrency: u.price?.currency,
      status: u.status,
      yearBuilt: u.yearBuilt,
      parking: u.parking,
      entry: u.entry,
      badge: u.badge as object | undefined,
      features: u.features as object[],
      gallery: u.gallery as object[] | undefined,
      priceHistory: (u.priceHistory ?? []) as object[],
      buyerId: u.buyerId,
      activeReservationId: u.reservationId,
      ...stamps(u),
    })),
  })

  await db.reservation.createMany({
    data: RESERVATIONS.map((r) => ({
      id: r.id,
      status: r.status,
      unitId: r.unitId,
      projectId: r.projectId,
      sellerId: r.sellerId,
      clientId: r.clientId,
      expiresAt: date(r.expiresAt),
      note: r.note,
      ...stamps(r),
    })),
  })

  /* לידים ופעילות — ליד הוא הרחבה של User (PK משותף):
     קודם נוצר המשתמש-לקוח עם הזהות, ואז שורת המסע */
  await db.user.createMany({
    data: LEADS.map((l) => ({
      id: l.id,
      role: 'client' as const,
      status: l.status,
      name: l.name,
      email: l.email,
      phone: l.phone,
      locale: 'he',
      currency: l.budget?.currency ?? 'ILS',
      ...stamps(l),
    })),
  })

  await db.lead.createMany({
    data: LEADS.map((l) => ({
      id: l.id,
      countryCode: l.countryCode,
      source: l.source,
      stage: l.stage,
      heat: l.heat,
      score: l.score,
      budgetAmount: l.budget?.amount,
      budgetCurrency: l.budget?.currency,
      projectId: l.projectId,
      unitId: l.unitId,
      assignedToId: l.assignedToId,
      nextFollowUpAt: date(l.nextFollowUpAt),
      lastActivityAt: new Date(l.lastActivityAt),
      ...stamps(l),
    })),
  })

  await db.leadActivity.createMany({
    data: LEADS.flatMap((l) =>
      l.activities.map((a) => ({
        id: a.id,
        leadId: l.id,
        at: new Date(a.at),
        kind: a.kind,
        byUserId: a.byUserId,
        summary: a.summary,
        fromStage: a.fromStage,
        toStage: a.toStage,
      })),
    ),
  })

  /* סיורים */
  await db.viewing.createMany({
    data: VIEWINGS.map((v) => ({
      id: v.id,
      sellerId: v.sellerId,
      leadId: v.leadId,
      unitId: v.unitId,
      scheduledAt: new Date(v.scheduledAt),
      durationMin: v.durationMin,
      status: v.status,
      note: v.note,
      ...stamps(v),
    })),
  })

  /* הזמנות ועסקאות */
  await db.invite.createMany({
    data: INVITES.map((i) => ({
      id: i.id,
      name: i.name,
      email: i.email,
      invitedById: i.invitedById,
      projectId: i.projectId,
      unitId: i.unitId,
      status: i.status,
      expiresAt: date(i.expiresAt),
      accessUntil: date(i.accessUntil),
      ...stamps(i),
    })),
  })

  for (const d of DEALS) {
    await db.deal.create({
      data: {
        id: d.id,
        stage: d.stage,
        unitId: d.unitId,
        projectId: d.projectId,
        clientId: d.clientId,
        contractorId: d.contractorId,
        sellerId: d.sellerId,
        priceAmount: d.price.amount,
        priceCurrency: d.price.currency,
        commissionAmount: d.commission?.amount,
        commissionCurrency: d.commission?.currency,
        clientSince: date(d.clientSince),
        ...stamps(d),
        documents: {
          create: d.documents.map((doc) => ({
            id: doc.id,
            kind: doc.kind,
            status: doc.status,
            file: doc.file as object,
            requiresSignature: doc.requiresSignature,
            signedAt: date(doc.signedAt),
            ...stamps(doc),
          })),
        },
        payments: {
          create: d.payments.map((p) => ({
            id: p.id,
            label: p.label,
            ...moneyCols(p.amount),
            dueDate: new Date(p.dueDate),
            status: p.status,
            paidAt: date(p.paidAt),
            receipt: p.receipt as object | undefined,
          })),
        },
      },
    })
  }

  await db.paymentApproval.createMany({
    data: PAYMENT_APPROVALS.map((a) => ({
      id: a.id,
      status: a.status,
      dealId: a.dealId,
      paymentId: a.paymentId,
      ...moneyCols(a.amount),
      requestedById: a.requestedById,
      contractorApprovedAt: date(a.contractorApprovedAt),
      adminConfirmedAt: date(a.adminConfirmedAt),
      confirmationRef: a.confirmationRef,
      ...stamps(a),
    })),
  })

  /* צ'אט — שיחות, משתתפים והודעות (פרק 9) */
  for (const c of CONVERSATIONS) {
    const msgs = MESSAGES.filter((m) => m.conversationId === c.id)
    await db.conversation.create({
      data: {
        id: c.id,
        leadId: c.leadId,
        lastMessageAt: msgs.at(-1)
          ? new Date(msgs.at(-1)!.createdAt)
          : undefined,
        ...stamps(c),
        participants: {
          create: c.participants.map((p) => ({
            userId: p.userId,
            role: p.role,
            lastReadMessageId: p.lastReadMessageId,
          })),
        },
        messages: {
          create: msgs.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            body: m.body,
            attachments: (m.attachments ?? []) as object[],
            linkedEntity: m.linkedEntity as object | undefined,
            createdAt: new Date(m.createdAt),
          })),
        },
      },
    })
  }

  await db.partnerApplication.createMany({
    data: PARTNER_APPLICATIONS.map((a) => ({
      id: a.id,
      type: a.type,
      companyName: a.companyName,
      contactName: a.contactName,
      email: a.email,
      phone: a.phone,
      country: a.country,
      status: a.status,
      reviewedById: a.reviewedById,
      reviewedAt: date(a.reviewedAt),
      note: a.note,
      ...stamps(a),
    })),
  })

  const counts = {
    organizations: await db.organization.count(),
    users: await db.user.count(),
    projects: await db.project.count(),
    units: await db.unit.count(),
    leads: await db.lead.count(),
    viewings: await db.viewing.count(),
    deals: await db.deal.count(),
    conversations: await db.conversation.count(),
    chatMessages: await db.chatMessage.count(),
  }
  console.log('Seed done:', counts)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
