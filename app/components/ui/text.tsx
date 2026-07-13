import type { HTMLAttributes } from 'react'
import { cn } from './cn'

/* ---------- Heading ---------- */

type HeadingSize = 'xl' | 'lg' | 'md'

const headingSizes: Record<HeadingSize, string> = {
  xl: 'text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl',
  lg: 'text-2xl font-extrabold sm:text-3xl',
  md: 'text-xl font-bold',
}

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** רמת התג הסמנטי (h1–h4) */
  level?: 1 | 2 | 3 | 4
  /** הגודל הוויזואלי, בנפרד מהרמה הסמנטית */
  size?: HeadingSize
}

export function Heading({
  level = 2,
  size = 'lg',
  className,
  ...props
}: HeadingProps) {
  const Tag = `h${level}` as const
  return (
    <Tag
      className={cn(headingSizes[size], 'text-gray-700 ', className)}
      {...props}
    />
  )
}

/* ---------- Text ---------- */

type TextVariant = 'lead' | 'body' | 'muted' | 'small'

const textVariants: Record<TextVariant, string> = {
  lead: 'text-base text-gray-600 sm:text-lg',
  body: 'text-base text-gray-700',
  muted: 'text-sm text-gray-500',
  small: 'text-xs text-gray-500',
}

export interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: TextVariant
  /** התג שירונדר — p (ברירת מחדל) או span */
  as?: 'p' | 'span'
}

export function Text({
  variant = 'body',
  as: Tag = 'p',
  className,
  ...props
}: TextProps) {
  return <Tag className={cn(textVariants[variant], className)} {...props} />
}

/* ---------- Price (מחיר מפורמט לפי מטבע) ---------- */

export function formatPrice({ amount = 0, currency = 'ILS' }) {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export interface PriceProps extends HTMLAttributes<HTMLParagraphElement> {
  value: number
  /** קוד מטבע ISO — הפלטפורמה עולמית (ILS, USD, EUR...) */
  currency?: string
  /** סיומת כמו "לחודש" — מוצגת בסגנון מוחלש */
  suffix?: string
}

export function Price({
  value,
  currency = 'ILS',
  suffix,
  className,
  ...props
}: PriceProps) {
  return (
    <p className={cn('text-lg font-bold text-gray-900', className)} {...props}>
      {formatPrice({ amount: value, currency })}
      {suffix && (
        <Text as='span' variant='muted' className='font-normal'>
          {' '}
          / {suffix}
        </Text>
      )}
    </p>
  )
}
