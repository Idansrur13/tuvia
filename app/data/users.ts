/*
 * ארגונים ומשתמשי דמו — כיסוי לכל ארבעת התפקידים (פרק 2).
 */
import type { Organization, PartnerApplication, User } from '~/types'
import { stamp } from './util'

export const ORGANIZATIONS: Organization[] = [
  {
    id: 'org-tchelet',
    type: 'contractor',
    name: 'י.כ. בנייה ופיתוח בע״מ',
    /* אנונימיות קבלנים (פרק 17): באזור הציבורי מוצג רק הכינוי. */
    alias: 'C-101',
    verified: true,
    regions: ['תל אביב', 'מרכז'],
    ...stamp('2025-01-10'),
  },
  {
    id: 'org-bluebay',
    type: 'contractor',
    name: 'Blue Bay Development',
    alias: 'C-102',
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

/** שליפת ארגון לפי מזהה. */
export const organizationById = (id?: string) =>
  ORGANIZATIONS.find((o) => o.id === id)

/*
 * בקשות הצטרפות קבלן/מתווך (פרק 17) - מאושרות רק על ידי מנהל.
 * מסך הטיפול ייבנה עם דשבורד האדמין.
 */
export const PARTNER_APPLICATIONS: PartnerApplication[] = [
  {
    id: 'app-1',
    type: 'contractor',
    companyName: 'Aegean Homes Ltd',
    contactName: 'Nikos Papadopoulos',
    email: 'nikos@aegeanhomes.gr',
    phone: '+30 210 5551234',
    country: 'Greece',
    status: 'pending',
    ...stamp('2026-07-08'),
  },
  {
    id: 'app-2',
    type: 'agency',
    companyName: 'תיווך פרימיום חיפה',
    contactName: 'שרון ברק',
    email: 'sharon@premium-haifa.co.il',
    phone: '04-8123456',
    country: 'Israel',
    status: 'approved',
    reviewedById: 'u-admin',
    reviewedAt: '2026-07-01T10:00:00Z',
    ...stamp('2026-06-25', '2026-07-01'),
  },
  {
    id: 'app-3',
    type: 'contractor',
    companyName: 'Sunrise Construct SRL',
    contactName: 'Andrei Ionescu',
    email: 'andrei@sunrise-construct.ro',
    country: 'Romania',
    status: 'rejected',
    reviewedById: 'u-admin',
    reviewedAt: '2026-06-20T09:00:00Z',
    note: 'חסרים מסמכי רישום חברה',
    ...stamp('2026-06-15', '2026-06-20'),
  },
]
