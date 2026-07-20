import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useInView,
} from 'motion/react'
import {
  Badge,
  Button,
  Chip,
  Field,
  Heading,
  IconButton,
  Input,
  Modal,
  Price,
  Select,
  Text,
  TextLink,
  ToggleGroup,
  cardExit,
  cn,
  fadeDown,
  fadeUp,
  spring,
  stagger,
  viewportOnce,
} from '../components/ui'
import { A11y } from 'swiper/modules'

import { Logo } from '../components/logo'
import houseSvg from '~/assets/icons/undraw_house-searching_g2b8.svg'
import { SiteFooter } from '../components/site-footer'
import {
  Building2Icon,
  CheckIcon,
  CircleCheckBig,
  ConstructionIcon,
  CrownIcon,
  GlobeIcon,
  HardHat,
  HeartHandshakeIcon,
  HomeIcon,
  LayoutGridIcon,
  SearchIcon,
  SparklesIcon,
  StarIcon,
  TreesIcon,
  XIcon,
} from 'lucide-react'

import { Link } from 'react-router'

import { UnitCard } from './unit-card'
import 'swiper/css'
import { Swiper, SwiperSlide } from 'swiper/react'

import type { Country, DealType, ListingCategory, Unit } from '~/types'
import { DEAL_TYPES, IMG, LISTING_CATEGORIES } from '~/data'
import { useLocale } from '~/i18n/locale'
import { Header } from '~/components/premisions/header'

type CategoryFilter = 'all' | ListingCategory
/** סינון חדרים — מינימום חדרים או 'all'. */
type RoomsFilter = 'all' | '2' | '3' | '4' | '5'

/* ---------- Data ---------- */

const HERO_STATS = [
  {
    value: 1240,
    suffix: '+',
    labelKey: 'statActiveProperties',
    icon: Building2Icon,
  },
  { value: 15, suffix: '', labelKey: 'statCountries', icon: GlobeIcon },
  { value: 320, suffix: '+', labelKey: 'statProjects', icon: HardHat },
  {
    value: 98,
    suffix: '%',
    labelKey: 'statSatisfied',
    icon: HeartHandshakeIcon,
  },
] as const

/** אייקונים אמיתיים לקטגוריות במקום אימוג'י — עקביים עם שאר המערכת. */
const CATEGORY_ICONS: Record<
  CategoryFilter,
  React.ComponentType<{ className?: string }>
> = {
  all: LayoutGridIcon,
  apartments: Building2Icon,
  penthouses: CrownIcon,
  gardenApartments: TreesIcon,
  houses: HomeIcon,
  newFromContractor: ConstructionIcon,
}

const ROOMS_OPTIONS: RoomsFilter[] = ['all', '2', '3', '4', '5']

/** תמונות דמו למדינות (Unsplash) — מדינה בלי תמונה מקבלת גרדיאנט. */
const COUNTRY_IMAGES: Record<string, string> = {
  IL: 'photo-1544971587-b842c27f8e14',
  CY: 'photo-1507525428034-b723cf961d3e',
  US: 'photo-1506966953602-c20cc11f75e3',
  GB: 'photo-1513635269975-59663e0ac1ad',
  FR: 'photo-1502602898657-3e91760cbb34',
  DE: 'photo-1560969184-10fe8719e047',
}

/** ערים פופולריות לחיפוש מהיר — הערכים תואמים ל-address.city בדאטה. */
const POPULAR_CITIES = ['תל אביב', 'Larnaca', 'Miami'] as const

/* ---------- Components ---------- */

/** מספר שסופר את עצמו מ-0 כשהוא נכנס למסך */
function CountUp({ to, suffix }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, {
      duration: 1.6,
      ease: 'easeOut',
      onUpdate: (v) => {
        if (ref.current)
          ref.current.textContent = Math.round(v).toLocaleString('he-IL')
      },
    })
    return () => controls.stop()
  }, [inView, to])

  return (
    <span>
      <span ref={ref}>0</span>
      {suffix}
    </span>
  )
}

/** עוטף אלמנט בריחוף איטי מתמשך — לכרטיסים המרחפים ב-hero */
function Floaty({
  children,
  duration = 5,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  duration?: number
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -9, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

/** פאנל החיפוש של ה-hero — מפעיל את הסינון של הגריד וגולל אליו */
function HeroSearchPanel({
  onSearch,
}: {
  onSearch: (
    query: string,
    category: CategoryFilter,
    dealType: DealType | 'all',
    rooms: RoomsFilter,
  ) => void
}) {
  const { t, tt } = useLocale()
  const [city, setCity] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [dealType, setDealType] = useState<DealType | 'all'>('all')
  const [rooms, setRooms] = useState<RoomsFilter>('all')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSearch(city, category, dealType, rooms)
      }}
      className=''
    >
      {/* שורת חיפוש ראשית */}
      {/* <div className='flex flex-col gap-2.5 sm:flex-row'>
        <div className='relative flex-1'>
          <Input
            value={city}

            onChange={(e) => setCity(e.target.value)}
            placeholder={tt('cityExample')}
            aria-label={tt('cityOrArea')}
            className='h-12 text-base'
          />
        </div>
      </div> */}

      {/* סינון משני */}
      <div className='flex justify-between items-end mt-4'>
        <Field label={tt('propertyType')}>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryFilter)}
          >
            {LISTING_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {t(c.label)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={tt('dealTypeLabel')}>
          <Select
            value={dealType}
            onChange={(e) => setDealType(e.target.value as DealType | 'all')}
          >
            {DEAL_TYPES.map((d) => (
              <option key={d.id} value={d.id}>
                {t(d.label)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={tt('roomsLabel')}>
          <Select
            value={rooms}
            onChange={(e) => setRooms(e.target.value as RoomsFilter)}
          >
            {ROOMS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r === 'all' ? tt('anyRooms') : `${r}+`}
              </option>
            ))}
          </Select>
        </Field>
        <Button
          type='submit'
          size='sm'
          variant='primary'
          className='h-fit flex'
        >
          <SearchIcon className='h-4 w-4' />
          {tt('search')}
        </Button>
      </div>
    </form>
  )
}

const HERO_AVATARS = [
  { imgUrl: 'app/assets/demoAvatars/dd.avif' },
  { imgUrl: 'app/assets/demoAvatars/IMG_7359.jpg' },
  { imgUrl: 'app/assets/demoAvatars/ff.avif' },
] as const

/** בלוב צבע מטושטש שמרחף ברקע ה-hero */
function FloatingBlob({
  className,
  duration,
}: {
  className: string
  duration: number
}) {
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute rounded-full  blur-3xl ${className}`}
      animate={{ y: [0, 28, 0], x: [0, -18, 0], scale: [1, 1.08, 1] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

/** סרגל מדינות ויזואלי — כרטיסי תמונה שמסננים את הגריד לפי מדינה */
function CountryExplorer({
  listings,
  active,
  onSelect,
}: {
  listings: Unit[]
  active: 'all' | string
  onSelect: (code: 'all' | string) => void
}) {
  const { t, tt, dir } = useLocale()

  const countries = useMemo(() => {
    const map = new Map<string, { country: Country; count: number }>()
    for (const l of listings) {
      const c = l.address.country
      const entry = map.get(c.code)
      if (entry) entry.count++
      else map.set(c.code, { country: c, count: 1 })
    }
    return [...map.values()].sort((a, b) => b.count - a.count)
  }, [listings])

  if (countries.length < 2) return null

  return (
    <section className='mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8'>
      <motion.div
        variants={stagger}
        initial='hidden'
        whileInView='visible'
        viewport={viewportOnce}
      >
        <motion.div variants={fadeUp} className='mb-5'>
          <Heading level={2} size='md'>
            {tt('exploreByCountry')}
          </Heading>
          <Text variant='muted' className='mt-1'>
            {tt('exploreByCountryHint')}
          </Text>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Swiper
            modules={[A11y]}
            dir={dir}
            spaceBetween={16}
            slidesPerView={1.15}
            breakpoints={{
              640: { slidesPerView: 2.2 },
              1024: { slidesPerView: 3 },
            }}
            className='w-full '
          >
            {countries.map(({ country, count }) => {
              const isActive = active === country.code
              const image = COUNTRY_IMAGES[country.code]
              return (
                <SwiperSlide key={country.code}>
                  <motion.button
                    type='button'
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onSelect(isActive ? 'all' : country.code)}
                    aria-pressed={isActive}
                    className={cn(
                      'group relative h-full w-full cursor-pointer overflow-hidden  rounded-3xl text-right shadow-lg transition-shadow sm:h-44',
                      isActive
                        ? 'shadow-xl shadow-primary-300/10 border-2  border-primary-500 '
                        : 'hover:shadow-xl',
                    )}
                  >
                    {image ? (
                      <img
                        src={IMG(image)}
                        alt={t(country.name)}
                        loading='lazy'
                        className='absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
                      />
                    ) : (
                      <div className='absolute inset-0 bg-linear-to-br from-primary-400 to-accent-400' />
                    )}
                    <div className='absolute inset-0 bg-linear-to-t from-gray-900/20 via-gray-500/10 to-transparent' />

                    <span className='absolute top-3 inset-s-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-gray-800 backdrop-blur'>
                      {count} {tt('propertiesCount')}
                    </span>

                    <AnimatePresence>
                      {isActive && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className='absolute inset-0  bottom-0  left-0 flex  justify-center items-center '
                        >
                          <CircleCheckBig className='text-primary-300/60' />
                        </motion.span>
                      )}
                    </AnimatePresence>

                    <span className='absolute bottom-3.5 inset-s-4 flex items-center gap-2'>
                      <span className='text-2xl drop-shadow'>
                        {country.flag}
                      </span>
                      <span className='text-lg font-bold text-white drop-shadow'>
                        {t(country.name)}
                      </span>
                    </span>
                  </motion.button>
                </SwiperSlide>
              )
            })}
          </Swiper>
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ---------- Page ---------- */
/** מקבל את הנכסים מה-loader של הראוט (נטענים מבסיס הנתונים) */
export function Listings({ listings }: { listings: Unit[] }) {
  const { t, tt } = useLocale()

  const [category, setCategory] = useState<CategoryFilter>('all')
  const [dealType, setDealType] = useState<DealType | 'all'>('all')
  const [rooms, setRooms] = useState<RoomsFilter>('all')
  const [query, setQuery] = useState('')
  const [countryCode, setCountryCode] = useState<'all' | string>('all')

  const hasActiveFilters =
    category !== 'all' ||
    dealType !== 'all' ||
    rooms !== 'all' ||
    query !== '' ||
    countryCode !== 'all'
  const clearAllFilters = () => {
    setCategory('all')
    setDealType('all')
    setRooms('all')
    setQuery('')
    setCountryCode('all')
  }

  /* השוואת דירות (פרק 3.1) - עד 4 נכסים. */
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const toggleCompare = (id: string) =>
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= 4
          ? prev
          : [...prev, id],
    )

  const filtered = useMemo(
    () =>
      listings.filter((l) => {
        if (category !== 'all' && l.category !== category) return false
        if (dealType !== 'all' && l.dealType !== dealType) return false
        if (rooms !== 'all' && l.rooms < Number(rooms)) return false
        if (countryCode !== 'all' && l.address.country.code !== countryCode)
          return false
        if (query) {
          const q = query.trim()
          return (
            l.address.city.includes(q) ||
            l.address.neighborhood?.includes(q) ||
            t(l.title).includes(q)
          )
        }
        return true
      }),
    [listings, category, dealType, rooms, query, countryCode],
  )

  const handleHeroSearch = (
    q: string,
    cat: CategoryFilter,
    deal: DealType | 'all',
    minRooms: RoomsFilter,
  ) => {
    setQuery(q)
    setCategory(cat)
    setDealType(deal)
    setRooms(minRooms)
    document
      .getElementById('listings')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <MotionConfig reducedMotion='user'>
      <div className='min-h-screen overflow-x-hidden bg-linear-to-b from-primary-100 via-primary-50 to-white '>
        {/* Header */}
        <Header query={query} setQuery={(q) => setQuery(q)} />

        {/* Hero */}
        <section className='relative  '>
          <FloatingBlob
            className='-top-24 -right-24 h-80 w-80 bg-primary-300/50'
            duration={14}
          />
          <FloatingBlob
            className='top-10 -left-32 h-96 w-96 bg-accent-400/25'
            duration={18}
          />

          <div className='relative mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pt-16'>
            <div className='grid items-center gap-12 md:grid-cols-2'>
              {/* טקסט + חיפוש */}
              <motion.div
                variants={stagger}
                initial='hidden'
                animate='visible'
                className='text-center self-end lg:text-right'
              >
                <motion.div variants={fadeUp}>
                  <Heading
                    level={1}
                    size='xl'
                    className='leading-[1.15] text-start'
                  >
                    {tt('heroTitle1')}{' '}
                    <span className='relative inline-block whitespace-nowrap text-primary-600'>
                      {tt('heroTitle2')}
                      <motion.svg
                        aria-hidden
                        viewBox='0 0 200 12'
                        fill='none'
                        className='absolute right-0 -bottom-2 w-full'
                        preserveAspectRatio='none'
                      >
                        <motion.path
                          d='M3 9C55 3 145 3 197 8'
                          stroke='var(--color-accent-400)'
                          strokeWidth='5'
                          strokeLinecap='round'
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.7, delay: 0.7 }}
                        />
                      </motion.svg>
                    </span>
                  </Heading>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <Text
                    variant='lead'
                    className='mx-auto mt-5 max-w-xl text-start lg:mx-0'
                  >
                    {tt('heroLead')}
                  </Text>
                </motion.div>

                <motion.div
                  variants={fadeUp}
                  className='  mt-6 items-center gap-8 rounded-2xl border border-primary-200/70 bg-white/80 p-6 text-center shadow-xl shadow-primary-300/10 backdrop-blur sm:flex-row sm:text-start'
                >
                  <div className='flex gap-4'>
                    {/* מקום ל-SVG — להחליף את האייקון באיור */}
                    <div className='flex size-30 shrink-0 items-center justify-center rounded-2xl bg-primary-100'>
                      <img src={houseSvg} alt='' />
                    </div>

                    <div className='flex flex-col items-center gap-4 sm:items-start'>
                      <Heading level={2} size='md'>
                        {tt('aiTitle')}
                      </Heading>
                      <Text variant='muted'>{tt('aiSubtitle')}</Text>
                      <Link to='/assistant'>
                        <Button size='md' variant='primary'>
                          <SearchIcon className='h-4 w-4' />
                          {tt('navAssistant')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className='h-px bg-primary-200 my-2' />
                  <HeroSearchPanel onSearch={handleHeroSearch} />
                </motion.div>

                {/* Trust */}
                <motion.div
                  variants={fadeUp}
                  className='mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start'
                >
                  <div className='flex'>
                    {HERO_AVATARS.map((a, i) => (
                      <img
                        src={a.imgUrl}
                        alt=''
                        key={i}
                        className={`rounded-full object-cover size-9 `}
                      />
                    ))}
                  </div>
                  <div className='flex items-center gap-1 text-warning-500'>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon key={i} className='h-4 w-4 fill-current' />
                    ))}
                  </div>
                  <Text as='span' variant='muted'>
                    {tt('heroTrust')}
                  </Text>
                </motion.div>
              </motion.div>

              {/* קומפוזיציית תמונות */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.15,
                  ease: [0.22, 0.61, 0.36, 1],
                }}
                className='relative mx-auto hidden w-full max-w-md md:block'
              >
                <img
                  src={IMG('photo-1512917774080-9991f1c4c750')}
                  alt='פנטהאוז יוקרתי'
                  className='h-100 w-full rounded-3xl object-cover shadow-2xl shadow-primary-900/20'
                />

                {/* תמונה משנית */}
                <div className='absolute -bottom-8 -right-8'>
                  <img
                    src={IMG('photo-1600607687939-ce8a6c25118c')}
                    alt='עיצוב פנים'
                    className='h-36 w-52 rounded-2xl border-4 border-white object-cover shadow-xl'
                  />
                </div>

                {/* כרטיס "נמכרה הרגע" */}
                {/* <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className='absolute top-6 -left-8'
                >
                  <Floaty duration={5}>
                    <div className='flex items-center gap-2.5 rounded-xl bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur'>
                      <span className='h-2.5 w-2.5 shrink-0 rounded-full bg-success-500' />
                      <div>
                        <p className='text-xs font-bold text-gray-900'>
                          נמכרה הרגע
                        </p>
                        <p className='text-[11px] text-gray-500'>
                          פנטהאוז במרינה, הרצליה
                        </p>
                      </div>
                    </div>
                  </Floaty>
                </motion.div> */}

                {/* כרטיס מחיר */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className='absolute bottom-16 -left-10'
                ></motion.div>
              </motion.div>
            </div>

            {/* Stats */}
            <motion.dl
              variants={stagger}
              initial='hidden'
              whileInView='visible'
              viewport={viewportOnce}
              className='mt-14 grid grid-cols-2 gap-x-4 gap-y-8 rounded-2xl border border-primary-100/70 bg-white/60 p-4 text-center shadow-xl shadow-primary-500/10 backdrop-blur sm:grid-cols-4 '
            >
              {HERO_STATS.map((stat) => {
                const StatIcon = stat.icon
                return (
                  <motion.div key={stat.labelKey} variants={fadeUp}>
                    <dt className='flex flex-col items-center gap-2.5'>
                      <span className='flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-100/80 text-primary-600'>
                        <StatIcon className='h-5 w-5' />
                      </span>
                      <span className='bg-linear-to-br from-primary-600 to-primary-200 bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl'>
                        <CountUp to={stat.value} suffix={stat.suffix} />
                      </span>
                    </dt>
                    <dd className='mt-1'>
                      <Text as='span' variant='muted'>
                        {tt(stat.labelKey)}
                      </Text>
                    </dd>
                  </motion.div>
                )
              })}
            </motion.dl>
          </div>
        </section>

        {/* חיפוש ויזואלי לפי מדינה */}
        <CountryExplorer
          listings={listings}
          active={countryCode}
          onSelect={setCountryCode}
        />

        {/* סרגל סינון דביק — קטגוריות + סוג עסקה + ניקוי */}
        <div className='sticky top-15.25 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-md'>
          <motion.div
            variants={stagger}
            initial='hidden'
            animate='visible'
            className='mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8 scrollbar-none'
          >
            {LISTING_CATEGORIES.map((c) => {
              const CategoryIcon = CATEGORY_ICONS[c.id]
              const count =
                c.id === 'all'
                  ? listings.length
                  : listings.filter((l) => l.category === c.id).length
              return (
                <motion.div key={c.id} variants={fadeDown}>
                  <Chip
                    appearance='solid'
                    icon={<CategoryIcon className='h-4 w-4' />}
                    active={category === c.id}
                    onClick={() => setCategory(c.id)}
                  >
                    {t(c.label)}
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none',
                        category === c.id
                          ? 'bg-white/25 text-white'
                          : 'bg-gray-100 text-gray-500',
                      )}
                    >
                      {count}
                    </span>
                  </Chip>
                </motion.div>
              )
            })}

            <AnimatePresence>
              {hasActiveFilters && (
                <motion.button
                  type='button'
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={clearAllFilters}
                  className='flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-gray-400 transition hover:bg-gray-100 hover:text-danger-500'
                >
                  <XIcon className='h-3.5 w-3.5' />
                  {tt('clearFilters')}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Listings grid */}
        <main
          id='listings'
          className='mx-auto max-w-7xl scroll-mt-28 px-4 py-8 sm:px-6 lg:px-8'
        >
          <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
            <Heading level={2} size='md'>
              {category === 'all'
                ? tt('topProperties')
                : t(
                    LISTING_CATEGORIES.find((c) => c.id === category)
                      ?.label ?? {
                      he: '',
                      en: '',
                    },
                  )}
            </Heading>
            <Text as='span' variant='muted'>
              {filtered.length} {tt('propertiesCount')}
            </Text>
          </div>

          {filtered.length === 0 ? (
            <motion.div
              variants={fadeUp}
              initial='hidden'
              animate='visible'
              className='rounded-2xl border border-dashed border-gray-200 py-24 text-center'
            >
              <Text className='text-lg font-semibold'>{tt('noResults')}</Text>
              <Text variant='muted' className='mt-1'>
                {tt('noResultsHint')}
              </Text>
              <Button
                variant='outline'
                size='sm'
                onClick={clearAllFilters}
                className='mx-auto mt-4'
              >
                <XIcon className='h-3.5 w-3.5' />
                {tt('clearFilters')}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              layout
              className='grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            >
              <AnimatePresence mode='popLayout'>
                {filtered.map((l) => (
                  <UnitCard
                    key={l.id}
                    unit={l}
                    compared={compareIds.includes(l.id)}
                    onCompareToggle={toggleCompare}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </main>

        {/* באנר העוזר החכם — מוביל לעמוד ה-AI */}

        {/* CTA banner */}
        <section className='mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8'>
          <motion.div
            variants={fadeUp}
            initial='hidden'
            whileInView='visible'
            viewport={viewportOnce}
            className='relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl bg-linear-to-l from-primary-500 to-accent-400 px-8 py-12 text-center text-white sm:flex-row sm:justify-between sm:text-right'
          >
            <FloatingBlob
              className='-bottom-20 -left-20 h-64 w-64 bg-white/15'
              duration={12}
            />
            <div className='relative'>
              <Heading level={2} size='lg' className='text-white'>
                {tt('ctaTitle')}
              </Heading>
              <Text className='mt-2 text-primary-50'>{tt('ctaText')}</Text>
            </div>
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className='relative shrink-0'
            >
              <Button variant='white' size='lg' className='font-bold'>
                {tt('ctaButton')}
              </Button>
            </motion.div>
          </motion.div>
        </section>

        <SiteFooter />

        {/* ---------- סרגל השוואה צף (פרק 3.1) ---------- */}
        <AnimatePresence>
          {compareIds.length > 0 && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className='fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-gray-900 px-4 py-2.5 text-white shadow-xl'
            >
              <div className='flex items-center'>
                {listings
                  .filter((l) => compareIds.includes(l.id))
                  .map((l, i) => (
                    <img
                      key={l.id}
                      src={l.gallery?.[0]?.url}
                      alt={t(l.title)}
                      className={cn(
                        'h-8 w-8 rounded-full border-2 border-gray-900 object-cover',
                        i > 0 && '-ms-3',
                      )}
                    />
                  ))}
              </div>
              <span className='text-sm font-medium'>
                {compareIds.length} {tt('compareSelected')}
              </span>
              <Button
                size='sm'
                variant='white'
                disabled={compareIds.length < 2}
                onClick={() => setCompareOpen(true)}
              >
                {tt('compareCta')}
              </Button>
              <button
                type='button'
                onClick={() => setCompareIds([])}
                className='text-xs text-gray-300 transition hover:text-white'
              >
                {tt('compareClear')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <CompareModal
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          ids={compareIds}
          listings={listings}
        />
      </div>
    </MotionConfig>
  )
}

/* ---------- מודל השוואת דירות (פרק 3.1) ---------- */

function CompareModal({
  open,
  onClose,
  ids,
  listings,
}: {
  open: boolean
  onClose: () => void
  ids: string[]
  listings: Unit[]
}) {
  const { t, tt } = useLocale()
  const items = listings.filter((l) => ids.includes(l.id))

  const rows: {
    label: string
    render: (l: (typeof items)[number]) => React.ReactNode
  }[] = [
    {
      label: tt('colPrice'),
      render: (l) => (
        <span className='font-bold text-gray-900'>
          {l.price ? (
            <Price value={l.price.amount} currency={l.price.currency} />
          ) : (
            tt('contactForPrice')
          )}
        </span>
      ),
    },
    {
      label: tt('comparePerSqm'),
      render: (l) =>
        l.price ? Math.round(l.price.amount / l.sqm).toLocaleString() : '—',
    },
    { label: tt('colRooms'), render: (l) => l.rooms },
    { label: tt('colSqm'), render: (l) => l.sqm },
    { label: tt('compareFloor'), render: (l) => l.floor ?? '—' },
    { label: tt('compareCity'), render: (l) => l.address.city },
    {
      label: tt('compareDealType'),
      render: (l) => (l.dealType === 'sale' ? tt('forSale') : tt('forRent')),
    },
    {
      label: tt('compareFeatures'),
      render: (l) =>
        l.features
          .slice(0, 4)
          .map((f) => t(f))
          .join(' · ') || '—',
    },
  ]

  return (
    <Modal open={open} onClose={onClose} title={tt('compareTitle')}>
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr>
              <th className='w-28 px-2 py-2' />
              {items.map((l) => (
                <th key={l.id} className='px-2 py-2 text-start align-top'>
                  <img
                    src={l.gallery?.[0]?.url}
                    alt={t(l.title)}
                    className='mb-2 h-20 w-full rounded-lg object-cover'
                  />
                  <TextLink href={`/property/${l.id}`} className='text-sm'>
                    {t(l.title)}
                  </TextLink>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className='border-t border-gray-100'>
                <td className='px-2 py-2.5 text-xs font-medium text-gray-400'>
                  {row.label}
                </td>
                {items.map((l) => (
                  <td key={l.id} className='px-2 py-2.5 text-gray-700'>
                    {row.render(l)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}
