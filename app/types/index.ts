/*
 * נקודת כניסה אחת לכל טיפוסי הדומיין של הפלטפורמה.
 * ייבוא לדוגמה:  import type { User, Project, Lead } from '~/types'
 *
 * המבנה תואם לפרקי האפיון (docs/spec.md):
 *  common       — יסודות ובינלאומיות (1, 14)
 *  user         — משתמשים, תפקידים, הרשאות (2, 7)
 *  project      — פרויקטים, יחידות, שריון (5, 8)
 *  listing      — מרקטפלייס וחיפוש מתקדם (3.1, 3.2)
 *  lead         — לידים ומעקב מתקדם (13)
 *  client       — הזמנות, עסקאות, מסמכים, תשלומים (4, 6)
 *  chat         — צ׳אט (9)
 *  notification — נוטיפיקציות (10)
 *  report       — דוחות (11)
 *  article      — כתבות דינמיות (3.4)
 *  ai           — בוט המלצות + ייבוא חכם (3.3, 12)
 *  sync         — סנכרון והיסטוריית שינויים (8)
 */
export * from './common'
export * from './user'
export * from './project'
export * from './listing'
export * from './lead'
export * from './client'
export * from './chat'
export * from './notification'
export * from './report'
export * from './article'
export * from './ai'
export * from './sync'