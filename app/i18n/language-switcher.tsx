/*
 * מתג שפה he/en. אפשר לשבץ בכל מקום (header/דשבורד).
 */
import type { Locale } from '~/types'
import { cn } from '~/components/ui'
import { useLocale } from './locale'

const LABELS: Record<Locale, string> = { he: 'עב', en: 'EN' }

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale()

  return (
    <div
      className={cn(
        'inline-flex rounded-full border border-gray-200 bg-white p-0.5 text-xs font-semibold',
        className,
      )}
    >
      {(['he', 'en'] as const).map((l) => (
        <button
          key={l}
          type='button'
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn(
            'rounded-full px-2.5 py-1 transition',
            locale === l
              ? 'bg-primary-500 text-white'
              : 'text-gray-500 hover:text-gray-900',
          )}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  )
}
