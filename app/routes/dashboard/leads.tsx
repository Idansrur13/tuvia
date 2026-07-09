import { useMemo, useState } from 'react'
import type { Route } from './+types/leads'
import {
  Badge,
  Button,
  Card,
  Field,
  Heading,
  Input,
  Modal,
  Select,
  StatCard,
  Text,
  cn,
} from '../../components/ui'

import { PlusIcon, FunnelIcon, UsersIcon, MailIcon } from 'lucide-react'
import type { Invite, Lead, LeadStage } from '~/types'
import {
  COUNTRIES,
  INVITES,
  LEADS,
  LEAD_STAGES,
  LEAD_STAGE_META,
  PROJECTS,
  formatMoney,
  projectById,
} from '~/data'
import { useLocale } from '~/i18n/locale'
import { LanguageSwitcher } from '~/i18n/language-switcher'

/** המשתמש המחובר (עד שיהיה auth אמיתי) — הקבלן ששולח את ההזמנות. */
const CURRENT_USER_ID = 'u-yossi'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'לידים והזמנות | Leads' }]
}

function LeadCard({
  lead,
  onStageChange,
}: {
  lead: Lead
  onStageChange: (stage: LeadStage) => void
}) {
  const { t, tt, locale, formatDate } = useLocale()
  const project = projectById(lead.projectId ?? '')
  const flag = lead.countryCode ? COUNTRIES[lead.countryCode]?.flag : undefined

  return (
    <div className='space-y-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm'>
      <div className='flex items-start justify-between gap-2'>
        <p className='font-semibold text-gray-900'>{lead.name}</p>
        {flag && (
          <span className='text-lg leading-none' title={lead.countryCode}>
            {flag}
          </span>
        )}
      </div>

      {project && (
        <Text as='p' variant='small'>
          {t(project.name)}
        </Text>
      )}

      {lead.budget && (
        <p className='text-sm font-bold text-gray-900'>
          {formatMoney(lead.budget, locale)}
          <Text as='span' variant='small' className='font-normal'>
            {' '}
            {tt('budget')}
          </Text>
        </p>
      )}

      <div className='flex items-center justify-between gap-2 pt-1'>
        <Text as='span' variant='small'>
          {formatDate(lead.lastActivityAt)}
        </Text>
        <select
          value={lead.stage}
          onChange={(e) => onStageChange(e.target.value as LeadStage)}
          className='cursor-pointer rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 outline-none transition hover:bg-gray-200'
        >
          {LEAD_STAGES.map((s) => (
            <option key={s} value={s}>
              {t(LEAD_STAGE_META[s].label)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default function ContractorLeads() {
  const { t, tt } = useLocale()
  const [leads, setLeads] = useState(LEADS)
  const [invites, setInvites] = useState(INVITES)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)

  const wonCount = leads.filter((l) => l.stage === 'won').length
  const newCount = leads.filter((l) => l.stage === 'new').length
  const conversion = leads.length
    ? Math.round((wonCount / leads.length) * 100)
    : 0
  const pendingInvites = invites.filter((i) => i.status === 'pending').length

  const byStage = useMemo(
    () =>
      LEAD_STAGES.map((stage) => ({
        stage,
        meta: LEAD_STAGE_META[stage],
        leads: leads.filter((l) => l.stage === stage),
      })),
    [leads],
  )

  const moveLead = (id: string, stage: LeadStage) =>
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage } : l)))

  const sendInvite = (form: FormData) => {
    const now = new Date().toISOString()
    const invite: Invite = {
      id: `inv-${Date.now()}`,
      name: String(form.get('name')),
      email: String(form.get('email')),
      invitedById: CURRENT_USER_ID,
      projectId: String(form.get('project')),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }
    setInvites((prev) => [invite, ...prev])
    setInviteOpen(false)
    setInviteSent(true)
    setTimeout(() => setInviteSent(false), 4000)
  }

  return (
    <div className='space-y-6'>
      {/* Page header */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <Heading level={1} size='lg'>
            {tt('leadsHeading')}
          </Heading>
          <Text variant='muted' className='mt-1'>
            {tt('leadsSubtitle')}
          </Text>
        </div>
        <div className='flex items-center gap-3'>
          <Button
            className='flex items-center gap-2'
            onClick={() => setInviteOpen(true)}
          >
            <PlusIcon className='h-4 w-4' />
            {tt('inviteClient')}
          </Button>
        </div>
      </div>

      {inviteSent && (
        <div className='rounded-xl border border-success-500/30 bg-success-50 px-4 py-3 text-sm font-medium text-success-700'>
          {tt('inviteSent')}
        </div>
      )}

      {/* KPIs */}
      <div className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
        <StatCard
          label={tt('activeLeads')}
          value={leads.length - wonCount}
          icon={<FunnelIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('newLeads')}
          value={newCount}
          hint={tt('waitingContact')}
          icon={<UsersIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('closedDeals')}
          value={wonCount}
          hint={`${conversion}% ${tt('conversionRate')}`}
        />
        <StatCard
          label={tt('pendingInvites')}
          value={pendingInvites}
          hint={tt('notRegistered')}
          icon={<MailIcon className='h-5 w-5' />}
        />
      </div>

      {/* Pipeline */}
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-6'>
        {byStage.map(({ stage, meta, leads: stageLeads }) => (
          <div key={stage} className='rounded-2xl bg-gray-100/70 p-3'>
            <div className='mb-3 flex items-center gap-2 px-1'>
              <span className={cn('h-2.5 w-2.5 rounded-full', meta.dot)} />
              <span className='text-sm font-semibold text-gray-700'>
                {t(meta.label)}
              </span>
              <span className='ms-auto rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-500'>
                {stageLeads.length}
              </span>
            </div>
            <div className='space-y-2'>
              {stageLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onStageChange={(s) => moveLead(lead.id, s)}
                />
              ))}
              {stageLeads.length === 0 && (
                <p className='rounded-xl border border-dashed border-gray-200 py-6 text-center text-xs text-gray-400'>
                  {tt('noLeadsInStage')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invites */}
      <Card className='p-0'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 p-4'>
          <div>
            <Heading level={3} size='md'>
              {tt('invitesTitle')}
            </Heading>
            <Text variant='small' className='mt-0.5'>
              {tt('invitesSubtitle')}
            </Text>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setInviteOpen(true)}
          >
            + {tt('newInvite')}
          </Button>
        </div>

        <ul className='divide-y divide-gray-50'>
          {invites.map((invite) => (
            <InviteRow key={invite.id} invite={invite} />
          ))}
        </ul>
      </Card>

      {/* Invite modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title={tt('modalTitle')}
      >
        <form
          className='space-y-4'
          onSubmit={(e) => {
            e.preventDefault()
            sendInvite(new FormData(e.currentTarget))
          }}
        >
          <Text variant='muted'>{tt('modalHint')}</Text>
          <Field label={tt('fullName')}>
            <Input
              name='name'
              required
              placeholder={tt('fullNamePlaceholder')}
            />
          </Field>
          <Field label={tt('emailAddress')}>
            <Input
              name='email'
              type='email'
              required
              placeholder='name@example.com'
              dir='ltr'
            />
          </Field>
          <Field label={tt('assignProject')}>
            <Select name='project' defaultValue={PROJECTS[0].id}>
              {PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {t(p.name)} — {p.address.city}
                </option>
              ))}
            </Select>
          </Field>
          <div className='flex justify-end gap-2 pt-2'>
            <Button variant='ghost' onClick={() => setInviteOpen(false)}>
              {tt('cancel')}
            </Button>
            <Button type='submit'>{tt('sendInvite')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function InviteRow({ invite }: { invite: Invite }) {
  const { t, tt, formatDate } = useLocale()
  const project = projectById(invite.projectId ?? '')

  return (
    <li className='flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3'>
      <span className='flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600'>
        <MailIcon className='h-4 w-4' />
      </span>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-semibold text-gray-900'>
          {invite.name}
        </p>
        <Text as='p' variant='small' className='truncate'>
          {invite.email}
          {project && ` · ${t(project.name)}`}
        </Text>
      </div>
      <Text as='span' variant='small'>
        {tt('sentOn')} {formatDate(invite.createdAt)}
      </Text>
      <Badge variant={invite.status === 'joined' ? 'success' : 'warning'}>
        {invite.status === 'joined' ? tt('statusJoined') : tt('statusPending')}
      </Badge>
    </li>
  )
}
