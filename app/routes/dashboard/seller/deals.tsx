import { useState } from 'react'
import type { Route } from './+types/deals'
import {
  FileTextIcon,
  HandshakeIcon,
  TrendingUpIcon,
  WalletIcon,
} from 'lucide-react'
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  PillSelect,
  StatCard,
  Text,
  cn,
} from '../../../components/ui'
import type { Deal, DealStage } from '~/types'
import {
  DEALS,
  DEAL_STAGE_META,
  PROJECTS,
  formatMoney,
  unitById,
  userById,
} from '~/data'
import { useLocale } from '~/i18n/locale'

/** המוכרת המחוברת (עד שיהיה auth אמיתי). */
const CURRENT_SELLER_ID = 'u-michal'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'עסקאות ועמלות | Deals' }]
}

const DEAL_STAGES = Object.keys(DEAL_STAGE_META) as DealStage[]

export default function SellerDeals() {
  const { t, tt, locale } = useLocale()
  const [deals, setDeals] = useState<Deal[]>(() =>
    DEALS.filter((d) => d.sellerId === CURRENT_SELLER_ID),
  )

  const openDeals = deals.filter((d) => d.stage !== 'completed')
  const pipelineByCurrency = openDeals.reduce<Record<string, number>>(
    (acc, d) => {
      acc[d.price.currency] = (acc[d.price.currency] ?? 0) + d.price.amount
      return acc
    },
    {},
  )
  const expectedCommission = openDeals.reduce(
    (sum, d) => sum + (d.commission?.amount ?? 0),
    0,
  )
  const receivedCommission = deals
    .filter((d) => d.stage === 'completed')
    .reduce((sum, d) => sum + (d.commission?.amount ?? 0), 0)
  const commissionCurrency = deals[0]?.commission?.currency ?? 'ILS'

  const setStage = (id: string, stage: DealStage) =>
    setDeals((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, stage, updatedAt: new Date().toISOString() }
          : d,
      ),
    )

  return (
    <div className='space-y-6'>
      <PageHeader title={tt('dlTitle')} subtitle={tt('dlSub')} />

      {/* KPIs */}
      <div className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
        <StatCard
          label={tt('kpiDealsInProcess')}
          value={openDeals.length}
          icon={<HandshakeIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('kpiPipelineValue')}
          value={Object.entries(pipelineByCurrency)
            .map(([currency, amount]) =>
              formatMoney(
                { amount, currency: currency as Deal['price']['currency'] },
                locale,
              ),
            )
            .join(' + ')}
          icon={<TrendingUpIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('kpiExpectedCommission')}
          value={formatMoney(
            { amount: expectedCommission, currency: commissionCurrency },
            locale,
          )}
          icon={<WalletIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('dlCommissionReceived')}
          value={formatMoney(
            { amount: receivedCommission, currency: commissionCurrency },
            locale,
          )}
          icon={<WalletIcon className='h-5 w-5' />}
        />
      </div>

      {/* ---------- טבלת העסקאות ---------- */}
      <Card className='p-0'>
        <div className='overflow-x-auto'>
          <table className='w-full min-w-180 text-sm'>
            <thead>
              <tr className='border-b border-gray-100 text-xs text-gray-400'>
                <th className='px-4 py-2.5 text-start font-medium'>
                  {tt('colClient')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('colUnit')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('colStage')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('colPrice')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('colCommission')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('colPayments')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('colDocs')}
                </th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => {
                const client = userById(deal.clientId)
                const unit = unitById(deal.unitId)
                const project = PROJECTS.find((p) => p.id === deal.projectId)
                const paidCount = deal.payments.filter(
                  (p) => p.status === 'paid',
                ).length
                const stageOrder = DEAL_STAGE_META[deal.stage].order
                const progress = Math.round(
                  ((stageOrder + 1) / DEAL_STAGES.length) * 100,
                )

                return (
                  <tr
                    key={deal.id}
                    className='border-b border-gray-50 transition hover:bg-gray-50/60'
                  >
                    <td className='px-4 py-3'>
                      <p className='font-semibold text-gray-900'>
                        {client?.name ?? deal.clientId}
                      </p>
                      <Text as='span' variant='small'>
                        {client?.email}
                      </Text>
                    </td>
                    <td className='px-3 py-3'>
                      <p className='text-xs font-medium text-gray-700'>
                        {unit?.name ?? deal.unitId}
                      </p>
                      <Text as='span' variant='small'>
                        {project?.address.country.flag} {t(project?.name)}
                      </Text>
                    </td>
                    <td className='px-3 py-3'>
                      <PillSelect
                        value={deal.stage}
                        onChange={(e) =>
                          setStage(deal.id, e.target.value as DealStage)
                        }
                      >
                        {DEAL_STAGES.map((s) => (
                          <option key={s} value={s}>
                            {t(DEAL_STAGE_META[s].label)}
                          </option>
                        ))}
                      </PillSelect>
                      <div className='mt-1.5 h-1 w-24 overflow-hidden rounded-full bg-gray-100'>
                        <div
                          className={cn(
                            'h-full rounded-full',
                            deal.stage === 'completed'
                              ? 'bg-success-500'
                              : 'bg-primary-400',
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </td>
                    <td className='whitespace-nowrap px-3 py-3 font-semibold text-gray-900'>
                      {formatMoney(deal.price, locale)}
                    </td>
                    <td className='whitespace-nowrap px-3 py-3'>
                      {deal.commission ? (
                        <Badge variant='success'>
                          {formatMoney(deal.commission, locale)}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className='px-3 py-3 text-xs text-gray-600'>
                      {paidCount}/{deal.payments.length} {tt('paidOf')}
                    </td>
                    <td className='px-3 py-3'>
                      <span className='inline-flex items-center gap-1 text-xs text-gray-600'>
                        <FileTextIcon className='h-3.5 w-3.5 text-gray-400' />
                        {deal.documents.length}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {deals.length === 0 && (
                <tr>
                  <td colSpan={7} className='p-4'>
                    <EmptyState
                      title={tt('dlNoDeals')}
                      icon={<HandshakeIcon className='h-5 w-5' />}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
