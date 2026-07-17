/*
 * נקודת כניסה אחת לשכבת נתוני הדמו (seed).
 * ייבוא לדוגמה:  import { PROJECTS, LEADS, formatMoney } from '~/data'
 *
 * שכבה זו מחליפה את app/dashboard/data.ts ו-app/listings/data.ts הישנים.
 * כשמתחברים ל-DB אמיתי — מחליפים רק את הקבצים כאן.
 */
export * from './util' // IMG, img, L, money, formatMoney, stamp, COUNTRIES
export * from './meta' // UNIT_STATUS_META, LEAD_STAGE_META, LEAD_STAGES, DEAL_STAGE_META
export * from './users' // ORGANIZATIONS, USERS
export * from './projects' // PROJECTS, RESERVATIONS, projectById
export * from './units' // UNITS, unitById, LISTING_CATEGORIES, DEAL_TYPES
export * from './leads' // LEADS, leadById, leadsAssignedTo
export * from './clients' // INVITES, DEALS, dealById, dealForClient
export * from './notifications' // NOTIFICATIONS, notificationsFor
export * from './chat' // CONVERSATIONS, MESSAGES, messagesFor, conversationsFor
export * from './articles' // ARTICLES, articleBySlug, publishedArticles
export * from './viewings' // VIEWINGS, viewingsFor
