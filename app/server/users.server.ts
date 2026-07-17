import { db } from './db.server'

export function getUser() {}

/**
 * ליד מטופס "השארת פרטים" בעמוד נכס ציבורי (פרק 8):
 * יוצר User(client) + Lead המשויכים לנכס, לפרויקט ולסוכן האחראי.
 * פנייה חוזרת מאותו טלפון לא יוצרת כפילות — נרשמת כפעילות על הליד הקיים.
 */
export async function contactLeadForm(form: FormData) {
  const name = String(form.get('name') ?? '').trim()
  const phone = String(form.get('phone') ?? '').trim()
  const unitId = String(form.get('unitId') ?? '') || undefined
  if (!name || !phone) return { ok: false as const }

  const now = new Date()
  const unit = unitId
    ? await db.unit.findUnique({
        where: { id: unitId },
        select: { id: true, projectId: true, agentId: true },
      })
    : null

  /* פנייה חוזרת — מזהים לפי טלפון ומעדכנים את הליד הקיים במקום ליצור כפול */
  const existing = await db.user.findFirst({
    where: { phone, role: 'client' },
    include: { lead: true },
  })
  if (existing?.lead) {
    await db.$transaction([
      db.lead.update({
        where: { id: existing.id },
        data: {
          lastActivityAt: now,
          unitId: unit?.id ?? existing.lead.unitId,
          projectId: unit?.projectId ?? existing.lead.projectId,
        },
      }),
      db.leadActivity.create({
        data: {
          leadId: existing.id,
          at: now,
          kind: 'note',
          byUserId: existing.id,
          summary: 'פנייה חוזרת מדף נכס במרקטפלייס',
        },
      }),
    ])
    return { ok: true as const, leadId: existing.id }
  }

  const user = await db.user.create({
    data: {
      role: 'client',
      status: 'invited',
      name,
      phone,
      /* אין אימייל בטופס — placeholder ייחודי (העמודה unique) עד שהלקוח יירשם */
      email: `lead-${crypto.randomUUID()}@placeholder.local`,
      locale: 'he',
      lead: {
        create: {
          source: 'marketplace',
          unitId: unit?.id,
          projectId: unit?.projectId,
          assignedToId: unit?.agentId,
          lastActivityAt: now,
        },
      },
    },
  })
  await db.leadActivity.create({
    data: {
      leadId: user.id,
      at: now,
      kind: 'note',
      byUserId: user.id,
      summary: 'השארת פרטים בדף הנכס',
    },
  })
  return { ok: true as const, leadId: user.id }
}
