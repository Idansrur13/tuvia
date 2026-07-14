/*
 * צ׳אט ברמה גבוהה — שיחות מקושרות-הקשר, נקרא/נמסר, מדיה.
 * פרק 9. מחליף את הטיוטה מבוססת-Firebase שהייתה ב-routes/contractor/chat.tsx.
 */
import type { Id, ISODate, MediaAsset, Timestamps } from './common'
import type { Role } from './user'

/** הקשר השיחה — כל שיחה קשורה לישות (יחידה/עסקה/ליד) או ישירה. */
export type ConversationContext =
  | { type: 'direct' }
  | { type: 'unit'; unitId: Id }
  | { type: 'deal'; dealId: Id }
  | { type: 'lead'; leadId: Id }

export interface ChatParticipant {
  userId: Id
  role: Role
  /** ההודעה האחרונה שהמשתמש קרא (לחישוב "לא נקרא"). */
  lastReadMessageId?: Id
}

export interface Conversation extends Timestamps {
  id: Id
  context: ConversationContext
  participants: ChatParticipant[]
  lastMessage?: ChatMessage
  /** שיחה קבוצתית (יותר משני משתתפים). */
  isGroup: boolean
}

/** סטטוס מסירה של הודעה (פרק 9). */
export type MessageDelivery =
  'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface ChatMessage {
  id: Id
  conversationId: Id
  senderId: Id
  body: string
  attachments?: MediaAsset[]
  delivery: MessageDelivery
  createdAt: ISODate
  /** קישור אופציונלי של ההודעה לישות (יחידה/ליד/עסקה). */
  linkedEntity?: ConversationContext
}

/** מצב הקלדה (typing indicator) — אירוע חולף, לא נשמר. */
export interface TypingState {
  conversationId: Id
  userId: Id
  at: ISODate
}
