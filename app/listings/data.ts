/*
 * נתוני הנכסים של האתר הציבורי — משותפים לעמוד הבית ולעמוד הפריט.
 * כשיהיה API אמיתי, מחליפים רק את הקובץ הזה.
 */

export type DealType = 'sale' | 'rent'

export interface Listing {
  id: number
  title: string
  neighborhood: string
  city: string
  address: string
  dealType: DealType
  price: number
  rooms: number
  sqm: number
  floor: string
  yearBuilt: number
  parking: number
  entry: string
  category: string
  badge?: string
  /** שם הפרויקט — נכסים עם אותו שם יוצגו יחד ב"עוד מאותו פרויקט" */
  project?: string
  agent: string
  agentPhone: string
  description: string
  features: string[]
  images: string[]
}

export const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`

export const LISTINGS: Listing[] = [
  {
    id: 1,
    title: 'דירת 4 חדרים מעוצבת עם מרפסת שמש',
    neighborhood: 'הצפון הישן',
    city: 'תל אביב',
    address: 'רחוב דיזנגוף 210',
    dealType: 'sale',
    price: 4_950_000,
    rooms: 4,
    sqm: 105,
    floor: '3 מתוך 6',
    yearBuilt: 2019,
    parking: 1,
    entry: 'גמיש',
    category: 'דירות',
    badge: 'בלעדיות',
    project: 'מגדלי תכלת',
    agent: 'מיכל לוי',
    agentPhone: '050-1112233',
    description:
      'דירה מעוצבת אדריכלית בלב הצפון הישן, במרחק הליכה מהים ומרחוב דיזנגוף. הדירה עברה שיפוץ יסודי הכולל מטבח בהזמנה אישית, מיזוג מרכזי ומרפסת שמש מוארת הפונה לרחוב שקט. הבניין מטופח עם ועד בית פעיל, מעלית וחניה בטאבו.',
    features: [
      'מרפסת שמש 12 מ״ר',
      'מיזוג מרכזי',
      'מטבח בהזמנה אישית',
      'מעלית',
      'חניה בטאבו',
      'ממ״ד',
      'מחסן',
      'כיווני אוויר: דרום-מערב',
    ],
    images: [
      IMG('photo-1522708323590-d24dbb6b0267'),
      IMG('photo-1502672260266-1c1ef2d93688'),
      IMG('photo-1484154218962-a197022b5858'),
    ],
  },
  {
    id: 2,
    title: 'פנטהאוז יוקרתי עם נוף פתוח לים',
    neighborhood: 'מרינה',
    city: 'הרצליה',
    address: 'שדרות אבא אבן 12',
    dealType: 'sale',
    price: 9_800_000,
    rooms: 5,
    sqm: 180,
    floor: '12 מתוך 12',
    yearBuilt: 2021,
    parking: 2,
    entry: 'מיידית',
    category: 'פנטהאוזים',
    badge: 'חדש באתר',
    agent: 'יוסי כהן',
    agentPhone: '052-4445566',
    description:
      'פנטהאוז מרהיב בקומה העליונה של מגדל יוקרה במרינה של הרצליה, עם קו ראייה פתוח לים מכל חלל הדירה. סלון כפול, מטבח שף, סוויטת הורים עם חדר ארונות, ומרפסת גג פרטית עם פינת ג׳קוזי. הבניין כולל לובי מפואר, חדר כושר ובריכה לדיירים.',
    features: [
      'נוף פתוח לים',
      'מרפסת גג 60 מ״ר',
      'ג׳קוזי',
      '2 חניות + מחסן',
      'חדר כושר ובריכה בבניין',
      'לובי מפואר',
      'מעלית שבת',
      'בית חכם',
    ],
    images: [
      IMG('photo-1512917774080-9991f1c4c750'),
      IMG('photo-1600607687939-ce8a6c25118c'),
      IMG('photo-1600566753086-00f18fb6b3ea'),
    ],
  },
  {
    id: 3,
    title: 'דירת גן מרווחת עם גינה פרטית',
    neighborhood: 'רמת אביב',
    city: 'תל אביב',
    address: 'רחוב אחימאיר 8',
    dealType: 'sale',
    price: 6_200_000,
    rooms: 5,
    sqm: 130,
    floor: 'קרקע',
    yearBuilt: 2020,
    parking: 2,
    entry: '03/2027',
    category: 'דירות גן',
    project: 'מגדלי תכלת',
    agent: 'מיכל לוי',
    agentPhone: '050-1112233',
    description:
      'דירת גן בפרויקט מגדלי תכלת המבוקש, עם גינה פרטית מטופחת של 80 מ״ר ויציאה ישירה מהסלון. תכנון חכם עם אגף הורים נפרד, מטבח פתוח ומואר וסלון פונה לגינה. מושלמת למשפחות — צמוד לבתי ספר, פארק הירקון ומרכזי קניות.',
    features: [
      'גינה פרטית 80 מ״ר',
      'יציאה ישירה מהסלון',
      'אגף הורים נפרד',
      '2 חניות',
      'ממ״ד',
      'מחסן צמוד',
      'קרוב לפארק הירקון',
      'בית חכם',
    ],
    images: [
      IMG('photo-1600585154340-be6161a56a0c'),
      IMG('photo-1600596542815-ffad4c1539a9'),
      IMG('photo-1560448204-e02f11c3d0e2'),
    ],
  },
  {
    id: 4,
    title: 'דירת 3 חדרים משופצת ליד הפארק',
    neighborhood: 'בילו',
    city: 'רחובות',
    address: 'רחוב בילו 34',
    dealType: 'rent',
    price: 6_500,
    rooms: 3,
    sqm: 78,
    floor: '2 מתוך 4',
    yearBuilt: 1998,
    parking: 1,
    entry: 'מיידית',
    category: 'דירות',
    badge: 'כניסה מיידית',
    agent: 'דנה אברהם',
    agentPhone: '054-7778899',
    description:
      'דירת 3 חדרים משופצת מהיסוד ברחוב שקט ליד פארק המדע. מטבח חדש, מזגנים בכל חדר, ומרפסת שירות מרווחת. במרחק הליכה ממכון ויצמן ומתחנת הרכבת — מתאימה במיוחד לזוגות צעירים ואנשי הייטק.',
    features: [
      'משופצת מהיסוד',
      'מזגנים בכל חדר',
      'מטבח חדש',
      'חניה',
      'קרוב לרכבת',
      'מרפסת שירות',
    ],
    images: [
      IMG('photo-1493809842364-78817add7ffb'),
      IMG('photo-1502005229762-cf1b2da7c5d6'),
      IMG('photo-1522708323590-d24dbb6b0267'),
    ],
  },
  {
    id: 5,
    title: 'בית פרטי עם בריכה על מגרש חצי דונם',
    neighborhood: 'שכונת הפרחים',
    city: 'כפר סבא',
    address: 'רחוב הנרקיס 5',
    dealType: 'sale',
    price: 8_400_000,
    rooms: 6,
    sqm: 240,
    floor: '2 קומות',
    yearBuilt: 2015,
    parking: 3,
    entry: 'גמיש',
    category: 'בתים פרטיים',
    badge: 'בלעדיות',
    agent: 'יוסי כהן',
    agentPhone: '052-4445566',
    description:
      'בית פרטי מרשים על מגרש של חצי דונם בשכונת הפרחים היוקרתית. קומת מגורים מרווחת עם תקרות גבוהות, קומת חדרים עם 4 חדרי שינה, וחצר אחורית עם בריכה מחוממת, פרגולה ומטבח חוץ. יחידת דיור נפרדת עם כניסה עצמאית.',
    features: [
      'בריכה מחוממת',
      'מגרש 500 מ״ר',
      'יחידת דיור נפרדת',
      'מטבח חוץ ופרגולה',
      '3 חניות',
      'תקרות גבוהות',
      'הסקה רצפתית',
      'פאנלים סולאריים',
    ],
    images: [
      IMG('photo-1613490493576-7fde63acd811'),
      IMG('photo-1580587771525-78b9dba3b914'),
      IMG('photo-1568605114967-8130f3a36994'),
    ],
  },
  {
    id: 6,
    title: 'מיני פנטהאוז חדש מקבלן במגדל בוטיק',
    neighborhood: 'פארק המושבה',
    city: 'פתח תקווה',
    address: 'רחוב העצמאות 40',
    dealType: 'sale',
    price: 3_890_000,
    rooms: 4,
    sqm: 115,
    floor: '8 מתוך 9',
    yearBuilt: 2026,
    parking: 2,
    entry: '06/2027',
    category: 'חדש מקבלן',
    badge: 'חדש מקבלן',
    project: 'פארק המושבה בוטיק',
    agent: 'דנה אברהם',
    agentPhone: '054-7778899',
    description:
      'מיני פנטהאוז חדש מקבלן במגדל בוטיק של 9 קומות מול פארק המושבה. מפרט טכני עשיר הכולל מיזוג מיני מרכזי, ריצוף גרניט 80/80, וחלונות בלגיים. מרפסת של 25 מ״ר עם נוף פתוח לפארק. ליווי בנקאי מלא וערבות חוק מכר.',
    features: [
      'חדש מקבלן — ערבות חוק מכר',
      'מרפסת 25 מ״ר מול הפארק',
      'מפרט טכני עשיר',
      '2 חניות + מחסן',
      'מיזוג מיני מרכזי',
      'חלונות בלגיים',
      'מעלית שבת',
      'ליווי בנקאי מלא',
    ],
    images: [
      IMG('photo-1600607687920-4e2a09cf159d'),
      IMG('photo-1560185007-cde436f6a4d0'),
      IMG('photo-1512917774080-9991f1c4c750'),
    ],
  },
  {
    id: 7,
    title: 'דירת 2 חדרים מרוהטת קרובה לים',
    neighborhood: 'לב העיר',
    city: 'בת ים',
    address: 'רחוב בלפור 60',
    dealType: 'rent',
    price: 5_200,
    rooms: 2,
    sqm: 55,
    floor: '4 מתוך 5',
    yearBuilt: 2005,
    parking: 0,
    entry: '01/09/2026',
    category: 'דירות',
    agent: 'מיכל לוי',
    agentPhone: '050-1112233',
    description:
      'דירת 2 חדרים מרוהטת קומפלט, 5 דקות הליכה מחוף הים של בת ים. כוללת את כל הריהוט והמכשירים — פשוט להגיע עם מזוודה. מרפסת קטנה עם נוף עירוני, ובניין שקט עם שכנים ותיקים.',
    features: [
      'מרוהטת קומפלט',
      '5 דקות מהים',
      'מזגן בסלון ובחדר',
      'מכונת כביסה ומייבש',
      'מרפסת',
      'קרוב לקו מטרו M1',
    ],
    images: [
      IMG('photo-1502672260266-1c1ef2d93688'),
      IMG('photo-1484154218962-a197022b5858'),
      IMG('photo-1493809842364-78817add7ffb'),
    ],
  },
  {
    id: 8,
    title: 'דופלקס גג עם מרפסת 60 מ״ר',
    neighborhood: 'כרמל צרפתי',
    city: 'חיפה',
    address: 'רחוב וודג׳ווד 15',
    dealType: 'rent',
    price: 8_900,
    rooms: 5,
    sqm: 150,
    floor: '5-6 מתוך 6',
    yearBuilt: 2010,
    parking: 1,
    entry: 'גמיש',
    category: 'פנטהאוזים',
    badge: 'חדש באתר',
    agent: 'יוסי כהן',
    agentPhone: '052-4445566',
    description:
      'דופלקס גג מרהיב בכרמל הצרפתי עם נוף פנורמי למפרץ חיפה. קומה תחתונה עם סלון ומטבח מרווחים, קומה עליונה עם סוויטת הורים ויציאה למרפסת גג של 60 מ״ר. שכונה ירוקה ושקטה ליד מרכז הכרמל.',
    features: [
      'נוף פנורמי למפרץ',
      'מרפסת גג 60 מ״ר',
      'סוויטת הורים',
      'חניה',
      'שכונה ירוקה ושקטה',
      'קרוב למרכז הכרמל',
    ],
    images: [
      IMG('photo-1560185127-6ed189bf02f4'),
      IMG('photo-1600607687939-ce8a6c25118c'),
      IMG('photo-1560448204-e02f11c3d0e2'),
    ],
  },
]

export const CATEGORIES = [
  { name: 'הכל', icon: '🏙️' },
  { name: 'דירות', icon: '🏢' },
  { name: 'פנטהאוזים', icon: '🌇' },
  { name: 'דירות גן', icon: '🌳' },
  { name: 'בתים פרטיים', icon: '🏡' },
  { name: 'חדש מקבלן', icon: '🏗️' },
] as const

export const DEAL_TYPE_OPTIONS = [
  ['all', 'הכל'],
  ['sale', 'למכירה'],
  ['rent', 'להשכרה'],
] as const

export const listingById = (id: number) => LISTINGS.find((l) => l.id === id)

/** נכסים נוספים מאותו פרויקט (אם הנכס משויך לפרויקט) */
export const sameProjectListings = (listing: Listing) =>
  listing.project
    ? LISTINGS.filter(
        (l) => l.project === listing.project && l.id !== listing.id,
      )
    : []

/** נכסים דומים — אותה קטגוריה או עיר, בלי מה שכבר מוצג */
export const similarListings = (listing: Listing, excludeIds: number[] = []) =>
  LISTINGS.filter(
    (l) =>
      l.id !== listing.id &&
      !excludeIds.includes(l.id) &&
      (l.category === listing.category ||
        l.city === listing.city ||
        l.dealType === listing.dealType),
  )
    .sort((a, b) => {
      const score = (x: Listing) =>
        (x.category === listing.category ? 2 : 0) +
        (x.city === listing.city ? 1 : 0)
      return score(b) - score(a)
    })
    .slice(0, 4)
