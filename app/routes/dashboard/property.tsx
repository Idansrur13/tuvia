/*
 * עמוד נכס בדשבורד — תצוגה אחת, שני תפקידים (פרקים 5–6):
 * החלק העליון (גלריה, פרטים, מאפיינים) משותף; הפאנל התחתון מתחלף לפי תפקיד —
 * קבלן: מלאי הפרויקט, התקדמות מכירות והיסטוריית מחירים.
 * מתווך: סיורים בנכס, עמלה משוערת ופעולות שיווק.
 * שניהם רואים את הלידים שמתעניינים בנכס.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { Route } from './+types/property'
import {
  ArrowUpRightIcon,
  BedDoubleIcon,
  BuildingIcon,
  CalendarDaysIcon,
  CarIcon,
  ExternalLinkIcon,
  FlameIcon,
  HammerIcon,
  KeyRoundIcon,
  LayersIcon,
  RulerIcon,
  Share2Icon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react'
import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  Heading,
  PageHeader,
  StatCard,
  Text,
} from '../../components/ui'
import {
  LEADS,
  LEAD_HEAT_META,
  LEAD_STAGE_META,
  UNIT_STATUS_META,
  USERS,
  VIEWINGS,
  VIEWING_STATUS_META,
  formatMoney,
  leadById,
  listingById,
  projectById,
} from '~/data'
import type { Lead, Listing, Project, Unit } from '~/types'
import { useLocale } from '~/i18n/locale'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'נכס | Property' }]
}

export async function loader({ params }: Route.LoaderArgs) {
  const listing = listingById(params.id) ?? null
  const project = listing?.projectId
    ? (projectById(listing.projectId) ?? null)
    : null
  return { listing, project }
}

type DashRole = 'contractor' | 'seller'

/** לידים שמתעניינים בנכס — לפי היחידה או הפרויקט המקושרים. */
const leadsForListing = (listing: Listing): Lead[] =>
  LEADS.filter(
    (l) =>
      (listing.unitId && l.unitId === listing.unitId) ||
      (listing.projectId && l.projectId === listing.projectId),
  ).slice(0, 6)

/* ---------- גלריה ---------- */

function Gallery({ listing }: { listing: Listing }) {
  const { t } = useLocale()
  const [active, setActive] = useState(0)
  const img = listing.images[active] ?? listing.images[0]

  return (
    <div className='space-y-2'>
      <div className='relative overflow-hidden rounded-2xl'>
        <img
          src={img?.url}
          alt={t(listing.title)}
          className='h-72 w-full object-cover sm:h-96'
        />
        <div className='absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/50 to-transparent' />
        <div className='absolute inset-s-3 top-3 flex gap-2'>
          {listing.badge && <Badge variant='overlay'>{t(listing.badge)}</Badge>}
          <Badge variant='overlay'>
            {listing.dealType === 'sale' ? '🏷️' : '🔑'}{' '}
            {listing.dealType === 'sale' ? 'למכירה' : 'להשכרה'}
          </Badge>
        </div>
      </div>
      {listing.images.length > 1 && (
        <div className='flex gap-2 overflow-x-auto pb-1 scrollbar-none'>
          {listing.images.map((im, i) => (
            <button
              key={im.id}
              type='button'
              onClick={() => setActive(i)}
              className={
                i === active
                  ? 'shrink-0 rounded-xl ring-2 ring-primary-500 ring-offset-2'
                  : 'shrink-0 rounded-xl opacity-70 transition hover:opacity-100'
              }
            >
              <img
                src={im.url}
                alt=''
                className='h-16 w-24 rounded-xl object-cover'
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- שורת פרטים ---------- */

export function DetailTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className='flex items-center gap-3 rounded-xl bg-gray-50 p-3'>
      <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600'>
        {icon}
      </span>
      <div className='min-w-0'>
        <Text as='p' variant='small'>
          {label}
        </Text>
        <p className='truncate text-sm font-semibold text-gray-900'>{value}</p>
      </div>
    </div>
  )
}

/* ---------- לידים מתעניינים (משותף) ---------- */

function InterestedLeads({ leads }: { leads: Lead[] }) {
  const { t, tt, locale } = useLocale()
  return (
    <Card className='p-0'>
      <div className='flex items-center gap-2 border-b border-gray-100 p-4'>
        <UsersIcon className='h-4 w-4 text-primary-500' />
        <Heading level={3} size='md'>
          {tt('propInterestedLeads')}
        </Heading>
        <Badge>{leads.length}</Badge>
      </div>
      {leads.length === 0 ? (
        <div className='p-4'>
          <EmptyState
            title={tt('propNoLeads')}
            icon={<UsersIcon className='h-5 w-5' />}
          />
        </div>
      ) : (
        <ul className='divide-y divide-gray-50'>
          {leads.map((lead) => {
            const heat = LEAD_HEAT_META[lead.heat]
            const stage = LEAD_STAGE_META[lead.stage]
            return (
              <li
                key={lead.id}
                className='flex flex-wrap items-center gap-3 p-3 transition hover:bg-gray-50/60'
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${heat.dot}`}
                  title={t(heat.label)}
                />
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-semibold text-gray-900'>
                    {lead.countryCode ? `${lead.name}` : lead.name}
                  </p>
                  <Text as='p' variant='small'>
                    {lead.budget
                      ? `${tt('budget')}: ${formatMoney(lead.budget, locale)}`
                      : (lead.email ?? lead.phone ?? '')}
                  </Text>
                </div>
                {lead.heat === 'hot' && (
                  <FlameIcon className='h-4 w-4 text-red-500' />
                )}
                <Badge variant='neutral'>{t(stage.label)}</Badge>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

/* ---------- פאנל קבלן ---------- */

function ContractorPanel({
  listing,
  project,
}: {
  listing: Listing
  project: Project | null
}) {
  const { t, tt, locale, formatDate } = useLocale()
  if (!project) return null

  const sold = project.units.filter((u) => u.status === 'sold').length
  const percent = project.units.length
    ? Math.round((sold / project.units.length) * 100)
    : 0
  const linkedUnit: Unit | undefined = project.units.find(
    (u) => u.id === listing.unitId,
  )

  return (
    <div className='space-y-4'>
      {/* התקדמות מכירות */}
      <Card>
        <div className='mb-2 flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <TrendingUpIcon className='h-4 w-4 text-primary-500' />
            <Heading level={3} size='md'>
              {tt('propSalesProgress')}
            </Heading>
          </div>
          <Link to='/dashboard'>
            <Button size='sm' variant='outline'>
              {tt('propGoToProject')}
              <ArrowUpRightIcon className='ms-1 inline h-3.5 w-3.5' />
            </Button>
          </Link>
        </div>
        <div className='mb-1 flex justify-between text-xs text-gray-500'>
          <span>
            {tt('soldOfUnits')} {sold}/{project.units.length} {tt('ofUnits')}
          </span>
          <span className='font-semibold text-primary-600'>{percent}%</span>
        </div>
        <div className='h-2 overflow-hidden rounded-full bg-gray-100'>
          <div
            className='h-full rounded-full bg-linear-to-l from-primary-500 to-accent-400'
            style={{ width: `${percent}%` }}
          />
        </div>
      </Card>

      {/* מלאי הפרויקט */}
      <Card className='p-0'>
        <div className='flex items-center gap-2 border-b border-gray-100 p-4'>
          <BuildingIcon className='h-4 w-4 text-primary-500' />
          <Heading level={3} size='md'>
            {tt('propProjectInventory')}
          </Heading>
          <Text as='span' variant='small'>
            {t(project.name)}
          </Text>
        </div>
        <ul className='max-h-72 divide-y divide-gray-50 overflow-y-auto'>
          {project.units.map((unit) => {
            const meta = UNIT_STATUS_META[unit.status]
            return (
              <li
                key={unit.id}
                className={`flex items-center gap-3 p-3 ${
                  unit.id === listing.unitId ? 'bg-primary-50/50' : ''
                }`}
              >
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-semibold text-gray-900'>
                    {unit.name}
                  </p>
                  <Text as='p' variant='small'>
                    {unit.rooms} {tt('colRooms')} · {unit.sqm} {tt('colSqm')}
                  </Text>
                </div>
                <p className='whitespace-nowrap text-sm font-semibold text-gray-900'>
                  {formatMoney(unit.price, locale)}
                </p>
                <Badge variant={meta.badge}>{t(meta.label)}</Badge>
              </li>
            )
          })}
        </ul>
      </Card>

      {/* היסטוריית מחירים של היחידה המקושרת */}
      <Card>
        <div className='mb-3 flex items-center gap-2'>
          <LayersIcon className='h-4 w-4 text-primary-500' />
          <Heading level={3} size='md'>
            {tt('propPriceHistory')}
          </Heading>
        </div>
        {linkedUnit?.priceHistory?.length ? (
          <ul className='space-y-2'>
            {linkedUnit.priceHistory.map((ch, i) => (
              <li
                key={i}
                className='flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm'
              >
                <span className='text-gray-500'>{formatDate(ch.at)}</span>
                <span>
                  <span className='text-gray-400 line-through'>
                    {formatMoney(ch.from, locale)}
                  </span>{' '}
                  <span className='font-semibold text-gray-900'>
                    {formatMoney(ch.to, locale)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Text variant='muted'>{tt('propNoPriceChanges')}</Text>
        )}
      </Card>
    </div>
  )
}

/* ---------- פאנל מתווך ---------- */

function SellerPanel({ listing }: { listing: Listing }) {
  const { t, tt, locale, formatDate, formatTime } = useLocale()
  const [copied, setCopied] = useState(false)

  const viewings = VIEWINGS.filter(
    (v) =>
      v.listingId === listing.id ||
      (listing.unitId && v.unitId === listing.unitId),
  ).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))

  const commission =
    listing.dealType === 'sale'
      ? {
          amount: Math.round(listing.price.amount * 0.02),
          currency: listing.price.currency,
        }
      : { amount: listing.price.amount, currency: listing.price.currency }

  const share = async () => {
    try {
      await navigator.clipboard.writeText(
        `${location.origin}/property/${listing.id}`,
      )
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      /* דפדפן ללא clipboard — מתעלמים בדמו */
    }
  }

  return (
    <div className='space-y-4'>
      {copied && <Banner variant='success'>{tt('propLinkCopied')}</Banner>}

      {/* עמלה + פעולות */}
      <StatCard
        label={tt('propEstCommission')}
        value={formatMoney(commission, locale)}
        hint={tt('propCommissionHint')}
        icon={<KeyRoundIcon className='h-5 w-5' />}
      />
      <Card className='flex flex-wrap items-center gap-2'>
        <Button size='sm' onClick={share}>
          <Share2Icon className='me-1.5 inline h-4 w-4' />
          {tt('propShare')}
        </Button>
        <Link to={`/property/${listing.id}`}>
          <Button size='sm' variant='outline'>
            <ExternalLinkIcon className='me-1.5 inline h-4 w-4' />
            {tt('propViewPublic')}
          </Button>
        </Link>
        <Link to='/dashboard/seller/viewings'>
          <Button size='sm' variant='outline'>
            <CalendarDaysIcon className='me-1.5 inline h-4 w-4' />
            {tt('propScheduleViewing')}
          </Button>
        </Link>
      </Card>

      {/* סיורים בנכס */}
      <Card className='p-0'>
        <div className='flex items-center gap-2 border-b border-gray-100 p-4'>
          <CalendarDaysIcon className='h-4 w-4 text-primary-500' />
          <Heading level={3} size='md'>
            {tt('propViewings')}
          </Heading>
          <Badge>{viewings.length}</Badge>
        </div>
        {viewings.length === 0 ? (
          <div className='p-4'>
            <EmptyState
              title={tt('propNoViewings')}
              icon={<CalendarDaysIcon className='h-5 w-5' />}
            />
          </div>
        ) : (
          <ul className='divide-y divide-gray-50'>
            {viewings.map((v) => {
              const lead = leadById(v.leadId)
              return (
                <li key={v.id} className='flex items-center gap-3 p-3'>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-semibold text-gray-900'>
                      {lead?.name ?? v.leadId}
                    </p>
                    <Text as='p' variant='small'>
                      {formatDate(v.scheduledAt)} · {formatTime(v.scheduledAt)}
                      {v.note ? ` · ${v.note}` : ''}
                    </Text>
                  </div>
                  <Badge variant={VIEWING_STATUS_META[v.status].badge}>
                    {t(VIEWING_STATUS_META[v.status].label)}
                  </Badge>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

/* ---------- העמוד ---------- */

export default function DashboardProperty({
  loaderData,
}: Route.ComponentProps) {
  const { t, tt, locale } = useLocale()
  const { listing, project } = loaderData

  /* התפקיד נשמר ע"י פריסת הדשבורד — עד שיחובר auth. */
  const [role, setRole] = useState<DashRole>('contractor')
  useEffect(() => {
    const saved = localStorage.getItem('dashRole')
    if (saved === 'seller' || saved === 'contractor') setRole(saved)
  }, [])

  if (!listing) {
    return (
      <EmptyState
        title={tt('propNotFound')}
        description={tt('propNotFoundHint')}
        icon={<BuildingIcon className='h-5 w-5' />}
      />
    )
  }

  const agent = USERS.find((u) => u.id === listing.agentId)
  const perSqm = listing.sqm
    ? Math.round(listing.price.amount / listing.sqm)
    : 0
  const leads = leadsForListing(listing)

  return (
    <div className='space-y-6'>
      <PageHeader
        title={t(listing.title)}
        subtitle={`${listing.address.country.flag} ${listing.address.city}${
          listing.address.neighborhood
            ? `, ${listing.address.neighborhood}`
            : ''
        }${listing.address.street ? ` · ${listing.address.street}` : ''}`}
        icon={<BuildingIcon className='h-5 w-5' />}
      />

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* עמודה ראשית — גלריה ופרטים */}
        <div className='space-y-4 lg:col-span-2'>
          <Card className='p-3'>
            <Gallery listing={listing} />
          </Card>

          {/* מחיר */}
          <Card className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <Text as='p' variant='small'>
                {tt('propAskedPrice')}
              </Text>
              <p className='text-3xl font-extrabold tracking-tight text-gray-900'>
                {formatMoney(listing.price, locale)}
              </p>
            </div>
            {perSqm > 0 && (
              <Badge variant='neutral'>
                {tt('comparePerSqm')}:{' '}
                {formatMoney(
                  { amount: perSqm, currency: listing.price.currency },
                  locale,
                )}
              </Badge>
            )}
          </Card>

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

          <InterestedLeads leads={leads} />
        </div>

        {/* עמודה צדדית — פאנל לפי תפקיד */}
        <div className='space-y-4'>
          {/* אחראי על הנכס */}
          {agent && (
            <Card className='flex items-center gap-3'>
              <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-accent-400 font-bold text-white'>
                {agent.name.slice(0, 2)}
              </span>
              <div className='min-w-0'>
                <Text as='p' variant='small'>
                  {tt('propAgentInCharge')}
                </Text>
                <p className='truncate text-sm font-semibold text-gray-900'>
                  {agent.name}
                </p>
              </div>
            </Card>
          )}

          {role === 'contractor' ? (
            <ContractorPanel listing={listing} project={project} />
          ) : (
            <SellerPanel listing={listing} />
          )}
        </div>
      </div>
    </div>
  )
}
