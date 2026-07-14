/*
 * תיק הנכסים שלי (פרק 6) — רק מה שהמתווך משווק בפועל:
 * יחידות קבלן ששוריינו/אושרו לו (מסונכרנות) + נכסים עצמאיים.
 * לכל נכס: לקוח מקושר, סיור קרוב, עסקה פעילה ושלב ההזמנה (פרק 16),
 * ואינדיקציית חלון 3 החודשים (פרק 4.1).
 * המלאי המלא + בקשות שריון נמצאים בעמוד "מלאי קבלנים" (inventory).
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { Route } from './+types/portfolio'
import {
  BriefcaseIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  HandshakeIcon,
  MegaphoneIcon,
  TagIcon,
  UsersIcon,
} from 'lucide-react'
import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  Field,
  Heading,
  Input,
  Modal,
  PageHeader,
  StatCard,
  Text,
} from '../../../components/ui'
import {
  DEALS,
  DEAL_STAGE_META,
  LISTINGS,
  RESERVATIONS,
  UNIT_STATUS_META,
  VIEWINGS,
  accessWindowEnd,
  formatMoney,
  isWithinWindow,
  projectById,
  unitById,
  userById,
} from '~/data'
import { useLocale } from '~/i18n/locale'
import { route } from '@react-router/dev/routes'

/** המוכרת המחוברת (עד שיהיה auth אמיתי). */
const CURRENT_SELLER_ID = 'u-michal'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'תיק הנכסים | Portfolio' }]
}

export default function SellerPortfolio() {
  const { t, tt, locale, formatDate } = useLocale()
  const navigate = useNavigate()

  /* יחידה שנבחרה לפרסום מודעה (null = המודל סגור) + הודעת הצלחה. */
  const [adUnit, setAdUnit] = useState<ReturnType<typeof unitById>>(undefined)
  const [adPublished, setAdPublished] = useState(false)

  /* שריונים שלי (מבוקשים/מאושרים) - הבסיס לתיק. */
  const myReservations = RESERVATIONS.filter(
    (r) =>
      r.sellerId === CURRENT_SELLER_ID &&
      (r.status === 'requested' || r.status === 'approved'),
  )
  const myDeals = DEALS.filter((d) => d.sellerId === CURRENT_SELLER_ID)

  /* יחידות בתיק = שריונים שלי + יחידות עם עסקה פעילה שלי. */
  const unitIds = [
    ...new Set([
      ...myReservations.map((r) => r.unitId),
      ...myDeals.map((d) => d.unitId),
    ]),
  ]

  const portfolioRows = unitIds
    .map((unitId) => {
      const unit = unitById(unitId)
      if (!unit) return null
      const reservation = myReservations.find((r) => r.unitId === unitId)
      const deal = myDeals.find((d) => d.unitId === unitId)
      const project = projectById(
        reservation?.projectId ?? deal?.projectId ?? '',
      )
      const client = userById(deal?.clientId ?? reservation?.clientId)
      const nextViewing = VIEWINGS.find(
        (v) =>
          v.sellerId === CURRENT_SELLER_ID &&
          v.unitId === unitId &&
          (v.status === 'scheduled' || v.status === 'confirmed'),
      )
      return { unit, reservation, deal, project, client, nextViewing }
    })
    .filter(Boolean) as {
    unit: NonNullable<ReturnType<typeof unitById>>
    reservation?: (typeof RESERVATIONS)[number]
    deal?: (typeof DEALS)[number]
    project?: ReturnType<typeof projectById>
    client?: ReturnType<typeof userById>
    nextViewing?: (typeof VIEWINGS)[number]
  }[]

  /* נכסים עצמאיים שהמתווך משווק. */
  const myListings = LISTINGS.filter((l) => l.agentId === CURRENT_SELLER_ID)

  /* KPIs (פרק 6). */
  const openDeals = myDeals.filter((d) => d.stage !== 'contractSigned')
  const activeClients = new Set(
    openDeals.map((d) => d.clientId).filter(Boolean),
  ).size

  return (
    <div className='space-y-6'>
      <PageHeader title={tt('portTitle')} subtitle={tt('portSub')} />

      {adPublished && (
        <Banner
          variant='success'
          icon={<CheckCircle2Icon className='h-4 w-4' />}
        >
          {tt('adPublishedMsg')}
        </Banner>
      )}

      {/* KPIs */}
      <div className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
        <StatCard
          label={tt('kpiPortfolioAssets')}
          value={portfolioRows.length + myListings.length}
          icon={<BriefcaseIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('kpiMyReservations')}
          value={myReservations.length}
          hint={`${myReservations.filter((r) => r.status === 'approved').length} ${tt('resApproved')}`}
          icon={<HandshakeIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('kpiDealsInProcess')}
          value={openDeals.length}
          icon={<HandshakeIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('kpiActiveClients')}
          value={activeClients}
          icon={<UsersIcon className='h-5 w-5' />}
        />
      </div>

      {/* ---------- יחידות קבלן בתיק שלי (מסונכרן) ---------- */}
      <Card className='p-0'>
        <div className='flex flex-wrap items-center gap-2 border-b border-gray-100 p-4'>
          <Heading level={2} size='md'>
            {tt('portMyUnits')}
          </Heading>
          <Badge variant='success'>
            <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-success-500' />
            {tt('syncLiveBadge')}
          </Badge>
          <Link
            to='/dashboard/seller/inventory'
            className='ms-auto text-sm font-medium text-primary-600 transition hover:underline'
          >
            {tt('goToInventory')}
          </Link>
        </div>

        {portfolioRows.length === 0 ? (
          <div className='p-4'>
            <EmptyState
              title={tt('noPortfolioUnits')}
              description={tt('noPortfolioHint')}
              icon={<BriefcaseIcon className='h-5 w-5' />}
            />
          </div>
        ) : (
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
                    {tt('colPrice')}
                  </th>
                  <th className='px-3 py-2.5 text-start font-medium'>
                    {tt('colStatus')}
                  </th>
                  <th className='px-3 py-2.5 text-start font-medium'>
                    {tt('linkedClientCol')}
                  </th>
                  <th className='px-3 py-2.5 text-start font-medium'>
                    {tt('activeDealCol')}
                  </th>
                  <th className='px-3 py-2.5 text-start font-medium'>
                    {tt('nextViewingCol')}
                  </th>
                  <th className='px-3 py-2.5 text-start font-medium'>
                    {tt('addAdCta')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {portfolioRows.map(
                  ({
                    unit,
                    reservation,
                    deal,
                    project,
                    client,
                    nextViewing,
                  }) => {
                    const statusMeta = UNIT_STATUS_META[unit.status]
                    return (
                      <tr
                        key={unit.id}
                        onClick={() => navigate(`/dashboard/${unit.id}`)}
                        className='cursor-pointer border-b border-gray-50 transition hover:bg-gray-50/60'
                      >
                        <td className='px-4 py-3'>
                          <p className='font-semibold text-gray-900'>
                            {unit.name}
                          </p>
                          <Text as='span' variant='small'>
                            {unit.id}
                            {reservation &&
                              ` · ${reservation.status === 'approved' ? tt('reservedByMe') : tt('resPending')}`}
                          </Text>
                        </td>

                        <td className='px-3 py-3 text-xs text-gray-600'>
                          {project?.address.country.flag} {t(project?.name)}
                        </td>
                        <td className='whitespace-nowrap px-3 py-3 font-semibold text-gray-900'>
                          {formatMoney(unit.price, locale)}
                        </td>
                        <td className='px-3 py-3'>
                          <Badge variant={statusMeta.badge}>
                            {t(statusMeta.label)}
                          </Badge>
                        </td>
                        {/* לקוח מקושר + חלון 3 החודשים (פרק 4.1) */}
                        <td className='px-3 py-3'>
                          {client ? (
                            <div>
                              <p className='text-xs font-medium text-gray-700'>
                                {client.name}
                              </p>
                              {deal?.clientSince &&
                                (isWithinWindow(deal.clientSince) ? (
                                  <Text as='p' variant='small'>
                                    {tt('accessUntilLabel')}{' '}
                                    {formatDate(
                                      accessWindowEnd(deal.clientSince),
                                    )}
                                  </Text>
                                ) : (
                                  <Badge variant='neutral'>
                                    {tt('accessBlockedBadge')}
                                  </Badge>
                                ))}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        {/* שלב העסקה (פרק 16.1) */}
                        <td className='px-3 py-3'>
                          {deal ? (
                            <Badge
                              variant={
                                deal.stage === 'contractSigned'
                                  ? 'success'
                                  : 'primary'
                              }
                            >
                              {t(DEAL_STAGE_META[deal.stage].label)}
                            </Badge>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className='whitespace-nowrap px-3 py-3 text-xs text-gray-500'>
                          {nextViewing ? (
                            <span className='inline-flex items-center gap-1'>
                              <CalendarDaysIcon className='h-3.5 w-3.5 text-gray-400' />
                              {formatDate(nextViewing.scheduledAt)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className='whitespace-nowrap px-3 py-3 text-xs text-gray-500'>
                          {/* stopPropagation — שהקליק לא יפעיל ניווט של השורה */}
                          <Button
                            size='sm'
                            onClick={(e) => {
                              e.stopPropagation()
                              setAdUnit(unit)
                            }}
                          >
                            <MegaphoneIcon className='h-3.5 w-3.5' />
                            {tt('addAdCta')}
                          </Button>
                        </td>
                      </tr>
                    )
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
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
                to={`/dashboard/seller/property/${listing.id}`}
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

      {/* ---------- מודל פרסום מודעה (פרק 6) ---------- */}
      <Modal
        open={adUnit !== undefined}
        onClose={() => setAdUnit(undefined)}
        title={tt('adModalTitle')}
      >
        <form
          className='space-y-4'
          onSubmit={(e) => {
            e.preventDefault()
            /* אין עדיין backend — סוגרים ומציגים אישור */
            setAdUnit(undefined)
            setAdPublished(true)
          }}
        >
          <Text as='p' variant='small'>
            {tt('adModalHint')}
          </Text>

          <Field label={tt('adTitleLabel')}>
            <Input
              name='title'
              required
              defaultValue={adUnit?.name}
              placeholder={tt('adTitlePlaceholder')}
            />
          </Field>

          <Field label={`${tt('adPriceLabel')} (${adUnit?.price.currency ?? 'ILS'})`}>
            <Input
              name='price'
              type='number'
              min={0}
              required
              defaultValue={adUnit?.price.amount}
            />
          </Field>

          <Field label={tt('adDescLabel')}>
            <textarea
              name='description'
              rows={3}
              placeholder={tt('adDescPlaceholder')}
              className='w-full resize-none rounded-xl border border-gray-200 bg-white px-2 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100'
            />
          </Field>

          <div className='flex justify-end gap-2 pt-2'>
            <Button variant='ghost' onClick={() => setAdUnit(undefined)}>
              {tt('cancel')}
            </Button>
            <Button type='submit'>
              <MegaphoneIcon className='h-4 w-4' />
              {tt('adPublish')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
