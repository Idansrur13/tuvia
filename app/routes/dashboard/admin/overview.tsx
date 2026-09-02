import { Link } from 'react-router'
import type { Route } from './+types/overview'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Heading,
  PageHeader,
  StatCard,
  Text,
} from '../../../components/ui'
import {
  BadgeCheckIcon,
  Building2Icon,
  CreditCardIcon,
  FunnelIcon,
  GlobeIcon,
  UsersIcon,
} from 'lucide-react'
import { getAdminOverview } from '~/server/admin.server'
import { formatMoney } from '~/data'
import { useLocale } from '~/i18n/locale'
import { ORG_TYPE_LABEL } from '~/components/admin/admin-shared'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'סקירת פלטפורמה | Admin' }]
}

export async function loader() {
  return { overview: await getAdminOverview() }
}

export default function AdminOverview({ loaderData }: Route.ComponentProps) {
  const { t, tt, locale, formatDate } = useLocale()
  const o = loaderData.overview

  return (
    <div className='space-y-6'>
      <PageHeader
        title={tt('admTitle')}
        subtitle={tt('admSubtitle')}
        icon={<GlobeIcon className='h-5 w-5' />}
      />

      {/* KPIs */}
      <div className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
        <StatCard
          label={tt('admKpiPendingApps')}
          value={o.pendingApplications}
          tone={o.pendingApplications > 0 ? 'warning' : 'primary'}
          icon={<BadgeCheckIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('admKpiOrgs')}
          value={o.organizations}
          hint={`${o.verifiedOrganizations} ${tt('admVerifiedHint')}`}
          icon={<Building2Icon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('admKpiUsers')}
          value={o.users}
          hint={`${o.activeLeads} ${tt('activeLeads')}`}
          icon={<UsersIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('admKpiPayments')}
          value={o.awaitingAdminApprovals}
          tone={o.awaitingAdminApprovals > 0 ? 'danger' : 'primary'}
          hint={`${o.publishedUnits} ${tt('admKpiListings')}`}
          icon={<CreditCardIcon className='h-5 w-5' />}
        />
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        {/* בקשות הצטרפות ממתינות */}
        <Card className='p-0'>
          <div className='flex items-center justify-between border-b border-gray-100 p-4'>
            <Heading level={2} size='md'>
              {tt('admRecentApps')}
            </Heading>
            <Link to='/dashboard/admin/applications'>
              <Button size='sm' variant='outline'>
                {tt('admViewAll')}
              </Button>
            </Link>
          </div>
          {o.recentApplications.length === 0 ? (
            <div className='p-4'>
              <EmptyState
                size='sm'
                title={tt('admNoPendingApps')}
                icon={<BadgeCheckIcon className='h-5 w-5' />}
              />
            </div>
          ) : (
            <ul className='divide-y divide-gray-50'>
              {o.recentApplications.map((app) => (
                <li
                  key={app.id}
                  className='flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3'
                >
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-semibold text-gray-900'>
                      {app.companyName}
                    </p>
                    <Text as='p' variant='small' className='truncate'>
                      {app.contactName} · {app.country}
                    </Text>
                  </div>
                  <Badge variant='neutral'>
                    {tt(ORG_TYPE_LABEL[app.type])}
                  </Badge>
                  <Text as='span' variant='small'>
                    {formatDate(app.createdAt)}
                  </Text>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* אישורי תשלום שממתינים לאדמין */}
        <Card className='p-0'>
          <div className='flex items-center justify-between border-b border-gray-100 p-4'>
            <Heading level={2} size='md'>
              {tt('admAwaitingAdmin')}
            </Heading>
            <Link to='/dashboard/admin/payments'>
              <Button size='sm' variant='outline'>
                {tt('admViewAll')}
              </Button>
            </Link>
          </div>
          {o.approvalsPreview.length === 0 ? (
            <div className='p-4'>
              <EmptyState
                size='sm'
                title={tt('admNoAwaiting')}
                icon={<CreditCardIcon className='h-5 w-5' />}
              />
            </div>
          ) : (
            <ul className='divide-y divide-gray-50'>
              {o.approvalsPreview.map((row) => (
                <li
                  key={row.approval.id}
                  className='flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3'
                >
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-semibold text-gray-900'>
                      {t(row.unitTitle)}
                    </p>
                    <Text as='p' variant='small' className='truncate'>
                      {row.clientName} · {row.contractorName}
                    </Text>
                  </div>
                  <span className='text-sm font-bold text-gray-900'>
                    {formatMoney(row.approval.amount, locale)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* קיצורי ניהול */}
      <div className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
        {(
          [
            ['/dashboard/admin/organizations', 'navAdminOrgs', Building2Icon],
            ['/dashboard/admin/users', 'navAdminUsers', UsersIcon],
            ['/dashboard/admin/moderation', 'navAdminModeration', FunnelIcon],
            ['/dashboard/admin/payments', 'navAdminPayments', CreditCardIcon],
          ] as const
        ).map(([to, key, Icon]) => (
          <Link
            key={to}
            to={to}
            className='flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-primary-200 hover:shadow-md'
          >
            <span className='flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600'>
              <Icon className='h-5 w-5' />
            </span>
            <span className='text-sm font-semibold text-gray-900'>
              {tt(key)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
