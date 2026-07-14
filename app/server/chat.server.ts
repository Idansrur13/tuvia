/*
 * צ'אט (פרק 9) — שאילתות ומוטציות מול Postgres.
 * שיחה נטענת עם המשתתפים; "נקרא" נגזר מ-lastReadMessageId של כל משתתף,
 * כך שהחישוב תקף גם בשיחה קבוצתית.
 */
import { db } from './db.server'
import type {
  ChatMessage,
  ChatParticipant,
  Conversation,
  ConversationContext,
  MediaAsset,
  MessageDelivery,
  Role,
} from '~/types'
import type {
  ChatMessage as DbChatMessage,
  Conversation as DbConversation,
  ConversationParticipant as DbParticipant,
} from '../../generated/prisma/client'

/* ---------- מיפוי ---------- */

const toContext = (r: DbConversation): ConversationContext => {
  switch (r.context) {
    case 'unit':
      return { type: 'unit', unitId: r.unitId! }
    case 'deal':
      return { type: 'deal', dealId: r.dealId! }
    case 'lead':
      return { type: 'lead', leadId: r.leadId! }
    case 'direct':
      return { type: 'direct' }
  }
}

const contextColumns = (ctx: ConversationContext) => ({
  context: ctx.type,
  unitId: ctx.type === 'unit' ? ctx.unitId : null,
  dealId: ctx.type === 'deal' ? ctx.dealId : null,
  leadId: ctx.type === 'lead' ? ctx.leadId : null,
})

const toParticipant = (r: DbParticipant): ChatParticipant => ({
  userId: r.userId,
  role: r.role,
  lastReadMessageId: r.lastReadMessageId ?? undefined,
})

/**
 * מסירה נגזרת: "read" אם כל שאר המשתתפים קראו את ההודעה
 * (לפי מיקום lastReadMessageId שלהם ברצף), אחרת "delivered".
 */
function deliveryOf(
  index: number,
  senderId: string,
  ordered: DbChatMessage[],
  participants: DbParticipant[],
): MessageDelivery {
  const others = participants.filter(
    (p) => p.userId !== senderId && !p.leftAt,
  )
  if (others.length === 0) return 'sent'
  const readBy = (p: DbParticipant) => {
    const i = p.lastReadMessageId
      ? ordered.findIndex((m) => m.id === p.lastReadMessageId)
      : -1
    return i >= index
  }
  return others.every(readBy) ? 'read' : 'delivered'
}

const toMessage = (
  r: DbChatMessage,
  delivery: MessageDelivery,
): ChatMessage => ({
  id: r.id,
  conversationId: r.conversationId,
  senderId: r.senderId,
  body: r.body,
  attachments: (r.attachments as unknown as MediaAsset[]).length
    ? (r.attachments as unknown as MediaAsset[])
    : undefined,
  delivery,
  createdAt: r.createdAt.toISOString(),
  linkedEntity: (r.linkedEntity as ConversationContext | null) ?? undefined,
})

/* ---------- שאילתות ---------- */

const conversationInclude = {
  participants: true,
  messages: { orderBy: { createdAt: 'asc' as const } },
}

/** כל השיחות + הודעותיהן. הסינון לפי משתמש/תפקיד נעשה בעמוד ("מחובר/ת בתור"). */
export async function getChatData(): Promise<{
  conversations: Conversation[]
  messages: ChatMessage[]
}> {
  const rows = await db.conversation.findMany({
    include: conversationInclude,
    orderBy: { lastMessageAt: 'desc' },
  })

  const conversations: Conversation[] = []
  const messages: ChatMessage[] = []

  for (const r of rows) {
    const mapped = r.messages.map((m, i) =>
      toMessage(m, deliveryOf(i, m.senderId, r.messages, r.participants)),
    )
    messages.push(...mapped)
    conversations.push({
      id: r.id,
      context: toContext(r),
      participants: r.participants.filter((p) => !p.leftAt).map(toParticipant),
      lastMessage: mapped.at(-1),
      isGroup: r.participants.filter((p) => !p.leftAt).length > 2,
      createdAt: r.createdAt.toISOString(),
      updatedAt: (r.lastMessageAt ?? r.updatedAt).toISOString(),
    })
  }

  return { conversations, messages }
}

/** שמות הישויות לצ'יפים של הקשר השיחה (יחידה/ליד/עסקה). */
export async function getContextNames(): Promise<{
  units: Record<string, string>
  leads: Record<string, string>
  deals: Record<string, string>
}> {
  const [units, leads, deals] = await Promise.all([
    db.unit.findMany({ select: { id: true, name: true } }),
    db.lead.findMany({ select: { id: true, name: true } }),
    db.deal.findMany({
      select: { id: true, unit: { select: { name: true } } },
    }),
  ])
  return {
    units: Object.fromEntries(units.map((u) => [u.id, u.name])),
    leads: Object.fromEntries(leads.map((l) => [l.id, l.name])),
    deals: Object.fromEntries(deals.map((d) => [d.id, d.unit.name])),
  }
}

/* ---------- מוטציות ---------- */

/** שליחת הודעה — יוצרת את ההודעה, מקדמת lastMessageAt ומסמנת שהשולח קרא אותה. */
export async function sendMessage(input: {
  conversationId: string
  senderId: string
  body: string
  attachments?: MediaAsset[]
  linkedEntity?: ConversationContext
}) {
  const msg = await db.chatMessage.create({
    data: {
      conversationId: input.conversationId,
      senderId: input.senderId,
      body: input.body,
      attachments: (input.attachments ?? []) as object[],
      linkedEntity: (input.linkedEntity as object | undefined) ?? undefined,
    },
  })
  await db.conversation.update({
    where: { id: input.conversationId },
    data: { lastMessageAt: msg.createdAt },
  })
  await db.conversationParticipant.updateMany({
    where: { conversationId: input.conversationId, userId: input.senderId },
    data: { lastReadMessageId: msg.id },
  })
  return msg.id
}

/** סימון שיחה כנקראה — מצביע על ההודעה האחרונה. */
export async function markConversationRead(
  conversationId: string,
  userId: string,
) {
  const last = await db.chatMessage.findFirst({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
  })
  if (!last) return
  await db.conversationParticipant.updateMany({
    where: { conversationId, userId },
    data: { lastReadMessageId: last.id },
  })
}

/** פתיחת שיחה ישירה — מאתרת קיימת (1-על-1 direct) או יוצרת חדשה. */
export async function startDirectConversation(
  byUser: { id: string; role: Role },
  withUser: { id: string; role: Role },
): Promise<string> {
  const existing = await db.conversation.findFirst({
    where: {
      context: 'direct',
      AND: [
        { participants: { some: { userId: byUser.id, leftAt: null } } },
        { participants: { some: { userId: withUser.id, leftAt: null } } },
      ],
    },
    include: { participants: true },
  })
  if (existing && existing.participants.filter((p) => !p.leftAt).length === 2)
    return existing.id

  const conv = await db.conversation.create({
    data: {
      ...contextColumns({ type: 'direct' }),
      participants: {
        create: [
          { userId: byUser.id, role: byUser.role },
          { userId: withUser.id, role: withUser.role },
        ],
      },
    },
  })
  return conv.id
}

/** צירוף משתתף לשיחה (הופך אותה לקבוצתית) — למשל מתווך שמצרף קבלן. */
export async function addParticipant(input: {
  conversationId: string
  userId: string
  role: Role
  addedById: string
}) {
  await db.conversationParticipant.upsert({
    where: {
      conversationId_userId: {
        conversationId: input.conversationId,
        userId: input.userId,
      },
    },
    create: {
      conversationId: input.conversationId,
      userId: input.userId,
      role: input.role,
      addedById: input.addedById,
    },
    /* אם המשתתף עזב בעבר — מחזירים אותו */
    update: { leftAt: null, addedById: input.addedById },
  })
}
