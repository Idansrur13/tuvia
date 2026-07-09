/*
 * נכסי המרקטפלייס הציבורי (פרקים 3.1–3.2).
 * חלק מהנכסים מקושרים למלאי הקבלן (projectId/unitId), חלק עצמאיים של מוכרים.
 */
import type { DealType, Listing, ListingCategory, Localized } from '~/types'
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

export const LISTINGS: Listing[] = [
  {
    id: 'lst-1',
    title: L(
      'דירת 4 חדרים מעוצבת עם מרפסת שמש',
      'Designed 4-room apartment with a sun balcony',
    ),
    description: L(
      'דירה מעוצבת אדריכלית בלב הצפון הישן, במרחק הליכה מהים.',
      'An architecturally designed apartment in the heart of Old North, walking distance from the sea.',
    ),
    address: {
      country: COUNTRIES.IL,
      city: 'תל אביב',
      neighborhood: 'הצפון הישן',
      street: 'דיזנגוף 210',
      point: { lat: 32.0853, lng: 34.7818 },
    },
    dealType: 'sale',
    category: 'apartments',
    availability: 'immediate',
    price: money(4_950_000, 'ILS'),
    rooms: 4,
    sqm: 105,
    floor: '3 מתוך 6',
    yearBuilt: 2019,
    parking: 1,
    entry: 'flexible',
    badge: L('בלעדיות', 'Exclusive'),
    features: [
      L('מרפסת שמש', 'Sun balcony'),
      L('מיזוג מרכזי', 'Central A/C'),
      L('מעלית', 'Elevator'),
      L('חניה בטאבו', 'Deeded parking'),
      L('ממ״ד', 'Safe room'),
    ],
    images: [
      img('photo-1522708323590-d24dbb6b0267'),
      img('photo-1502672260266-1c1ef2d93688'),
      img('photo-1484154218962-a197022b5858'),
    ],
    projectId: 'tlv-towers',
    agentId: 'u-michal',
    agentRole: 'seller',
    ...stamp('2026-05-20'),
  },
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
    dealType: 'sale',
    category: 'penthouses',
    availability: 'new',
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
    images: [
      img('photo-1512917774080-9991f1c4c750'),
      img('photo-1600607687939-ce8a6c25118c'),
      img('photo-1600566753086-00f18fb6b3ea'),
    ],
    agentId: 'u-yossi',
    agentRole: 'contractor',
    ...stamp('2026-06-10'),
  },
  {
    id: 'lst-3',
    title: L(
      'Penthouse with panoramic bay view',
      'Penthouse with panoramic bay view',
    ),
    description: L(
      'פנטהאוז מרווח במפרץ לרנקה עם נוף פתוח.',
      'A spacious penthouse in Larnaca bay with an open view.',
    ),
    address: {
      country: COUNTRIES.CY,
      city: 'Larnaca',
      point: { lat: 34.9182, lng: 33.632 },
    },
    dealType: 'sale',
    category: 'penthouses',
    availability: 'underConstruction',
    price: money(890_000, 'EUR'),
    rooms: 5,
    sqm: 175,
    floor: '5 / 5',
    yearBuilt: 2027,
    parking: 2,
    entry: '2027-06-01T00:00:00Z',
    features: [
      L('נוף לים', 'Sea view'),
      L('בריכה פרטית', 'Private pool'),
      L('חניה כפולה', 'Double parking'),
    ],
    images: [
      img('photo-1613490493576-7fde63acd811'),
      img('photo-1600585154340-be6161a56a0c'),
    ],
    projectId: 'larnaca-bay',
    unitId: 'C-15',
    agentId: 'u-mike',
    agentRole: 'contractor',
    ...stamp('2026-06-25'),
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
    dealType: 'rent',
    category: 'apartments',
    availability: 'immediate',
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
    images: [
      img('photo-1493809842364-78817add7ffb'),
      img('photo-1502005229762-cf1b2da7c5d6'),
    ],
    agentId: 'u-david-seller',
    agentRole: 'seller',
    ...stamp('2026-07-01'),
  },
]

export const listingById = (id: string) => LISTINGS.find((l) => l.id === id)

/** נכסים נוספים מאותו פרויקט. */
export const sameProjectListings = (listing: Listing) =>
  listing.projectId
    ? LISTINGS.filter(
        (l) => l.projectId === listing.projectId && l.id !== listing.id,
      )
    : []

/** נכסים דומים — אותה קטגוריה / עיר / סוג עסקה, מדורגים, בלי מה שכבר מוצג. */
export const similarListings = (listing: Listing, excludeIds: string[] = []) =>
  LISTINGS.filter(
    (l) =>
      l.id !== listing.id &&
      !excludeIds.includes(l.id) &&
      (l.category === listing.category ||
        l.address.city === listing.address.city ||
        l.dealType === listing.dealType),
  )
    .sort((a, b) => {
      const score = (x: Listing) =>
        (x.category === listing.category ? 2 : 0) +
        (x.address.city === listing.address.city ? 1 : 0)
      return score(b) - score(a)
    })
    .slice(0, 4)
