import { LayoutGridIcon } from 'lucide-react'

export function Logo({ size = 'md' }: { size?: 'md' | 'sm' }) {
  return (
    <a href='/' className='flex items-center gap-2 text-primary-500'>
      <LayoutGridIcon className={size === 'md' ? 'h-8 w-8' : 'h-6 w-6'} />
      <span
        className={
          size === 'md'
            ? 'text-xl font-extrabold tracking-tight'
            : 'font-bold text-gray-700'
        }
      >
        תכלת{' '}
        {size === 'md' ? <span className='text-gray-900'>נדל״ן</span> : 'נדל״ן'}
      </span>
    </a>
  )
}
