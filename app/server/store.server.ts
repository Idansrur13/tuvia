/*
 * יישום ייבוא חכם על ה-DB — מקבל ImportedProject[] (פרויקטים ויחידות מלאים
 * עם שדות ביקורת) וכותב ל-Postgres לפי סוג השינוי של כל יחידה.
 * (לשעבר מאגר בזיכרון; getProjects עבר ל-queries.server.)
 */
import { COUNTRIES, L } from '~/data'
import type { Address, Country, ImportResult, ImportSummary } from '~/types'
import { db } from './db.server'

export { getProjects } from './queries.server'

/** מתאים שם מדינה (בעברית/אנגלית) לאובייקט Country, או בונה ברירת מחדל. */
export function resolveCountry(name: string): Country {
  const key = name.trim().toLowerCase()
  const found = Object.values(COUNTRIES).find(
    (c) => c.name.he === name.trim() || c.name.en.toLowerCase() === key,
  )
  return found ?? { code: '??', name: L(name, name), flag: '🌍' }
}

export function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9֐-׿]+/g, '-')
      .replace(/^-|-$/g, '') || 'project'
  )
}

/** כתובת הדומיין → עמודות שטוחות של Unit. */
const addr = (a: Address) => ({
  country: a.country as object,
  city: a.city,
  neighborhood: a.neighborhood,
  street: a.street,
  lat: a.point?.lat,
  lng: a.point?.lng,
})

/** מיישם תוצאת ייבוא מאושרת על ה-DB ומחזיר סיכום. */
export async function applyImport(
  result: ImportResult,
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    newProjects: 0,
    newUnits: 0,
    priceChanges: 0,
    sold: 0,
    unchanged: 0,
  }

  for (const parsed of result.projects) {
    let project = await db.project.findUnique({
      where: { id: parsed.id },
      include: { units: true },
    })

    if (!project) {
      project = await db.project.create({
        data: {
          id: parsed.id,
          contractorId: parsed.contractorId,
          status: 'pending',
          name: parsed.name as object,
          description: (parsed.description as object | undefined) ?? undefined,
        },
        include: { units: true },
      })
      summary.newProjects++
    }

    for (const u of parsed.units) {
      const existing = project.units.find((e) => e.id === u.id)

      if (!existing) {
        await db.unit.create({
          data: {
            id: u.id,
            projectId: project.id,
            title: u.title as object,
            description: u.description as object,
            ...addr(u.address),
            agentId: u.agentId,
            agentRole: u.agentRole,
            dealType: u.dealType,
            category: u.category,
            availability: u.availability,
            features: (u.features ?? []) as object[],
            rooms: u.rooms,
            sqm: u.sqm,
            floor: u.floor,
            priceAmount: u.price?.amount,
            priceCurrency: u.price?.currency,
            status: u.price ? 'available' : 'sold',
          },
        })
        if (u.price) summary.newUnits++
        else summary.sold++
        continue
      }

      if (!u.price) {
        if (existing.status !== 'sold') {
          await db.unit.update({
            where: { id: existing.id },
            data: { status: 'sold' },
          })
          summary.sold++
        } else {
          summary.unchanged++
        }
      } else if (u.price.amount !== existing.priceAmount) {
        const history = (existing.priceHistory as object[]) ?? []
        await db.unit.update({
          where: { id: existing.id },
          data: {
            priceAmount: u.price.amount,
            priceCurrency: u.price.currency,
            priceHistory: [
              ...history,
              {
                at: new Date().toISOString(),
                from:
                  existing.priceAmount != null && existing.priceCurrency
                    ? {
                        amount: existing.priceAmount,
                        currency: existing.priceCurrency,
                      }
                    : undefined,
                to: u.price,
                changedBy: 'import',
              },
            ],
          },
        })
        summary.priceChanges++
      } else {
        summary.unchanged++
      }
    }
  }

  return summary
}
