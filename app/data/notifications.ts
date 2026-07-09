/*
 * נוטיפיקציות דמו (פרק 10).
 */
import type { Notification } from '~/types'

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'ntf-1',
    userId: 'u-michal',
    event: 'lead.new',
    title: 'ליד חדש: אבי רוזן',
    body: 'התעניין במגדלי תכלת',
    href: '/dashboard/leads',
    read: false,
    createdAt: '2026-07-09T08:00:00Z',
  },
  {
    id: 'ntf-2',
    userId: 'u-yossi',
    event: 'reservation.requested',
    title: 'בקשת שריון חדשה',
    body: 'דוד אברהם ביקש לשריין את Unit 142',
    href: '/dashboard/projects',
    read: false,
    createdAt: '2026-07-06T11:00:00Z',
  },
  {
    id: 'ntf-3',
    userId: 'u-ron',
    event: 'document.new',
    title: 'מסמך חדש לחתימה',
    body: 'אישור זמין לחתימה דיגיטלית',
    href: '/dashboard/documents',
    read: false,
    createdAt: '2026-07-01T09:00:00Z',
  },
  {
    id: 'ntf-4',
    userId: 'u-ron',
    event: 'payment.due',
    title: 'תזכורת תשלום',
    body: 'תשלום 2/4 לתשלום עד 01.08',
    href: '/dashboard/payments',
    read: true,
    createdAt: '2026-07-05T09:00:00Z',
  },
]

/** התראות של משתמש, החדשות ראשונות. */
export const notificationsFor = (userId: string) =>
  NOTIFICATIONS.filter((n) => n.userId === userId).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
