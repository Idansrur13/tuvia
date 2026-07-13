import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

/* ---------- Banner (הודעת משוב בראש עמוד) ---------- */

type BannerVariant = 'success' | 'warning' | 'danger' | 'info'

const bannerVariants: Record<BannerVariant, string> = {
  success: 'border-success-500/30 bg-success-50 text-success-700',
  warning: 'border-warning-500/30 bg-warning-50 text-warning-700',
  danger: 'border-danger-500/30 bg-danger-50 text-danger-700',
  info: 'border-primary-500/30 bg-primary-50 text-primary-700',
}

export interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BannerVariant
  icon?: ReactNode
}

export function Banner({
  variant = 'success',
  icon,
  className,
  children,
  ...props
}: BannerProps) {
  return (
    <div
      role='status'
      className={cn(
        'flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium',
        bannerVariants[variant],
        className,
      )}
      {...props}
    >
      {icon && <span className='shrink-0'>{icon}</span>}
      {children}
    </div>
  )
}
