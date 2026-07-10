/*
 * שיחות צ׳אט דמו (פרק 9) — מכסות את כל ארבעת התפקידים:
 * לקוח (u-ron), קבלן (u-yossi / u-mike), מתווך (u-michal / u-david-seller), אדמין (u-admin).
 * כל שיחה מקושרת להקשר: עסקה / יחידה / ליד / ישירה.
 */
import type { ChatMessage, Conversation } from '~/types'

export const MESSAGES: ChatMessage[] = [
  /* conv-1: לקוח ↔ מתווך — סביב עסקה */
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'u-ron',
    body: 'היי מיכל, מתי אפשר לתאם סיור בדירה?',
    delivery: 'read',
    createdAt: '2026-07-08T09:00:00Z',
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    senderId: 'u-michal',
    body: 'שלום רון! אפשר מחר ב-17:00, מתאים?',
    delivery: 'read',
    createdAt: '2026-07-08T09:05:00Z',
    linkedEntity: { type: 'unit', unitId: 'A-12' },
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    senderId: 'u-ron',
    body: 'מושלם, נתראה מחר 🙏',
    delivery: 'delivered',
    createdAt: '2026-07-08T09:07:00Z',
  },

  /* conv-2: מתווך ↔ קבלן — סביב שריון יחידה */
  {
    id: 'msg-4',
    conversationId: 'conv-2',
    senderId: 'u-david-seller',
    body: 'Mike, can you approve the reservation on Unit 142?',
    delivery: 'delivered',
    createdAt: '2026-07-06T11:00:00Z',
    linkedEntity: { type: 'unit', unitId: 'M-142' },
  },
  {
    id: 'msg-5',
    conversationId: 'conv-2',
    senderId: 'u-mike',
    body: 'Checking with the office, will confirm by EOD.',
    delivery: 'read',
    createdAt: '2026-07-06T12:20:00Z',
  },

  /* conv-3: קבוצתית — לקוח + קבלן + מתווך סביב עסקה */
  {
    id: 'msg-6',
    conversationId: 'conv-3',
    senderId: 'u-yossi',
    body: 'רון, החוזה המעודכן הועלה למערכת. מיכל — תוכלי לעבור איתו על הנספח?',
    delivery: 'read',
    createdAt: '2026-07-07T10:00:00Z',
    linkedEntity: { type: 'deal', dealId: 'deal-1' },
  },
  {
    id: 'msg-7',
    conversationId: 'conv-3',
    senderId: 'u-michal',
    body: 'כמובן, נקבע לזה שיחה מחר בבוקר.',
    delivery: 'read',
    createdAt: '2026-07-07T10:12:00Z',
  },
  {
    id: 'msg-8',
    conversationId: 'conv-3',
    senderId: 'u-ron',
    body: 'תודה לשניכם! מחכה לעדכון.',
    delivery: 'delivered',
    createdAt: '2026-07-07T18:40:00Z',
  },

  /* conv-4: אדמין ↔ קבלן — ישירה */
  {
    id: 'msg-9',
    conversationId: 'conv-4',
    senderId: 'u-admin',
    body: 'יוסי, פרויקט Ocean View ממתין לאישור פרסום. חסרות תמונות גלריה.',
    delivery: 'delivered',
    createdAt: '2026-07-09T07:30:00Z',
  },

  /* conv-5: קבלן ↔ מתווך — סביב ליד חם */
  {
    id: 'msg-10',
    conversationId: 'conv-5',
    senderId: 'u-michal',
    body: 'דוד לוי במשא ומתן מתקדם על A-24. שווה שתצטרף לפגישה הבאה.',
    delivery: 'read',
    createdAt: '2026-07-07T16:30:00Z',
    linkedEntity: { type: 'lead', leadId: 'lead-3' },
  },
  {
    id: 'msg-11',
    conversationId: 'conv-5',
    senderId: 'u-yossi',
    body: 'בשמחה. תשלחי לי זימון ליום חמישי.',
    delivery: 'read',
    createdAt: '2026-07-07T17:05:00Z',
  },
]

const lastOf = (conversationId: string) =>
  MESSAGES.filter((m) => m.conversationId === conversationId).at(-1)

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    context: { type: 'deal', dealId: 'deal-1' },
    isGroup: false,
    participants: [
      { userId: 'u-ron', role: 'client', lastReadMessageId: 'msg-3' },
      { userId: 'u-michal', role: 'seller', lastReadMessageId: 'msg-2' },
    ],
    lastMessage: lastOf('conv-1'),
    createdAt: '2026-06-15T00:00:00Z',
    updatedAt: '2026-07-08T09:07:00Z',
  },
  {
    id: 'conv-2',
    context: { type: 'unit', unitId: 'M-142' },
    isGroup: false,
    participants: [
      {
        userId: 'u-david-seller',
        role: 'seller',
        lastReadMessageId: 'msg-5',
      },
      { userId: 'u-mike', role: 'contractor', lastReadMessageId: 'msg-5' },
    ],
    lastMessage: lastOf('conv-2'),
    createdAt: '2026-07-06T11:00:00Z',
    updatedAt: '2026-07-06T12:20:00Z',
  },
  {
    id: 'conv-3',
    context: { type: 'deal', dealId: 'deal-1' },
    isGroup: true,
    participants: [
      { userId: 'u-ron', role: 'client', lastReadMessageId: 'msg-8' },
      { userId: 'u-yossi', role: 'contractor', lastReadMessageId: 'msg-7' },
      { userId: 'u-michal', role: 'seller', lastReadMessageId: 'msg-8' },
    ],
    lastMessage: lastOf('conv-3'),
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-07T18:40:00Z',
  },
  {
    id: 'conv-4',
    context: { type: 'direct' },
    isGroup: false,
    participants: [
      { userId: 'u-admin', role: 'admin', lastReadMessageId: 'msg-9' },
      { userId: 'u-yossi', role: 'contractor' },
    ],
    lastMessage: lastOf('conv-4'),
    createdAt: '2026-07-09T07:30:00Z',
    updatedAt: '2026-07-09T07:30:00Z',
  },
  {
    id: 'conv-5',
    context: { type: 'lead', leadId: 'lead-3' },
    isGroup: false,
    participants: [
      { userId: 'u-michal', role: 'seller', lastReadMessageId: 'msg-11' },
      { userId: 'u-yossi', role: 'contractor', lastReadMessageId: 'msg-11' },
    ],
    lastMessage: lastOf('conv-5'),
    createdAt: '2026-07-07T16:30:00Z',
    updatedAt: '2026-07-07T17:05:00Z',
  },
]

/** ההודעות של שיחה מסוימת, לפי סדר כרונולוגי. */
export const messagesFor = (conversationId: string) =>
  MESSAGES.filter((m) => m.conversationId === conversationId).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  )

/** השיחות שמשתמש מסוים משתתף בהן (אדמין רואה הכל — נאכף בעמוד). */
export const conversationsFor = (userId: string) =>
  CONVERSATIONS.filter((c) => c.participants.some((p) => p.userId === userId))

/**
 * כמה הודעות לא נקראו למשתמש בשיחה — הודעות של אחרים
 * שהגיעו אחרי lastReadMessageId שלו.
 */
export function unreadCount(
  messages: ChatMessage[],
  conversation: Conversation,
  userId: string,
): number {
  const inConv = messages
    .filter((m) => m.conversationId === conversation.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const me = conversation.participants.find((p) => p.userId === userId)
  const lastReadIdx = me?.lastReadMessageId
    ? inConv.findIndex((m) => m.id === me.lastReadMessageId)
    : -1
  return inConv.slice(lastReadIdx + 1).filter((m) => m.senderId !== userId)
    .length
}
