/*
 * שכבת הסנכרון — היסטוריית שינויים ואירועים חוצי-דשבורדים (פרק 8).
 * מקור אמת אחד: כל שינוי מהותי נרשם כ-AuditEvent ומשודר לצרכנים.
 */
import type { Id, ISODate } from './common'
import type { Role } from './user'

/** הישויות שמשתתפות בסנכרון בזמן אמת. */
export type SyncEntity = 'unit' | 'project' | 'lead' | 'deal' | 'reservation'

/** פעולת השינוי. */
export type SyncAction =
  'created' | 'updated' | 'statusChanged' | 'priceChanged' | 'deleted'

/**
 * רשומת היסטוריה/אודיט לכל שינוי מהותי (פרק 8.2 — עקביות נתונים).
 * משמשת גם לשידור בזמן אמת לדשבורדים הרלוונטיים.
 */
export interface AuditEvent {
  id: Id
  entity: SyncEntity
  entityId: Id
  action: SyncAction
  /** מי ביצע את השינוי, או "system"/"import" לפעולות אוטומטיות. */
  actorId: Id | 'system' | 'import'
  /** התפקידים שאמורים לקבל את העדכון (לניתוב הסנכרון). */
  audience: Role[]
  /** snapshot של השדות שהשתנו (ישן→חדש), לתצוגה בהיסטוריה. */
  changes?: Record<string, { from: unknown; to: unknown }>
  at: ISODate
}
