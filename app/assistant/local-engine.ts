/*
 * מנוע ההתאמה המקומי של "נדלנומטר".
 * רץ כשאין ANTHROPIC_API_KEY (או כשהמפתח נדחה) — מנתח את בקשת המשתמש
 * בכללים דטרמיניסטיים, מדרג את המלאי ומנסח תשובה בשפת הפנייה.
 * אין כאן שום קריאת רשת: הדמו עובד תמיד, גם בלי חשבון API.
 */
import type {
  AiRecommendation,
  Currency,
  DealType,
  ListingCategory,
  Locale,
  Unit,
} from '~/types'

export interface LocalAnswer {
  reply: string
  recommendations: AiRecommendation[]
}

/* ---------- ניתוח הבקשה ---------- */

interface Criteria {
  budget?: number
  currency?: Currency
  rooms?: number
  sqm?: number
  dealType?: DealType
  category?: ListingCategory
  city?: string
  /** מאפיינים חופשיים שהוזכרו (ים, מרפסת, חניה...) */
  features: string[]
}

const HEBREW = /[֐-׿]/

/** שפת התשובה נגזרת מהפנייה עצמה, ולא רק משפת הממשק. */
function detectLocale(text: string, fallback: Locale): Locale {
  if (HEBREW.test(text)) return 'he'
  if (/[a-z]/i.test(text)) return 'en'
  return fallback
}

const CURRENCY_HINTS: [RegExp, Currency][] = [
  [/₪|שקל|ils|nis/i, 'ILS'],
  [/€|יורו|eur/i, 'EUR'],
  [/\$|דולר|usd/i, 'USD'],
  [/£|פאונד|gbp/i, 'GBP'],
  [/aed|דירהם/i, 'AED'],
]

/** "5 מיליון", "500 אלף יורו", "1.2m", "800k", "4,650,000" */
function parseBudget(text: string): number | undefined {
  const m = text.match(
    /(\d[\d,.]*)\s*(מיליון|מליון|million|m\b|אלף|k\b|thousand)?/gi,
  )
  if (!m) return undefined

  let best: number | undefined
  for (const chunk of m) {
    const num = Number(chunk.replace(/[^\d.]/g, '').replace(/\.(?=.*\.)/g, ''))
    if (!Number.isFinite(num) || num === 0) continue
    let value = num
    if (/מיליון|מליון|million|m\b/i.test(chunk)) value = num * 1_000_000
    else if (/אלף|k\b|thousand/i.test(chunk)) value = num * 1_000
    /* מספרים קטנים בלי סיומת הם בדרך כלל חדרים/מ"ר ולא תקציב */
    if (value < 10_000) continue
    best = Math.max(best ?? 0, value)
  }
  return best
}

function parseRooms(text: string): number | undefined {
  const m = text.match(
    /(\d+(?:\.5)?)\s*(?:חדרים|חדר|חד['׳]?|rooms?|-room|bed(?:room)?s?)/i,
  )
  return m ? Number(m[1]) : undefined
}

function parseSqm(text: string): number | undefined {
  const m = text.match(/(\d{2,4})\s*(?:מ["״]?ר|מטר|sqm|sq\.?\s?m|m2|m²)/i)
  return m ? Number(m[1]) : undefined
}

const CATEGORY_HINTS: [RegExp, ListingCategory][] = [
  [/פנטהאו[זס]|penthouse/i, 'penthouses'],
  [/דירת גן|גינה|garden/i, 'gardenApartments'],
  [/בית פרטי|וילה|קוטג|house|villa|cottage/i, 'houses'],
  [
    /מקבלן|על הנייר|חדשה מקבלן|new build|off.?plan|from developer/i,
    'newFromContractor',
  ],
  [/דירה|דירות|apartment|flat/i, 'apartments'],
]

/** ערי המלאי — כדי לזהות עיר גם כשהיא נכתבה בשפה השנייה. */
const CITY_ALIASES: Record<string, string[]> = {
  'תל אביב': ['tel aviv', 'tlv', 'תל-אביב', 'תל אביב'],
  Larnaca: ['larnaca', 'לרנקה', 'לרנקא', 'קפריסין', 'cyprus'],
  Miami: ['miami', 'מיאמי', 'פלורידה', 'florida'],
}

function parseCity(text: string, listings: Unit[]): string | undefined {
  const lower = text.toLowerCase()
  const cities = [...new Set(listings.map((u) => u.address.city))]
  for (const city of cities) {
    const aliases = [city.toLowerCase(), ...(CITY_ALIASES[city] ?? [])]
    if (aliases.some((a) => lower.includes(a.toLowerCase()))) return city
  }
  /* שכונה מוכרת → העיר שלה */
  for (const u of listings) {
    const n = u.address.neighborhood
    if (n && lower.includes(n.toLowerCase())) return u.address.city
  }
  return undefined
}

const FEATURE_HINTS: [RegExp, string][] = [
  [/ים|חוף|sea|beach|ocean/i, 'sea'],
  [/מרפסת|balcony|terrace/i, 'balcony'],
  [/חני[יה]|parking|garage/i, 'parking'],
  [/מעלית|elevator|lift/i, 'elevator'],
  [/בריכה|pool/i, 'pool'],
  [/ממ["״]?ד|shelter|safe room/i, 'shelter'],
  [/נוף|view/i, 'view'],
]

/** מעל הסכום הזה תקציב הוא כמעט תמיד רכישה ולא שכר דירה חודשי. */
const SALE_BUDGET_FLOOR = 100_000

function parseCriteria(text: string, listings: Unit[]): Criteria {
  const features = FEATURE_HINTS.filter(([re]) => re.test(text)).map(
    ([, key]) => key,
  )
  const budget = parseBudget(text)
  const stated = /השכר|שכירות|להשכיר|rent|rental|lease/i.test(text)
    ? ('rent' as const)
    : /מכיר|לקנות|קניי?ה|רכיש|buy|purchase|for sale/i.test(text)
      ? ('sale' as const)
      : undefined

  return {
    budget,
    currency: CURRENCY_HINTS.find(([re]) => re.test(text))?.[1],
    rooms: parseRooms(text),
    sqm: parseSqm(text),
    /* לא נאמר במפורש — גודל התקציב מסגיר אם מדובר בקנייה או בשכירות */
    dealType:
      stated ??
      (budget ? (budget >= SALE_BUDGET_FLOOR ? 'sale' : 'rent') : undefined),
    category: CATEGORY_HINTS.find(([re]) => re.test(text))?.[1],
    city: parseCity(text, listings),
    features,
  }
}

/* ---------- דירוג ---------- */

interface Scored {
  unit: Unit
  score: number
  max: number
  hits: string[]
  misses: string[]
}

/** טקסט חופשי של הנכס — לחיפוש מאפיינים שהוזכרו בבקשה. */
const unitText = (u: Unit) =>
  [
    u.title.he,
    u.title.en,
    u.description.he,
    u.description.en,
    ...u.features.flatMap((f) => [f.he, f.en]),
    u.address.neighborhood ?? '',
  ]
    .join(' ')
    .toLowerCase()

const FEATURE_WORDS: Record<string, RegExp> = {
  sea: /ים|חוף|sea|beach/i,
  balcony: /מרפסת|balcony|terrace/i,
  parking: /חני|parking/i,
  elevator: /מעלית|elevator/i,
  pool: /בריכה|pool/i,
  shelter: /ממ["״]?ד|shelter/i,
  view: /נוף|view/i,
}

function scoreUnit(unit: Unit, c: Criteria): Scored {
  let score = 0
  let max = 0
  const hits: string[] = []
  const misses: string[] = []
  const text = unitText(unit)

  if (c.city) {
    max += 40
    if (unit.address.city === c.city) {
      score += 40
      hits.push('city')
    } else misses.push('city')
  }

  if (c.category) {
    max += 20
    if (unit.category === c.category) {
      score += 20
      hits.push('category')
    } else misses.push('category')
  }

  if (c.rooms) {
    max += 20
    const diff = Math.abs(unit.rooms - c.rooms)
    if (diff === 0) {
      score += 20
      hits.push('rooms')
    } else if (diff <= 1) {
      score += 12
      hits.push('roomsClose')
    } else misses.push('rooms')
  }

  if (c.sqm) {
    max += 10
    if (unit.sqm >= c.sqm) {
      score += 10
      hits.push('sqm')
    } else misses.push('sqm')
  }

  if (c.budget) {
    max += 25
    const amount = unit.price?.amount
    if (amount == null) misses.push('price')
    else if (amount <= c.budget) {
      score += 25
      hits.push('budget')
    } else if (amount <= c.budget * 1.1) {
      score += 12
      hits.push('budgetClose')
    } else misses.push('budget')
  }

  for (const f of c.features) {
    max += 8
    if (FEATURE_WORDS[f]?.test(text)) {
      score += 8
      hits.push(f)
    }
  }

  return { unit, score, max, hits, misses }
}

/* ---------- ניסוח ---------- */

const HIT_LABELS: Record<string, { he: string; en: string }> = {
  city: { he: 'בעיר המבוקשת', en: 'in the requested city' },
  category: { he: 'סוג הנכס תואם', en: 'matching property type' },
  rooms: { he: 'מספר החדרים מדויק', en: 'exact room count' },
  roomsClose: { he: 'מספר חדרים קרוב', en: 'close on room count' },
  sqm: { he: 'שטח מתאים', en: 'enough floor area' },
  budget: { he: 'בתוך התקציב', en: 'within budget' },
  budgetClose: { he: 'מעט מעל התקציב', en: 'slightly above budget' },
  sea: { he: 'קרבה לים', en: 'close to the sea' },
  balcony: { he: 'מרפסת', en: 'balcony' },
  parking: { he: 'חנייה', en: 'parking' },
  elevator: { he: 'מעלית', en: 'elevator' },
  pool: { he: 'בריכה', en: 'pool' },
  shelter: { he: 'ממ״ד', en: 'safe room' },
  view: { he: 'נוף', en: 'view' },
}

function reasonFor(s: Scored, locale: Locale): string {
  const labels = s.hits
    .map((h) => HIT_LABELS[h]?.[locale])
    .filter(Boolean)
    .slice(0, 3)
  if (labels.length) return labels.join(locale === 'he' ? ' · ' : ' · ')
  return locale === 'he'
    ? 'מהמלאי הזמין כרגע בפלטפורמה'
    : 'From the inventory currently available on the platform'
}

const hasCriteria = (c: Criteria) =>
  Boolean(
    c.budget ||
    c.rooms ||
    c.sqm ||
    c.dealType ||
    c.category ||
    c.city ||
    c.features.length,
  )

/** שאלת חידוד אחת — מבקשים את הפרט החסר המשמעותי ביותר. */
function followUp(c: Criteria, locale: Locale): string {
  if (!c.city)
    return locale === 'he'
      ? 'באיזה אזור או עיר תרצו למקד את החיפוש?'
      : 'Which city or area should I focus on?'
  if (!c.budget)
    return locale === 'he'
      ? 'מה טווח התקציב שלכם?'
      : 'What budget range are you working with?'
  if (!c.rooms)
    return locale === 'he'
      ? 'כמה חדרים אתם צריכים?'
      : 'How many rooms do you need?'
  return locale === 'he'
    ? 'רוצים שאצמצם לפי קומה, כיווני אוויר או מועד כניסה?'
    : 'Want me to narrow it down by floor, orientation or move-in date?'
}

const GREETING = /^(שלום|היי|הי|אהלן|hi|hello|hey|good (morning|evening))\b/i
const WHO_ARE_YOU = /מי אתה|מה שמך|who are you|your name/i

/* ---------- נקודת הכניסה ---------- */

/**
 * מנסח תשובה והמלצות מהמלאי בלי שום קריאת רשת.
 * מחזיר עד 4 נכסים, מדורגים לפי התאמה לבקשה האחרונה.
 */
export function answerLocally(
  message: string,
  uiLocale: Locale,
  listings: Unit[],
): LocalAnswer {
  const locale = detectLocale(message, uiLocale)
  const he = locale === 'he'

  if (WHO_ARE_YOU.test(message))
    return {
      reply: he
        ? 'אני נדלנומטר, היועץ החכם של הפלטפורמה. ספרו לי מה אתם מחפשים — עיר, תקציב ומספר חדרים — ואמצא לכם התאמות מהמלאי.'
        : "I'm Nadlanometer, the platform's property advisor. Tell me the city, budget and number of rooms you're after and I'll match you with listings.",
      recommendations: [],
    }

  const available = listings.filter((u) => u.status !== 'sold')
  const pool = available.length ? available : listings

  if (pool.length === 0)
    return {
      reply: he
        ? 'אין כרגע נכסים פעילים במאגר. חזרו אלינו בקרוב.'
        : 'There are no active listings in the inventory right now. Please check back soon.',
      recommendations: [],
    }

  const criteria = parseCriteria(message, pool)
  /* השוואת מחיר בין שכירות למכירה חסרת משמעות, לכן זה מסנן ולא ניקוד */
  const matchingDeal = criteria.dealType
    ? pool.filter((u) => u.dealType === criteria.dealType)
    : pool
  const candidates = matchingDeal.length ? matchingDeal : pool
  const scored = candidates
    .map((u) => scoreUnit(u, criteria))
    .sort(
      (a, b) =>
        b.score - a.score ||
        (a.unit.price?.amount ?? 0) - (b.unit.price?.amount ?? 0),
    )

  /* פנייה כללית (ברכה / בלי קריטריונים) — מציגים מלאי לדוגמה ושואלים שאלה */
  if (!hasCriteria(criteria)) {
    const top = scored.slice(0, 3)
    return {
      reply:
        (GREETING.test(message.trim()) ? (he ? 'שלום! ' : 'Hi! ') : '') +
        (he
          ? `הנה כמה נכסים מהמלאי כדי להתחיל. ${followUp(criteria, locale)}`
          : `Here are a few listings to start with. ${followUp(criteria, locale)}`),
      recommendations: top.map((s) => ({
        unitId: s.unit.id,
        matchScore: 60,
        reason: reasonFor(s, locale),
      })),
    }
  }

  const relevant = scored.filter((s) => s.score > 0).slice(0, 4)
  const recommendations: AiRecommendation[] = relevant.map((s) => ({
    unitId: s.unit.id,
    matchScore: Math.max(
      35,
      Math.min(99, Math.round((s.score / Math.max(s.max, 1)) * 100)),
    ),
    reason: reasonFor(s, locale),
  }))

  if (recommendations.length === 0)
    return {
      reply: he
        ? `לא מצאתי נכס שעונה על הבקשה במלאי הנוכחי. ${followUp(criteria, locale)}`
        : `I couldn't find a listing matching that in the current inventory. ${followUp(criteria, locale)}`,
      recommendations: [],
    }

  const perfect = relevant.filter((s) => s.misses.length === 0).length
  const intro = he
    ? perfect > 0
      ? `מצאתי ${recommendations.length} נכסים שמתאימים לבקשה.`
      : `אין התאמה מושלמת, אבל אלה הנכסים הקרובים ביותר לבקשה.`
    : perfect > 0
      ? recommendations.length === 1
        ? 'I found one listing that fits your request.'
        : `I found ${recommendations.length} listings that fit your request.`
      : `Nothing matches perfectly, but these are the closest listings I have.`

  return {
    reply: `${intro} ${followUp(criteria, locale)}`,
    recommendations,
  }
}
