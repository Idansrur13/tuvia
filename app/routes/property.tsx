import { useState } from 'react'
import { Link, data } from 'react-router'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import type { Route } from './+types/property'
import {
  Badge,
  Button,
  Card,
  Field,
  Heading,
  IconButton,
  Input,
  Text,
  TextLink,
  cn,
  fadeUp,
  formatPrice,
  stagger,
  viewportOnce,
} from '../components/ui'
import { Logo } from '../components/logo'
import { SiteFooter } from '../components/site-footer'
import { ListingCard } from '../listings/listing-card'
import {
  listingById,
  sameProjectListings,
  similarListings,
  type Listing,
} from '../listings/data'
import {
  ArrowRightIcon,
  BedDoubleIcon,
  BuildingIcon,
  CalendarIcon,
  CarIcon,
  CheckIcon,
  ChevronLeft,
  ChevronRight,
  HeartIcon,
  MapPinIcon,
  MaximizeIcon,
  PhoneIcon,
  Share2Icon,
  XIcon,
} from 'lucide-react'

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: data ? `${data.listing.title} | תכלת נדל״ן` : 'תכלת נדל״ן' },
    { name: 'description', content: data?.listing.description.slice(0, 150) },
  ]
}

export async function loader({ params }: Route.LoaderArgs) {
  const listing = listingById(Number(params.id))
  if (!listing) throw data('הנכס לא נמצא', { status: 404 })

  const fromProject = sameProjectListings(listing)
  const similar = similarListings(
    listing,
    fromProject.map((l) => l.id),
  )
  return { listing, fromProject, similar }
}

/* ---------- קומפוננטות משנה ---------- */

function Lightbox({
  images,
  index,
  onClose,
  onIndex,
}: {
  images: string[]
  index: number
  onClose: () => void
  onIndex: (i: number) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 p-4'
      onClick={onClose}
    >
      <button
        type='button'
        aria-label='סגירה'
        className='absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20'
      >
        <XIcon className='h-5 w-5' />
      </button>

      <motion.img
        key={index}
        src={images[index]}
        alt=''
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className='max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl'
      />

      <button
        type='button'
        aria-label='תמונה קודמת'
        onClick={(e) => {
          e.stopPropagation()
          onIndex((index - 1 + images.length) % images.length)
        }}
        className='absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20'
      >
        <ChevronRight className='h-6 w-6' />
      </button>
      <button
        type='button'
        aria-label='תמונה הבאה'
        onClick={(e) => {
          e.stopPropagation()
          onIndex((index + 1) % images.length)
        }}
        className='absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20'
      >
        <ChevronLeft className='h-6 w-6' />
      </button>

      <div className='absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white'>
        {index + 1} / {images.length}
      </div>
    </motion.div>
  )
}

function ContactCard({ listing }: { listing: Listing }) {
  const [sent, setSent] = useState(false)
  const perSqm = Math.round(listing.price / listing.sqm)

  return (
    <Card className='sticky top-24 space-y-5 shadow-lg shadow-primary-500/5'>
      {/* Price */}
      <div>
        <div className='flex items-baseline justify-between gap-2'>
          <p className='text-3xl font-extrabold text-gray-900'>
            {formatPrice(listing.price)}
            {listing.dealType === 'rent' && (
              <span className='text-base font-normal text-gray-500'>
                {' '}
                / לחודש
              </span>
            )}
          </p>
          <Badge variant={listing.dealType === 'sale' ? 'primary' : 'success'}>
            {listing.dealType === 'sale' ? 'למכירה' : 'להשכרה'}
          </Badge>
        </div>
        {listing.dealType === 'sale' && (
          <Text variant='small' className='mt-1'>
            {formatPrice(perSqm)} למ״ר
          </Text>
        )}
      </div>

      {/* Agent */}
      <div className='flex items-center gap-3 rounded-xl bg-gray-50 p-3'>
        <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-500 font-bold text-white'>
          {listing.agent.slice(0, 1)}
        </span>
        <div className='min-w-0 flex-1'>
          <p className='text-sm font-semibold text-gray-900'>{listing.agent}</p>
          <Text as='p' variant='small'>
            סוכנ/ת מלווה · תכלת נדל״ן
          </Text>
        </div>
        <a
          href={`tel:${listing.agentPhone}`}
          aria-label='חיוג לסוכן'
          className='flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary-600 shadow-sm transition hover:bg-primary-50'
        >
          <PhoneIcon className='h-4 w-4' />
        </a>
      </div>

      {/* Form */}
      {sent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className='rounded-xl bg-success-50 px-4 py-5 text-center'
        >
          <p className='font-bold text-success-700'>הפרטים נשלחו!</p>
          <Text variant='small' className='mt-1'>
            {listing.agent} תחזור אליכם תוך שעות ספורות לתיאום סיור.
          </Text>
        </motion.div>
      ) : (
        <form
          className='space-y-3'
          onSubmit={(e) => {
            e.preventDefault()
            setSent(true)
          }}
        >
          <Field label='שם מלא'>
            <Input name='name' required placeholder='ישראל ישראלי' />
          </Field>
          <Field label='טלפון'>
            <Input
              name='phone'
              type='tel'
              required
              placeholder='050-0000000'
              dir='ltr'
              className='text-right'
            />
          </Field>
          <Button type='submit' className='w-full'>
            תיאום סיור בנכס
          </Button>
          <Text as='p' variant='small' className='text-center'>
            ללא התחייבות · המידע לא יועבר לגורם שלישי
          </Text>
        </form>
      )}
    </Card>
  )
}

function ListingsRow({
  title,
  subtitle,
  listings,
}: {
  title: string
  subtitle?: string
  listings: Listing[]
}) {
  if (listings.length === 0) return null
  return (
    <section className='mt-14'>
      <Heading level={2} size='md'>
        {title}
      </Heading>
      {subtitle && (
        <Text variant='muted' className='mt-1'>
          {subtitle}
        </Text>
      )}
      <motion.div
        variants={stagger}
        initial='hidden'
        whileInView='visible'
        viewport={viewportOnce}
        className='mt-5 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4'
      >
        {listings.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </motion.div>
    </section>
  )
}

/* ---------- העמוד ---------- */

export default function PropertyPage({ loaderData }: Route.ComponentProps) {
  const { listing, fromProject, similar } = loaderData
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [liked, setLiked] = useState(false)
  const [copied, setCopied] = useState(false)

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // דפדפן ללא הרשאת clipboard — מתעלמים בשקט
    }
  }

  const highlights = [
    { icon: BedDoubleIcon, label: 'חדרים', value: String(listing.rooms) },
    { icon: MaximizeIcon, label: 'שטח', value: `${listing.sqm} מ״ר` },
    { icon: BuildingIcon, label: 'קומה', value: listing.floor },
    {
      icon: CarIcon,
      label: 'חניות',
      value: listing.parking > 0 ? String(listing.parking) : 'ללא',
    },
    { icon: CalendarIcon, label: 'כניסה', value: listing.entry },
  ]

  return (
    <MotionConfig reducedMotion='user'>
      <div className='min-h-screen bg-white'>
        {/* Header */}
        <header className='sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-md'>
          <div className='mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8'>
            <Logo />
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
        </header>

        <main className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
          {/* Breadcrumb */}
          <motion.nav
            variants={fadeUp}
            initial='hidden'
            animate='visible'
            className='flex items-center gap-1.5 text-sm text-gray-500'
          >
            <Link
              to='/'
              className='flex items-center gap-1 transition hover:text-primary-600'
            >
              <ArrowRightIcon className='h-4 w-4' />
              כל הנכסים
            </Link>
            <span>/</span>
            <span>{listing.city}</span>
            <span>/</span>
            <span className='truncate text-gray-900'>{listing.title}</span>
          </motion.nav>

          {/* Title row */}
          <motion.div
            variants={fadeUp}
            initial='hidden'
            animate='visible'
            className='mt-4 flex flex-wrap items-start justify-between gap-3'
          >
            <div>
              <div className='flex flex-wrap items-center gap-2'>
                <Heading level={1} size='lg'>
                  {listing.title}
                </Heading>
                {listing.badge && <Badge>{listing.badge}</Badge>}
              </div>
              <Text variant='muted' className='mt-1.5 flex items-center gap-1'>
                <MapPinIcon className='h-4 w-4 text-primary-500' />
                {listing.address}, {listing.neighborhood}, {listing.city}
                {listing.project && ` · פרויקט ${listing.project}`}
              </Text>
            </div>

            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={share}
                className='flex items-center gap-1.5'
              >
                <Share2Icon className='h-4 w-4' />
                {copied ? 'הקישור הועתק!' : 'שיתוף'}
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setLiked((v) => !v)}
                className='flex items-center gap-1.5'
              >
                <HeartIcon
                  className={cn(
                    'h-4 w-4',
                    liked && 'fill-primary-500 stroke-primary-500',
                  )}
                />
                {liked ? 'נשמר' : 'שמירה'}
              </Button>
            </div>
          </motion.div>

          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className='mt-5 grid grid-cols-3 grid-rows-2 gap-2 overflow-hidden rounded-3xl'
          >
            <button
              type='button'
              onClick={() => setLightbox(0)}
              className='group relative col-span-2 row-span-2'
            >
              <img
                src={listing.images[0]}
                alt={listing.title}
                className='h-full max-h-110 w-full object-cover transition duration-500 group-hover:scale-[1.02]'
              />
            </button>
            {listing.images.slice(1, 3).map((src, i) => (
              <button
                key={src}
                type='button'
                onClick={() => setLightbox(i + 1)}
                className='group relative'
              >
                <img
                  src={src}
                  alt={listing.title}
                  className='h-full max-h-52 w-full object-cover transition duration-500 group-hover:scale-[1.03]'
                />
                {i === 1 && (
                  <span className='absolute inset-0 flex items-center justify-center bg-gray-900/30 text-sm font-semibold text-white opacity-0 transition group-hover:opacity-100'>
                    לכל התמונות
                  </span>
                )}
              </button>
            ))}
          </motion.div>

          {/* Content + sidebar */}
          <div className='mt-8 grid gap-8 lg:grid-cols-[1fr_380px]'>
            <motion.div
              variants={stagger}
              initial='hidden'
              animate='visible'
              className='space-y-8'
            >
              {/* Highlights */}
              <motion.div
                variants={fadeUp}
                className='grid grid-cols-2 gap-3 sm:grid-cols-5'
              >
                {highlights.map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className='rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5 text-center'
                  >
                    <Icon className='mx-auto h-5 w-5 text-primary-500' />
                    <p className='mt-1.5 font-bold text-gray-900'>{value}</p>
                    <Text as='p' variant='small'>
                      {label}
                    </Text>
                  </div>
                ))}
              </motion.div>

              {/* Description */}
              <motion.div variants={fadeUp}>
                <Heading level={2} size='md'>
                  על הנכס
                </Heading>
                <Text variant='body' className='mt-3 leading-relaxed'>
                  {listing.description}
                </Text>
                <Text variant='muted' className='mt-3'>
                  שנת בנייה: {listing.yearBuilt} · קטגוריה: {listing.category}
                </Text>
              </motion.div>

              {/* Features */}
              <motion.div variants={fadeUp}>
                <Heading level={2} size='md'>
                  מה יש בנכס
                </Heading>
                <ul className='mt-4 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2'>
                  {listing.features.map((feature) => (
                    <li
                      key={feature}
                      className='flex items-center gap-2.5 text-sm text-gray-700'
                    >
                      <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600'>
                        <CheckIcon className='h-3 w-3' />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Location */}
              <motion.div variants={fadeUp}>
                <Heading level={2} size='md'>
                  מיקום
                </Heading>
                <div className='mt-4 flex h-56 flex-col items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-linear-to-b from-primary-50 to-white'>
                  <span className='flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary-500 shadow-md'>
                    <MapPinIcon className='h-6 w-6' />
                  </span>
                  <p className='font-semibold text-gray-900'>
                    {listing.address}, {listing.city}
                  </p>
                  <Text variant='small'>
                    שכונת {listing.neighborhood} · המיקום המדויק יימסר בתיאום
                    סיור
                  </Text>
                </div>
              </motion.div>
            </motion.div>

            {/* Sidebar */}
            <motion.aside
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ContactCard listing={listing} />
            </motion.aside>
          </div>

          {/* עוד מאותו פרויקט */}
          <ListingsRow
            title={`עוד בפרויקט ${listing.project ?? ''}`}
            subtitle='נכסים נוספים שמשווקים כרגע באותו פרויקט'
            listings={fromProject}
          />

          {/* נכסים דומים */}
          <ListingsRow
            title='נכסים דומים שאולי יעניינו אתכם'
            listings={similar}
          />
        </main>

        <SiteFooter />

        {/* Lightbox */}
        <AnimatePresence>
          {lightbox !== null && (
            <Lightbox
              images={listing.images}
              index={lightbox}
              onClose={() => setLightbox(null)}
              onIndex={setLightbox}
            />
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
