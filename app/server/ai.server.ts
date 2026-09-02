/*
 * מנוע הייבוא החכם שולח את הקובץ ל-Claude ומקבל נתונים מובנים.
 * PDF נשלח כ-document block, תמונות כ-image block, DOCX מחולץ לטקסט (mammoth),
 * ושאר הקבצים נשלחים כטקסט. הפלט נאכף עם structured outputs (Zod).
 */
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'

import { hasApiKey } from './anthropic.server'
import { canParseLocally, parseFileLocally } from './import-local.server'
import { getProjects, resolveCountry, slugify } from './store.server'
import { L } from '~/data'
import type {
  Address,
  Currency,
  ImportResult,
  ImportedProject,
  ImportedUnit,
  Unit,
} from '~/types'

/** ברירות מחדל ליחידות חדשות מהייבוא, עד שיהיה auth אמיתי. */
const DEFAULT_AGENT_ID = 'u-yossi'
const DEFAULT_CONTRACTOR_ID = 'org-tchelet'

const MAX_FILE_BYTES = 20 * 1024 * 1024 // מגבלת ה-API היא 32MB לבקשה

/* ---------- סכמת הפלט של המודל ---------- */

const AiLocalizedSchema = z.object({
  he: z.string().describe('בעברית'),
  en: z.string().describe('באנגלית'),
})

const AiUnitSchema = z.object({
  unitId: z
    .string()
    .nullable()
    .describe('מזהה יחידה קיימת מהמערכת אם זוהתה התאמה, אחרת null'),
  title: AiLocalizedSchema.describe(
    'שם/תיאור היחידה בשתי השפות — תרגם/תעתק אם הקובץ בשפה אחת',
  ),
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
  name: AiLocalizedSchema.describe(
    'שם הפרויקט בשתי השפות — תרגם/תעתק אם הקובץ בשפה אחת',
  ),
  city: z.string(),
  country: z.string().describe('שם המדינה בעברית'),
  currency: z.string().describe('קוד מטבע ISO כמו ILS / EUR / USD'),
  units: z.array(AiUnitSchema),
})

const AiImportSchema = z.object({
  projects: z.array(AiProjectSchema),
})

/** המבנה שמוזן לשלב השוואת השינויים — מהמודל או מהפענוח המקומי. */
export type ImportPayload = z.infer<typeof AiImportSchema>

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

/* ---------- הקריאה למודל ---------- */

async function buildSystemPrompt() {
  const existing = (await getProjects()).map((p) => ({
    id: p.id,
    name: p.name,
    city: p.units[0]?.address.city ?? '',
    country: p.units[0]?.address.country.name ?? '',
    currency: p.units[0]?.price?.currency ?? 'USD',
    units: p.units.map((u) => ({
      id: u.id,
      title: u.title,
      rooms: u.rooms,
      sqm: u.sqm,
      price: u.price?.amount ?? null,
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
7. אל תמציא נתונים. שדה שלא מופיע בקובץ null.
8. שמות (name/title): החזר תמיד עברית ואנגלית. אם הקובץ בשפה אחת — תרגם או תעתק לשנייה.`
}

export type AiImportOutcome =
  | {
      ok: true
      result: ImportResult
      /** 'ai' = פוענח על ידי המודל, 'local' = פענוח מקומי בלי AI. */
      mode: 'ai' | 'local'
    }
  | { ok: false; error: string }

export async function parseFileWithAi(file: File): Promise<AiImportOutcome> {
  if (file.size === 0) return { ok: false, error: 'empty' }
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: 'tooLarge' }

  /* בלי מפתח API אין קריאת רשת — מפענחים מקומית מה שאפשר (CSV/JSON) */
  if (!hasApiKey()) return parseLocally(file)

  const client = new Anthropic()

  let contentBlock: ContentBlock
  try {
    contentBlock = await fileToContentBlock(file)
  } catch {
    return { ok: false, error: 'unreadable' }
  }

  try {
    const response = await client.messages.parse({
      model: 'claude-opus-4-8',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: await buildSystemPrompt(),
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
      return { ok: false, error: 'refusal' }
    if (response.stop_reason === 'max_tokens')
      return { ok: false, error: 'maxTokens' }
    if (!response.parsed_output) return { ok: false, error: 'badOutput' }

    return {
      ok: true,
      mode: 'ai',
      result: await annotateChanges(response.parsed_output),
    }
  } catch (error) {
    /* מפתח שנדחה — מנסים בכל זאת פענוח מקומי לפני שמכריזים על כישלון */
    if (error instanceof Anthropic.AuthenticationError)
      return parseLocally(file)
    if (error instanceof Anthropic.RateLimitError)
      return { ok: false, error: 'rateLimit' }
    if (error instanceof Anthropic.APIConnectionError)
      return { ok: false, error: 'connection' }
    if (error instanceof Anthropic.APIError)
      return { ok: false, error: 'generic' }
    throw error
  }
}

/* ---------- מסלול מקומי (בלי AI) ---------- */

/**
 * מחירוני CSV/JSON מפוענחים מקומית ועוברים לאותו שלב השוואת שינויים.
 * פורמטים שדורשים הבנת מסמך (PDF/DOCX/תמונה) עדיין דורשים מפתח API.
 */
async function parseLocally(file: File): Promise<AiImportOutcome> {
  if (!canParseLocally(file.name)) return { ok: false, error: 'noKey' }
  const payload = await parseFileLocally(file)
  if (!payload) return { ok: false, error: 'unreadable' }
  return { ok: true, mode: 'local', result: await annotateChanges(payload) }
}

/* ---------- השוואה דטרמיניסטית מול המאגר ---------- */

/**
 * ה-AI מחזיר נתונים מנורמלים; את סיווג השינויים (חדש / עדכון מחיר / נמכר)
 * אנחנו מחשבים כאן באופן דטרמיניסטי מול המאגר לא סומכים על המודל בזה.
 */
async function annotateChanges(ai: ImportPayload): Promise<ImportResult> {
  const stored = await getProjects()
  const now = new Date().toISOString()
  const summary = {
    newProjects: 0,
    newUnits: 0,
    priceChanges: 0,
    sold: 0,
    unchanged: 0,
  }

  const projects: ImportedProject[] = ai.projects.map((p) => {
    const existingProject =
      stored.find((s) => s.id === p.matchedProjectId) ??
      stored.find(
        (s) =>
          s.name.he.trim() === p.name.he.trim() ||
          s.name.en.trim() === p.name.en.trim(),
      )

    if (!existingProject) summary.newProjects++

    const projectId =
      existingProject?.id ?? `${slugify(p.name.en)}-${Date.now().toString(36)}`
    const currency = (existingProject?.units[0]?.price?.currency ??
      p.currency ??
      'USD') as Currency
    /* כתובת בסיס ליחידות חדשות — מהיחידות הקיימות או ממה שהמודל זיהה */
    const baseAddress: Address = existingProject?.units[0]?.address ?? {
      country: resolveCountry(p.country),
      city: p.city,
    }

    const units: ImportedUnit[] = p.units.map((u, ui) => {
      const existingUnit = existingProject?.units.find(
        (e) =>
          e.id === u.unitId ||
          e.title.he === u.title.he ||
          e.title.en === u.title.en,
      )

      let change: ImportedUnit['change']
      let oldPrice: ImportedUnit['oldPrice']

      if (!existingUnit) {
        change = u.price === null ? 'sold' : 'new'
        if (u.price === null) summary.sold++
        else summary.newUnits++
      } else if (u.price === null) {
        oldPrice = existingUnit.price
        if (existingUnit.status !== 'sold') {
          change = 'sold'
          summary.sold++
        } else {
          change = 'unchanged'
          summary.unchanged++
        }
      } else if (u.price !== existingUnit.price?.amount) {
        change = 'priceChanged'
        oldPrice = existingUnit.price
        summary.priceChanges++
      } else {
        change = 'unchanged'
        summary.unchanged++
      }

      /* יחידה קיימת = בסיס מהמאגר; חדשה = ברירות מחדל של מלאי קבלן */
      const base: Unit = existingUnit ?? {
        id: u.unitId ?? `${projectId}-u${ui}-${Date.now().toString(36)}`,
        projectId,
        title: u.title,
        description: L('', ''),
        address: baseAddress,
        agentId: DEFAULT_AGENT_ID,
        agentRole: 'contractor',
        dealType: 'sale',
        category: 'newFromContractor',
        availability: 'underConstruction',
        features: [],
        rooms: u.rooms ?? 0,
        sqm: u.sqm ?? 0,
        status: 'available',
        createdAt: now,
        updatedAt: now,
      }

      return {
        ...base,
        title: u.title,
        rooms: u.rooms ?? base.rooms,
        sqm: u.sqm ?? base.sqm,
        price: u.price != null ? { amount: u.price, currency } : undefined,
        status: u.price === null ? 'sold' : base.status,
        updatedAt: now,
        change,
        oldPrice,
        buyer: u.buyer ?? undefined,
      }
    })

    return {
      id: projectId,
      contractorId: existingProject?.contractorId ?? DEFAULT_CONTRACTOR_ID,
      status: existingProject?.status ?? 'pending',
      name: existingProject?.name ?? p.name,
      description: existingProject?.description,
      units,
      createdAt: existingProject?.createdAt ?? now,
      updatedAt: now,
      isNew: !existingProject,
    }
  })

  return { projects, summary }
}
