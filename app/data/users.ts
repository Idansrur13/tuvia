/*
 * ארגונים ומשתמשי דמו — כיסוי לכל ארבעת התפקידים (פרק 2).
 */
import type { Organization, User } from '~/types'
import { stamp } from './util'

export const ORGANIZATIONS: Organization[] = [
  {
    id: 'org-tchelet',
    type: 'contractor',
    name: 'י.כ. בנייה ופיתוח בע״מ',
    verified: true,
    regions: ['תל אביב', 'מרכז'],
    ...stamp('2025-01-10'),
  },
  {
    id: 'org-bluebay',
    type: 'contractor',
    name: 'Blue Bay Development',
    verified: true,
    regions: ['Larnaca', 'Miami'],
    ...stamp('2025-02-01'),
  },
  {
    id: 'org-remax-tlv',
    type: 'agency',
    name: 'רי/מקס תל אביב',
    verified: true,
    regions: ['תל אביב', 'הרצליה', 'רמת גן'],
    ...stamp('2025-03-15'),
  },
]

export const USERS: User[] = [
  /* ---------- אדמין ---------- */
  {
    id: 'u-admin',
    role: 'admin',
    status: 'active',
    name: 'מנהל המערכת',
    email: 'admin@platform.com',
    preferences: { locale: 'he', currency: 'ILS' },
    ...stamp('2025-01-01'),
  },

  /* ---------- קבלנים ---------- */
  {
    id: 'u-yossi',
    role: 'contractor',
    status: 'active',
    name: 'יוסי כהן',
    email: 'yossi@tchelet.co.il',
    phone: '050-1112233',
    organizationId: 'org-tchelet',
    preferences: { locale: 'he', currency: 'ILS' },
    ...stamp('2025-01-12'),
  },
  {
    id: 'u-mike',
    role: 'contractor',
    status: 'active',
    name: 'Mike Anderson',
    email: 'mike@bluebay.com',
    phone: '+357 99 123456',
    organizationId: 'org-bluebay',
    preferences: { locale: 'en', currency: 'EUR' },
    ...stamp('2025-02-03'),
  },

  /* ---------- מוכרים (מתווכים) ---------- */
  {
    id: 'u-michal',
    role: 'seller',
    status: 'active',
    name: 'מיכל לוי',
    email: 'michal@remax-tlv.co.il',
    phone: '050-4445566',
    organizationId: 'org-remax-tlv',
    preferences: { locale: 'he', currency: 'ILS' },
    ...stamp('2025-03-20'),
  },
  {
    id: 'u-david-seller',
    role: 'seller',
    status: 'active',
    name: 'דוד אברהם',
    email: 'david@remax-tlv.co.il',
    phone: '054-7778899',
    organizationId: 'org-remax-tlv',
    preferences: { locale: 'he', currency: 'ILS' },
    ...stamp('2025-04-05'),
  },

  /* ---------- לקוחות ---------- */
  {
    id: 'u-ron',
    role: 'client',
    status: 'active',
    name: 'רון אלמוג',
    email: 'ron.almog@gmail.com',
    phone: '052-9998877',
    preferences: { locale: 'he', currency: 'ILS' },
    ...stamp('2026-06-12'),
  },
  {
    id: 'u-emma',
    role: 'client',
    status: 'invited',
    name: 'Emma Wilson',
    email: 'emma.w@gmail.com',
    phone: '+44 7700 900123',
    preferences: { locale: 'en', currency: 'GBP' },
    ...stamp('2026-06-28'),
  },
]

/** שליפת משתמש לפי מזהה. */
export const userById = (id?: string) => USERS.find((u) => u.id === id)
