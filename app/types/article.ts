/*
 * מערכת כתבות דינמית — האדמין מוסיף כתבה, נוצר עמוד דינמי חדש (פרק 3.4).
 */
import type {
  Id,
  ISODate,
  Localized,
  MediaAsset,
  Locale,
  Timestamps,
} from './common'

export type ArticleStatus = 'draft' | 'scheduled' | 'published' | 'archived'

/** מטא-נתוני SEO לעמוד הדינמי (רב-לשוני). */
export interface Seo {
  metaTitle: Localized
  metaDescription: Localized
  ogImage?: MediaAsset
}

/**
 * בלוק תוכן בעורך העשיר. גוף הכתבה = רצף בלוקים,
 * כך שכל כתבה מתרנדרת כעמוד דינמי בלי פיתוח נוסף.
 */
export type ContentBlock =
  | { type: 'heading'; level: 2 | 3; text: Localized }
  | { type: 'paragraph'; text: Localized }
  | { type: 'image'; asset: MediaAsset; caption?: Localized }
  | { type: 'quote'; text: Localized }
  | { type: 'embed'; url: string }

export interface Article extends Timestamps {
  id: Id
  /** כתובת ידידותית ייחודית לעמוד הדינמי (/articles/:slug). */
  slug: string
  title: Localized
  excerpt: Localized
  cover?: MediaAsset
  body: ContentBlock[]
  tags: string[]
  status: ArticleStatus
  /** תזמון פרסום עתידי (כשהסטטוס 'scheduled'). */
  publishAt?: ISODate
  publishedAt?: ISODate
  authorId: Id
  seo: Seo
  /** אילו שפות מלאות ומוכנות לפרסום. */
  availableLocales: Locale[]
}
