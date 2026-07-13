import type { ReactNode } from 'react'
import { cn } from './cn'
import { Text } from './text'

/* ---------- EmptyState (מצב ריק — רשימות, טבלאות, עמודות) ---------- */

type EmptyStateSize = 'sm' | 'md'

export interface EmptyStateProps {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  /** פעולה מוצעת — למשל כפתור ניקוי סינון */
  action?: ReactNode
  /** sm — קומפקטי לעמודות קנבן ואזורים צרים */
  size?: EmptyStateSize
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  size = 'md',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 text-center',
        size === 'sm' ? 'px-3 py-5' : 'px-4 py-12',
        className,
      )}
    >
      {icon && (
        <span className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400'>
          {icon}
        </span>
      )}
      <Text
        as='p'
        variant={size === 'sm' ? 'small' : 'muted'}
        className='font-medium'
      >
        {title}
      </Text>
      {description && (
        <Text as='p' variant='small'>
          {description}
        </Text>
      )}
      {action}
    </div>
  )
}
