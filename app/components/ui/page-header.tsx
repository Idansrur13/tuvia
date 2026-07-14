import type { ReactNode } from 'react'
import { cn } from './cn'
import { Heading, Text } from './text'

/* ---------- PageHeader (כותרת עמוד בדשבורד) ---------- */

export interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  /** אייקון בריבוע מותג לצד הכותרת */
  icon?: ReactNode
  /** פעולות בקצה הנגדי — לרוב כפתור ראשי */
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3',
        className,
      )}
    >
      <div>
        <div className='flex items-center gap-3'>
          {icon && (
            <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary-500 to-accent-400 text-white shadow-brand'>
              {icon}
            </span>
          )}
          <div>
            <Heading
              level={1}
              size='lg'
              className='tracking-tight text-ink-800'
            >
              {title}
            </Heading>
            {/* קו מותג קצר מתחת לכותרת — חתימה ויזואלית של הפלטפורמה */}
          </div>
        </div>
        {subtitle && (
          <Text variant='muted' className='mt-2'>
            {subtitle}
          </Text>
        )}
      </div>
      {actions && (
        <div className='flex shrink-0 items-center gap-2'>{actions}</div>
      )}
    </div>
  )
}
