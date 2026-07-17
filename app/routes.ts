import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('property/:id', 'routes/property.tsx'),
  route('assistant', 'routes/assistant.tsx'),
  route('logIn', 'routes/logIn.tsx'),

  /*
   * אזור הדשבורד — מחולק לפי תפקידים.
   * כרגע ממומש אזור הקבלן; בעתיד יתווספו routes ללקוחות ולאדמין
   * (למשל route("dashboard/client", ...) ו-route("dashboard/admin", ...)).
   */
  route('dashboard', 'routes/dashboard.tsx', [
    index('routes/dashboard/projects.tsx'),

    route('property/:id', 'routes/dashboard/property.tsx'),
    route('leads', 'routes/dashboard/leads.tsx'),
    route('import', 'routes/dashboard/import.tsx'),
    route('chat', 'routes/dashboard/chat.tsx'),

    /* דשבורד המוכר/מתווך (פרק 6) */
    route('seller', 'routes/dashboard/seller/overview.tsx'),
    route('seller/portfolio', 'routes/dashboard/seller/portfolio.tsx'),
    route('seller/listing/new', 'routes/dashboard/seller/listing-new.tsx'),
    route('seller/inventory', 'routes/dashboard/seller/inventory.tsx'),
    route('seller/viewings', 'routes/dashboard/seller/viewings.tsx'),
    route('seller/deals', 'routes/dashboard/seller/deals.tsx'),
  ]),
] satisfies RouteConfig
