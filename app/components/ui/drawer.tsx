import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { XIcon } from 'lucide-react'
import { cn } from './cn'
import { IconButton } from './button'

/* ---------- Drawer (פאנל צד נשלף) ---------- */

export interface DrawerProps {
  onClose: () => void
  /** תוכן שורת הכותרת — טקסט או צומת מורכב */
  header: ReactNode
  children: ReactNode
  closeLabel?: string
  className?: string
}

/**
 * פאנל צד עם רקע מוחשך — לפרטי רשומה ופעולות מהירות.
 * לרינדור בתוך AnimatePresence כדי שאנימציית היציאה תפעל.
 */
export function Drawer({
  onClose,
  header,
  children,
  closeLabel = 'סגירה',
  className,
}: DrawerProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className='fixed inset-0 z-40 bg-gray-900/30 backdrop-blur-[2px]'
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl',
          className,
        )}
      >
        <div className='flex items-start gap-3 border-b border-gray-100 p-4'>
          <div className='min-w-0 flex-1'>{header}</div>
          <IconButton
            variant='overlay'
            aria-label={closeLabel}
            onClick={onClose}
            className='bg-gray-100 shadow-none hover:bg-gray-200'
          >
            <XIcon className='h-4 w-4' />
          </IconButton>
        </div>
        <div className='min-h-0 flex-1 space-y-5 overflow-y-auto p-4'>
          {children}
        </div>
      </motion.aside>
    </>
  )
}
