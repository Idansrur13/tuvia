import { useMemo, useState } from 'react'
import type { Route } from './+types/viewings'
import {
  CalendarDaysIcon,
  CheckCheckIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  PlusIcon,
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
  PillSelect,
  Select,
  StatCard,
  Text,
  TextLink,
} from '../../../components/ui'
import type { Lead, Project, Unit, Viewing, ViewingStatus } from '~/types'
import { VIEWING_STATUS_META } from '~/data'
import {
  createViewing,
  getLeads,
  getProjects,
  getUnitsAgent,
  viewingsFor,
} from '~/server/queries.server'
import { useLocale } from '~/i18n/locale'
import type { DictKey } from '~/i18n/dictionary'
import { Form, useFetcher, useNavigate } from 'react-router'
import { CURRENT_SELLER_ID } from './deals'

/** המוכרת המחוברת (עד שיהיה auth אמיתי). */

export function meta({}: Route.MetaArgs) {
  return [{ title: 'סיורים וביקורים | Viewings' }]
}

export async function loader() {
  const [viewings, leads, projects, units] = await Promise.all([
    viewingsFor(CURRENT_SELLER_ID),
    getLeads(),
    getProjects(),
    getUnitsAgent(CURRENT_SELLER_ID),
  ])

  /* מפות lookup לצירופים בכרטיסי הסיורים — נבנות פעם אחת בצד השרת */
  const leadsById: Record<string, Lead> = Object.fromEntries(
    leads.map((l) => [l.id, l]),
  )
  const unitsById: Record<string, Unit> = Object.fromEntries(
    projects.flatMap((p) => p.units.map((u) => [u.id, u])),
  )
  const projectsById: Record<string, Project> = Object.fromEntries(
    projects.map((p) => [p.id, p]),
  )

  return {
    viewings,
    projects,
    leadsById,
    unitsById,
    projectsById,
    myLeads: leads.filter(
      (l) =>
        l.assignedToId === CURRENT_SELLER_ID &&
        l.stage !== 'won' &&
        l.stage !== 'lost',
    ),
    myUnits: units,
  }
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData()
  const viewing = await createViewing(form)
  return { viewing }
}

/* מפות ה-lookup שה-loader מחזיר, מועברות לכרטיס הסיור */
type Lookups = Awaited<ReturnType<typeof loader>>

type Bucket = 'today' | 'tomorrow' | 'upcoming' | 'past'

const BUCKET_LABEL: Record<Bucket, DictKey> = {
  today: 'vwToday',
  tomorrow: 'vwTomorrow',
  upcoming: 'vwUpcoming',
  past: 'vwPast',
}

function bucketOf(v: Viewing, now: Date): Bucket {
  const d = new Date(v.scheduledAt)
  const today = now.toDateString()
  const tomorrow = new Date(now.getTime() + 86_400_000).toDateString()
  if (d.toDateString() === today)
    return Date.parse(v.scheduledAt) < now.getTime() &&
      (v.status === 'completed' ||
        v.status === 'noShow' ||
        v.status === 'cancelled')
      ? 'past'
      : 'today'
  if (d.toDateString() === tomorrow) return 'tomorrow'
  return d.getTime() > now.getTime() ? 'upcoming' : 'past'
}

function ViewingCard({
  viewing,
  lookups,
  selectedLead,
  onStatusChange,
}: {
  viewing: Viewing
  lookups: Lookups
  selectedLead: (l: Lead) => void
  onStatusChange: (s: ViewingStatus) => void
}) {
  const { t, formatDate, formatTime } = useLocale()
  const lead = lookups.leadsById[viewing.leadId]
  const unit = viewing.unitId ? lookups.unitsById[viewing.unitId] : undefined

  const project = unit?.projectId
    ? lookups.projectsById[unit.projectId]
    : undefined
  const propertyName = t(unit?.title)
  const done =
    viewing.status === 'completed' ||
    viewing.status === 'cancelled' ||
    viewing.status === 'noShow'

  return (
    <Card
      className='flex flex-wrap items-center gap-3'
      onClick={() => {
        if (lead) selectedLead(lead)
      }}
    >
      {/* מועד */}
      <span className='flex h-12 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-50 text-primary-700'>
        <span className='text-sm font-bold' dir='ltr'>
          {formatTime(viewing.scheduledAt)}
        </span>
        <span className='text-[10px]'>{formatDate(viewing.scheduledAt)}</span>
      </span>

      {/* מי + מה */}
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <p className='text-sm font-semibold text-gray-900'>
            {lead?.name ?? '—'}
          </p>
          {lead?.phone && (
            <TextLink variant='pill' href={`tel:${lead.phone}`} dir='ltr'>
              <PhoneIcon className='h-3 w-3' />
              {lead.phone}
            </TextLink>
          )}
        </div>
        <Text as='p' variant='small' className='mt-0.5 flex items-center gap-1'>
          <MapPinIcon className='h-3 w-3 shrink-0' />
          <span className='truncate'>
            {propertyName}
            {project && ` · ${t(project.name)}`}
          </span>
        </Text>
        {viewing.note && (
          <Text as='p' variant='small' className='mt-0.5 truncate'>
            💬 {viewing.note}
          </Text>
        )}
      </div>

      {/* סטטוס */}
      {done ? (
        <Badge variant={VIEWING_STATUS_META[viewing.status].badge}>
          {t(VIEWING_STATUS_META[viewing.status].label)}
        </Badge>
      ) : (
        <Select
          value={viewing.status}
          onChange={(e) => onStatusChange(e.target.value as ViewingStatus)}
        >
          {(Object.keys(VIEWING_STATUS_META) as ViewingStatus[]).map((s) => (
            <option key={s} value={s}>
              {t(VIEWING_STATUS_META[s].label)}
            </option>
          ))}
        </Select>
      )}
    </Card>
  )
}

export default function SellerViewings({ loaderData }: Route.ComponentProps) {
  const { t, tt } = useLocale()
  const navigate = useNavigate()
  const now = new Date()
  const [viewings, setViewings] = useState<Viewing[]>(loaderData.viewings)
  const [modalOpen, setModalOpen] = useState(false)
  const [created, setCreated] = useState(false)
  const fetcher = useFetcher()

  /* ---------- KPI ---------- */
  const todayCount = viewings.filter(
    (v) =>
      new Date(v.scheduledAt).toDateString() === now.toDateString() &&
      v.status !== 'cancelled',
  ).length
  const weekCount = viewings.filter((v) => {
    const dt = Date.parse(v.scheduledAt)
    return (
      dt >= now.getTime() - 86_400_000 && dt < now.getTime() + 7 * 86_400_000
    )
  }).length
  const completed = viewings.filter((v) => v.status === 'completed').length
  const finished = viewings.filter((v) =>
    ['completed', 'noShow', 'cancelled'].includes(v.status),
  ).length
  const completionRate = finished ? Math.round((completed / finished) * 100) : 0

  /* ---------- קיבוץ לפי יום ---------- */
  const buckets = useMemo(() => {
    const map: Record<Bucket, Viewing[]> = {
      today: [],
      tomorrow: [],
      upcoming: [],
      past: [],
    }
    for (const v of viewings) map[bucketOf(v, now)].push(v)
    map.past.sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewings])

  const setStatus = (id: string, status: ViewingStatus) =>
    setViewings((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, status, updatedAt: new Date().toISOString() } : v,
      ),
    )

  /* ---------- תיאום סיור חדש ---------- */
  const { myLeads, myUnits } = loaderData
  const availableUnits = loaderData.projects
    .filter((p) => p.status === 'published')
    .flatMap((p) => p.units.map((u) => ({ project: p, unit: u })))
    .filter(({ unit }) => unit.status !== 'sold')

  const createViewingToDb = (form: FormData) => {
    fetcher.submit(form, { method: 'post' })

    setModalOpen(false)
    setCreated(true)
    setTimeout(() => setCreated(false), 4000)
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title={tt('vwTitle')}
        subtitle={tt('vwSub')}
        actions={
          <Button
            className='flex items-center gap-2'
            onClick={() => setModalOpen(true)}
          >
            <PlusIcon className='h-4 w-4' />
            {tt('vwNew')}
          </Button>
        }
      />

      {created && <Banner variant='success'>{tt('vwCreated')}</Banner>}

      {/* KPIs */}
      <div className='grid grid-cols-3 gap-4'>
        <StatCard
          label={tt('kpiViewingsToday')}
          value={todayCount}
          icon={<CalendarDaysIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('kpiWeekViewings')}
          value={weekCount}
          icon={<ClockIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('kpiCompleted')}
          value={completed}
          hint={`${completionRate}%`}
          icon={<CheckCheckIcon className='h-5 w-5' />}
        />
      </div>

      {/* ---------- קבוצות לפי יום ---------- */}
      {(['today', 'tomorrow', 'upcoming', 'past'] as Bucket[]).map((bucket) => {
        const items = buckets[bucket]
        if (items.length === 0 && bucket !== 'today') return null
        return (
          <section key={bucket}>
            <div className='mb-2 flex items-center gap-2'>
              <Heading level={2} size='md'>
                {tt(BUCKET_LABEL[bucket])}
              </Heading>
              <span className='rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500'>
                {items.length}
              </span>
            </div>
            {items.length === 0 ? (
              <EmptyState
                title={tt('vwNoViewings')}
                icon={<CalendarDaysIcon className='h-5 w-5' />}
              />
            ) : (
              <div className='space-y-2'>
                {items.map((v) => (
                  <ViewingCard
                    key={v.id}
                    viewing={v}
                    lookups={loaderData}
                    selectedLead={(l) => navigate(`/dashboard/leads/${l.id}`)}
                    onStatusChange={(s) => setStatus(v.id, s)}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
      <ScheduleViewing
        modalOpen={modalOpen}
        myLeads={myLeads}
        myUnits={myUnits}
        setModalClose={() => setModalOpen(false)}
        createViewing={(f) => createViewingToDb(f)}
      />
    </div>
  )
}

export function ScheduleViewing({
  modalOpen,
  myLeads,
  myUnits,
  setModalClose,
  createViewing,
}: {
  modalOpen: boolean
  myLeads: Lead[]
  myUnits: Unit[]
  setModalClose: () => void
  createViewing: (f: FormData) => void
}) {
  const { t, tt } = useLocale()
  const now = new Date()

  return (
    <Modal open={modalOpen} onClose={setModalClose} title={tt('vwNew')}>
      <Form
        className='space-y-4'
        onSubmit={(e) => {
          const fd = new FormData(e.currentTarget)
          createViewing(fd)
        }}
      >
        <Field label={tt('vwPickLead')}>
          <Select name='lead' required defaultValue={myLeads[0]?.id}>
            {myLeads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
                {l.phone && ` · ${l.phone}`}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={tt('vwPickProperty')}>
          <Select name='property' required>
            <optgroup label={tt('myMarketed')}>
              {myUnits.map((l) => (
                <option key={l.id} value={l.id}>
                  {t(l.title)}
                </option>
              ))}
            </optgroup>
          </Select>
        </Field>

        <div className='grid grid-cols-2 gap-3'>
          <Field label={tt('vwDate')}>
            <Input
              name='date'
              type='date'
              required
              defaultValue={now.toISOString().slice(0, 10)}
            />
          </Field>
          <Field label={tt('vwTime')}>
            <Input name='time' type='time' required defaultValue='10:00' />
          </Field>
        </div>

        <Field label={tt('vwNote')}>
          <Input name='note' placeholder={tt('addNotePh')} />
        </Field>

        <div className='flex justify-end gap-2 pt-2'>
          <Button variant='ghost' onClick={setModalClose}>
            {tt('cancel')}
          </Button>
          <Button type='submit'>{tt('vwNew')}</Button>
        </div>
      </Form>
    </Modal>
  )
}
