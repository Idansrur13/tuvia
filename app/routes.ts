import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('property/:id', 'routes/property.tsx'),
  route('*', 'routes/not-found.tsx'),
  route('assistant', 'routes/assistant.tsx'),
  // route('logIn', 'routes/logIn.tsx'),

  /*
   * אזור הדשבורד — מחולק לפי תפקידים.
   * כרגע ממומש אזור הקבלן; בעתיד יתווספו routes ללקוחות ולאדמין
   * (למשל route("dashboard/client", ...) ו-route("dashboard/admin", ...)).
   */
  route('dashboard', 'routes/dashboard.tsx', [
    index('routes/dashboard/projects.tsx'),

    route('property/:id', 'routes/dashboard/property.tsx'),
    route('leads', 'routes/dashboard/leads.tsx'),
    route('deals', 'routes/dashboard/seller/deals.tsx'),
    route('leads/:id', 'routes/dashboard/lead.tsx'),
    route('import', 'routes/dashboard/import.tsx'),
    route('chat', 'routes/dashboard/chat.tsx'),

    /* דשבורד המוכר/מתווך (פרק 6) */
    route('seller', 'routes/dashboard/seller/overview.tsx'),
    route('seller/portfolio', 'routes/dashboard/seller/portfolio.tsx'),
    route('seller/listing/new', 'routes/dashboard/seller/listing-new.tsx'),
    route('seller/inventory', 'routes/dashboard/seller/inventory.tsx'),
    route('seller/viewings', 'routes/dashboard/seller/viewings.tsx'),

    /* דשבורד האדמין (פרקים 7, 16.2, 17) */
    route('admin', 'routes/dashboard/admin/overview.tsx'),
    route('admin/applications', 'routes/dashboard/admin/applications.tsx'),
    route('admin/organizations', 'routes/dashboard/admin/organizations.tsx'),
    route('admin/organizations/:id', 'routes/dashboard/admin/organization.tsx'),
    route('admin/users', 'routes/dashboard/admin/users.tsx'),
    route('admin/moderation', 'routes/dashboard/admin/moderation.tsx'),
    route('admin/payments', 'routes/dashboard/admin/payments.tsx'),
  ]),
] satisfies RouteConfig
