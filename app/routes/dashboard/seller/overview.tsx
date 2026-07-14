import { useMemo } from 'react'
import { Link } from 'react-router'
import type { Route } from './+types/overview'
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  FunnelIcon,
  HandshakeIcon,
  MapPinIcon,
  PhoneIcon,
  RefreshCwIcon,
  TagIcon,
  WalletIcon,
} from 'lucide-react'
import {
  Badge,
  Card,
  EmptyState,
  Heading,
  StatCard,
  Text,
  cn,
} from '../../../components/ui'
import type { Viewing } from '~/types'
import {
  DEALS,
  LEADS,
  PROJECTS,
  RESERVATIONS,
  UNIT_STATUS_META,
  VIEWING_STATUS_META,
  formatMoney,
  leadById,
  listingById,
  unitById,
  viewingsFor,
} from '~/data'
import { useLocale } from '~/i18n/locale'

/** המוכרת המחוברת (עד שיהיה auth אמיתי). */
const CURRENT_SELLER_ID = 'u-michal'
const SELLER_NAME = 'מיכל'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'סקירת סוכן | Seller Overview' }]
}

const sameDay = (iso: string, ref: Date) =>
  new Date(iso).toDateString() === ref.toDateString()

/* פריט בפיד הסנכרון */
interface FeedItem {
  id: string
  at: string
  title: string
  desc: string
  tone: 'primary' | 'success' | 'warning'
  icon: typeof TagIcon
}

function ViewingRow({ viewing }: { viewing: Viewing }) {
  const { t, tt, formatTime } = useLocale()
  const lead = leadById(viewing.leadId)
  const unit = viewing.unitId ? unitById(viewing.unitId) : undefined
  const listing = viewing.listingId ? listingById(viewing.listingId) : undefined
  const propertyName = unit?.name ?? (listing ? t(listing.title) : '—')
  const meta = VIEWING_STATUS_META[viewing.status]

  return (
    <li className='flex items-center gap-3 px-4 py-3'>
      <span className='flex h-10 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-50 text-primary-700'>
        <ClockIcon className='h-3.5 w-3.5' />
        <span className='text-xs font-bold' dir='ltr'>
          {formatTime(viewing.scheduledAt)}
        </span>
      </span>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-semibold text-gray-900'>
          {lead?.name ?? '—'}
        </p>
        <Text
          as='p'
          variant='small'
          className='flex items-center gap-1 truncate'
        >
          <MapPinIcon className='h-3 w-3 shrink-0' />
          {propertyName}
          {viewing.note && ` · ${viewing.note}`}
        </Text>
      </div>
      {lead?.phone && (
        <a
          href={`tel:${lead.phone}`}
          aria-label={tt('callAgent')}
          className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-primary-50 hover:text-primary-600'
        >
          <PhoneIcon className='h-3.5 w-3.5' />
        </a>
      )}
      <Badge variant={meta.badge}>{t(meta.label)}</Badge>
    </li>
  )
}

export default function SellerOverview() {
  const { t, tt, locale, formatDate } = useLocale()
  const now = new Date()

  const myViewings = viewingsFor(CURRENT_SELLER_ID)
  const todayViewings = myViewings.filter(
    (v) =>
      sameDay(v.scheduledAt, now) &&
      v.status !== 'cancelled' &&
      v.status !== 'completed' &&
      v.status !== 'noShow',
  )

  const myLeads = LEADS.filter(
    (l) =>
      l.assignedToId === CURRENT_SELLER_ID &&
      l.stage !== 'won' &&
      l.stage !== 'lost',
  )
  const myDeals = DEALS.filter((d) => d.sellerId === CURRENT_SELLER_ID)
  const openDeals = myDeals.filter((d) => d.stage !== 'contractSigned')
  const expectedCommission = openDeals.reduce(
    (sum, d) => sum + (d.commission?.amount ?? 0),
    0,
  )
  const commissionCurrency = openDeals[0]?.commission?.currency ?? 'ILS'

  /* ---------- פיד הסנכרון: שינויי מחיר, סטטוסים ושריונים (פרק 8) ---------- */
  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = []

    for (const project of PROJECTS) {
      for (const unit of project.units) {
        const change = unit.priceHistory?.at(-1)
        if (change) {
          items.push({
            id: `price-${unit.id}`,
            at: change.at,
            title: `${tt('syncPriceDrop')} · ${unit.name}`,
            desc: `${t(project.name)} — ${formatMoney(change.from, locale)} ← ${formatMoney(change.to, locale)}`,
            tone: 'success',
            icon: TagIcon,
          })
        }
        if (
          (unit.status === 'sold' || unit.status === 'reserved') &&
          Date.parse(unit.updatedAt) > now.getTime() - 14 * 86_400_000
        ) {
          items.push({
            id: `status-${unit.id}`,
            at: unit.updatedAt,
            title: `${t(UNIT_STATUS_META[unit.status].label)} · ${unit.name}`,
            desc: t(project.name),
            tone: unit.status === 'sold' ? 'warning' : 'primary',
            icon: RefreshCwIcon,
          })
        }
      }
    }

    for (const res of RESERVATIONS.filter(
      (r) => r.sellerId === CURRENT_SELLER_ID,
    )) {
      const unit = unitById(res.unitId)
      items.push({
        id: `res-${res.id}`,
        at: res.updatedAt,
        title: `${res.status === 'approved' ? tt('resApproved') : tt('resPending')} · ${unit?.name ?? res.unitId}`,
        desc: t(PROJECTS.find((p) => p.id === res.projectId)?.name),
        tone: res.status === 'approved' ? 'success' : 'primary',
        icon: HandshakeIcon,
      })
    }

    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  const toneClass = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
  } as const

  return (
    <div className='space-y-6'>
      {/* KPIs */}
      <div className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
        <StatCard
          label={tt('kpiViewingsToday')}
          value={todayViewings.length}
          icon={<CalendarDaysIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('kpiMyActiveLeads')}
          value={myLeads.length}
          icon={<FunnelIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('kpiDealsInProcess')}
          value={openDeals.length}
          icon={<HandshakeIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('kpiExpectedCommission')}
          value={formatMoney(
            { amount: expectedCommission, currency: commissionCurrency },
            locale,
          )}
          icon={<WalletIcon className='h-5 w-5' />}
        />
      </div>

      <div className='grid gap-5 lg:grid-cols-2'>
        {/* ---------- הסיורים של היום ---------- */}
        <Card className='p-0'>
          <div className='flex items-center justify-between border-b border-gray-100 p-2'>
            <div>
              <Heading level={2} size='md'>
                {tt('todayViewings')}
              </Heading>
              <Text variant='small' className='mt-0.5'>
                {formatDate(now.toISOString())}
              </Text>
            </div>
            <Link
              to='/dashboard/seller/viewings'
              className='flex items-center gap-1 text-sm font-medium text-primary-600 transition hover:text-primary-700'
            >
              {tt('viewAllViewings')}
              <ArrowLeftIcon className='h-3.5 w-3.5 rtl:rotate-0 ltr:rotate-180' />
            </Link>
          </div>
          {todayViewings.length === 0 ? (
            <div className='p-4'>
              <EmptyState
                title={tt('noViewingsToday')}
                icon={<CalendarDaysIcon className='h-5 w-5' />}
              />
            </div>
          ) : (
            <ul className='divide-y divide-gray-50'>
              {todayViewings.map((v) => (
                <ViewingRow key={v.id} viewing={v} />
              ))}
            </ul>
          )}
        </Card>

        {/* ---------- פיד סנכרון מהקבלנים ---------- */}
        <Card className='p-0'>
          <div className='flex items-center justify-between border-b border-gray-100 p-2'>
            <div className='flex items-center gap-2'>
              <Heading level={2} size='md'>
                {tt('syncFeedTitle')}
              </Heading>
              <Badge variant='success'>
                <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-success-500' />
                {tt('syncLiveBadge')}
              </Badge>
            </div>
            <Link
              to='/dashboard/seller/portfolio'
              className='flex items-center gap-1 text-sm font-medium text-primary-600 transition hover:text-primary-700'
            >
              {tt('viewPortfolioLink')}
              <ArrowLeftIcon className='h-3.5 w-3.5 rtl:rotate-0 ltr:rotate-180' />
            </Link>
          </div>
          <ul className='divide-y divide-gray-50'>
            {feed.map((item) => (
              <li key={item.id} className='flex items-center gap-3 px-4 py-3'>
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                    toneClass[item.tone],
                  )}
                >
                  <item.icon className='h-4 w-4' />
                </span>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-semibold text-gray-900'>
                    {item.title}
                  </p>
                  <Text as='p' variant='small' className='truncate'>
                    {item.desc}
                  </Text>
                </div>
                <Text as='span' variant='small' className='shrink-0'>
                  {formatDate(item.at)}
                </Text>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
