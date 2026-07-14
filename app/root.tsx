import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from 'react-router'

import type { Route } from './+types/root'
import './app.css'
import { LocaleProvider, LOCALE_COOKIE, useLocale } from './i18n/locale'
import type { Locale } from './types'

export function loader({ request }: Route.LoaderArgs) {
  // קריאת העדפת השפה מה-cookie כדי לרנדר בשרת בשפה הנכונה (בלי פליק)
  const match = new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=(he|en)`).exec(
    request.headers.get('Cookie') ?? '',
  )
  return { locale: (match?.[1] ?? 'en') as Locale }
}

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap',
  },
]

export function Layout({ children }: { children: React.ReactNode }) {
  // ה-Layout מרונדר גם ב-ErrorBoundary, אז ייתכן שאין נתוני loader — נופלים לאנגלית
  const data = useRouteLoaderData<typeof loader>('root')
  return (
    <LocaleProvider initialLocale={data?.locale}>
      <Document>{children}</Document>
    </LocaleProvider>
  )
}

/* קומפוננטה פנימית כדי ש-<html lang/dir> יגיעו מה-context (הפרובידר חייב להיות מעליה) */
function Document({ children }: { children: React.ReactNode }) {
  const { locale, dir } = useLocale()
  return (
    <html lang={locale} dir={dir}>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className='pt-16 p-4 container mx-auto'>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className='w-full  p-4 overflow-x-auto '>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
