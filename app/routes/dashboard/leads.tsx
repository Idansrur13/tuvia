import { useEffect, useMemo, useState } from 'react'
import type { Route } from './+types/leads'
import { AnimatePresence, motion } from 'motion/react'
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

import {
  AlarmClockIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FlameIcon,
  FunnelIcon,
  KanbanIcon,
  MailIcon,
  PhoneIcon,
  PlusIcon,
  SearchIcon,
  TableIcon,
  XIcon,
} from 'lucide-react'
import type {
  Invite,
  Lead,
  LeadHeat,
  LeadSource,
  LeadStage,
} from '~/types'
import {
  COUNTRIES,
  INVITES,
  LEADS,
  LEAD_ACTIVITY_META,
  LEAD_HEAT_META,
  LEAD_SOURCE_META,
  LEAD_STAGES,
  LEAD_STAGE_META,
  PROJECTS,
  USERS,
  formatMoney,
  projectById,
} from '~/data'
import { useLocale } from '~/i18n/locale'
import type { DictKey } from '~/i18n/dictionary'

/** המשתמש המחובר (עד שיהיה auth אמיתי). */
const CURRENT_USER_ID = 'u-yossi'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'לידים והזמנות | Leads' }]
}

/* ---------- סינון, מיון ותצוגות שמורות ---------- */

type SortKey = 'score' | 'recent' | 'budget' | 'name'
type Preset = 'all' | 'hot' | 'overdue' | 'newWeek'

interface Filters {
  query: string
  stage: LeadStage | 'all'
  heat: LeadHeat | 'all'
  source: LeadSource | 'all'
  overdueOnly: boolean
  newWeek: boolean
}

const EMPTY_FILTERS: Filters = {
  query: '',
  stage: 'all',
  heat: 'all',
  source: 'all',
  overdueOnly: false,
  newWeek: false,
}

const SORT_LABEL: Record<SortKey, DictKey> = {
  score: 'sortScore',
  recent: 'sortRecent',
  budget: 'sortBudget',
  name: 'sortName',
}

const isOpen = (l: Lead) => l.stage !== 'won' && l.stage !== 'lost'

const isOverdue = (l: Lead) =>
  isOpen(l) && !!l.nextFollowUpAt && l.nextFollowUpAt < new Date().toISOString()

const isNewThisWeek = (l: Lead) =>
  Date.now() - Date.parse(l.createdAt) < 7 * 86_400_000

const userName = (id?: string) => USERS.find((u) => u.id === id)?.name

/* ---------- אבני בניין ---------- */

function HeatDot({ heat, withLabel }: { heat: LeadHeat; withLabel?: boolean }) {
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

function ScoreBar({ score }: { score: number }) {
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

function StageSelect({
  value,
  onChange,
  className,
}: {
  value: LeadStage
  onChange: (s: LeadStage) => void
  className?: string
}) {
  const { t } = useLocale()
  return (
    <select
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as LeadStage)}
      className={cn(
        'cursor-pointer rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 outline-none transition hover:bg-gray-200',
        className,
      )}
    >
      {LEAD_STAGES.map((s) => (
        <option key={s} value={s}>
          {t(LEAD_STAGE_META[s].label)}
        </option>
      ))}
    </select>
  )
}

function OverdueBadge() {
  const { tt } = useLocale()
  return (
    <span className='inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700'>
      <AlarmClockIcon className='h-3 w-3' />
      {tt('overdueBadge')}
    </span>
  )
}

/* ---------- פאנל צד: פרטי ליד + יומן פעילות ---------- */

function LeadDrawer({
  lead,
  onClose,
  onChangeStage,
  onChangeHeat,
  onSetFollowUp,
  onAddNote,
}: {
  lead: Lead
  onClose: () => void
  onChangeStage: (s: LeadStage) => void
  onChangeHeat: (h: LeadHeat) => void
  onSetFollowUp: (iso?: string) => void
  onAddNote: (text: string) => void
}) {
  const { t, tt, locale, formatDate, formatTime } = useLocale()
  const [note, setNote] = useState('')
  const project = projectById(lead.projectId ?? '')
  const flag = lead.countryCode ? COUNTRIES[lead.countryCode]?.flag : undefined

  const activities = [...lead.activities].sort((a, b) =>
    b.at.localeCompare(a.at),
  )

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className='fixed inset-0 z-40 bg-gray-900/30 backdrop-blur-[2px]'
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className='fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl'
      >
        {/* כותרת */}
        <div className='flex items-start gap-3 border-b border-gray-100 p-4'>
          <div className='min-w-0 flex-1'>
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
          </div>
          <button
            type='button'
            aria-label={tt('imgClose')}
            onClick={onClose}
            className='rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600'
          >
            <XIcon className='h-5 w-5' />
          </button>
        </div>

        <div className='min-h-0 flex-1 space-y-5 overflow-y-auto p-4'>
          {/* יצירת קשר + תקציב */}
          <div className='flex flex-wrap items-center gap-2'>
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className='inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200'
                dir='ltr'
              >
                <PhoneIcon className='h-3.5 w-3.5' />
                {lead.phone}
              </a>
            )}
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className='inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200'
                dir='ltr'
              >
                <MailIcon className='h-3.5 w-3.5' />
                {lead.email}
              </a>
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
                onChange={(e) => onChangeStage(e.target.value as LeadStage)}
              >
                {LEAD_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {t(LEAD_STAGE_META[s].label)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={tt('colHeat')}>
              <Select
                value={lead.heat}
                onChange={(e) => onChangeHeat(e.target.value as LeadHeat)}
              >
                {(Object.keys(LEAD_HEAT_META) as LeadHeat[]).map((h) => (
                  <option key={h} value={h}>
                    {t(LEAD_HEAT_META[h].label)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={tt('followUpDate')} className='col-span-2'>
              <Input
                type='date'
                value={lead.nextFollowUpAt?.slice(0, 10) ?? ''}
                onChange={(e) =>
                  onSetFollowUp(
                    e.target.value
                      ? `${e.target.value}T09:00:00Z`
                      : undefined,
                  )
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
                onAddNote(note.trim())
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
                  <span className='absolute -start-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary-400' />
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
        </div>
      </motion.aside>
    </>
  )
}

/* ---------- העמוד ---------- */

export default function ContractorLeads() {
  const { t, tt, locale, formatDate } = useLocale()
  const [leads, setLeads] = useState(LEADS)
  const [invites, setInvites] = useState(INVITES)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [invitesExpanded, setInvitesExpanded] = useState(false)

  const [view, setView] = useState<'table' | 'kanban'>('table')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [preset, setPreset] = useState<Preset>('all')
  const [sort, setSort] = useState<SortKey>('score')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  /* עדכון פילטר ידני מבטל את התצוגה השמורה הפעילה */
  const patchFilters = (patch: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
    setPreset('all')
  }

  const applyPreset = (p: Preset) => {
    setPreset(p)
    setFilters(
      p === 'hot'
        ? { ...EMPTY_FILTERS, heat: 'hot' }
        : p === 'overdue'
          ? { ...EMPTY_FILTERS, overdueOnly: true }
          : p === 'newWeek'
            ? { ...EMPTY_FILTERS, stage: 'new', newWeek: true }
            : EMPTY_FILTERS,
    )
    setSort(p === 'overdue' ? 'recent' : 'score')
  }

  const hasActiveFilters =
    filters !== EMPTY_FILTERS &&
    (filters.query !== '' ||
      filters.stage !== 'all' ||
      filters.heat !== 'all' ||
      filters.source !== 'all' ||
      filters.overdueOnly ||
      filters.newWeek)

  /* ---------- סינון + מיון + עימוד ---------- */
  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    return leads.filter((l) => {
      if (filters.stage !== 'all' && l.stage !== filters.stage) return false
      if (filters.heat !== 'all' && l.heat !== filters.heat) return false
      if (filters.source !== 'all' && l.source !== filters.source) return false
      if (filters.overdueOnly && !isOverdue(l)) return false
      if (filters.newWeek && !isNewThisWeek(l)) return false
      if (!q) return true
      return (
        l.name.toLowerCase().includes(q) ||
        (l.phone ?? '').includes(q) ||
        (l.email ?? '').toLowerCase().includes(q)
      )
    })
  }, [leads, filters])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    switch (sort) {
      case 'score':
        return arr.sort((a, b) => b.score - a.score)
      case 'recent':
        return arr.sort((a, b) =>
          b.lastActivityAt.localeCompare(a.lastActivityAt),
        )
      case 'budget':
        return arr.sort(
          (a, b) => (b.budget?.amount ?? 0) - (a.budget?.amount ?? 0),
        )
      case 'name':
        return arr.sort((a, b) => a.name.localeCompare(b.name, 'he'))
    }
  }, [filtered, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setPage(1)
  }, [filters, sort, pageSize, view])

  /* ---------- KPIs ---------- */
  const active = leads.filter(isOpen)
  const hotCount = active.filter((l) => l.heat === 'hot').length
  const overdueCount = leads.filter(isOverdue).length
  const wonCount = leads.filter((l) => l.stage === 'won').length
  const conversion = leads.length
    ? Math.round((wonCount / leads.length) * 100)
    : 0

  /* ---------- מוטציות (מעקב מתקדם: כל שינוי נרשם ביומן) ---------- */
  const patchLead = (id: string, patch: Partial<Lead>) =>
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))

  const changeStage = (id: string, stage: LeadStage) => {
    const lead = leads.find((l) => l.id === id)
    if (!lead || lead.stage === stage) return
    const now = new Date().toISOString()
    patchLead(id, {
      stage,
      lastActivityAt: now,
      updatedAt: now,
      activities: [
        ...lead.activities,
        {
          id: `act-${Date.now()}`,
          at: now,
          kind: 'stageChange',
          byUserId: CURRENT_USER_ID,
          summary: `${t(LEAD_STAGE_META[lead.stage].label)} → ${t(LEAD_STAGE_META[stage].label)}`,
          fromStage: lead.stage,
          toStage: stage,
        },
      ],
    })
  }

  const addNote = (id: string, text: string) => {
    const lead = leads.find((l) => l.id === id)
    if (!lead) return
    const now = new Date().toISOString()
    patchLead(id, {
      lastActivityAt: now,
      updatedAt: now,
      activities: [
        ...lead.activities,
        {
          id: `act-${Date.now()}`,
          at: now,
          kind: 'note',
          byUserId: CURRENT_USER_ID,
          summary: text,
        },
      ],
    })
  }

  const selectedLead = leads.find((l) => l.id === selectedId) ?? null

  /* ---------- הזמנות ---------- */
  const pendingInvites = invites.filter((i) => i.status === 'pending').length

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

  /* ---------- קנבן ---------- */
  const byStage = useMemo(
    () =>
      LEAD_STAGES.map((stage) => ({
        stage,
        meta: LEAD_STAGE_META[stage],
        leads: sorted.filter((l) => l.stage === stage),
      })),
    [sorted],
  )

  return (
    <div className='space-y-5'>
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
        <Button
          className='flex items-center gap-2'
          onClick={() => setInviteOpen(true)}
        >
          <PlusIcon className='h-4 w-4' />
          {tt('inviteClient')}
        </Button>
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
          value={active.length}
          icon={<FunnelIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('hotLeadsKpi')}
          value={hotCount}
          icon={<FlameIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('overdueKpi')}
          value={overdueCount}
          icon={<AlarmClockIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('closedDeals')}
          value={wonCount}
          hint={`${conversion}% ${tt('conversionRate')}`}
        />
      </div>

      {/* ---------- סרגל כלים: תצוגות שמורות, חיפוש, סינון, מיון ---------- */}
      <Card className='space-y-3 p-3'>
        <div className='flex flex-wrap items-center gap-2'>
          {/* תצוגות שמורות */}
          {(
            [
              ['all', tt('all')],
              ['hot', tt('presetHot')],
              ['overdue', tt('presetOverdue')],
              ['newWeek', tt('presetNewWeek')],
            ] as [Preset, string][]
          ).map(([p, label]) => (
            <button
              key={p}
              type='button'
              onClick={() => applyPreset(p)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition',
                preset === p
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {label}
            </button>
          ))}

          {/* מתג תצוגה */}
          <div className='ms-auto flex rounded-xl border border-gray-200 p-0.5'>
            {(
              [
                ['table', TableIcon, tt('leadsViewTable')],
                ['kanban', KanbanIcon, tt('leadsViewKanban')],
              ] as const
            ).map(([v, Icon, label]) => (
              <button
                key={v}
                type='button'
                onClick={() => setView(v)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
                  view === v
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-500 hover:text-gray-900',
                )}
              >
                <Icon className='h-3.5 w-3.5' />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <div className='flex min-w-52 flex-1 items-center gap-2 rounded-xl bg-gray-100 px-3 py-2'>
            <SearchIcon className='h-4 w-4 shrink-0 text-gray-400' />
            <input
              value={filters.query}
              onChange={(e) => patchFilters({ query: e.target.value })}
              placeholder={tt('leadsSearchPh')}
              className='w-full bg-transparent text-sm outline-none placeholder:text-gray-400'
            />
          </div>

          <select
            value={filters.stage}
            onChange={(e) =>
              patchFilters({ stage: e.target.value as Filters['stage'] })
            }
            className='cursor-pointer rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-700 outline-none'
          >
            <option value='all'>{tt('allStages')}</option>
            {LEAD_STAGES.map((s) => (
              <option key={s} value={s}>
                {t(LEAD_STAGE_META[s].label)}
              </option>
            ))}
          </select>

          <select
            value={filters.heat}
            onChange={(e) =>
              patchFilters({ heat: e.target.value as Filters['heat'] })
            }
            className='cursor-pointer rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-700 outline-none'
          >
            <option value='all'>{tt('allHeat')}</option>
            {(Object.keys(LEAD_HEAT_META) as LeadHeat[]).map((h) => (
              <option key={h} value={h}>
                {t(LEAD_HEAT_META[h].label)}
              </option>
            ))}
          </select>

          <select
            value={filters.source}
            onChange={(e) =>
              patchFilters({ source: e.target.value as Filters['source'] })
            }
            className='cursor-pointer rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-700 outline-none'
          >
            <option value='all'>{tt('allSources')}</option>
            {(Object.keys(LEAD_SOURCE_META) as LeadSource[]).map((s) => (
              <option key={s} value={s}>
                {t(LEAD_SOURCE_META[s].label)}
              </option>
            ))}
          </select>

          <button
            type='button'
            onClick={() => patchFilters({ overdueOnly: !filters.overdueOnly })}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-medium transition',
              filters.overdueOnly
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
            )}
          >
            <AlarmClockIcon className='h-3.5 w-3.5' />
            {tt('overdueOnly')}
          </button>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className='cursor-pointer rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-700 outline-none'
          >
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {tt(SORT_LABEL[k])}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type='button'
              onClick={() => applyPreset('all')}
              className='flex items-center gap-1 text-xs font-medium text-gray-400 transition hover:text-gray-700'
            >
              <XIcon className='h-3.5 w-3.5' />
              {tt('clearFilters')}
            </button>
          )}

          <Text as='span' variant='small' className='ms-auto shrink-0'>
            {sorted.length} {tt('leadsCountLabel')}
          </Text>
        </div>
      </Card>

      {/* ---------- תצוגת טבלה (ברירת מחדל — בנויה למאות לידים) ---------- */}
      {view === 'table' && (
        <Card className='p-0'>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-200 text-sm'>
              <thead>
                <tr className='border-b border-gray-100 text-start text-xs text-gray-400'>
                  <th className='px-4 py-2.5 text-start font-medium'>
                    {tt('colLead')}
                  </th>
                  <th className='px-3 py-2.5 text-start font-medium'>
                    {tt('colProject')}
                  </th>
                  <th className='px-3 py-2.5 text-start font-medium'>
                    {tt('colBudget')}
                  </th>
                  <th className='px-3 py-2.5 text-start font-medium'>
                    {tt('colStage')}
                  </th>
                  <th className='px-3 py-2.5 text-start font-medium'>
                    {tt('colHeat')}
                  </th>
                  <th className='px-3 py-2.5 text-start font-medium'>
                    {tt('colScore')}
                  </th>
                  <th className='px-3 py-2.5 text-start font-medium'>
                    {tt('colAssignee')}
                  </th>
                  <th className='px-3 py-2.5 text-start font-medium'>
                    {tt('colFollowUp')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((lead) => {
                  const project = projectById(lead.projectId ?? '')
                  const flag = lead.countryCode
                    ? COUNTRIES[lead.countryCode]?.flag
                    : undefined
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedId(lead.id)}
                      className='cursor-pointer border-b border-gray-50 transition hover:bg-gray-50/70'
                    >
                      <td className='px-4 py-2'>
                        <div className='flex items-center gap-2'>
                          {flag && <span>{flag}</span>}
                          <div className='min-w-0'>
                            <p className='truncate font-semibold text-gray-900'>
                              {lead.name}
                            </p>
                            <p className='truncate text-xs text-gray-400'>
                              {t(LEAD_SOURCE_META[lead.source].label)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='px-3 py-2 text-xs text-gray-600'>
                        {project ? t(project.name) : '—'}
                      </td>
                      <td className='whitespace-nowrap px-3 py-2 text-xs font-semibold text-gray-900'>
                        {lead.budget ? formatMoney(lead.budget, locale) : '—'}
                      </td>
                      <td className='px-3 py-2'>
                        <StageSelect
                          value={lead.stage}
                          onChange={(s) => changeStage(lead.id, s)}
                        />
                      </td>
                      <td className='px-3 py-2'>
                        <HeatDot heat={lead.heat} withLabel />
                      </td>
                      <td className='px-3 py-2'>
                        <ScoreBar score={lead.score} />
                      </td>
                      <td className='px-3 py-2 text-xs text-gray-600'>
                        {userName(lead.assignedToId) ?? tt('unassigned')}
                      </td>
                      <td className='whitespace-nowrap px-3 py-2 text-xs text-gray-600'>
                        {isOverdue(lead) ? (
                          <OverdueBadge />
                        ) : lead.nextFollowUpAt ? (
                          formatDate(lead.nextFollowUpAt)
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  )
                })}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={8} className='px-4 py-12 text-center'>
                      <Text variant='muted'>{tt('noLeadsFound')}</Text>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* עימוד */}
          <div className='flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-2.5'>
            <Text as='span' variant='small'>
              {tt('pagingShowing')} {sorted.length === 0 ? 0 : (page - 1) * pageSize + 1}
              –{Math.min(page * pageSize, sorted.length)} {tt('pagingOf')}{' '}
              {sorted.length}
            </Text>
            <div className='flex items-center gap-2'>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className='cursor-pointer rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none'
              >
                {[25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} {tt('perPage')}
                  </option>
                ))}
              </select>
              <button
                type='button'
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label={tt('prevPage')}
                className='rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-50 disabled:opacity-40'
              >
                <ChevronRightIcon className='h-4 w-4 ltr:hidden' />
                <ChevronLeftIcon className='h-4 w-4 rtl:hidden' />
              </button>
              <Text as='span' variant='small' dir='ltr'>
                {page} / {totalPages}
              </Text>
              <button
                type='button'
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                aria-label={tt('nextPage')}
                className='rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:bg-gray-50 disabled:opacity-40'
              >
                <ChevronLeftIcon className='h-4 w-4 ltr:hidden' />
                <ChevronRightIcon className='h-4 w-4 rtl:hidden' />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* ---------- תצוגת קנבן ---------- */}
      {view === 'kanban' && (
        <div className='grid gap-3 md:grid-cols-3 xl:grid-cols-6'>
          {byStage.map(({ stage, meta, leads: stageLeads }) => (
            <div key={stage} className='rounded-2xl bg-gray-100/70 p-2.5'>
              <div className='mb-2 flex items-center gap-2 px-1'>
                <span className={cn('h-2.5 w-2.5 rounded-full', meta.dot)} />
                <span className='text-sm font-semibold text-gray-700'>
                  {t(meta.label)}
                </span>
                <span className='ms-auto rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-500'>
                  {stageLeads.length}
                </span>
              </div>
              <div className='space-y-1.5'>
                {stageLeads.slice(0, 12).map((lead) => (
                  <button
                    key={lead.id}
                    type='button'
                    onClick={() => setSelectedId(lead.id)}
                    className='w-full rounded-xl border border-gray-100 bg-white p-2.5 text-start shadow-sm transition hover:border-primary-200'
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <span className='truncate text-sm font-semibold text-gray-900'>
                        {lead.name}
                      </span>
                      <HeatDot heat={lead.heat} />
                    </div>
                    <div className='mt-1 flex items-center justify-between gap-2'>
                      <span className='truncate text-xs text-gray-400'>
                        {lead.budget
                          ? formatMoney(lead.budget, locale)
                          : t(LEAD_SOURCE_META[lead.source].label)}
                      </span>
                      {isOverdue(lead) && (
                        <AlarmClockIcon className='h-3.5 w-3.5 shrink-0 text-red-500' />
                      )}
                    </div>
                  </button>
                ))}
                {stageLeads.length > 12 && (
                  <button
                    type='button'
                    onClick={() => setView('table')}
                    className='w-full rounded-xl border border-dashed border-gray-200 py-2 text-center text-xs text-gray-400 transition hover:text-primary-600'
                  >
                    +{stageLeads.length - 12} {tt('kanbanMore')}
                  </button>
                )}
                {stageLeads.length === 0 && (
                  <p className='rounded-xl border border-dashed border-gray-200 py-5 text-center text-xs text-gray-400'>
                    {tt('noLeadsInStage')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------- הזמנות לקוחות (מקופל כברירת מחדל) ---------- */}
      <Card className='p-0'>
        <button
          type='button'
          onClick={() => setInvitesExpanded((v) => !v)}
          className='flex w-full flex-wrap items-center justify-between gap-2 p-4 text-start'
        >
          <div>
            <Heading level={3} size='md'>
              {tt('invitesTitle')}{' '}
              <span className='text-sm font-normal text-gray-400'>
                ({invites.length}
                {pendingInvites > 0 && ` · ${pendingInvites} ${tt('statusPending')}`})
              </span>
            </Heading>
            <Text variant='small' className='mt-0.5'>
              {tt('invitesSubtitle')}
            </Text>
          </div>
          <ChevronDownIcon
            className={cn(
              'h-5 w-5 text-gray-400 transition',
              invitesExpanded && 'rotate-180',
            )}
          />
        </button>

        {invitesExpanded && (
          <ul className='divide-y divide-gray-50 border-t border-gray-100'>
            {invites.map((invite) => (
              <InviteRow key={invite.id} invite={invite} />
            ))}
          </ul>
        )}
      </Card>

      {/* ---------- פאנל פרטי ליד ---------- */}
      <AnimatePresence>
        {selectedLead && (
          <LeadDrawer
            lead={selectedLead}
            onClose={() => setSelectedId(null)}
            onChangeStage={(s) => changeStage(selectedLead.id, s)}
            onChangeHeat={(h) => patchLead(selectedLead.id, { heat: h })}
            onSetFollowUp={(iso) =>
              patchLead(selectedLead.id, { nextFollowUpAt: iso })
            }
            onAddNote={(text) => addNote(selectedLead.id, text)}
          />
        )}
      </AnimatePresence>

      {/* ---------- מודל הזמנה ---------- */}
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
