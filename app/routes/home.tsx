import type { Route } from './+types/home'
import { Listings } from '../listings/listings'

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

export default function Home() {
  return <Listings />
}
