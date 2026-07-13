import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { Route } from './+types/portfolio'
import {
  BuildingIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  HandshakeIcon,
  HourglassIcon,
  TagIcon,
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
} from '../../../components/ui'
import type { Reservation, ReservationStatus, Unit } from '~/types'
import {
  LISTINGS,
  PROJECTS,
  RESERVATIONS,
  UNIT_STATUS_META,
  formatMoney,
} from '~/data'
import { useLocale } from '~/i18n/locale'
import type { DictKey } from '~/i18n/dictionary'

/** המוכרת המחוברת (עד שיהיה auth אמיתי). */
const CURRENT_SELLER_ID = 'u-michal'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'תיק הנכסים | Portfolio' }]
}

const RES_STATUS_KEY: Record<ReservationStatus, DictKey> = {
  requested: 'resPending',
  approved: 'resApproved',
  rejected: 'resRejected',
  expired: 'resExpired',
}

export default function SellerPortfolio() {
  const { t, tt, locale, formatDate } = useLocale()

  /* שריונים — מקומי כדי לאפשר בקשות חדשות בדמו */
  const [reservations, setReservations] = useState<Reservation[]>(RESERVATIONS)
  const [flash, setFlash] = useState(false)

  const published = PROJECTS.filter((p) => p.status === 'published')
  const rows = useMemo(
    () =>
      published.flatMap((project) =>
        project.units.map((unit) => ({ project, unit })),
      ),
    [published],
  )

  const availableCount = rows.filter(
    ({ unit }) => unit.status === 'available',
  ).length
  const myReservations = reservations.filter(
    (r) => r.sellerId === CURRENT_SELLER_ID,
  )
  const myListings = LISTINGS.filter((l) => l.agentId === CURRENT_SELLER_ID)

  const reservationFor = (unit: Unit) =>
    myReservations.find(
      (r) =>
        r.unitId === unit.id &&
        (r.status === 'requested' || r.status === 'approved'),
    )

  const requestReservation = (unit: Unit, projectId: string) => {
    const now = new Date().toISOString()
    setReservations((prev) => [
      ...prev,
      {
        id: `res-${Date.now()}`,
        unitId: unit.id,
        projectId,
        sellerId: CURRENT_SELLER_ID,
        status: 'requested',
        createdAt: now,
        updatedAt: now,
      },
    ])
    setFlash(true)
    setTimeout(() => setFlash(false), 4000)
  }

  return (
    <div className='space-y-6'>
      <PageHeader title={tt('portTitle')} subtitle={tt('portSub')} />

      {flash && <Banner variant='success'>{tt('reserveSentMsg')}</Banner>}

      {/* KPIs */}
      <div className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
        <StatCard
          label={tt('kpiAvailableUnits')}
          value={availableCount}
          icon={<BuildingIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('kpiMyReservations')}
          value={myReservations.length}
          hint={`${myReservations.filter((r) => r.status === 'approved').length} ${tt('resApproved')}`}
          icon={<HandshakeIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('myMarketed')}
          value={myListings.length}
          icon={<TagIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('activeProjects')}
          value={published.length}
          icon={<BuildingIcon className='h-5 w-5' />}
        />
      </div>

      {/* ---------- מלאי הקבלנים (מסונכרן) ---------- */}
      <Card className='p-0'>
        <div className='flex flex-wrap items-center gap-2 border-b border-gray-100 p-4'>
          <Heading level={2} size='md'>
            {tt('contractorInventory')}
          </Heading>
          <Badge variant='success'>
            <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-success-500' />
            {tt('syncLiveBadge')}
          </Badge>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full min-w-180 text-sm'>
            <thead>
              <tr className='border-b border-gray-100 text-xs text-gray-400'>
                <th className='px-4 py-2.5 text-start font-medium'>
                  {tt('colUnit')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('colProject')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('colRooms')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('colSqm')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('colPrice')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('colStatus')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('colUpdated')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium' />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ project, unit }) => {
                const statusMeta = UNIT_STATUS_META[unit.status]
                const priceChange = unit.priceHistory?.at(-1)
                const myRes = reservationFor(unit)

                return (
                  <tr
                    key={unit.id}
                    className='border-b border-gray-50 transition hover:bg-gray-50/60'
                  >
                    <td className='px-4 py-2.5'>
                      <p className='font-semibold text-gray-900'>{unit.name}</p>
                      <Text as='span' variant='small'>
                        {unit.id}
                      </Text>
                    </td>
                    <td className='px-3 py-2.5 text-xs text-gray-600'>
                      {project.address.country.flag} {t(project.name)}
                    </td>
                    <td className='px-3 py-2.5 text-gray-600'>{unit.rooms}</td>
                    <td className='px-3 py-2.5 text-gray-600'>{unit.sqm}</td>
                    <td className='whitespace-nowrap px-3 py-2.5'>
                      <p className='font-semibold text-gray-900'>
                        {formatMoney(unit.price, locale)}
                      </p>
                      {priceChange && (
                        <Text
                          as='p'
                          variant='small'
                          className='line-through'
                        >
                          {tt('priceWas')}{' '}
                          {formatMoney(priceChange.from, locale)}
                        </Text>
                      )}
                    </td>
                    <td className='px-3 py-2.5'>
                      <Badge variant={statusMeta.badge}>
                        {t(statusMeta.label)}
                      </Badge>
                    </td>
                    <td className='whitespace-nowrap px-3 py-2.5 text-xs text-gray-500'>
                      {formatDate(unit.updatedAt)}
                    </td>
                    <td className='px-3 py-2.5'>
                      {myRes?.status === 'approved' ? (
                        <Badge variant='success'>
                          <CheckCircle2Icon className='h-3.5 w-3.5' />
                          {tt('reservedByMe')}
                        </Badge>
                      ) : myRes?.status === 'requested' ? (
                        <Badge variant='warning'>
                          <HourglassIcon className='h-3.5 w-3.5' />
                          {tt('resPending')}
                        </Badge>
                      ) : unit.status === 'available' ? (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => requestReservation(unit, project.id)}
                        >
                          {tt('reqReserve')}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ---------- הנכסים שאני משווקת ---------- */}
      <Card className='p-0'>
        <div className='border-b border-gray-100 p-4'>
          <Heading level={2} size='md'>
            {tt('myMarketed')}
          </Heading>
        </div>
        <ul className='divide-y divide-gray-50'>
          {myListings.map((listing) => (
            <li key={listing.id}>
              <Link
                to={`/property/${listing.id}`}
                className='flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50/70'
              >
                <img
                  src={listing.images[0]?.url}
                  alt={t(listing.title)}
                  className='h-12 w-16 shrink-0 rounded-lg object-cover'
                />
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-semibold text-gray-900'>
                    {t(listing.title)}
                  </p>
                  <Text as='p' variant='small' className='truncate'>
                    {[listing.address.neighborhood, listing.address.city]
                      .filter(Boolean)
                      .join(', ')}
                    {' · '}
                    {listing.rooms} · {listing.sqm} {tt('colSqm')}
                  </Text>
                </div>
                <span className='shrink-0 text-sm font-bold text-gray-900'>
                  {formatMoney(listing.price, locale)}
                </span>
                <Badge
                  variant={listing.dealType === 'sale' ? 'primary' : 'success'}
                >
                  {listing.dealType === 'sale' ? tt('forSale') : tt('forRent')}
                </Badge>
                <ExternalLinkIcon className='h-4 w-4 shrink-0 text-gray-300' />
              </Link>
            </li>
          ))}
          {myListings.length === 0 && (
            <li className='p-4'>
              <EmptyState
                title={tt('noResults')}
                icon={<TagIcon className='h-5 w-5' />}
              />
            </li>
          )}
        </ul>
      </Card>
    </div>
  )
}
