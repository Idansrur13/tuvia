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
  Localized,
  MediaAsset,
  MessageDelivery,
  Role,
} from '~/types'
import type {
  ChatMessage as DbChatMessage,
  ConversationParticipant as DbParticipant,
} from '../../generated/prisma/client'

/* ---------- מיפוי ---------- */

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
  const others = participants.filter((p) => p.userId !== senderId && !p.leftAt)
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
      participants: r.participants.filter((p) => !p.leftAt).map(toParticipant),
      lastMessage: mapped.at(-1),
      leadId: r.leadId,
      createdAt: r.createdAt.toISOString(),
      updatedAt: (r.lastMessageAt ?? r.updatedAt).toISOString(),
    })
  }

  return { conversations, messages }
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

/**
 * פתיחת שיחה מול ליד — כל שיחה נסובה סביב ליד.
 * מאתרת שיחה קיימת של הפותח סביב אותו ליד, ואם אין — יוצרת חדשה
 * שבה הליד (שהוא גם User) משתתף כלקוח.
 */
export async function startLeadConversation(
  byUser: { id: string; role: Role },
  leadId: string,
): Promise<string> {
  const existing = await db.conversation.findFirst({
    where: {
      leadId,
      participants: { some: { userId: byUser.id, leftAt: null } },
    },
  })
  if (existing) return existing.id

  const conv = await db.conversation.create({
    data: {
      leadId,
      participants: {
        create: [
          { userId: byUser.id, role: byUser.role },
          { userId: leadId, role: 'client' },
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
