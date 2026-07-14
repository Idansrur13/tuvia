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

import { Logo } from '../components/logo'
import { SiteFooter } from '../components/site-footer'
import { SearchIcon, StarIcon } from 'lucide-react'

import { ListingCard } from './listing-card'
import LogIn from '~/components/premisions/logIn'
import type { DealType, ListingCategory } from '~/types'
import { DEAL_TYPES, IMG, LISTINGS, LISTING_CATEGORIES } from '~/data'
import { useLocale } from '~/i18n/locale'
import { Header } from '~/components/premisions/header'

type CategoryFilter = 'all' | ListingCategory

/* ---------- Data ---------- */

const HERO_STATS = [
  { value: 1240, suffix: '+', labelKey: 'statActiveProperties' },
  { value: 15, suffix: '', labelKey: 'statCountries' },
  { value: 320, suffix: '+', labelKey: 'statProjects' },
  { value: 98, suffix: '%', labelKey: 'statSatisfied' },
] as const

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
    <span dir='ltr'>
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
  ) => void
}) {
  const { t, tt } = useLocale()
  const [city, setCity] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [dealType, setDealType] = useState<DealType | 'all'>('all')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSearch(city, category, dealType)
      }}
      className='rounded-2xl border border-white/70 bg-white/85 p-4 text-right shadow-xl shadow-primary-500/10 backdrop-blur-md'
    >
      <div className='grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto]'>
        <Field label={tt('cityOrArea')}>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={tt('cityExample')}
          />
        </Field>
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
        <Button
          type='submit'
          className='flex h-10 items-center justify-center gap-2 sm:col-span-2 lg:col-span-1'
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
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
      animate={{ y: [0, 28, 0], x: [0, -18, 0], scale: [1, 1.08, 1] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

/* ---------- Page ---------- */
function getListings() {
  return LISTINGS
}
export function Listings() {
  const { t, tt } = useLocale()

  const [category, setCategory] = useState<CategoryFilter>('all')
  const [dealType, setDealType] = useState<DealType | 'all'>('all')
  const [query, setQuery] = useState('')

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
      getListings().filter((l) => {
        if (category !== 'all' && l.category !== category) return false
        if (dealType !== 'all' && l.dealType !== dealType) return false
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
    [category, dealType, query],
  )

  const handleHeroSearch = (
    q: string,
    cat: CategoryFilter,
    deal: DealType | 'all',
  ) => {
    setQuery(q)
    setCategory(cat)
    setDealType(deal)
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
        <section className='relative overflow-hidden '>
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
                  <Heading level={1} size='xl' className='leading-[1.15] '>
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
                    className='mx-auto mt-5 max-w-xl lg:mx-0'
                  >
                    {tt('heroLead')}
                  </Text>
                </motion.div>

                <motion.div variants={fadeUp} className='mt-8'>
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
                <Floaty duration={7} className='absolute -bottom-8 -right-8'>
                  <img
                    src={IMG('photo-1600607687939-ce8a6c25118c')}
                    alt='עיצוב פנים'
                    className='h-36 w-52 rounded-2xl border-4 border-white object-cover shadow-xl'
                  />
                </Floaty>

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
                >
                  <Floaty duration={6} delay={1.2}>
                    <div className='rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur'>
                      <p
                        className='text-sm font-extrabold text-gray-900'
                        dir='ltr'
                      >
                        ₪4,950,000
                      </p>
                      <p className='text-[11px] text-gray-500'>
                        דירת 4 חד׳ · הצפון הישן, ת״א
                      </p>
                    </div>
                  </Floaty>
                </motion.div>
              </motion.div>
            </div>

            {/* Stats */}
            <motion.dl
              variants={stagger}
              initial='hidden'
              whileInView='visible'
              viewport={viewportOnce}
              className='mt-14 grid grid-cols-2 gap-6 rounded-3xl border border-white/70 bg-white/60 p-6 text-center backdrop-blur sm:grid-cols-4 sm:p-8'
            >
              {HERO_STATS.map((stat) => (
                <motion.div key={stat.labelKey} variants={fadeUp}>
                  <dt className='text-2xl font-extrabold text-gray-900 sm:text-3xl'>
                    <CountUp to={stat.value} suffix={stat.suffix} />
                  </dt>
                  <dd>
                    <Text as='span' variant='muted'>
                      {tt(stat.labelKey)}
                    </Text>
                  </dd>
                </motion.div>
              ))}
            </motion.dl>
          </div>
        </section>

        {/* Category chips */}
        <div className='sticky top-15.25 z-20 border-b border-gray-100  '>
          <motion.div
            variants={stagger}
            initial='hidden'
            animate='visible'
            className='mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8 scrollbar-none'
          >
            {LISTING_CATEGORIES.map((c) => (
              <motion.div key={c.id} variants={fadeDown}>
                <Chip
                  icon={c.icon}
                  active={category === c.id}
                  onClick={() => setCategory(c.id)}
                >
                  {t(c.label)}
                </Chip>
              </motion.div>
            ))}
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
            <div className='flex items-center gap-3'>
              <ToggleGroup
                options={DEAL_TYPES.map((d) => [d.id, t(d.label)] as const)}
                value={dealType}
                onChange={setDealType}
              />
              <Text as='span' variant='muted' className='hidden sm:block'>
                {filtered.length} {tt('propertiesCount')}
              </Text>
            </div>
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
            </motion.div>
          ) : (
            <motion.div
              layout
              className='grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            >
              <AnimatePresence mode='popLayout'>
                {filtered.map((l) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    compared={compareIds.includes(l.id)}
                    onCompareToggle={toggleCompare}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </main>

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
              className='fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-gray-900 px-5 py-2.5 text-white shadow-xl'
            >
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
}: {
  open: boolean
  onClose: () => void
  ids: string[]
}) {
  const { t, tt } = useLocale()
  const items = LISTINGS.filter((l) => ids.includes(l.id))

  const rows: {
    label: string
    render: (l: (typeof items)[number]) => React.ReactNode
  }[] = [
    {
      label: tt('colPrice'),
      render: (l) => (
        <span className='font-bold text-gray-900'>
          <Price value={l.price.amount} currency={l.price.currency} />
        </span>
      ),
    },
    {
      label: tt('comparePerSqm'),
      render: (l) => Math.round(l.price.amount / l.sqm).toLocaleString(),
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
                    src={l.images[0]?.url}
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
