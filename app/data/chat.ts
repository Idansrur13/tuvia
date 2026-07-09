/*
 * שיחות צ׳אט דמו (פרק 9) — מקושרות להקשר (עסקה/ליד).
 */
import type { ChatMessage, Conversation } from '~/types'

export const MESSAGES: ChatMessage[] = [
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
  {
    id: 'msg-4',
    conversationId: 'conv-2',
    senderId: 'u-david-seller',
    body: 'מייק, אפשר לאשר את השריון על Unit 142?',
    delivery: 'sent',
    createdAt: '2026-07-06T11:00:00Z',
    linkedEntity: { type: 'unit', unitId: 'M-142' },
  },
]

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    context: { type: 'deal', dealId: 'deal-1' },
    isGroup: false,
    participants: [
      { userId: 'u-ron', role: 'client', lastReadMessageId: 'msg-3' },
      { userId: 'u-michal', role: 'seller', lastReadMessageId: 'msg-2' },
    ],
    lastMessage: MESSAGES[2],
    createdAt: '2026-06-15T00:00:00Z',
    updatedAt: '2026-07-08T09:07:00Z',
  },
  {
    id: 'conv-2',
    context: { type: 'unit', unitId: 'M-142' },
    isGroup: false,
    participants: [
      { userId: 'u-david-seller', role: 'seller', lastReadMessageId: 'msg-4' },
      { userId: 'u-mike', role: 'contractor' },
    ],
    lastMessage: MESSAGES[3],
    createdAt: '2026-07-06T11:00:00Z',
    updatedAt: '2026-07-06T11:00:00Z',
  },
]

/** ההודעות של שיחה מסוימת, לפי סדר כרונולוגי. */
export const messagesFor = (conversationId: string) =>
  MESSAGES.filter((m) => m.conversationId === conversationId).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  )

/** השיחות שמשתמש מסוים משתתף בהן. */
export const conversationsFor = (userId: string) =>
  CONVERSATIONS.filter((c) => c.participants.some((p) => p.userId === userId))
