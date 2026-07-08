import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("property/:id", "routes/property.tsx"),

  /*
   * אזור הדשבורד — מחולק לפי תפקידים.
   * כרגע ממומש אזור הקבלן; בעתיד יתווספו routes ללקוחות ולאדמין
   * (למשל route("dashboard/client", ...) ו-route("dashboard/admin", ...)).
   */
  route("dashboard", "routes/dashboard.tsx", [
    index("routes/dashboard/projects.tsx"),
    route("leads", "routes/dashboard/leads.tsx"),
    route("import", "routes/dashboard/import.tsx"),
  ]),
] satisfies RouteConfig;
