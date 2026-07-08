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
  formatPrice,
} from '../../components/ui'

import {
  INVITES,
  LEADS,
  LEAD_STAGES,
  PROJECTS,
  projectById,
  type Invite,
  type Lead,
  type LeadStage,
} from '../../dashboard/data'
import { PlusIcon, FunnelIcon, UsersIcon, MailIcon } from 'lucide-react'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'לידים והזמנות | תכלת נדל״ן' }]
}

function LeadCard({
  lead,
  onStageChange,
}: {
  lead: Lead
  onStageChange: (stage: LeadStage) => void
}) {
  const project = projectById(PROJECTS, lead.projectId)

  return (
    <div className='space-y-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm'>
      <div className='flex items-start justify-between gap-2'>
        <p className='font-semibold text-gray-900'>{lead.name}</p>
        <span className='text-lg leading-none' title={lead.country}>
          {lead.flag}
        </span>
      </div>

      <Text as='p' variant='small'>
        {project?.name}
        {lead.unit && ` · יחידה ${lead.unit}`}
      </Text>

      {lead.budget && project && (
        <p className='text-sm font-bold text-gray-900'>
          {formatPrice(lead.budget, project.currency)}
          <Text as='span' variant='small' className='font-normal'>
            {' '}
            תקציב
          </Text>
        </p>
      )}

      <div className='flex items-center justify-between gap-2 pt-1'>
        <Text as='span' variant='small'>
          {lead.lastActivity}
        </Text>
        <select
          value={lead.stage}
          onChange={(e) => onStageChange(e.target.value as LeadStage)}
          className='cursor-pointer rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 outline-none transition hover:bg-gray-200'
        >
          {LEAD_STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default function ContractorLeads() {
  const [leads, setLeads] = useState(LEADS)
  const [invites, setInvites] = useState(INVITES)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)

  const paidCount = leads.filter((l) => l.stage === 'paid').length
  const newCount = leads.filter((l) => l.stage === 'new').length
  const conversion = Math.round((paidCount / leads.length) * 100)
  const pendingInvites = invites.filter((i) => i.status === 'pending').length

  const byStage = useMemo(
    () =>
      LEAD_STAGES.map((stage) => ({
        ...stage,
        leads: leads.filter((l) => l.stage === stage.id),
      })),
    [leads],
  )

  const moveLead = (id: number, stage: LeadStage) =>
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage } : l)))

  const sendInvite = (form: FormData) => {
    setInvites((prev) => [
      {
        id: Math.max(0, ...prev.map((i) => i.id)) + 1,
        name: String(form.get('name')),
        email: String(form.get('email')),
        projectId: String(form.get('project')),
        sentAt: new Date().toLocaleDateString('he-IL'),
        status: 'pending',
      },
      ...prev,
    ])
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
            לידים והזמנות
          </Heading>
          <Text variant='muted' className='mt-1'>
            מעקב אחר מתעניינים מכל העולם משלב הפנייה ועד התשלום
          </Text>
        </div>
        <Button
          className='flex items-center gap-2'
          onClick={() => setInviteOpen(true)}
        >
          <PlusIcon className='h-4 w-4' />
          הזמנת לקוח למערכת
        </Button>
      </div>

      {inviteSent && (
        <div className='rounded-xl border border-success-500/30 bg-success-50 px-4 py-3 text-sm font-medium text-success-700'>
          ההזמנה נשלחה בהצלחה! הלקוח יקבל מייל עם קישור הצטרפות אישי.
        </div>
      )}

      {/* KPIs */}
      <div className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
        <StatCard
          label='לידים פעילים'
          value={leads.length - paidCount}
          icon={<FunnelIcon className='h-5 w-5' />}
        />
        <StatCard
          label='לידים חדשים'
          value={newCount}
          hint='ממתינים ליצירת קשר'
          icon={<UsersIcon className='h-5 w-5' />}
        />
        <StatCard
          label='עסקאות שנסגרו'
          value={paidCount}
          hint={`${conversion}% יחס המרה`}
        />
        <StatCard
          label='הזמנות ממתינות'
          value={pendingInvites}
          hint='טרם נרשמו למערכת'
          icon={<MailIcon className='h-5 w-5' />}
        />
      </div>

      {/* Pipeline */}
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-5'>
        {byStage.map((stage) => (
          <div key={stage.id} className='rounded-2xl bg-gray-100/70 p-3'>
            <div className='mb-3 flex items-center gap-2 px-1'>
              <span className={cn('h-2.5 w-2.5 rounded-full', stage.dot)} />
              <span className='text-sm font-semibold text-gray-700'>
                {stage.label}
              </span>
              <span className='mr-auto rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-500'>
                {stage.leads.length}
              </span>
            </div>
            <div className='space-y-2'>
              {stage.leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onStageChange={(s) => moveLead(lead.id, s)}
                />
              ))}
              {stage.leads.length === 0 && (
                <p className='rounded-xl border border-dashed border-gray-200 py-6 text-center text-xs text-gray-400'>
                  אין לידים בשלב זה
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
              הזמנות לקוחות
            </Heading>
            <Text variant='small' className='mt-0.5'>
              לקוחות יכולים להצטרף לפלטפורמה רק בהזמנה אישית ממך
            </Text>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setInviteOpen(true)}
          >
            + הזמנה חדשה
          </Button>
        </div>

        <ul className='divide-y divide-gray-50'>
          {invites.map((invite: Invite) => (
            <li
              key={invite.id}
              className='flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3'
            >
              <span className='flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600'>
                <MailIcon className='h-4 w-4' />
              </span>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-semibold text-gray-900'>
                  {invite.name}
                </p>
                <Text as='p' variant='small' className='truncate'>
                  {invite.email} ·{' '}
                  {projectById(PROJECTS, invite.projectId)?.name}
                </Text>
              </div>
              <Text as='span' variant='small'>
                נשלחה {invite.sentAt}
              </Text>
              <Badge
                variant={invite.status === 'joined' ? 'success' : 'warning'}
              >
                {invite.status === 'joined' ? 'הצטרף/ה' : 'ממתין להרשמה'}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>

      {/* Invite modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title='הזמנת לקוח חדש למערכת'
      >
        <form
          className='space-y-4'
          onSubmit={(e) => {
            e.preventDefault()
            sendInvite(new FormData(e.currentTarget))
          }}
        >
          <Text variant='muted'>
            הלקוח יקבל מייל עם קישור הצטרפות אישי רק כך אפשר להיכנס לפלטפורמה.
          </Text>
          <Field label='שם מלא'>
            <Input name='name' required placeholder='למשל: ישראל ישראלי' />
          </Field>
          <Field label='כתובת אימייל'>
            <Input
              name='email'
              type='email'
              required
              placeholder='name@example.com'
              dir='ltr'
              className='text-right'
            />
          </Field>
          <Field label='שיוך לפרויקט'>
            <Select name='project' defaultValue={PROJECTS[0].id}>
              {PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.flag} {p.name} — {p.city}
                </option>
              ))}
            </Select>
          </Field>
          <div className='flex justify-end gap-2 pt-2'>
            <Button variant='ghost' onClick={() => setInviteOpen(false)}>
              ביטול
            </Button>
            <Button type='submit'>שליחת הזמנה</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
