/*
 * מאגר נתונים בזיכרון השרת תחליף זמני ל-DB.
 * שמור על globalThis כדי לשרוד HMR בזמן פיתוח.
 * כשיהיה DB אמיתי מחליפים רק את הקובץ הזה.
 */
import { IMG, PROJECTS, type Project, type Unit } from './data'
import type { ImportResult, ImportSummary } from './import-types'

interface Store {
  projects: Project[]
}

const g = globalThis as typeof globalThis & { __tcheletStore?: Store }
g.__tcheletStore ??= { projects: structuredClone(PROJECTS) }
const store = g.__tcheletStore

export function getProjects(): Project[] {
  return store.projects
}

const COUNTRY_FLAGS: Record<string, string> = {
  ישראל: '🇮🇱',
  קפריסין: '🇨🇾',
  'ארצות הברית': '🇺🇸',
  'ארה"ב': '🇺🇸',
  יוון: '🇬🇷',
  ספרד: '🇪🇸',
  פורטוגל: '🇵🇹',
  גרמניה: '🇩🇪',
  בריטניה: '🇬🇧',
  צרפת: '🇫🇷',
  'איחוד האמירויות': '🇦🇪',
  דובאי: '🇦🇪',
}

const DEFAULT_COVER = IMG('photo-1486406146926-c627a92ad1ab')

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

  for (const parsed of result.projects) {
    let project = parsed.projectId
      ? store.projects.find((p) => p.id === parsed.projectId)
      : undefined

    if (!project) {
      project = {
        id: `${slugify(parsed.name)}-${Date.now().toString(36)}`,
        name: parsed.name,
        city: parsed.city,
        country: parsed.country,
        flag: COUNTRY_FLAGS[parsed.country] ?? '🌍',
        currency: parsed.currency || 'USD',
        cover: DEFAULT_COVER,
        gallery: [],
        units: [],
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
          name: u.name,
          rooms: u.rooms ?? 0,
          sqm: u.sqm ?? 0,
          price: u.price ?? u.oldPrice ?? 0,
          status: u.price === null ? 'sold' : 'available',
          buyer: u.buyer ?? undefined,
        }
        project.units.push(unit)
        if (u.price === null) summary.sold++
        else summary.newUnits++
        continue
      }

      if (u.price === null) {
        if (existing.status !== 'sold') {
          existing.status = 'sold'
          if (u.buyer) existing.buyer = u.buyer
          summary.sold++
        } else {
          summary.unchanged++
        }
      } else if (u.price !== existing.price) {
        existing.price = u.price
        summary.priceChanges++
      } else {
        summary.unchanged++
      }
    }
  }

  return summary
}
