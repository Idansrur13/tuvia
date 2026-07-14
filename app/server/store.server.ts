/*
 * יישום ייבוא חכם על ה-DB — ממיר את פלט מנוע הייבוא (מספרים/מחרוזות
 * גולמיים) לצורות המודל (Money / Localized / Address) וכותב ל-Postgres.
 * (לשעבר מאגר בזיכרון; getProjects עבר ל-queries.server.)
 */
import { COUNTRIES, L, img } from '~/data'
import type { Country, Currency, ImportResult, ImportSummary } from '~/types'
import { db } from './db.server'

export { getProjects } from './queries.server'

/** בעלים ברירת מחדל לפרויקטים חדשים מהייבוא, עד שיהיה auth אמיתי. */
const DEFAULT_CONTRACTOR_ID = 'org-tchelet'

/** מתאים שם מדינה (בעברית/אנגלית) לאובייקט Country, או בונה ברירת מחדל. */
function resolveCountry(name: string): Country {
  const key = name.trim().toLowerCase()
  const found = Object.values(COUNTRIES).find(
    (c) => c.name.he === name.trim() || c.name.en.toLowerCase() === key,
  )
  return found ?? { code: '??', name: L(name, name), flag: '🌍' }
}

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9֐-׿]+/g, '-')
      .replace(/^-|-$/g, '') || 'project'
  )
}

/** מיישם תוצאת ייבוא מאושרת על ה-DB ומחזיר סיכום. */
export async function applyImport(result: ImportResult): Promise<ImportSummary> {
  const summary: ImportSummary = {
    newProjects: 0,
    newUnits: 0,
    priceChanges: 0,
    sold: 0,
    unchanged: 0,
  }

  for (const parsed of result.projects) {
    const currency = (parsed.currency || 'USD') as Currency

    let project = parsed.projectId
      ? await db.project.findUnique({
          where: { id: parsed.projectId },
          include: { units: true },
        })
      : null

    if (!project) {
      project = await db.project.create({
        data: {
          id: `${slugify(parsed.name)}-${Date.now().toString(36)}`,
          contractorId: DEFAULT_CONTRACTOR_ID,
          status: 'pending',
          name: L(parsed.name, parsed.name),
          country: resolveCountry(parsed.country) as object,
          city: parsed.city,
          cover: img('photo-1486406146926-c627a92ad1ab') as object,
          gallery: [],
        },
        include: { units: true },
      })
      summary.newProjects++
    }

    for (const u of parsed.units) {
      const existing = project.units.find(
        (e) => e.id === u.unitId || e.name === u.name,
      )

      if (!existing) {
        await db.unit.create({
          data: {
            ...(u.unitId ? { id: u.unitId } : {}),
            projectId: project.id,
            name: u.name,
            rooms: u.rooms ?? 0,
            sqm: u.sqm ?? 0,
            priceAmount: u.price ?? u.oldPrice ?? 0,
            priceCurrency: currency,
            status: u.price === null ? 'sold' : 'available',
          },
        })
        if (u.price === null) summary.sold++
        else summary.newUnits++
        continue
      }

      if (u.price === null) {
        if (existing.status !== 'sold') {
          await db.unit.update({
            where: { id: existing.id },
            data: { status: 'sold' },
          })
          summary.sold++
        } else {
          summary.unchanged++
        }
      } else if (u.price !== existing.priceAmount) {
        const history = (existing.priceHistory as object[]) ?? []
        await db.unit.update({
          where: { id: existing.id },
          data: {
            priceAmount: u.price,
            priceHistory: [
              ...history,
              {
                at: new Date().toISOString(),
                from: { amount: existing.priceAmount, currency: existing.priceCurrency },
                to: { amount: u.price, currency: existing.priceCurrency },
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
