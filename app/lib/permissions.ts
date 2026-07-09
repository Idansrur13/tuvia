import type { Permission, Role } from '~/types'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
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
