import type { Route } from './+types/home'
import { Listings } from '../listings/listings'
import { getPublishedUnits } from '~/server/queries.server'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'תכלת נדל״ן | דירות למכירה ולהשכרה' },
    {
      name: 'description',
      content:
        'מבחר נכסים נבחרים למכירה ולהשכרה בליווי אישי של סוכני נדל״ן מובילים',
    },
  ]
}

/** טוען את הנכסים מבסיס הנתונים עבור עמוד הבית */
export async function loader({}: Route.LoaderArgs) {
  const listings = await getPublishedUnits()
  return { listings }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <Listings listings={loaderData.listings} />
}
