import type { AnchorHTMLAttributes } from 'react'
import { cn } from './cn'

type LinkVariant = 'nav' | 'footer' | 'inline' | 'pill'

const linkVariants: Record<LinkVariant, string> = {
  nav: 'rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100',
  footer: 'transition hover:text-primary-600',
  inline: 'font-medium text-primary-600 underline-offset-2 hover:underline',
  /* קישור פעולה קטן — טלפון/מייל בכרטיסים ובפאנלים */
  pill: 'inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-primary-50 hover:text-primary-700',
}

export interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: LinkVariant
}

export function TextLink({
  variant = 'inline',
  className,
  ...props
}: TextLinkProps) {
  return <a className={cn(linkVariants[variant], className)} {...props} />
}
