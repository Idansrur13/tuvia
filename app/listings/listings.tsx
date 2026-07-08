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
import {
  CATEGORIES,
  DEAL_TYPE_OPTIONS,
  IMG,
  LISTINGS,
  type DealType,
} from './data'
import { ListingCard } from './listing-card'

/* ---------- Data ---------- */

const HERO_STATS = [
  { value: 1240, suffix: '+', label: 'נכסים פעילים' },
  { value: 15, suffix: '', label: 'מדינות בעולם' },
  { value: 320, suffix: '+', label: 'פרויקטים של קבלנים' },
  { value: 98, suffix: '%', label: 'לקוחות מרוצים' },
] as const

/* ---------- Components ---------- */

function SearchBar({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <div
      className={`flex items-center rounded-full border border-gray-200 bg-white py-1.5 pr-5 pl-2 shadow-sm transition hover:shadow-md focus-within:shadow-md ${className ?? ''}`}
    >
      <input
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='חיפוש לפי עיר, שכונה או תיאור...'
        className='w-full bg-transparent text-sm outline-none placeholder:text-gray-400'
      />
      <IconButton aria-label='חיפוש'>
        <SearchIcon className='h-4 w-4' />
      </IconButton>
    </div>
  )
}

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
    category: string,
    dealType: DealType | 'all',
  ) => void
}) {
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('הכל')
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
        <Field label='עיר או שכונה'>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder='למשל: תל אביב'
          />
        </Field>
        <Field label='סוג נכס'>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label='סוג עסקה'>
          <Select
            value={dealType}
            onChange={(e) => setDealType(e.target.value as DealType | 'all')}
          >
            {DEAL_TYPE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Button
          type='submit'
          className='flex h-10 items-center justify-center gap-2 sm:col-span-2 lg:col-span-1'
        >
          <SearchIcon className='h-4 w-4' />
          חיפוש
        </Button>
      </div>
    </form>
  )
}

const HERO_AVATARS = [
  { imgUrl: 'public/dd.avif' },
  { imgUrl: 'public/IMG_7359.jpg' },
  { imgUrl: 'public/ff.avif' },
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

export function Listings() {
  const [category, setCategory] = useState<string>('הכל')
  const [dealType, setDealType] = useState<DealType | 'all'>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () =>
      LISTINGS.filter((l) => {
        if (category !== 'הכל' && l.category !== category) return false
        if (dealType !== 'all' && l.dealType !== dealType) return false
        if (query) {
          const q = query.trim()
          return (
            l.city.includes(q) ||
            l.neighborhood.includes(q) ||
            l.title.includes(q)
          )
        }
        return true
      }),
    [category, dealType, query],
  )

  const handleHeroSearch = (q: string, cat: string, deal: DealType | 'all') => {
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
        <motion.header
          variants={fadeDown}
          initial='hidden'
          animate='visible'
          className='sticky top-0  z-30 border-b border-gray-100 bg-white/90 backdrop-blur-md '
        >
          <div className='mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8'>
            <Logo />

            <div className='hidden flex-1 justify-center md:flex'>
              <SearchBar
                value={query}
                onChange={setQuery}
                className='w-full max-w-xl'
              />
            </div>

            <nav className='flex items-center gap-2'>
              <TextLink
                href='/dashboard'
                variant='nav'
                className='hidden lg:block'
              >
                אזור קבלנים
              </TextLink>
              <Button>התחברות</Button>
            </nav>
          </div>

          {/* Mobile search */}
          <div className='px-4 pb-3 md:hidden'>
            <SearchBar value={query} onChange={setQuery} />
          </div>
        </motion.header>

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
                    הבית הבא שלכם{' '}
                    <span className='relative inline-block whitespace-nowrap text-primary-600'>
                      מתחיל כאן
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
                    נכסים נבחרים למכירה ולהשכרה, ישירות מהקבלנים המובילים — מתל
                    אביב ועד מיאמי, בליווי אישי לאורך כל הדרך.
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
                    4.9 · מעל 1,200 רוכשים מצאו בית דרכנו
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
                <motion.div key={stat.label} variants={fadeUp}>
                  <dt className='text-2xl font-extrabold text-gray-900 sm:text-3xl'>
                    <CountUp to={stat.value} suffix={stat.suffix} />
                  </dt>
                  <dd>
                    <Text as='span' variant='muted'>
                      {stat.label}
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
            {CATEGORIES.map((c) => (
              <motion.div key={c.name} variants={fadeDown}>
                <Chip
                  icon={c.icon}
                  active={category === c.name}
                  onClick={() => setCategory(c.name)}
                >
                  {c.name}
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
              {category === 'הכל' ? 'נכסים מובילים' : category}
            </Heading>
            <div className='flex items-center gap-3'>
              <ToggleGroup
                options={DEAL_TYPE_OPTIONS}
                value={dealType}
                onChange={setDealType}
              />
              <Text as='span' variant='muted' className='hidden sm:block'>
                {filtered.length} נכסים
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
              <Text className='text-lg font-semibold'>
                לא נמצאו נכסים מתאימים
              </Text>
              <Text variant='muted' className='mt-1'>
                נסו לשנות את הסינון או את מילות החיפוש
              </Text>
            </motion.div>
          ) : (
            <motion.div
              layout
              className='grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            >
              <AnimatePresence mode='popLayout'>
                {filtered.map((l) => (
                  <ListingCard key={l.id} listing={l} />
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
                יש לכם נכס למכירה?
              </Heading>
              <Text className='mt-2 text-primary-50'>
                קבלו הערכת שווי חינם ושיווק מקצועי שימכור את הנכס שלכם מהר יותר.
              </Text>
            </div>
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className='relative shrink-0'
            >
              <Button variant='white' size='lg' className='font-bold'>
                לקבלת הערכת שווי
              </Button>
            </motion.div>
          </motion.div>
        </section>

        <SiteFooter />
      </div>
    </MotionConfig>
  )
}
