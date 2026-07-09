/*
 * מאגר נתונים בזיכרון השרת — תחליף זמני ל-DB (שורד HMR דרך globalThis).
 * ממיר את פלט מנוע הייבוא (מספרים/מחרוזות גולמיים) לצורות המודל החדש
 * (Money / Localized / Address). כשיהיה DB אמיתי — מחליפים רק את הקובץ הזה.
 */
import { COUNTRIES, L, PROJECTS, img, money } from '~/data'
import type {
  Country,
  Currency,
  ImportResult,
  ImportSummary,
  Project,
  Unit,
} from '~/types'

interface Store {
  projects: Project[]
}

const g = globalThis as typeof globalThis & { __platformStore?: Store }
g.__platformStore ??= { projects: structuredClone(PROJECTS) }
const store = g.__platformStore

export function getProjects(): Project[] {
  return store.projects
}

/** בעלים ברירת מחדל לפרויקטים חדשים מהייבוא, עד שיהיה auth אמיתי. */
const DEFAULT_CONTRACTOR_ID = 'org-tchelet'
const DEFAULT_COVER = img('photo-1486406146926-c627a92ad1ab')

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

/** מיישם תוצאת ייבוא מאושרת על המאגר ומחזיר סיכום. */
export function applyImport(result: ImportResult): ImportSummary {
  const summary: ImportSummary = {
    newProjects: 0,
    newUnits: 0,
    priceChanges: 0,
    sold: 0,
    unchanged: 0,
  }
  const now = new Date().toISOString()

  for (const parsed of result.projects) {
    const currency = (parsed.currency || 'USD') as Currency
    let project = parsed.projectId
      ? store.projects.find((p) => p.id === parsed.projectId)
      : undefined

    if (!project) {
      project = {
        id: `${slugify(parsed.name)}-${Date.now().toString(36)}`,
        contractorId: DEFAULT_CONTRACTOR_ID,
        status: 'pending',
        name: L(parsed.name, parsed.name),
        address: { country: resolveCountry(parsed.country), city: parsed.city },
        cover: DEFAULT_COVER,
        gallery: [],
        units: [],
        createdAt: now,
        updatedAt: now,
      }
      store.projects.push(project)
      summary.newProjects++
    }

    for (const u of parsed.units) {
      const existing = project.units.find(
        (e) => e.id === u.unitId || e.name === u.name,
      )

      if (!existing) {
        const unit: Unit = {
          id:
            u.unitId ??
            `U-${project.units.length + 1}-${Date.now().toString(36)}`,
          projectId: project.id,
          name: u.name,
          rooms: u.rooms ?? 0,
          sqm: u.sqm ?? 0,
          price: money(u.price ?? u.oldPrice ?? 0, currency),
          status: u.price === null ? 'sold' : 'available',
          createdAt: now,
          updatedAt: now,
        }
        project.units.push(unit)
        if (u.price === null) summary.sold++
        else summary.newUnits++
        continue
      }

      if (u.price === null) {
        if (existing.status !== 'sold') {
          existing.status = 'sold'
          existing.updatedAt = now
          summary.sold++
        } else {
          summary.unchanged++
        }
      } else if (u.price !== existing.price.amount) {
        existing.price = money(u.price, existing.price.currency)
        existing.updatedAt = now
        summary.priceChanges++
      } else {
        summary.unchanged++
      }
    }
  }

  return summary
}
