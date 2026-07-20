import { useState } from 'react'
import { useFetcher } from 'react-router'
import type { Route } from './+types/applications'
import {
  Badge,
  Banner,
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Heading,
  Input,
  Modal,
  PageHeader,
  Text,
} from '../../../components/ui'
import { BadgeCheckIcon, CheckIcon, XIcon } from 'lucide-react'
import type { PartnerApplication, PartnerApplicationStatus } from '~/types'
import {
  getPartnerApplications,
  reviewPartnerApplication,
} from '~/server/admin.server'
import { useLocale } from '~/i18n/locale'
import {
  APP_STATUS_META,
  ORG_TYPE_LABEL,
} from '~/components/admin/admin-shared'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'בקשות הצטרפות | Admin' }]
}

export async function loader() {
  return { applications: await getPartnerApplications() }
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData()
  if (form.get('intent') === 'review') {
    await reviewPartnerApplication({
      id: String(form.get('id')),
      approve: form.get('approve') === 'true',
      byUserId: CURRENT_ADMIN_ID,
      note: String(form.get('note') ?? ''),
    })
  }
  return { ok: true }
}
export const CURRENT_ADMIN_ID = 'u-admin'

type StatusFilter = 'all' | PartnerApplicationStatus

export default function AdminApplications({
  loaderData,
}: Route.ComponentProps) {
  const { tt, formatDate } = useLocale()
  const reviewFetcher = useFetcher()

  const [applications, setApplications] = useState(loaderData.applications)
  const [filter, setFilter] = useState<StatusFilter>('pending')
  const [banner, setBanner] = useState<'approved' | 'rejected' | null>(null)
  /** בקשה שנמצאת כרגע במודל דחייה (עם נימוק) */
  const [rejecting, setRejecting] = useState<PartnerApplication | null>(null)

  const review = (app: PartnerApplication, approve: boolean, note = '') => {
    reviewFetcher.submit(
      { intent: 'review', id: app.id, approve: String(approve), note },
      { method: 'post' },
    )
    const now = new Date().toISOString()
    setApplications((prev) =>
      prev.map((a) =>
        a.id === app.id
          ? {
              ...a,
              status: approve ? 'approved' : 'rejected',
              reviewedById: CURRENT_ADMIN_ID,
              reviewedAt: now,
              note: note || a.note,
              updatedAt: now,
            }
          : a,
      ),
    )
    setBanner(approve ? 'approved' : 'rejected')
    setRejecting(null)
    setTimeout(() => setBanner(null), 4000)
  }

  const filtered =
    filter === 'all'
      ? applications
      : applications.filter((a) => a.status === filter)
  const pendingCount = applications.filter((a) => a.status === 'pending').length

  return (
    <div className='space-y-5'>
      <PageHeader
        title={tt('appTitle')}
        subtitle={tt('appSubtitle')}
        icon={<BadgeCheckIcon className='h-5 w-5' />}
      />

      {banner === 'approved' && (
        <Banner variant='success'>{tt('appApprovedBanner')}</Banner>
      )}
      {banner === 'rejected' && (
        <Banner variant='danger'>{tt('appRejectedBanner')}</Banner>
      )}

      {/* סינון לפי סטטוס */}
      <div className='flex gap-1.5 overflow-x-auto scrollbar-none'>
        <Chip
          size='sm'
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          {tt('all')} ({applications.length})
        </Chip>
        {(Object.keys(APP_STATUS_META) as PartnerApplicationStatus[]).map(
          (s) => (
            <Chip
              key={s}
              size='sm'
              active={filter === s}
              onClick={() => setFilter(s)}
            >
              {tt(APP_STATUS_META[s].label)} (
              {applications.filter((a) => a.status === s).length})
            </Chip>
          ),
        )}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title={
              pendingCount === 0 && filter === 'pending'
                ? tt('admNoPendingApps')
                : tt('appEmpty')
            }
            icon={<BadgeCheckIcon className='h-5 w-5' />}
          />
        </Card>
      ) : (
        <div className='space-y-3'>
          {filtered.map((app) => {
            const meta = APP_STATUS_META[app.status]
            return (
              <Card key={app.id} className='space-y-3'>
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Heading level={2} size='md'>
                        {app.companyName}
                      </Heading>
                      <Badge variant='neutral'>
                        {tt(ORG_TYPE_LABEL[app.type])}
                      </Badge>
                      <Badge variant={meta.badge}>{tt(meta.label)}</Badge>
                    </div>
                    <Text variant='muted' className='mt-1'>
                      {app.contactName} · {app.country}
                    </Text>
                    <Text as='p' variant='small' className='mt-0.5' dir='ltr'>
                      {app.email}
                      {app.phone && ` · ${app.phone}`}
                    </Text>
                  </div>

                  <div className='text-end'>
                    <Text as='p' variant='small'>
                      {tt('appSubmittedOn')} {formatDate(app.createdAt)}
                    </Text>
                    {app.reviewedAt && (
                      <Text as='p' variant='small'>
                        {tt('appReviewedOn')} {formatDate(app.reviewedAt)}
                      </Text>
                    )}
                  </div>
                </div>

                {app.note && (
                  <Text variant='small' className='rounded-xl bg-gray-50 p-3'>
                    {tt('appNoteLabel')}: {app.note}
                  </Text>
                )}

                {app.status === 'pending' && (
                  <div className='flex flex-wrap justify-end gap-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setRejecting(app)}
                      className='flex items-center gap-1.5'
                    >
                      <XIcon className='h-3.5 w-3.5' />
                      {tt('appReject')}
                    </Button>
                    <Button
                      size='sm'
                      onClick={() => review(app, true)}
                      className='flex items-center gap-1.5'
                    >
                      <CheckIcon className='h-3.5 w-3.5' />
                      {tt('appApprove')}
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* מודל דחייה — נימוק לתיעוד ולתשובה למבקש */}
      <Modal
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        title={tt('appRejectTitle')}
      >
        {rejecting && (
          <form
            className='space-y-4'
            onSubmit={(e) => {
              e.preventDefault()
              review(
                rejecting,
                false,
                String(new FormData(e.currentTarget).get('note') ?? ''),
              )
            }}
          >
            <Text variant='muted'>
              {tt('appRejectHint')} — {rejecting.companyName}
            </Text>
            <Field label={tt('appNoteLabel')}>
              <Input name='note' placeholder={tt('appRejectNotePh')} />
            </Field>
            <div className='flex justify-end gap-2 pt-2'>
              <Button variant='ghost' onClick={() => setRejecting(null)}>
                {tt('cancel')}
              </Button>
              <Button type='submit'>{tt('appReject')}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
