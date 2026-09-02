/*
 * עזרי חיבור ל-Anthropic API — משותפים למנוע הייבוא ולעוזר האישי.
 * המפתח הוא אופציונלי: בלעדיו הפיצ'רים נופלים למנוע המקומי (בלי קריאות רשת).
 */
import fs from 'node:fs'
import path from 'node:path'

/**
 * מוודא ש-ANTHROPIC_API_KEY זמין ב-process.env (טוען מ-.env אם צריך).
 * מחזיר true אם יש מפתח — הקוראים מחליטים לפי זה אם ללכת ל-API או למנוע המקומי.
 */
export function hasApiKey(): boolean {
  if (process.env.ANTHROPIC_API_KEY) return true
  try {
    const envFile = fs.readFileSync(
      path.resolve(process.cwd(), '.env'),
      'utf-8',
    )
    const match = envFile.match(/^ANTHROPIC_API_KEY\s*=\s*"?([^"\n]+)"?/m)
    if (match) {
      process.env.ANTHROPIC_API_KEY = match[1].trim()
      return true
    }
  } catch {
    // אין קובץ .env — עובדים במצב מקומי
  }
  return false
}
