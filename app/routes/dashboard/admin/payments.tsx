import { useState } from 'react'
import { useFetcher } from 'react-router'
import type { Route } from './+types/payments'
import {
  Badge,
  Banner,
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  StatCard,
  Text,
} from '../../../components/ui'
import {
  CheckIcon,
  CreditCardIcon,
  HourglassIcon,
  ShieldCheckIcon,
  XIcon,
} from 'lucide-react'
import type { PaymentApprovalStatus } from '~/types'
import {
  confirmPaymentApproval,
  getPaymentApprovalsAdmin,
  rejectPaymentApproval,
  type AdminApprovalRow,
} from '~/server/admin.server'
import { DEAL_STAGE_META, formatMoney } from '~/data'
import { useLocale } from '~/i18n/locale'
import { APPROVAL_STATUS_META } from '~/components/admin/admin-shared'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'אישורי תשלום | Admin' }]
}

export async function loader() {
  return { rows: await getPaymentApprovalsAdmin() }
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData()
  const intent = form.get('intent')
  if (intent === 'confirm') {
    await confirmPaymentApproval(
      String(form.get('id')),
      String(form.get('ref') ?? ''),
    )
  }
  if (intent === 'reject') {
    await rejectPaymentApproval(String(form.get('id')))
  }
  return { ok: true }
}

type StatusFilter = 'all' | PaymentApprovalStatus

export default function AdminPayments({ loaderData }: Route.ComponentProps) {
  const { t, tt, locale, formatDate } = useLocale()
  const fetcher = useFetcher()

  const [rows, setRows] = useState(loaderData.rows)
  const [filter, setFilter] = useState<StatusFilter>('contractorApproved')
  const [confirming, setConfirming] = useState<AdminApprovalRow | null>(null)
  const [banner, setBanner] = useState(false)

  const patchRow = (id: string, patch: Partial<AdminApprovalRow['approval']>) =>
    setRows((prev) =>
      prev.map((r) =>
        r.approval.id === id
          ? { ...r, approval: { ...r.approval, ...patch } }
          : r,
      ),
    )

  const confirm = (row: AdminApprovalRow, ref: string) => {
    fetcher.submit(
      { intent: 'confirm', id: row.approval.id, ref },
      { method: 'post' },
    )
    patchRow(row.approval.id, {
      status: 'adminConfirmed',
      adminConfirmedAt: new Date().toISOString(),
      confirmationRef: ref || undefined,
    })
    setConfirming(null)
    setBanner(true)
    setTimeout(() => setBanner(false), 4000)
  }

  const reject = (row: AdminApprovalRow) => {
    fetcher.submit(
      { intent: 'reject', id: row.approval.id },
      { method: 'post' },
    )
    patchRow(row.approval.id, { status: 'rejected' })
  }

  const filtered =
    filter === 'all'
      ? rows
      : rows.filter((r) => r.approval.status === filter)

  const awaiting = rows.filter(
    (r) => r.approval.status === 'contractorApproved',
  ).length
  const confirmed = rows.filter(
    (r) => r.approval.status === 'adminConfirmed',
  ).length
  const confirmedSum = rows
    .filter((r) => r.approval.status === 'adminConfirmed')
    .reduce((sum, r) => sum + r.approval.amount.amount, 0)
  const firstCurrency = rows[0]?.approval.amount.currency

  return (
    <div className='space-y-5'>
      <PageHeader
        title={tt('payTitle')}
        subtitle={tt('paySubtitle')}
        icon={<CreditCardIcon className='h-5 w-5' />}
      />

      {banner && <Banner variant='success'>{tt('payConfirmedBanner')}</Banner>}

      {/* KPIs */}
      <div className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
        <StatCard
          label={tt('payKpiTotal')}
          value={rows.length}
          icon={<CreditCardIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('payKpiAwaiting')}
          value={awaiting}
          tone={awaiting > 0 ? 'warning' : 'primary'}
          icon={<HourglassIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('payKpiConfirmed')}
          value={confirmed}
          tone='success'
          icon={<ShieldCheckIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('payKpiConfirmedSum')}
          value={
            firstCurrency
              ? formatMoney(
                  { amount: confirmedSum, currency: firstCurrency },
                  locale,
                )
              : '—'
          }
          icon={<CheckIcon className='h-5 w-5' />}
        />
      </div>

      {/* סינון לפי סטטוס */}
      <div className='flex gap-1.5 overflow-x-auto scrollbar-none'>
        <Chip
          size='sm'
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          {tt('all')} ({rows.length})
        </Chip>
        {(
          Object.keys(APPROVAL_STATUS_META) as PaymentApprovalStatus[]
        ).map((s) => (
          <Chip
            key={s}
            size='sm'
            active={filter === s}
            onClick={() => setFilter(s)}
          >
            {tt(APPROVAL_STATUS_META[s].label)} (
            {rows.filter((r) => r.approval.status === s).length})
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title={tt('payEmpty')}
            icon={<CreditCardIcon className='h-5 w-5' />}
          />
        </Card>
      ) : (
        <div className='space-y-3'>
          {filtered.map((row) => {
            const meta = APPROVAL_STATUS_META[row.approval.status]
            return (
              <Card key={row.approval.id} className='space-y-3'>
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='font-semibold text-gray-900'>
                        {t(row.unitTitle)}
                      </p>
                      <Badge variant={meta.badge}>{tt(meta.label)}</Badge>
                      <Badge variant='neutral'>
                        {t(DEAL_STAGE_META[row.dealStage].label)}
                      </Badge>
                    </div>
                    <Text variant='small' className='mt-1'>
                      {tt('payColClient')}: {row.clientName} ·{' '}
                      {tt('modColContractor')}: {row.contractorName} ·{' '}
                      {tt('payColRequestedBy')}: {row.requestedByName}
                    </Text>
                    <Text as='p' variant='small' className='mt-0.5'>
                      {tt('payColRequested')} {formatDate(row.approval.createdAt)}
                      {row.approval.contractorApprovedAt &&
                        ` · ${tt('payStage1')} ${formatDate(row.approval.contractorApprovedAt)}`}
                      {row.approval.adminConfirmedAt &&
                        ` · ${tt('payStage2')} ${formatDate(row.approval.adminConfirmedAt)}`}
                    </Text>
                    {row.approval.confirmationRef && (
                      <Text as='p' variant='small' className='mt-0.5'>
                        {tt('payRefLabel')}: {row.approval.confirmationRef}
                      </Text>
                    )}
                  </div>

                  <div className='text-end'>
                    <p className='text-lg font-bold text-gray-900'>
                      {formatMoney(row.approval.amount, locale)}
                    </p>
                    <Text as='p' variant='small'>
                      {tt('payColDeal')}: {formatMoney(row.dealPrice, locale)}
                    </Text>
                  </div>
                </div>

                {row.approval.status === 'contractorApproved' && (
                  <div className='flex flex-wrap justify-end gap-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => reject(row)}
                      className='flex items-center gap-1.5'
                    >
                      <XIcon className='h-3.5 w-3.5' />
                      {tt('payReject')}
                    </Button>
                    <Button
                      size='sm'
                      onClick={() => setConfirming(row)}
                      className='flex items-center gap-1.5'
                    >
                      <CheckIcon className='h-3.5 w-3.5' />
                      {tt('payConfirm')}
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* מודל אישור סופי — עם אסמכתא */}
      <Modal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={tt('payConfirmTitle')}
      >
        {confirming && (
          <form
            className='space-y-4'
            onSubmit={(e) => {
              e.preventDefault()
              confirm(
                confirming,
                String(new FormData(e.currentTarget).get('ref') ?? ''),
              )
            }}
          >
            <Text variant='muted'>
              {t(confirming.unitTitle)} ·{' '}
              {formatMoney(confirming.approval.amount, locale)}
            </Text>
            <Field label={tt('payRefLabel')}>
              <Input name='ref' placeholder={tt('payRefPh')} dir='ltr' />
            </Field>
            <div className='flex justify-end gap-2 pt-2'>
              <Button variant='ghost' onClick={() => setConfirming(null)}>
                {tt('cancel')}
              </Button>
              <Button type='submit'>{tt('payConfirm')}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
