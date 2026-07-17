import { useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import {
  Badge,
  IconButton,
  Price,
  Text,
  cardExit,
  fadeUp,
  spring,
  viewportOnce,
} from '../components/ui'
import {
  ArrowLeftRightIcon,
  ChevronLeft,
  ChevronRight,
  HeartIcon,
  ImageOffIcon,
} from 'lucide-react'
import type { Unit } from '~/types'
import { useLocale } from '~/i18n/locale'

export function UnitCard({
  unit,
  compared,
  onCompareToggle,
}: {
  unit: Unit
  /** האם הנכס נבחר להשוואה (פרק 3.1). */
  compared?: boolean
  /** קיים רק בעמודים שתומכים בהשוואה. */
  onCompareToggle?: (id: string) => void
}) {
  const { t, tt } = useLocale()
  const [imageIndex, setImageIndex] = useState(0)
  const [liked, setLiked] = useState(false)

  const images = unit.gallery ?? []
  const next = () => setImageIndex((i) => (i + 1) % images.length)
  const prev = () =>
    setImageIndex((i) => (i - 1 + images.length) % images.length)

  // עוצר ניווט של ה-Link כשלוחצים על כפתורים בתוך הכרטיס
  const guard =
    (fn: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.stopPropagation()
      fn()
    }

  return (
    <motion.article
      layout
      variants={fadeUp}
      initial='hidden'
      whileInView='visible'
      viewport={viewportOnce}
      exit={cardExit}
      className='group'
    >
      <Link to={`/property/${unit.id}`} className='block cursor-pointer'>
        {/* Image carousel */}
        <div className='relative aspect-4/3 overflow-hidden rounded-2xl bg-gray-100'>
          {images.length > 0 ? (
            <motion.div
              className='flex h-full'
              animate={{ x: `${imageIndex * 100}%` }}
              transition={spring}
            >
              {images.map((src, i) => (
                <img
                  key={src.id}
                  src={src.url}
                  alt={t(unit.title)}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  className='h-full w-full shrink-0 object-cover transition-transform duration-500 group-hover:scale-[1.03]'
                />
              ))}
            </motion.div>
          ) : (
            <div className='flex h-full items-center justify-center text-gray-300'>
              <ImageOffIcon className='h-8 w-8' />
            </div>
          )}

          {unit.badge && (
            <Badge
              variant='overlay'
              className='absolute top-3 right-3 px-3 py-1'
            >
              {t(unit.badge)}
            </Badge>
          )}

          {/* השוואת דירות (פרק 3.1) */}
          {onCompareToggle && (
            <motion.button
              type='button'
              aria-label={compared ? tt('compareRemove') : tt('compareAdd')}
              title={compared ? tt('compareRemove') : tt('compareAdd')}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.8 }}
              onClick={guard(() => onCompareToggle(unit.id))}
              className='absolute top-12 left-3'
            >
              <span
                className={
                  compared
                    ? 'flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-white shadow'
                    : 'flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white drop-shadow'
                }
              >
                <ArrowLeftRightIcon className='h-4 w-4' />
              </span>
            </motion.button>
          )}

          <motion.button
            type='button'
            aria-label='הוספה למועדפים'
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.8 }}
            onClick={guard(() => setLiked((v) => !v))}
            className='absolute top-3 left-3'
          >
            <motion.span
              className='block'
              animate={liked ? { scale: [1, 1.35, 1] } : { scale: 1 }}
              transition={{ duration: 0.35 }}
            >
              <HeartIcon
                className={
                  liked
                    ? 'h-6 w-6 fill-primary-500 stroke-primary-500 drop-shadow'
                    : 'h-6 w-6 fill-black/40 stroke-white drop-shadow'
                }
              />
            </motion.span>
          </motion.button>

          {/* Carousel arrows */}
          {images.length > 1 && (
            <>
              <IconButton
                variant='overlay'
                aria-label='תמונה קודמת'
                onClick={guard(prev)}
                className='absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100'
              >
                <ChevronRight className='h-4 w-4' />
              </IconButton>
              <IconButton
                variant='overlay'
                aria-label='תמונה הבאה'
                onClick={guard(next)}
                className='absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100'
              >
                <ChevronLeft className='h-4 w-4' />
              </IconButton>

              {/* Dots */}
              <div className='absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5'>
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full transition ${
                      i === imageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Details */}
        <div className='mt-3 space-y-1'>
          <div className='flex items-start justify-between gap-2'>
            <h3 className='font-semibold leading-snug text-gray-900'>
              {t(unit.title)}
            </h3>
            <Badge
              variant={unit.dealType === 'sale' ? 'primary' : 'success'}
              className='mt-0.5 shrink-0'
            >
              {unit.dealType === 'sale' ? 'למכירה' : 'להשכרה'}
            </Badge>
          </div>

          <Text variant='muted'>
            {[unit.address.neighborhood, unit.address.city]
              .filter(Boolean)
              .join(', ')}
          </Text>
          <Text variant='muted'>
            {unit.rooms} חדרים · {unit.sqm} מ״ר
            {unit.floor && ` · קומה ${unit.floor}`}
          </Text>

          {/* מחיר ריק = "צור קשר" (החלטת מוצר) */}
          {unit.price ? (
            <Price
              value={unit.price.amount}
              currency={unit.price.currency}
              suffix={unit.dealType === 'rent' ? 'לחודש' : undefined}
              className='pt-1'
            />
          ) : (
            <Text className='pt-1 font-bold text-primary-700'>
              {tt('contactForPrice')}
            </Text>
          )}
        </div>
      </Link>
    </motion.article>
  )
}
