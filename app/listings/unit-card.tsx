import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import {
  Badge,
  IconButton,
  Price,
  Text,
  cardExit,
  fadeUp,
  formatPrice,
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
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperClass } from 'swiper'
import 'swiper/css'
import { A11y } from 'swiper/modules'

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
  const { t, tt, dir } = useLocale()
  const navigate = useNavigate()
  const [imageIndex, setImageIndex] = useState(0)
  const [liked, setLiked] = useState(false)
  // האינסטנס נשמר ב-state כי useSwiper() עובד רק בתוך <Swiper>
  const [swiper, setSwiper] = useState<SwiperClass | null>(null)

  const images = unit.gallery ?? []

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
      <div
        className='flex-1 flex flex-col h-full bg-white rounded-2xl border border-gray-100 cursor-pointer overflow-hidden shadow-sm transition-shadow duration-300 hover:shadow-lg'
        // onClick={() => navigate(`/property/${unit.id}`)}
      >
        {/* Image carousel */}
        <div className='relative h-60 overflow-hidden rounded-t-2xl bg-gray-100'>
          {images.length > 0 ? (
            <Swiper
              modules={[A11y]}
              dir={dir}
              loop={images.length > 1}
              slidesPerView={1}
              onSwiper={setSwiper}
              onSlideChange={(s) => setImageIndex(s.realIndex)}
              className='h-full'
            >
              {images.map((src) => (
                <SwiperSlide key={src.id}>
                  <img
                    src={src.url}
                    alt={t(unit.title)}
                    loading='lazy'
                    className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]'
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className='flex h-full items-center justify-center text-gray-300'>
              <ImageOffIcon className='h-8 w-8' />
            </div>
          )}

          {/* חיצים ונקודות מחוץ ל-Swiper כדי שלא יזוזו עם הסליידים */}
          {images.length > 1 && (
            <>
              <IconButton
                variant='overlay'
                aria-label='תמונה קודמת'
                onClick={guard(() => swiper?.slidePrev())}
                className='absolute right-2 top-1/2 z-10 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100'
              >
                <ChevronRight className='h-4 w-4' />
              </IconButton>
              <IconButton
                variant='overlay'
                aria-label='תמונה הבאה'
                onClick={guard(() => swiper?.slideNext())}
                className='absolute left-2 top-1/2 z-10 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100'
              >
                <ChevronLeft className='h-4 w-4' />
              </IconButton>

              {/* Dots */}
              <div className='absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5'>
                {images.map((src, i) => (
                  <button
                    key={src.id}
                    type='button'
                    aria-label={`תמונה ${i + 1}`}
                    onClick={guard(() => swiper?.slideToLoop(i))}
                    className={`h-1.5 w-1.5 rounded-full transition ${
                      i === imageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {unit.badge && (
            <Badge
              variant='overlay'
              className='absolute top-3 right-3 z-10 px-3 py-1'
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
        </div>
        {/* Details */}
        <div className='flex-1 space-y-1.5 p-4 pb-3'>
          <div className='flex items-start justify-between gap-2'>
            <h3 className='font-semibold leading-snug text-gray-900 line-clamp-1'>
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
          <Text variant='muted' className='font-medium text-gray-600'>
            {unit.rooms} חדרים · {unit.sqm} מ״ר
            {unit.floor && ` · קומה ${unit.floor}`}
          </Text>

          {/* מחיר ריק = "צור קשר" (החלטת מוצר) */}
        </div>
        <div className='mt-auto flex items-baseline justify-between gap-2 border-t border-gray-100 px-4 py-3'>
          {unit.price ? (
            <>
              <Price
                value={unit.price.amount}
                currency={unit.price.currency}
                suffix={unit.dealType === 'rent' ? 'לחודש' : undefined}
              />
              {unit.dealType === 'sale' && unit.sqm > 0 && (
                <Text as='span' variant='small' className='shrink-0'>
                  {formatPrice({
                    amount: Math.round(unit.price.amount / unit.sqm),
                    currency: unit.price.currency,
                  })}{' '}
                  {tt('perSqm')}
                </Text>
              )}
            </>
          ) : (
            <Text className='font-bold text-primary-700'>
              {tt('contactForPrice')}
            </Text>
          )}
        </div>
      </div>
    </motion.article>
  )
}
