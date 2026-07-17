import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'
import { Text } from './text'

/* ---------- Card ---------- */

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/60 bg-white p-4 shadow-card   duration-300 ',
        className,
      )}
      {...props}
    />
  )
}

/* ---------- StatCard (כרטיס מדד לדשבורד) ---------- */

type StatCardTone = 'primary' | 'success' | 'warning' | 'danger' | 'secondary'

const statCardTones: Record<StatCardTone, string> = {
  primary:
    'bg-linear-to-br from-primary-500 to-accent-400 text-white shadow-brand',
  success: 'bg-linear-to-br from-success-500 to-emerald-400 text-white',
  secondary: 'bg-linear-to-br from-rose-500 to-rose-300 text-white',
  warning: 'bg-linear-to-br from-amber-400 to-amber-400 text-white',
  danger: 'bg-linear-to-br from-danger-500 to-rose-400 text-white',
}

export interface StatCardProps {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  /** צבע ריבוע האייקון — למשל danger למדדי איחור */
  tone?: StatCardTone
  className?: string
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'primary',
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'relative flex items-start justify-between gap-3 overflow-hidden',
        className,
      )}
    >
      {/* פס מותג עדין בראש הכרטיס */}
      <div>
        <Text as='span' variant='muted'>
          {label}
        </Text>
        <p className='mt-1 text-2xl font-extrabold tracking-tight text-ink-800'>
          {value}
        </p>
        {hint && (
          <Text as='p' variant='small' className='mt-1'>
            {hint}
          </Text>
        )}
      </div>
      {icon && (
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            statCardTones[tone],
          )}
        >
          {icon}
        </span>
      )}
    </Card>
  )
}
