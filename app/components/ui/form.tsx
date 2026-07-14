import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
} from 'react'
import { SearchIcon } from 'lucide-react'
import { cn } from './cn'

const fieldBase =
  'w-full rounded-xl border border-gray-200 bg-white px-2 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100'

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />
}

export function Select({
  className,
  onChange,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(fieldBase, 'cursor-pointer ', className)}

      {...props}
    />
  )
}

/** תיבת חיפוש אפורה עם אייקון — סרגלי כלים ורשימות. */
export function SearchInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 transition focus-within:ring-2 focus-within:ring-primary-100',
        className,
      )}
    >
      <SearchIcon className='h-4 w-4 shrink-0 text-gray-400' />
      <input
        type='search'
        className='w-full bg-transparent text-sm outline-none placeholder:text-gray-400'
        {...props}
      />
    </div>
  )
}

export interface PillSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** מחלקות צבע — ברירת המחדל אפורה; אפשר להעביר צבעי סטטוס */
  tone?: string
}

/** select קומפקטי בצורת גלולה — סינונים בסרגלי כלים וסטטוסים בטבלאות. */
export function PillSelect({
  tone = 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  className,
  ...props
}: PillSelectProps) {
  return (
    <select
      className={cn(
        'cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium outline-none transition',
        tone,
        className,
      )}
      {...props}
    />
  )
}

export interface FieldProps extends LabelHTMLAttributes<HTMLLabelElement> {
  label: string
}

/** עוטף שדה טופס עם תווית אחידה. */
export function Field({ label, className, children, ...props }: FieldProps) {
  return (
    <label className={cn('block', className)} {...props}>
      <span className='mb-1.5 block text-sm font-medium text-gray-700'>
        {label}
      </span>
      {children}
    </label>
  )
}
