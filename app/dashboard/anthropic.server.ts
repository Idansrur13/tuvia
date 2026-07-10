/*
 * עזרי חיבור ל-Anthropic API — משותפים למנוע הייבוא ולעוזר האישי.
 */
import fs from 'node:fs'
import path from 'node:path'

/** טוען את ANTHROPIC_API_KEY מקובץ .env אם לא הוגדר בסביבה. */
export function ensureApiKey() {
  if (process.env.ANTHROPIC_API_KEY) return
  try {
    const envFile = fs.readFileSync(
      path.resolve(process.cwd(), '.env'),
      'utf-8',
    )
    const match = envFile.match(/^ANTHROPIC_API_KEY\s*=\s*"?([^"\n]+)"?/m)
    if (match) process.env.ANTHROPIC_API_KEY = match[1].trim()
  } catch {
    // אין קובץ .env — הקריאה עצמה תיכשל ב-AuthenticationError שמטופל אצל הקורא
  }
}
