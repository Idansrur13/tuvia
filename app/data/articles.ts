/*
 * כתבות דינמיות דמו (פרק 3.4) — כל כתבה מתרנדרת כעמוד /articles/:slug.
 */
import type { Article } from '~/types'
import { L, img, stamp } from './util'

export const ARTICLES: Article[] = [
  {
    id: 'art-1',
    slug: 'buying-abroad-guide',
    title: L('המדריך לרכישת נכס בחו״ל', 'The guide to buying property abroad'),
    excerpt: L(
      'כל מה שצריך לדעת לפני השקעה בנדל״ן בינלאומי.',
      'Everything you need to know before investing in international real estate.',
    ),
    cover: img('photo-1560518883-ce09059eeffa'),
    body: [
      {
        type: 'heading',
        level: 2,
        text: L('למה להשקיע בחו״ל?', 'Why invest abroad?'),
      },
      {
        type: 'paragraph',
        text: L(
          'שוקי נדל״ן בינלאומיים מציעים גיוון ותשואה.',
          'International real estate markets offer diversification and yield.',
        ),
      },
      {
        type: 'image',
        asset: img('photo-1512917774080-9991f1c4c750'),
        caption: L('נוף עירוני', 'City skyline'),
      },
    ],
    tags: ['השקעות', 'בינלאומי'],
    status: 'published',
    publishedAt: '2026-06-20T09:00:00Z',
    authorId: 'u-admin',
    seo: {
      metaTitle: L('רכישת נכס בחו״ל', 'Buying property abroad'),
      metaDescription: L(
        'מדריך מלא לרכישת נדל״ן בינלאומי.',
        'A complete guide to international real estate.',
      ),
    },
    availableLocales: ['he', 'en'],
    ...stamp('2026-06-18', '2026-06-20'),
  },
  {
    id: 'art-2',
    slug: 'tlv-market-2026',
    title: L('שוק הנדל״ן בתל אביב 2026', 'Tel Aviv real estate market 2026'),
    excerpt: L(
      'מגמות מחירים וביקוש בשנה הקרובה.',
      'Price trends and demand for the coming year.',
    ),
    cover: img('photo-1545324418-cc1a3fa10c00'),
    body: [
      {
        type: 'paragraph',
        text: L(
          'המחירים בתל אביב ממשיכים לעלות בקצב מתון.',
          'Prices in Tel Aviv continue to rise at a moderate pace.',
        ),
      },
    ],
    tags: ['תל אביב', 'מגמות'],
    status: 'draft',
    authorId: 'u-admin',
    seo: {
      metaTitle: L('שוק הנדל״ן ת״א 2026', 'TLV market 2026'),
      metaDescription: L('סקירת שוק', 'Market overview'),
    },
    availableLocales: ['he'],
    ...stamp('2026-07-05'),
  },
]

export const articleBySlug = (slug: string) =>
  ARTICLES.find((a) => a.slug === slug)

/** רק כתבות שפורסמו — לאזור הציבורי. */
export const publishedArticles = () =>
  ARTICLES.filter((a) => a.status === 'published')
