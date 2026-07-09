/*
 * מנוע הייבוא החכם שולח את הקובץ ל-Claude ומקבל נתונים מובנים.
 * PDF נשלח כ-document block, תמונות כ-image block, DOCX מחולץ לטקסט (mammoth),
 * ושאר הקבצים נשלחים כטקסט. הפלט נאכף עם structured outputs (Zod).
 */
import fs from 'node:fs'
import path from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'

import { getProjects } from './store.server'
import type { ImportResult, ParsedProject, ParsedUnit } from '~/types'

const MAX_FILE_BYTES = 20 * 1024 * 1024 // מגבלת ה-API היא 32MB לבקשה

/* ---------- סכמת הפלט של המודל ---------- */

const AiUnitSchema = z.object({
  unitId: z
    .string()
    .nullable()
    .describe('מזהה יחידה קיימת מהמערכת אם זוהתה התאמה, אחרת null'),
  name: z.string().describe('שם/תיאור היחידה כפי שמופיע בקובץ'),
  rooms: z.number().nullable(),
  sqm: z.number().nullable(),
  price: z
    .number()
    .nullable()
    .describe('מחיר כמספר בלבד. אם אין מחיר / מסומן כנמכר null'),
  buyer: z.string().nullable().describe('שם רוכש/מתעניין אם מופיע'),
})

const AiProjectSchema = z.object({
  matchedProjectId: z
    .string()
    .nullable()
    .describe('מזהה פרויקט קיים מהמערכת אם זו התאמה, אחרת null = פרויקט חדש'),
  name: z.string(),
  city: z.string(),
  country: z.string().describe('שם המדינה בעברית'),
  currency: z.string().describe('קוד מטבע ISO כמו ILS / EUR / USD'),
  units: z.array(AiUnitSchema),
})

const AiImportSchema = z.object({
  projects: z.array(AiProjectSchema),
})

/* ---------- הכנת תוכן הקובץ ---------- */

type ContentBlock = Anthropic.ContentBlockParam

async function fileToContentBlock(file: File): Promise<ContentBlock> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = (file.name.split('.').pop() ?? '').toLowerCase()

  if (ext === 'pdf' || file.type === 'application/pdf') {
    return {
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: buffer.toString('base64'),
      },
    }
  }

  const imageTypes: Record<
    string,
    'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  > = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  }
  if (imageTypes[ext]) {
    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: imageTypes[ext],
        data: buffer.toString('base64'),
      },
    }
  }

  if (ext === 'docx') {
    const mammoth = await import('mammoth')
    const { value } = await mammoth.extractRawText({ buffer })
    return { type: 'text', text: `תוכן הקובץ ${file.name}:\n\n${value}` }
  }

  // txt / csv / md / כל טקסט אחר
  return {
    type: 'text',
    text: `תוכן הקובץ ${file.name}:\n\n${buffer.toString('utf-8')}`,
  }
}

/* ---------- קריאת מפתח API מ-.env אם לא הוגדר בסביבה ---------- */

function ensureApiKey() {
  if (process.env.ANTHROPIC_API_KEY) return
  try {
    const envFile = fs.readFileSync(
      path.resolve(process.cwd(), '.env'),
      'utf-8',
    )
    const match = envFile.match(/^ANTHROPIC_API_KEY\s*=\s*"?([^"\n]+)"?/m)
    if (match) process.env.ANTHROPIC_API_KEY = match[1].trim()
  } catch {
    confirm('חסר מפתח claude ')
    // אין קובץ .env ה-SDK ינסה פרופיל ant auth login
  }
}

/* ---------- הקריאה למודל ---------- */

function buildSystemPrompt() {
  const existing = getProjects().map((p) => ({
    id: p.id,
    name: p.name.he,
    city: p.address.city,
    country: p.address.country.name.he,
    currency: p.units[0]?.price.currency ?? 'USD',
    units: p.units.map((u) => ({
      id: u.id,
      name: u.name,
      rooms: u.rooms,
      sqm: u.sqm,
      price: u.price.amount,
      status: u.status,
    })),
  }))

  return `אתה מנוע ייבוא נתונים של פלטפורמת נדל"ן עולמית לקבלנים.
תפקידך: לקבל קובץ מחירון/מלאי (בכל פורמט ובכל שפה) ולהמיר אותו לנתונים מובנים.

הפרויקטים הקיימים במערכת (JSON):
${JSON.stringify(existing, null, 1)}

כללים:
1. קבץ את היחידות לפי פרויקט. קובץ אחד יכול להכיל כמה פרויקטים.
2. התאמת פרויקטים: אם שם הפרויקט בקובץ דומה לפרויקט קיים (גם בשפה אחרת או בכתיב שונה) החזר את ה-id הקיים ב-matchedProjectId. אחרת null (פרויקט חדש).
3. התאמת יחידות: אם מזהה/שם היחידה תואם יחידה קיימת בפרויקט שהותאם החזר את ה-id הקיים ב-unitId. אחרת null.
4. מחיר: מספר בלבד, בלי סימני מטבע ובלי מפרידי אלפים. אם למחיר אין ערך, מסומן "-", ריק, או כתוב "נמכר"/"sold" החזר null. משמעות null היא שהיחידה נמכרה.
5. currency: קוד ISO. הסק מהסימנים בקובץ (₪=ILS, €=EUR, $=USD) או מהמדינה. לפרויקט קיים השתמש במטבע הקיים שלו.
6. country: שם המדינה בעברית. אם לא ברור הסק מהעיר.
7. אל תמציא נתונים. שדה שלא מופיע בקובץ null.`
}

export type AiImportOutcome =
  { ok: true; result: ImportResult } | { ok: false; error: string }

export async function parseFileWithAi(file: File): Promise<AiImportOutcome> {
  if (file.size === 0) return { ok: false, error: 'הקובץ ריק' }
  if (file.size > MAX_FILE_BYTES)
    return { ok: false, error: 'הקובץ גדול מדי (מקסימום 20MB)' }

  ensureApiKey()
  const client = new Anthropic()

  let contentBlock: ContentBlock
  try {
    contentBlock = await fileToContentBlock(file)
  } catch {
    return {
      ok: false,
      error: 'לא הצלחנו לקרוא את הקובץ. נסו PDF, DOCX, CSV או תמונה.',
    }
  }

  try {
    const response = await client.messages.parse({
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: buildSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: [
            contentBlock,
            {
              type: 'text',
              text: 'המר את הקובץ המצורף לנתונים מובנים לפי הכללים. זהה אילו פרויקטים קיימים ואילו חדשים.',
            },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(AiImportSchema) },
    })

    if (response.stop_reason === 'refusal')
      return { ok: false, error: 'המודל סירב לעבד את הקובץ הזה' }
    if (response.stop_reason === 'max_tokens')
      return { ok: false, error: 'הקובץ גדול מדי לעיבוד בבת אחת נסו לפצל אותו' }
    if (!response.parsed_output)
      return { ok: false, error: 'המודל לא החזיר נתונים תקינים. נסו שוב.' }

    return { ok: true, result: annotateChanges(response.parsed_output) }
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError)
      return {
        ok: false,
        error:
          'חסר מפתח API של Anthropic. הוסיפו ANTHROPIC_API_KEY לקובץ .env בתיקיית הפרויקט והפעילו מחדש את השרת.',
      }
    if (error instanceof Anthropic.RateLimitError)
      return { ok: false, error: 'יותר מדי בקשות המתינו רגע ונסו שוב' }
    if (error instanceof Anthropic.APIConnectionError)
      return {
        ok: false,
        error: 'בעיית תקשורת מול שרת ה-AI. בדקו את החיבור לאינטרנט.',
      }
    if (error instanceof Anthropic.APIError)
      return {
        ok: false,
        error: `שגיאת AI (${error.status}): ${error.message}`,
      }
    throw error
  }
}

/* ---------- השוואה דטרמיניסטית מול המאגר ---------- */

/**
 * ה-AI מחזיר נתונים מנורמלים; את סיווג השינויים (חדש / עדכון מחיר / נמכר)
 * אנחנו מחשבים כאן באופן דטרמיניסטי מול המאגר לא סומכים על המודל בזה.
 */
function annotateChanges(ai: z.infer<typeof AiImportSchema>): ImportResult {
  const stored = getProjects()
  const summary = {
    newProjects: 0,
    newUnits: 0,
    priceChanges: 0,
    sold: 0,
    unchanged: 0,
  }

  const projects: ParsedProject[] = ai.projects.map((p) => {
    const existingProject =
      stored.find((s) => s.id === p.matchedProjectId) ??
      stored.find(
        (s) =>
          s.name.he.trim() === p.name.trim() ||
          s.name.en.trim() === p.name.trim(),
      )

    if (!existingProject) summary.newProjects++

    const units: ParsedUnit[] = p.units.map((u) => {
      const existingUnit = existingProject?.units.find(
        (e) => e.id === u.unitId || e.name === u.name,
      )

      let change: ParsedUnit['change']
      let oldPrice: number | undefined

      if (!existingUnit) {
        change = u.price === null ? 'sold' : 'new'
        if (u.price === null) summary.sold++
        else summary.newUnits++
      } else if (u.price === null) {
        oldPrice = existingUnit.price.amount
        if (existingUnit.status !== 'sold') {
          change = 'sold'
          summary.sold++
        } else {
          change = 'unchanged'
          summary.unchanged++
        }
      } else if (u.price !== existingUnit.price.amount) {
        change = 'priceChanged'
        oldPrice = existingUnit.price.amount
        summary.priceChanges++
      } else {
        change = 'unchanged'
        summary.unchanged++
      }

      return {
        unitId: existingUnit?.id ?? u.unitId,
        name: u.name,
        rooms: u.rooms,
        sqm: u.sqm,
        price: u.price,
        buyer: u.buyer,
        change,
        oldPrice,
      }
    })

    return {
      projectId: existingProject?.id ?? null,
      isNew: !existingProject,
      name: existingProject?.name.he ?? p.name,
      city: existingProject?.address.city ?? p.city,
      country: existingProject?.address.country.name.he ?? p.country,
      currency: existingProject?.units[0]?.price.currency ?? p.currency,
      units,
    }
  })

  return { projects, summary }
}
