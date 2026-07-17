/*
 * מרקטפלייס ציבורי — נכסים, חיפוש מתקדם, חיפושים שמורים ונקודות עניין.
 * פרקים 3.1 (חיפוש מתקדם) ו-3.2 (עמוד נכס).
 */
import type {
  Id,
  ISODate,
  Money,
  Address,
  MediaAsset,
  Localized,
  GeoPoint,
  Timestamps,
} from './common'

export type DealType = 'sale' | 'rent'

/** קטגוריות נכס. slug יציב + תווית מתורגמת. */
export type ListingCategory =
  | 'apartments'
  | 'penthouses'
  | 'gardenApartments'
  | 'houses'
  | 'newFromContractor'

/** מצב זמינות/בנייה לצורך סינון (פרק 3.1). */
export type ListingAvailability = 'new' | 'immediate' | 'underConstruction'

/* ---------- חיפוש מתקדם (פרק 3.1) ---------- */

export type SortOption = 'relevance' | 'priceAsc' | 'priceDesc' | 'newest'

export type ListingView = 'list' | 'grid' | 'map'

/** אזור חיפוש במפה — נקודה + רדיוס בק"מ. */
export interface MapArea {
  center: GeoPoint
  radiusKm: number
}

/** כל פרמטרי החיפוש. שדות ריקים = ללא סינון. */
export interface SearchFilters {
  /** חיפוש חופשי: עיר, שכונה, שם פרויקט, מזהה נכס. */
  query?: string
  dealType?: DealType
  categories?: ListingCategory[]
  availability?: ListingAvailability[]
  priceMin?: number
  priceMax?: number
  roomsMin?: number
  roomsMax?: number
  sqmMin?: number
  sqmMax?: number
  floorMin?: number
  /** מאפיינים נדרשים (חניה/מעלית/מרפסת/נגישות). */
  amenities?: string[]
  entryFrom?: ISODate
  entryTo?: ISODate
  area?: MapArea
  sort?: SortOption
}

/** חיפוש שמור + התראה על נכסים חדשים תואמים (פרק 3.1). */
export interface SavedSearch extends Timestamps {
  id: Id
  userId: Id
  name: string
  filters: SearchFilters
  /** לשלוח התראה כשנכס חדש תואם. */
  notifyOnNew: boolean
}

/* ---------- נקודות עניין (להזנת בוט ה-AI, פרק 3.3) ---------- */

export type PoiKind = 'school' | 'transit' | 'commerce' | 'park' | 'health'

export interface PointOfInterest {
  id: Id
  kind: PoiKind
  name: Localized
  point: GeoPoint
}
