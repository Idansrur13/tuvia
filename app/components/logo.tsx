import { LayoutGridIcon } from 'lucide-react'

export function Logo({ size = 'md' }: { size?: 'md' | 'sm' }) {
  return (
    <a href='/' className='flex items-center gap-2 text-primary-500'>
      <span className='flex items-center justify-center rounded-xl bg-linear-to-br from-primary-500 to-accent-400 p-1.5 text-white shadow-brand'>
        <LayoutGridIcon className={size === 'md' ? 'h-5 w-5' : 'h-4 w-4'} />
      </span>
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
