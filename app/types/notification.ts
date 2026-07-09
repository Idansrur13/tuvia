/*
 * נוטיפיקציות והתראות — חוצות-מערכת, רב-ערוציות (פרק 10).
 */
import type { Id, ISODate } from './common'

/** ערוצי הפצה. */
export type NotificationChannel = 'inApp' | 'email' | 'push' | 'whatsapp'

/** אירועים שמייצרים התראה (פרק 10). */
export type NotificationEvent =
  | 'lead.new'
  | 'meeting.scheduled'
  | 'payment.due'
  | 'payment.received'
  | 'status.changed'
  | 'document.new'
  | 'chat.message'
  | 'unit.sold'
  | 'price.changed'
  | 'reservation.requested'

export interface Notification {
  id: Id
  /** מקבל ההתראה. */
  userId: Id
  event: NotificationEvent
  title: string
  body?: string
  /** קישור פנימי לישות הרלוונטית (עמוד ליד/עסקה/שיחה). */
  href?: string
  read: boolean
  createdAt: ISODate
}

/**
 * העדפות אישיות — לכל אירוע, באילו ערוצים לקבל (פרק 10).
 */
export type NotificationPreferences = Record<NotificationEvent, NotificationChannel[]>