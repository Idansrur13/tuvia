import type { ReactNode } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from './cn'
import { Text } from './text'
import { PillSelect } from './form'

/* ---------- Pagination (עימוד לטבלאות ורשימות) ---------- */

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  /** טקסט חופשי בצד ההתחלה — למשל "מציג 1–25 מתוך 240" */
  summary?: ReactNode
  pageSize?: number
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
  /** תווית לאפשרויות גודל עמוד — למשל "בעמוד" */
  pageSizeLabel?: string
  prevLabel?: string
  nextLabel?: string
  className?: string
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  summary,
  pageSize,
  pageSizeOptions = [25, 50, 100],
  onPageSizeChange,
  pageSizeLabel,
  prevLabel = 'הקודם',
  nextLabel = 'הבא',
  className,
}: PaginationProps) {
  const navButton =
    'rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-50 disabled:opacity-40'

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3',
        className,
      )}
    >
      {summary && (
        <Text as='span' variant='small'>
          {summary}
        </Text>
      )}
      <div className='flex items-center gap-2'>
        {pageSize !== undefined && onPageSizeChange && (
          <PillSelect
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
                {pageSizeLabel && ` ${pageSizeLabel}`}
              </option>
            ))}
          </PillSelect>
        )}
        <button
          type='button'
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={prevLabel}
          className={navButton}
        >
          <ChevronRightIcon className='h-4 w-4 ltr:hidden' />
          <ChevronLeftIcon className='h-4 w-4 rtl:hidden' />
        </button>
        <Text as='span' variant='small' dir='ltr'>
          {page} / {totalPages}
        </Text>
        <button
          type='button'
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label={nextLabel}
          className={navButton}
        >
          <ChevronLeftIcon className='h-4 w-4 ltr:hidden' />
          <ChevronRightIcon className='h-4 w-4 rtl:hidden' />
        </button>
      </div>
    </div>
  )
}
