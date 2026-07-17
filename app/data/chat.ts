/*
 * שיחות צ׳אט דמו (פרק 9) — כל שיחה נסובה סביב ליד (leadId).
 * הליד הוא גם משתמש (PK משותף) ולרוב משתתף בשיחה עצמה;
 * לעיתים הצוות משוחח עליו בלעדיו (conv-2, conv-5).
 * דרך הליד נשלפת גם היחידה שהוא מתעניין בה (lead.unitId).
 */
import type { ChatMessage, Conversation } from '~/types'

export const MESSAGES: ChatMessage[] = [
  /* conv-1: ליד ↔ מתווכת — אבי רוזן מול מיכל */
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'lead-1',
    body: 'היי מיכל, מתי אפשר לתאם סיור בדירה?',
    delivery: 'read',
    createdAt: '2026-07-08T09:00:00Z',
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    senderId: 'u-michal',
    body: 'שלום אבי! אפשר מחר ב-17:00, מתאים?',
    delivery: 'read',
    createdAt: '2026-07-08T09:05:00Z',
    linkedEntity: { type: 'unit', unitId: 'A-12' },
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    senderId: 'lead-1',
    body: 'מושלם, נתראה מחר 🙏',
    delivery: 'delivered',
    createdAt: '2026-07-08T09:07:00Z',
  },

  /* conv-2: מתווך ↔ קבלן — על הליד קרלוס והשריון של היחידה שלו */
  {
    id: 'msg-4',
    conversationId: 'conv-2',
    senderId: 'u-david-seller',
    body: 'Mike, can you approve the reservation on Unit 142 for Carlos?',
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

  /* conv-3: קבוצתית — הליד דוד לוי + קבלן + מתווכת סביב העסקה שלו */
  {
    id: 'msg-6',
    conversationId: 'conv-3',
    senderId: 'u-yossi',
    body: 'דוד, החוזה המעודכן הועלה למערכת. מיכל — תוכלי לעבור איתו על הנספח?',
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
    senderId: 'lead-3',
    body: 'תודה לשניכם! מחכה לעדכון.',
    delivery: 'delivered',
    createdAt: '2026-07-07T18:40:00Z',
  },

  /* conv-4: קבלן ↔ ליד — מייק מול אמה על הפנטהאוז */
  {
    id: 'msg-9',
    conversationId: 'conv-4',
    senderId: 'u-mike',
    body: 'Hi Emma, the penthouse is available for a viewing this week — interested?',
    delivery: 'delivered',
    createdAt: '2026-07-09T07:30:00Z',
    linkedEntity: { type: 'unit', unitId: 'C-15' },
  },

  /* conv-5: מתווכת ↔ קבלן — על הליד החם דוד לוי, בלעדיו */
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
    leadId: 'lead-1',
    participants: [
      { userId: 'lead-1', role: 'client', lastReadMessageId: 'msg-3' },
      { userId: 'u-michal', role: 'seller', lastReadMessageId: 'msg-2' },
    ],
    lastMessage: lastOf('conv-1'),
    createdAt: '2026-06-15T00:00:00Z',
    updatedAt: '2026-07-08T09:07:00Z',
  },
  {
    id: 'conv-2',
    leadId: 'lead-4',
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
    leadId: 'lead-3',
    participants: [
      { userId: 'lead-3', role: 'client', lastReadMessageId: 'msg-8' },
      { userId: 'u-yossi', role: 'contractor', lastReadMessageId: 'msg-7' },
      { userId: 'u-michal', role: 'seller', lastReadMessageId: 'msg-8' },
    ],
    lastMessage: lastOf('conv-3'),
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-07T18:40:00Z',
  },
  {
    id: 'conv-4',
    leadId: 'lead-2',
    participants: [
      { userId: 'u-mike', role: 'contractor', lastReadMessageId: 'msg-9' },
      { userId: 'lead-2', role: 'client' },
    ],
    lastMessage: lastOf('conv-4'),
    createdAt: '2026-07-09T07:30:00Z',
    updatedAt: '2026-07-09T07:30:00Z',
  },
  {
    id: 'conv-5',
    leadId: 'lead-3',
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
