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
        <div className='flex items-center gap-2.5'>
          {icon && (
            <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white'>
              {icon}
            </span>
          )}
          <Heading level={1} size='lg'>
            {title}
          </Heading>
        </div>
        {subtitle && (
          <Text variant='muted' className='mt-1'>
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
