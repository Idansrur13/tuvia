/*
 * ייבוא מקומי — פענוח מחירונים בלי AI.
 * רץ כשאין ANTHROPIC_API_KEY: מפענח CSV / TSV / JSON, מזהה עמודות בעברית
 * ובאנגלית ומחזיר בדיוק את המבנה שהמודל היה מחזיר, כך ששלב השוואת
 * השינויים (annotateChanges) נשאר משותף לשני המסלולים.
 */
import type { ImportPayload } from './ai.server'

/** סיומות שאנחנו יודעים לפענח לבד. השאר (PDF/DOCX/תמונות) דורש AI. */
const LOCAL_EXTENSIONS = ['csv', 'tsv', 'txt', 'json']

export const canParseLocally = (fileName: string) =>
  LOCAL_EXTENSIONS.includes((fileName.split('.').pop() ?? '').toLowerCase())

/* ---------- CSV ---------- */

/** פיצול שורת CSV עם תמיכה במרכאות ובפסיק בתוך שדה. */
function splitRow(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let current = ''
  let quoted = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    /* מרכאות נחשבות תוחם רק בתחילת תא — כך כותרת כמו מ"ר לא שוברת את השורה */
    if (ch === '"' && (quoted || current === '')) {
      if (quoted && line[i + 1] === '"') {
        current += '"'
        i++
      } else quoted = !quoted
    } else if (ch === delimiter && !quoted) {
      cells.push(current.trim())
      current = ''
    } else current += ch
  }
  cells.push(current.trim())
  return cells
}

/** המפריד הנפוץ ביותר בשורת הכותרות מנצח. */
function detectDelimiter(headerLine: string): string {
  const counts = [',', ';', '\t', '|'].map(
    (d) => [d, headerLine.split(d).length] as const,
  )
  return counts.sort((a, b) => b[1] - a[1])[0][1] > 1
    ? counts.sort((a, b) => b[1] - a[1])[0][0]
    : ','
}

/* ---------- זיהוי עמודות ---------- */

type Column =
  | 'project'
  | 'unit'
  | 'rooms'
  | 'sqm'
  | 'price'
  | 'buyer'
  | 'city'
  | 'country'
  | 'currency'
  | 'status'

const COLUMN_ALIASES: Record<Column, RegExp> = {
  project: /^(פרויקט|פרוייקט|project|development|building)/i,
  unit: /^(יחידה|דירה|נכס|מספר דירה|unit|apartment|apt|flat|title|name)/i,
  rooms: /^(חדרים|חד|rooms?|beds?|bedrooms?)/i,
  sqm: /^(מ["״]?ר|שטח|גודל|sqm|size|area|m2)/i,
  price: /^(מחיר|price|amount|cost|value)/i,
  buyer: /^(רוכש|קונה|לקוח|buyer|client|customer)/i,
  city: /^(עיר|ישוב|יישוב|city|town)/i,
  country: /^(מדינה|country)/i,
  currency: /^(מטבע|currency)/i,
  status: /^(סטטוס|מצב|status|availability)/i,
}

function mapHeaders(headers: string[]): Partial<Record<Column, number>> {
  const map: Partial<Record<Column, number>> = {}
  headers.forEach((header, index) => {
    const clean = header.replace(/^["'\s]+|["'\s]+$/g, '')
    for (const [column, pattern] of Object.entries(COLUMN_ALIASES) as [
      Column,
      RegExp,
    ][]) {
      if (map[column] === undefined && pattern.test(clean)) map[column] = index
    }
  })
  return map
}

/* ---------- נרמול ערכים ---------- */

const SOLD = /^(נמכר[ה]?|sold|reserved|משוריין)$/i

/** "₪4,650,000" → 4650000. ריק / "-" / "נמכר" → null (משמעותו יחידה שנמכרה). */
function parsePrice(raw: string | undefined): number | null {
  if (!raw) return null
  const value = raw.trim()
  if (!value || value === '-' || SOLD.test(value)) return null
  const digits = value.replace(/[^\d.]/g, '')
  const amount = Number(digits)
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

function parseNumber(raw: string | undefined): number | null {
  if (!raw) return null
  const amount = Number(raw.replace(/[^\d.]/g, ''))
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

const CURRENCY_SYMBOLS: [RegExp, string][] = [
  [/₪|ils|nis|שקל/i, 'ILS'],
  [/€|eur|יורו/i, 'EUR'],
  [/\$|usd|דולר/i, 'USD'],
  [/£|gbp|פאונד/i, 'GBP'],
  [/aed|דירהם/i, 'AED'],
]

const detectCurrency = (samples: string[]) =>
  CURRENCY_SYMBOLS.find(([pattern]) =>
    samples.some((s) => pattern.test(s)),
  )?.[1]

/* ---------- הרכבת התוצאה ---------- */

interface Row {
  project?: string
  unit?: string
  rooms?: number | null
  sqm?: number | null
  price?: number | null
  buyer?: string
  city?: string
  country?: string
  currency?: string
}

/** שם הקובץ משמש כשם הפרויקט כשאין עמודת פרויקט. */
const projectNameFromFile = (fileName: string) =>
  fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim() || 'Import'

function rowsToPayload(rows: Row[], fileName: string): ImportPayload | null {
  const usable = rows.filter((r) => r.unit)
  if (usable.length === 0) return null

  const groups = new Map<string, Row[]>()
  for (const row of usable) {
    const key = row.project?.trim() || projectNameFromFile(fileName)
    const group = groups.get(key)
    if (group) group.push(row)
    else groups.set(key, [row])
  }

  return {
    projects: [...groups].map(([name, group]) => ({
      matchedProjectId: null,
      name: { he: name, en: name },
      city: group.find((r) => r.city)?.city ?? '',
      country: group.find((r) => r.country)?.country ?? '',
      currency: group.find((r) => r.currency)?.currency ?? 'USD',
      units: group.map((row) => ({
        unitId: null,
        title: { he: row.unit!, en: row.unit! },
        rooms: row.rooms ?? null,
        sqm: row.sqm ?? null,
        price: row.price ?? null,
        buyer: row.buyer || null,
      })),
    })),
  }
}

function parseDelimited(text: string, fileName: string): ImportPayload | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) return null

  const delimiter = detectDelimiter(lines[0])
  const headers = splitRow(lines[0], delimiter)
  const columns = mapHeaders(headers)
  if (columns.unit === undefined && columns.price === undefined) return null

  const cellsOf = (line: string) => splitRow(line, delimiter)
  const priceCells = lines
    .slice(1)
    .map((l) => cellsOf(l)[columns.price ?? -1] ?? '')
  /* מטבע ברירת מחדל לקובץ; שורה עם סימן מטבע משלה גוברת עליו */
  const fileCurrency = detectCurrency([headers.join(' '), ...priceCells])

  const rows: Row[] = lines.slice(1).map((line) => {
    const cells = cellsOf(line)
    const at = (column?: number) =>
      column === undefined ? undefined : cells[column]?.trim()
    const status = at(columns.status)
    const price = parsePrice(at(columns.price))
    return {
      project: at(columns.project),
      unit: at(columns.unit) ?? at(columns.project),
      rooms: parseNumber(at(columns.rooms)),
      sqm: parseNumber(at(columns.sqm)),
      /* סטטוס "נמכר" גובר על המחיר — כך היחידה מסומנת כנמכרה */
      price: status && SOLD.test(status) ? null : price,
      buyer: at(columns.buyer),
      city: at(columns.city),
      country: at(columns.country),
      currency:
        at(columns.currency) ??
        detectCurrency([at(columns.price) ?? '']) ??
        fileCurrency,
    }
  })

  return rowsToPayload(rows, fileName)
}

/* ---------- JSON ---------- */

const asString = (v: unknown) => (typeof v === 'string' ? v : undefined)

function parseJson(text: string, fileName: string): ImportPayload | null {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }

  /* קובץ שכבר במבנה הייבוא — מחזירים כמו שהוא */
  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as ImportPayload).projects)
  )
    return data as ImportPayload

  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as Record<string, unknown>)?.units)
      ? ((data as Record<string, unknown>).units as unknown[])
      : null
  if (!list) return null

  const rows: Row[] = list.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const r = item as Record<string, unknown>
    const pick = (column: Column) => {
      const key = Object.keys(r).find((k) => COLUMN_ALIASES[column].test(k))
      return key ? r[key] : undefined
    }
    const unit = asString(pick('unit')) ?? asString(pick('project'))
    if (!unit) return []
    return [
      {
        project: asString(pick('project')),
        unit,
        rooms: parseNumber(String(pick('rooms') ?? '')),
        sqm: parseNumber(String(pick('sqm') ?? '')),
        price: parsePrice(String(pick('price') ?? '')),
        buyer: asString(pick('buyer')),
        city: asString(pick('city')),
        country: asString(pick('country')),
        currency: asString(pick('currency')),
      },
    ]
  })

  return rowsToPayload(rows, fileName)
}

/* ---------- נקודת הכניסה ---------- */

/** מפענח את הקובץ מקומית, או null אם הפורמט/התוכן לא מתאים. */
export async function parseFileLocally(
  file: File,
): Promise<ImportPayload | null> {
  if (!canParseLocally(file.name)) return null
  const text = await file.text()
  const ext = (file.name.split('.').pop() ?? '').toLowerCase()
  return ext === 'json'
    ? parseJson(text, file.name)
    : parseDelimited(text, file.name)
}
