/*
 * כל היחידות במערכת — קולקשן אחד (מיזוג Listing→Unit).
 * יחידה עם projectId = מלאי קבלן; בלי projectId = נכס עצמאי (יד שנייה/השכרה).
 * הפרויקטים ב-projects.ts שולפים מכאן את היחידות שלהם.
 */
import type {
  Address,
  DealType,
  ListingCategory,
  Localized,
  Unit,
} from '~/types'
import { COUNTRIES, L, img, money, stamp } from './util'

/** קטגוריות למרקטפלייס — id הוא ה-slug של הקטגוריה (או 'all'). */
export const LISTING_CATEGORIES: {
  id: 'all' | ListingCategory
  icon: string
  label: Localized
}[] = [
  { id: 'all', icon: '🏙️', label: L('הכל', 'All') },
  { id: 'apartments', icon: '🏢', label: L('דירות', 'Apartments') },
  { id: 'penthouses', icon: '🌇', label: L('פנטהאוזים', 'Penthouses') },
  { id: 'gardenApartments', icon: '🌳', label: L('דירות גן', 'Garden apts') },
  { id: 'houses', icon: '🏡', label: L('בתים פרטיים', 'Houses') },
  {
    id: 'newFromContractor',
    icon: '🏗️',
    label: L('חדש מקבלן', 'New build'),
  },
]

/** אפשרויות סוג עסקה (או 'all'). */
export const DEAL_TYPES: { id: DealType | 'all'; label: Localized }[] = [
  { id: 'all', label: L('הכל', 'All') },
  { id: 'sale', label: L('למכירה', 'For sale') },
  { id: 'rent', label: L('להשכרה', 'For rent') },
]

/* כתובות פרויקטים — משוכפלות ליחידות (דנורמליזציה מכוונת לסינון מהיר). */
const ADDR_TLV: Address = {
  country: COUNTRIES.IL,
  city: 'תל אביב',
  neighborhood: 'הצפון הישן',
  point: { lat: 32.0853, lng: 34.7818 },
}
const ADDR_LARNACA: Address = {
  country: COUNTRIES.CY,
  city: 'Larnaca',
  point: { lat: 34.9182, lng: 33.632 },
}
const ADDR_MIAMI: Address = {
  country: COUNTRIES.US,
  city: 'Miami',
  point: { lat: 25.7617, lng: -80.1918 },
}

export const UNITS: Unit[] = [
  /* ---------- מגדלי תכלת (tlv-towers) ---------- */
  {
    id: 'A-12',
    projectId: 'tlv-towers',
    title: L('דירה 12, קומה 3', 'Apt 12, 3rd floor'),
    description: L(
      'דירת 4 חדרים במגדלי תכלת, קומה 3.',
      'A 4-room apartment in Tchelet Towers, 3rd floor.',
    ),
    address: ADDR_TLV,
    agentId: 'u-yossi',
    agentRole: 'contractor',
    dealType: 'sale',
    category: 'newFromContractor',
    availability: 'new',
    features: [],
    rooms: 4,
    sqm: 108,
    floor: '3',
    price: money(4_650_000, 'ILS'),
    status: 'sold',
    buyerId: 'u-ron',
    ...stamp('2025-06-01', '2026-06-15'),
  },
  {
    id: 'A-24',
    projectId: 'tlv-towers',
    title: L('דירה 24, קומה 7', 'Apt 24, 7th floor'),
    description: L(
      'דירת 5 חדרים מרווחת במגדלי תכלת, קומה 7.',
      'A spacious 5-room apartment in Tchelet Towers, 7th floor.',
    ),
    address: ADDR_TLV,
    agentId: 'u-yossi',
    agentRole: 'contractor',
    dealType: 'sale',
    category: 'newFromContractor',
    availability: 'new',
    features: [L('מרפסת שמש', 'Sun balcony'), L('ממ״ד', 'Safe room')],
    gallery: [img('photo-1512917774080-9991f1c4c750')],
    publishedToMarketplace: true,
    rooms: 5,
    sqm: 128,
    floor: '7',
    price: money(5_490_000, 'ILS'),
    status: 'inProcess',
    ...stamp('2025-06-01', '2026-07-05'),
  },
  {
    id: 'B-06',
    projectId: 'tlv-towers',
    title: L('דירה 6, קומה 2', 'Apt 6, 2nd floor'),
    description: L(
      'דירת 3 חדרים במגדלי תכלת, קומה 2.',
      'A 3-room apartment in Tchelet Towers, 2nd floor.',
    ),
    address: ADDR_TLV,
    agentId: 'u-yossi',
    agentRole: 'contractor',
    dealType: 'sale',
    category: 'newFromContractor',
    availability: 'new',
    features: [],
    gallery: [img('photo-1522708323590-d24dbb6b0267')],
    publishedToMarketplace: true,
    rooms: 3,
    sqm: 82,
    floor: '2',
    price: money(3_780_000, 'ILS'),
    status: 'reserved',
    reservationId: 'res-1',
    ...stamp('2025-06-01', '2026-07-08'),
  },
  {
    id: 'B-31',
    projectId: 'tlv-towers',
    title: L('פנטהאוז 31, קומה 9', 'Penthouse 31, 9th floor'),
    description: L(
      'פנטהאוז יוקרתי במגדלי תכלת עם נוף פתוח לעיר ולים.',
      'A luxury penthouse in Tchelet Towers with open city and sea views.',
    ),
    address: ADDR_TLV,
    agentId: 'u-yossi',
    agentRole: 'contractor',
    dealType: 'sale',
    category: 'penthouses',
    availability: 'new',
    badge: L('חדש מקבלן', 'New build'),
    features: [
      L('נוף לים', 'Sea view'),
      L('מרפסת גג', 'Roof terrace'),
      L('חניה כפולה', 'Double parking'),
    ],
    gallery: [
      img('photo-1545324418-cc1a3fa10c00'),
      img('photo-1600607687939-ce8a6c25118c'),
    ],
    publishedToMarketplace: true,
    rooms: 6,
    sqm: 210,
    floor: '9',
    price: money(11_900_000, 'ILS'),
    status: 'available',
    ...stamp('2025-06-01'),
  },
  /* נכס פרויקט שמשווק ע"י מתווכת (פרק 8 — מוכר משווק מלאי קבלן) */
  {
    id: 'lst-1',
    projectId: 'tlv-towers',
    title: L(
      'דירת 4 חדרים מעוצבת עם מרפסת שמש',
      'Designed 4-room apartment with a sun balcony',
    ),
    description: L(
      'דירה מעוצבת אדריכלית בלב הצפון הישן, במרחק הליכה מהים.',
      'An architecturally designed apartment in the heart of Old North, walking distance from the sea.',
    ),
    address: { ...ADDR_TLV, street: 'דיזנגוף 210' },
    agentId: 'u-michal',
    agentRole: 'seller',
    dealType: 'sale',
    category: 'apartments',
    availability: 'immediate',
    badge: L('בלעדיות', 'Exclusive'),
    features: [
      L('מרפסת שמש', 'Sun balcony'),
      L('מיזוג מרכזי', 'Central A/C'),
      L('מעלית', 'Elevator'),
      L('חניה בטאבו', 'Deeded parking'),
      L('ממ״ד', 'Safe room'),
    ],
    gallery: [
      img('photo-1522708323590-d24dbb6b0267'),
      img('photo-1502672260266-1c1ef2d93688'),
      img('photo-1484154218962-a197022b5858'),
    ],
    publishedToMarketplace: true,
    rooms: 4,
    sqm: 105,
    floor: '3 מתוך 6',
    yearBuilt: 2019,
    parking: 1,
    entry: 'flexible',
    price: money(4_950_000, 'ILS'),
    status: 'available',
    ...stamp('2026-05-20'),
  },

  /* ---------- מפרץ לרנקה (larnaca-bay) ---------- */
  {
    id: 'C-08',
    projectId: 'larnaca-bay',
    title: L('Apt 8, 2nd floor', 'Apt 8, 2nd floor'),
    description: L(
      'דירת 3 חדרים במפרץ לרנקה, קומה 2.',
      'A 3-room apartment in Blue Bay Residences, 2nd floor.',
    ),
    address: ADDR_LARNACA,
    agentId: 'u-mike',
    agentRole: 'contractor',
    dealType: 'sale',
    category: 'newFromContractor',
    availability: 'underConstruction',
    features: [],
    gallery: [img('photo-1600585154340-be6161a56a0c')],
    publishedToMarketplace: true,
    rooms: 3,
    sqm: 98,
    floor: '2',
    price: money(445_200, 'EUR'),
    status: 'inProcess',
    ...stamp('2025-08-10', '2026-07-02'),
  },
  {
    id: 'C-15',
    projectId: 'larnaca-bay',
    title: L(
      'Penthouse with panoramic bay view',
      'Penthouse with panoramic bay view',
    ),
    description: L(
      'פנטהאוז מרווח במפרץ לרנקה עם נוף פתוח.',
      'A spacious penthouse in Larnaca bay with an open view.',
    ),
    address: ADDR_LARNACA,
    agentId: 'u-mike',
    agentRole: 'contractor',
    dealType: 'sale',
    category: 'penthouses',
    availability: 'underConstruction',
    features: [
      L('נוף לים', 'Sea view'),
      L('בריכה פרטית', 'Private pool'),
      L('חניה כפולה', 'Double parking'),
    ],
    gallery: [
      img('photo-1613490493576-7fde63acd811'),
      img('photo-1600585154340-be6161a56a0c'),
    ],
    publishedToMarketplace: true,
    yearBuilt: 2027,
    parking: 2,
    entry: '2027-06-01T00:00:00Z',
    rooms: 5,
    sqm: 175,
    floor: '5',
    price: money(890_000, 'EUR'),
    status: 'available',
    priceHistory: [
      {
        at: '2026-07-08T09:00:00Z',
        from: money(920_000, 'EUR'),
        to: money(890_000, 'EUR'),
        changedBy: 'import',
      },
    ],
    ...stamp('2025-08-10', '2026-07-08'),
  },

  /* ---------- אושן ויו (miami-ocean, ממתין לאישור אדמין) ---------- */
  {
    id: 'M-142',
    projectId: 'miami-ocean',
    title: L('Unit 142, Floor 14', 'Unit 142, Floor 14'),
    description: L(
      'דירת 4 חדרים באושן ויו, קומה 14.',
      'A 4-room apartment in Ocean View Towers, 14th floor.',
    ),
    address: ADDR_MIAMI,
    agentId: 'u-mike',
    agentRole: 'contractor',
    dealType: 'sale',
    category: 'newFromContractor',
    availability: 'underConstruction',
    features: [],
    rooms: 4,
    sqm: 140,
    floor: '14',
    price: money(1_150_000, 'USD'),
    status: 'reserved',
    reservationId: 'res-2',
    ...stamp('2026-01-15', '2026-07-06'),
  },
  {
    id: 'M-201',
    projectId: 'miami-ocean',
    title: L('Sky Villa 201', 'Sky Villa 201'),
    description: L(
      'וילת שמיים באושן ויו, קומה 20, עם נוף לאוקיינוס.',
      'A sky villa in Ocean View Towers, 20th floor, with ocean views.',
    ),
    address: ADDR_MIAMI,
    agentId: 'u-mike',
    agentRole: 'contractor',
    dealType: 'sale',
    category: 'penthouses',
    availability: 'underConstruction',
    features: [L('נוף לאוקיינוס', 'Ocean view')],
    gallery: [img('photo-1560448204-e02f11c3d0e2')],
    rooms: 5,
    sqm: 230,
    floor: '20',
    price: money(2_400_000, 'USD'),
    status: 'available',
    priceHistory: [
      {
        at: '2026-07-06T08:00:00Z',
        from: money(2_550_000, 'USD'),
        to: money(2_400_000, 'USD'),
        changedBy: 'u-mike',
      },
    ],
    ...stamp('2026-01-15', '2026-07-06'),
  },

  /* ---------- נכסים עצמאיים (ללא פרויקט) ---------- */
  {
    id: 'lst-2',
    title: L(
      'פנטהאוז יוקרתי עם נוף פתוח לים',
      'Luxury penthouse with open sea view',
    ),
    description: L(
      'פנטהאוז מרהיב בקומה העליונה של מגדל יוקרה במרינה של הרצליה.',
      'A stunning penthouse on the top floor of a luxury tower at the Herzliya marina.',
    ),
    address: {
      country: COUNTRIES.IL,
      city: 'הרצליה',
      neighborhood: 'מרינה',
      street: 'אבא אבן 12',
      point: { lat: 32.1624, lng: 34.8065 },
    },
    agentId: 'u-yossi',
    agentRole: 'contractor',
    dealType: 'sale',
    category: 'penthouses',
    availability: 'new',
    publishedToMarketplace: true,
    price: money(9_800_000, 'ILS'),
    rooms: 5,
    sqm: 180,
    floor: '12 מתוך 12',
    yearBuilt: 2021,
    parking: 2,
    entry: 'flexible',
    badge: L('חדש באתר', 'New listing'),
    features: [
      L('נוף פתוח לים', 'Open sea view'),
      L('מרפסת גג', 'Roof terrace'),
      L('בריכה בבניין', 'Building pool'),
      L('בית חכם', 'Smart home'),
    ],
    gallery: [
      img('photo-1512917774080-9991f1c4c750'),
      img('photo-1600607687939-ce8a6c25118c'),
      img('photo-1600566753086-00f18fb6b3ea'),
    ],
    status: 'available',
    ...stamp('2026-06-10'),
  },
  {
    id: 'lst-4',
    title: L(
      'דירת 3 חדרים משופצת ליד הפארק',
      'Renovated 3-room apartment near the park',
    ),
    description: L(
      'דירת 3 חדרים משופצת מהיסוד ברחוב שקט ליד פארק המדע.',
      'A fully renovated 3-room apartment on a quiet street near Science Park.',
    ),
    address: {
      country: COUNTRIES.IL,
      city: 'רחובות',
      neighborhood: 'בילו',
      street: 'בילו 34',
    },
    agentId: 'u-david-seller',
    agentRole: 'seller',
    dealType: 'rent',
    category: 'apartments',
    availability: 'immediate',
    publishedToMarketplace: true,
    price: money(6_500, 'ILS'),
    rooms: 3,
    sqm: 78,
    floor: '2 מתוך 4',
    yearBuilt: 1998,
    parking: 1,
    entry: 'flexible',
    badge: L('כניסה מיידית', 'Immediate entry'),
    features: [
      L('משופצת מהיסוד', 'Fully renovated'),
      L('מזגנים בכל חדר', 'A/C in every room'),
      L('קרוב לרכבת', 'Near train'),
    ],
    gallery: [
      img('photo-1493809842364-78817add7ffb'),
      img('photo-1502005229762-cf1b2da7c5d6'),
    ],
    status: 'available',
    ...stamp('2026-07-01'),
  },
]

/** יחידות של פרויקט מסוים. */
export const unitsOfProject = (projectId: string): Unit[] =>
  UNITS.filter((u) => u.projectId === projectId)

/** שליפת יחידה לפי מזהה. */
export const unitById = (id: string): Unit | undefined =>
  UNITS.find((u) => u.id === id)
