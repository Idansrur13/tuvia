import { useEffect, useMemo, useState } from 'react'
import type { Route } from './+types/leads'
import { AnimatePresence } from 'motion/react'
import {
  Badge,
  Banner,
  Button,
  Card,
  Chip,
  Drawer,
  EmptyState,
  Field,
  Heading,
  Input,
  Modal,
  PageHeader,
  Pagination,
  PillSelect,
  SearchInput,
  Select,
  StatCard,
  Text,
  TextLink,
  ToggleGroup,
  cn,
} from '../../components/ui'

import {
  AlarmClockIcon,
  ChevronDownIcon,
  FlameIcon,
  FunnelIcon,
  KanbanIcon,
  MailIcon,
  PhoneIcon,
  PlusIcon,
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

function StageOptions() {
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

function HeatOptions() {
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

function OverdueBadge() {
  const { tt } = useLocale()
  return (
    <Badge variant='danger'>
      <AlarmClockIcon className='h-3 w-3' />
      {tt('overdueBadge')}
    </Badge>
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
            onChange={(e) => onChangeStage(e.target.value as LeadStage)}
          >
            <StageOptions />
          </Select>
        </Field>
        <Field label={tt('colHeat')}>
          <Select
            value={lead.heat}
            onChange={(e) => onChangeHeat(e.target.value as LeadHeat)}
          >
            <HeatOptions />
          </Select>
        </Field>
        <Field label={tt('followUpDate')} className='col-span-2'>
          <Input
            type='date'
            value={lead.nextFollowUpAt?.slice(0, 10) ?? ''}
            onChange={(e) =>
              onSetFollowUp(
                e.target.value ? `${e.target.value}T09:00:00Z` : undefined,
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
      <PageHeader
        title={tt('leadsHeading')}
        subtitle={tt('leadsSubtitle')}
        actions={
          <Button
            className='flex items-center gap-2'
            onClick={() => setInviteOpen(true)}
          >
            <PlusIcon className='h-4 w-4' />
            {tt('inviteClient')}
          </Button>
        }
      />

      {inviteSent && <Banner variant='success'>{tt('inviteSent')}</Banner>}

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
          tone='warning'
          icon={<FlameIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('overdueKpi')}
          value={overdueCount}
          tone='danger'
          icon={<AlarmClockIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('closedDeals')}
          value={wonCount}
          tone='success'
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
            <Chip
              key={p}
              size='sm'
              active={preset === p}
              onClick={() => applyPreset(p)}
            >
              {label}
            </Chip>
          ))}

          {/* מתג תצוגה */}
          <ToggleGroup
            size='sm'
            className='ms-auto'
            value={view}
            onChange={setView}
            options={[
              [
                'table',
                <>
                  <TableIcon className='h-3.5 w-3.5' />
                  {tt('leadsViewTable')}
                </>,
              ],
              [
                'kanban',
                <>
                  <KanbanIcon className='h-3.5 w-3.5' />
                  {tt('leadsViewKanban')}
                </>,
              ],
            ]}
          />
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <SearchInput
            className='min-w-52 flex-1'
            value={filters.query}
            onChange={(e) => patchFilters({ query: e.target.value })}
            placeholder={tt('leadsSearchPh')}
          />

          <PillSelect
            value={filters.stage}
            onChange={(e) =>
              patchFilters({ stage: e.target.value as Filters['stage'] })
            }
          >
            <option value='all'>{tt('allStages')}</option>
            <StageOptions />
          </PillSelect>

          <PillSelect
            value={filters.heat}
            onChange={(e) =>
              patchFilters({ heat: e.target.value as Filters['heat'] })
            }
          >
            <option value='all'>{tt('allHeat')}</option>
            <HeatOptions />
          </PillSelect>

          <PillSelect
            value={filters.source}
            onChange={(e) =>
              patchFilters({ source: e.target.value as Filters['source'] })
            }
          >
            <option value='all'>{tt('allSources')}</option>
            {(Object.keys(LEAD_SOURCE_META) as LeadSource[]).map((s) => (
              <option key={s} value={s}>
                {t(LEAD_SOURCE_META[s].label)}
              </option>
            ))}
          </PillSelect>

          <Chip
            size='sm'
            tone='danger'
            active={filters.overdueOnly}
            icon={<AlarmClockIcon className='h-3.5 w-3.5' />}
            onClick={() => patchFilters({ overdueOnly: !filters.overdueOnly })}
          >
            {tt('overdueOnly')}
          </Chip>

          <PillSelect
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {tt(SORT_LABEL[k])}
              </option>
            ))}
          </PillSelect>

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
                        <PillSelect
                          value={lead.stage}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            changeStage(lead.id, e.target.value as LeadStage)
                          }
                        >
                          <StageOptions />
                        </PillSelect>
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
                    <td colSpan={8} className='p-4'>
                      <EmptyState
                        title={tt('noLeadsFound')}
                        icon={<FunnelIcon className='h-5 w-5' />}
                        action={
                          hasActiveFilters ? (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => applyPreset('all')}
                            >
                              {tt('clearFilters')}
                            </Button>
                          ) : undefined
                        }
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            pageSizeLabel={tt('perPage')}
            prevLabel={tt('prevPage')}
            nextLabel={tt('nextPage')}
            summary={
              <>
                {tt('pagingShowing')}{' '}
                {sorted.length === 0 ? 0 : (page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, sorted.length)} {tt('pagingOf')}{' '}
                {sorted.length}
              </>
            }
            className='border-t border-gray-100 px-4 py-2.5'
          />
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
                        <AlarmClockIcon className='h-3.5 w-3.5 shrink-0 text-danger-500' />
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
                  <EmptyState size='sm' title={tt('noLeadsInStage')} />
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
                {pendingInvites > 0 &&
                  ` · ${pendingInvites} ${tt('statusPending')}`}
                )
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
