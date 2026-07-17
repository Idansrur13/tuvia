import type { Role } from '~/types'

/** הרשאות לפי תפקיד (פרק 2) — לא מוצמדות ליוזר; נגזרות מה-role בלבד. */
const ROLE_PERMISSIONS: Record<Role, string[]> = {
  client: ['marketplace.view', 'chat.use', 'reports.view'],
  contractor: [
    'projects.manage',
    'leads.manage',
    'chat.use',
    'reports.view',
    'ai.import',
  ],
  seller: ['portfolio.manage', 'leads.manage', 'chat.use', 'reports.view'],
  admin: [
    'users.manage',
    'articles.manage',
    'reports.viewAll',
    'leads.viewAll',
  ],
}
