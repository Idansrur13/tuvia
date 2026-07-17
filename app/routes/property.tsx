import { useState } from 'react'
import { Link, data, useParams } from 'react-router'
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
import { UnitCard } from '../listings/unit-card'

import {
  ArrowRightIcon,
  BedDoubleIcon,
  BuildingIcon,
  CalendarIcon,
  CarIcon,
  CheckIcon,
  ChevronLeft,
  ChevronRight,
  HammerIcon,
  HeartIcon,
  KeyRoundIcon,
  LayersIcon,
  MapPinIcon,
  MaximizeIcon,
  PhoneIcon,
  RulerIcon,
  Share2Icon,
  XIcon,
} from 'lucide-react'
import { LISTING_CATEGORIES } from '~/data'
import {
  organizationById,
  projectById,
  sameProjectUnits,
  similarUnits,
  unitById,
  userById,
} from '~/server/queries.server'
import type { MediaAsset, Organization, Unit, User } from '~/types'
import { useLocale } from '~/i18n/locale'
// import LogIn from '~/components/premisions/logIn'
import { Header } from '~/components/premisions/header'
import { DetailTile } from './dashboard/property'

export function meta({ matches }: Route.MetaArgs) {
  const match = matches.find((m) => m?.id === 'routes/property')
  const listing = (match?.loaderData as { listing?: Unit } | undefined)
    ?.listing
  return [
    {
      title: listing ? `${listing.title.he} | תכלת נדל״ן` : 'תכלת נדל״ן',
    },
    {
      name: 'description',
      content: listing?.description.he.slice(0, 150) ?? '',
    },
  ]
}

export async function loader({ params }: Route.LoaderArgs) {
  const listing = await unitById(params.id)
  if (!listing) throw data('הנכס לא נמצא', { status: 404 })

  const fromProject = await sameProjectUnits(listing)
  const similar = await similarUnits(
    listing,
    fromProject.map((l) => l.id),
  )

  // נתוני צד — פרויקט, סוכן וארגון (לאנונימיות קבלנים) נטענים בשרת
  const project = listing.projectId
    ? await projectById(listing.projectId)
    : undefined
  const agent = await userById(listing.agentId)
  const organization = agent?.organizationId
    ? await organizationById(agent.organizationId)
    : undefined

  return { listing, fromProject, similar, project, agent, organization }
}

/* ---------- קומפוננטות משנה ---------- */

function Lightbox({
  images,
  index,
  onClose,
  onIndex,
}: {
  images: MediaAsset[]
  index: number
  onClose: () => void
  onIndex: (i: number) => void
}) {
  const { tt } = useLocale()
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
        aria-label={tt('imgClose')}
        className='absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20'
      >
        <XIcon className='h-5 w-5' />
      </button>

      <motion.img
        key={index}
        src={images[index].url}
        alt={images[index].name}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className='max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl'
      />

      <button
        type='button'
        aria-label={tt('imgPrev')}
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
        aria-label={tt('imgNext')}
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

function ContactCard({
  listing,
  agent,
  organization,
}: {
  listing: Unit
  agent?: User
  organization?: Organization
}) {
  const { tt } = useLocale()
  const [sent, setSent] = useState(false)
  /*
   * אנונימיות קבלנים (פרק 17): באזור הציבורי קבלן מוצג כמספר/כינוי
   * בלבד, ללא שם וללא טלפון ישיר. הקשר נוצר דרך השארת ליד.
   */
  const isContractor = listing.agentRole === 'contractor'
  const contractorAlias = organization?.alias
  const agentName = isContractor
    ? `${tt('roleContractor')} ${contractorAlias ?? ''}`.trim()
    : (agent?.name ?? tt('roleAgent'))
  const perSqm = listing.price
    ? Math.round(listing.price.amount / listing.sqm)
    : undefined

  return (
    <Card className='sticky top-24 space-y-5 shadow-lg shadow-primary-500/5'>
      {/* Price */}
      <div>
        <div className='flex items-baseline justify-between gap-2'>
          <p className='text-3xl font-extrabold text-gray-900'>
            {listing.price ? formatPrice(listing.price) : tt('contactForPrice')}
            {listing.dealType === 'rent' && (
              <span className='text-base font-normal text-gray-500'>
                {' '}
                / {tt('perMonth')}
              </span>
            )}
          </p>
          <Badge variant={listing.dealType === 'sale' ? 'primary' : 'success'}>
            {listing.dealType === 'sale' ? tt('forSale') : tt('forRent')}
          </Badge>
        </div>
        {listing.dealType === 'sale' && perSqm != null && (
          <Text variant='small' className='mt-1'>
            {perSqm} {tt('perSqm')}
          </Text>
        )}
      </div>

      {/* Agent */}
      <div className='flex items-center gap-3 rounded-xl bg-gray-50 p-3'>
        <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-500 font-bold text-white'>
          {agentName.slice(0, 1)}
        </span>
        <div className='min-w-0 flex-1'>
          <p className='text-sm font-semibold text-gray-900'>{agentName}</p>
          <Text as='p' variant='small'>
            {listing.agentRole === 'contractor'
              ? tt('roleContractor')
              : tt('roleAgent')}{' '}
            · {tt('brandName')}
          </Text>
        </div>
        {!isContractor && (
          <a
            href={`tel:${agent?.phone ?? ''}`}
            aria-label={tt('callAgent')}
            className='flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary-600 shadow-sm transition hover:bg-primary-50'
          >
            <PhoneIcon className='h-4 w-4' />
          </a>
        )}
      </div>

      {/* Form */}
      {sent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className='rounded-xl bg-success-50 px-4 py-5 text-center'
        >
          <p className='font-bold text-success-700'>{tt('detailsSent')}</p>
          <Text variant='small' className='mt-1'>
            {agentName} {tt('agentWillContact')}
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
          <Field label={tt('fullName')}>
            <Input
              name='name'
              required
              placeholder={tt('fullNamePlaceholder')}
            />
          </Field>
          <Field label={tt('phone')}>
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
            {tt('scheduleViewing')}
          </Button>
          <Text as='p' variant='small' className='text-center'>
            {tt('noObligation')}
          </Text>
        </form>
      )}
    </Card>
  )
}

function UnitsRow({
  title,
  subtitle,
  listings,
}: {
  title: string
  subtitle?: string
  listings: Unit[]
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
          <UnitCard key={l.id} unit={l} />
        ))}
      </motion.div>
    </section>
  )
}

/* ---------- העמוד ---------- */

export default function PropertyPage({ loaderData }: Route.ComponentProps) {
  const { t, tt } = useLocale()
  const { listing, fromProject, similar, project, agent, organization } =
    loaderData
  const projectName = project ? t(project.name) : ''
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [liked, setLiked] = useState(false)
  const [copied, setCopied] = useState(false)
  const images = listing.gallery ?? []
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
    { icon: BedDoubleIcon, label: tt('hlRooms'), value: String(listing.rooms) },
    {
      icon: MaximizeIcon,
      label: tt('hlArea'),
      value: `${listing.sqm} ${tt('colSqm')}`,
    },
    { icon: BuildingIcon, label: tt('hlFloor'), value: listing.floor ?? '—' },
    {
      icon: CarIcon,
      label: tt('hlParking'),
      value:
        (listing.parking ?? 0) > 0 ? String(listing.parking) : tt('hlNone'),
    },
    {
      icon: CalendarIcon,
      label: tt('hlEntry'),
      value:
        !listing.entry || listing.entry === 'flexible'
          ? tt('flexible')
          : listing.entry,
    },
  ]

  return (
    <MotionConfig reducedMotion='user'>
      <div className='min-h-screen bg-white'>
        {/* Header */}
        <Header />

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
              {tt('allProperties')}
            </Link>
            <span>/</span>
            <span>{listing.address.city}</span>
            <span>/</span>
            <span className='truncate text-gray-900'>{t(listing.title)}</span>
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
                  {t(listing.title)}
                </Heading>
                {listing.badge && <Badge>{t(listing.badge)}</Badge>}
              </div>
              <Text variant='muted' className='mt-1.5 flex items-center gap-1'>
                <MapPinIcon className='h-4 w-4 text-primary-500' />
                {[
                  listing.address.street,
                  listing.address.neighborhood,
                  listing.address.city,
                ]
                  .filter(Boolean)
                  .join(', ')}
                {projectName && ` · ${projectName}`}
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
                {copied ? tt('linkCopied') : tt('share')}
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
                {liked ? tt('saved') : tt('save')}
              </Button>
            </div>
          </motion.div>

          {/* Gallery */}
          {images.length > 0 && (
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
                src={images[0].url}
                alt={images[0].name}
                className='h-full max-h-110 w-full object-cover transition duration-500 group-hover:scale-[1.02]'
              />
            </button>
            {images.slice(1, 3).map((src, i) => (
              <button
                key={src.id}
                type='button'
                onClick={() => setLightbox(i + 1)}
                className='group relative'
              >
                <img
                  src={src.url}
                  alt={t(listing.title)}
                  className='h-full max-h-52 w-full object-cover transition duration-500 group-hover:scale-[1.03]'
                />
                {i === 1 && (
                  <span className='absolute inset-0 flex items-center justify-center bg-gray-900/30 text-sm font-semibold text-white opacity-0 transition group-hover:opacity-100'>
                    {tt('allPhotos')}
                  </span>
                )}
              </button>
            ))}
          </motion.div>
          )}

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
              {/* פרטי הנכס */}
              <Card>
                <Heading level={3} size='md' className='mb-3'>
                  {tt('propDetails')}
                </Heading>
                <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
                  <DetailTile
                    icon={<BedDoubleIcon className='h-4 w-4' />}
                    label={tt('colRooms')}
                    value={listing.rooms}
                  />
                  <DetailTile
                    icon={<RulerIcon className='h-4 w-4' />}
                    label={tt('colSqm')}
                    value={listing.sqm}
                  />
                  {listing.floor && (
                    <DetailTile
                      icon={<LayersIcon className='h-4 w-4' />}
                      label={tt('compareFloor')}
                      value={listing.floor}
                    />
                  )}
                  {listing.parking != null && (
                    <DetailTile
                      icon={<CarIcon className='h-4 w-4' />}
                      label={tt('propParking')}
                      value={listing.parking}
                    />
                  )}
                  {listing.yearBuilt && (
                    <DetailTile
                      icon={<HammerIcon className='h-4 w-4' />}
                      label={tt('propYearBuilt')}
                      value={listing.yearBuilt}
                    />
                  )}
                  {listing.entry && (
                    <DetailTile
                      icon={<KeyRoundIcon className='h-4 w-4' />}
                      label={tt('propEntry')}
                      value={
                        listing.entry === 'flexible'
                          ? tt('propEntryFlexible')
                          : new Date(listing.entry).getFullYear()
                      }
                    />
                  )}
                </div>

                {/* מאפיינים */}
                {listing.features.length > 0 && (
                  <div className='mt-4 flex flex-wrap gap-2'>
                    {listing.features.map((f, i) => (
                      <Badge key={i} variant='neutral'>
                        {t(f)}
                      </Badge>
                    ))}
                  </div>
                )}

                <Text variant='muted' className='mt-4'>
                  {t(listing.description)}
                </Text>
              </Card>

              {/* Description */}
              <motion.div variants={fadeUp}>
                <Heading level={2} size='md'>
                  {tt('aboutProperty')}
                </Heading>
                <Text variant='body' className='mt-3 leading-relaxed'>
                  {t(listing.description)}
                </Text>
                <Text variant='muted' className='mt-3'>
                  {tt('builtYear')}: {listing.yearBuilt} · {tt('categoryLabel')}
                  :{' '}
                  {t(
                    LISTING_CATEGORIES.find((c) => c.id === listing.category)
                      ?.label ?? { he: '', en: '' },
                  )}
                </Text>
              </motion.div>

              {/* Features */}
              <motion.div variants={fadeUp}>
                <Heading level={2} size='md'>
                  {tt('whatsIncluded')}
                </Heading>
                <ul className='mt-4 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2'>
                  {listing.features.map((feature, i) => (
                    <li
                      key={i}
                      className='flex items-center gap-2.5 text-sm text-gray-700'
                    >
                      <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600'>
                        <CheckIcon className='h-3 w-3' />
                      </span>
                      {t(feature)}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Location */}
              <motion.div variants={fadeUp}>
                <Heading level={2} size='md'>
                  {tt('location')}
                </Heading>
                <div className='mt-4 flex h-56 flex-col items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-linear-to-b from-primary-50 to-white'>
                  <span className='flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary-500 shadow-md'>
                    <MapPinIcon className='h-6 w-6' />
                  </span>
                  <p className='font-semibold text-gray-900'>
                    {[listing.address.street, listing.address.city]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <Text variant='small'>
                    {listing.address.neighborhood &&
                      `${tt('neighborhoodPrefix')} ${listing.address.neighborhood} · `}
                    {tt('exactLocationNote')}
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
              <ContactCard
                listing={listing}
                agent={agent}
                organization={organization}
              />
            </motion.aside>
          </div>

          {/* עוד מאותו פרויקט */}
          <UnitsRow
            title={`${tt('moreInProject')} ${projectName}`}
            subtitle={tt('moreInProjectSub')}
            listings={fromProject}
          />

          {/* נכסים דומים */}
          <UnitsRow title={tt('similarProperties')} listings={similar} />
        </main>

        <SiteFooter />

        {/* Lightbox */}
        <AnimatePresence>
          {lightbox !== null && (
            <Lightbox
              images={images}
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
