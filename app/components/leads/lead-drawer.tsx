import { useState } from 'react'
import { AlarmClockIcon, MailIcon, PhoneIcon } from 'lucide-react'
import {
  Badge,
  Button,
  Drawer,
  Field,
  Heading,
  Input,
  Select,
  Text,
  TextLink,
  cn,
} from '../ui'
import type { Lead, LeadHeat, LeadStage } from '~/types'
import {
  COUNTRIES,
  LEAD_ACTIVITY_META,
  LEAD_HEAT_META,
  LEAD_SOURCE_META,
  LEAD_STAGES,
  LEAD_STAGE_META,
  USERS,
  formatMoney,
  projectById,
} from '~/data'
import { useLocale } from '~/i18n/locale'

/* ---------- עוזרי דומיין משותפים ללידים ---------- */

export const isOpen = (l: Lead) => l.stage !== 'won' && l.stage !== 'lost'

export const isOverdue = (l: Lead) =>
  isOpen(l) && !!l.nextFollowUpAt && l.nextFollowUpAt < new Date().toISOString()

export const isNewThisWeek = (l: Lead) =>
  Date.now() - Date.parse(l.createdAt) < 7 * 86_400_000

export const userName = (id?: string) => USERS.find((u) => u.id === id)?.name

export function StageOptions() {
  const { t } = useLocale()
  return (
    <>
      {LEAD_STAGES.map((s) => (
        <option key={s} value={s}>
          {t(LEAD_STAGE_META[s].label)}
        </option>
      ))}
    </>
  )
}

export function HeatOptions() {
  const { t } = useLocale()
  return (
    <>
      {(Object.keys(LEAD_HEAT_META) as LeadHeat[]).map((h) => (
        <option key={h} value={h}>
          {t(LEAD_HEAT_META[h].label)}
        </option>
      ))}
    </>
  )
}

export function HeatDot({
  heat,
  withLabel,
}: {
  heat: LeadHeat
  withLabel?: boolean
}) {
  const { t } = useLocale()
  const meta = LEAD_HEAT_META[heat]
  return (
    <span className='inline-flex items-center gap-1.5'>
      <span className={cn('h-2 w-2 rounded-full', meta.dot)} />
      {withLabel && (
        <span className={cn('text-xs font-medium', meta.text)}>
          {t(meta.label)}
        </span>
      )}
    </span>
  )
}

export function ScoreBar({ score }: { score: number }) {
  return (
    <span className='inline-flex items-center gap-2'>
      <span className='h-1.5 w-10 overflow-hidden rounded-full bg-gray-100'>
        <span
          className={cn(
            'block h-full rounded-full',
            score >= 75
              ? 'bg-success-500'
              : score >= 45
                ? 'bg-warning-500'
                : 'bg-gray-300',
          )}
          style={{ width: `${score}%` }}
        />
      </span>
      <span className='text-xs font-semibold text-gray-600'>{score}</span>
    </span>
  )
}

export function OverdueBadge() {
  const { tt } = useLocale()
  return (
    <Badge variant='danger'>
      <AlarmClockIcon className='h-3 w-3' />
      {tt('overdueBadge')}
    </Badge>
  )
}

/* ---------- פאנל צד: פרטי ליד + יומן פעילות ---------- */

export function LeadDrawer({
  lead,
  currentUserId,
  onClose,
  onUpdate,
}: {
  lead: Lead
  /** המשתמש המחובר — נרשם כמבצע ביומן הפעילות. */
  currentUserId: string
  onClose: () => void
  /** callback יחיד: הפאנל בונה בעצמו את רשומות היומן ומחזיר patch מוכן. */
  onUpdate: (patch: Partial<Lead>) => void
}) {
  const { t, tt, locale, formatDate, formatTime } = useLocale()
  const [note, setNote] = useState('')
  const project = projectById(lead.projectId ?? '')
  const flag = lead.countryCode ? COUNTRIES[lead.countryCode]?.flag : undefined

  const activities = [...lead.activities].sort((a, b) =>
    b.at.localeCompare(a.at),
  )

  const changeStage = (stage: LeadStage) => {
    if (lead.stage === stage) return
    const now = new Date().toISOString()
    onUpdate({
      stage,
      lastActivityAt: now,
      updatedAt: now,
      activities: [
        ...lead.activities,
        {
          id: `act-${Date.now()}`,
          at: now,
          kind: 'stageChange',
          byUserId: currentUserId,
          summary: `${t(LEAD_STAGE_META[lead.stage].label)} → ${t(LEAD_STAGE_META[stage].label)}`,
          fromStage: lead.stage,
          toStage: stage,
        },
      ],
    })
  }

  const addNote = (text: string) => {
    const now = new Date().toISOString()
    onUpdate({
      lastActivityAt: now,
      updatedAt: now,
      activities: [
        ...lead.activities,
        {
          id: `act-${Date.now()}`,
          at: now,
          kind: 'note',
          byUserId: currentUserId,
          summary: text,
        },
      ],
    })
  }

  return (
    <Drawer
      onClose={onClose}
      closeLabel={tt('imgClose')}
      header={
        <>
          <div className='flex items-center gap-2'>
            <Heading level={2} size='md'>
              {lead.name}
            </Heading>
            {flag && <span className='text-lg leading-none'>{flag}</span>}
            {isOverdue(lead) && <OverdueBadge />}
          </div>
          <Text as='p' variant='small' className='mt-0.5'>
            {t(LEAD_SOURCE_META[lead.source].label)}
            {project && ` · ${t(project.name)}`}
            {lead.assignedToId && ` · ${userName(lead.assignedToId)}`}
          </Text>
        </>
      }
    >
      {/* יצירת קשר + תקציב */}
      <div className='flex flex-wrap items-center gap-2'>
        {lead.phone && (
          <TextLink variant='pill' href={`tel:${lead.phone}`} dir='ltr'>
            <PhoneIcon className='h-3.5 w-3.5' />
            {lead.phone}
          </TextLink>
        )}
        {lead.email && (
          <TextLink variant='pill' href={`mailto:${lead.email}`} dir='ltr'>
            <MailIcon className='h-3.5 w-3.5' />
            {lead.email}
          </TextLink>
        )}
        {lead.budget && (
          <span className='ms-auto text-sm font-bold text-gray-900'>
            {formatMoney(lead.budget, locale)}
            <Text as='span' variant='small' className='font-normal'>
              {' '}
              {tt('budget')}
            </Text>
          </span>
        )}
      </div>

      {/* עריכה מהירה */}
      <div className='grid grid-cols-2 gap-3'>
        <Field label={tt('colStage')}>
          <Select
            value={lead.stage}
            onChange={(e) => changeStage(e.target.value as LeadStage)}
          >
            <StageOptions />
          </Select>
        </Field>
        <Field label={tt('colHeat')}>
          <Select
            value={lead.heat}
            onChange={(e) => onUpdate({ heat: e.target.value as LeadHeat })}
          >
            <HeatOptions />
          </Select>
        </Field>
        <Field label={tt('followUpDate')} className='col-span-2'>
          <Input
            type='date'
            value={lead.nextFollowUpAt?.slice(0, 10) ?? ''}
            onChange={(e) =>
              onUpdate({
                nextFollowUpAt: e.target.value
                  ? `${e.target.value}T09:00:00Z`
                  : undefined,
              })
            }
          />
        </Field>
      </div>

      {/* ניקוד */}
      <div className='flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-2.5'>
        <Text as='span' variant='small'>
          {tt('colScore')}
        </Text>
        <ScoreBar score={lead.score} />
      </div>

      {/* יומן פעילות */}
      <div>
        <Heading level={3} size='md'>
          {tt('activityLog')}
        </Heading>

        <form
          className='mt-2 flex gap-2'
          onSubmit={(e) => {
            e.preventDefault()
            if (!note.trim()) return
            addNote(note.trim())
            setNote('')
          }}
        >
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={tt('addNotePh')}
          />
          <Button type='submit' size='sm' disabled={!note.trim()}>
            {tt('addNoteBtn')}
          </Button>
        </form>

        <ol className='mt-3 space-y-3 border-s-2 border-gray-100 ps-4'>
          {activities.map((a) => (
            <li key={a.id} className='relative'>
              <span className='absolute -inset-s-5.25 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary-400' />
              <div className='flex items-baseline justify-between gap-2'>
                <span className='text-xs font-semibold text-gray-700'>
                  {t(LEAD_ACTIVITY_META[a.kind].label)}
                  {a.kind === 'stageChange' && a.toStage && (
                    <> → {t(LEAD_STAGE_META[a.toStage].label)}</>
                  )}
                </span>
                <span className='shrink-0 text-[11px] text-gray-400' dir='ltr'>
                  {formatDate(a.at)} {formatTime(a.at)}
                </span>
              </div>
              <Text as='p' variant='small' className='mt-0.5'>
                {a.summary}
                {userName(a.byUserId) && ` — ${userName(a.byUserId)}`}
              </Text>
            </li>
          ))}
        </ol>
      </div>
    </Drawer>
  )
}
