import { TextLink } from './ui'
import { Logo } from './logo'

export function SiteFooter() {
  return (
    <footer className='border-t border-gray-100 bg-gray-50'>
      <div className='mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-gray-500 sm:flex-row sm:px-6 lg:px-8'>
        <Logo size='sm' />
        <p>© 2026 תכלת נדל״ן · כל הזכויות שמורות</p>
        <div className='flex gap-5'>
          <TextLink href='#' variant='footer'>
            אודות
          </TextLink>
          <TextLink href='#' variant='footer'>
            צור קשר
          </TextLink>
          <TextLink href='#' variant='footer'>
            תנאי שימוש
          </TextLink>
        </div>
      </div>
    </footer>
  )
}
