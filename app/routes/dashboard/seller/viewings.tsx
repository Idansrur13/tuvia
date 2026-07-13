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
import type { Viewing, ViewingStatus } from '~/types'
import {
  LEADS,
  LISTINGS,
  PROJECTS,
  VIEWING_STATUS_META,
  leadById,
  listingById,
  unitById,
  viewingsFor,
} from '~/data'
import { useLocale } from '~/i18n/locale'
import type { DictKey } from '~/i18n/dictionary'

/** המוכרת המחוברת (עד שיהיה auth אמיתי). */
const CURRENT_SELLER_ID = 'u-michal'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'סיורים וביקורים | Viewings' }]
}

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
      (v.status === 'completed' || v.status === 'noShow' || v.status === 'cancelled')
      ? 'past'
      : 'today'
  if (d.toDateString() === tomorrow) return 'tomorrow'
  return d.getTime() > now.getTime() ? 'upcoming' : 'past'
}

function ViewingCard({
  viewing,
  onStatusChange,
}: {
  viewing: Viewing
  onStatusChange: (s: ViewingStatus) => void
}) {
  const { t, formatDate, formatTime } = useLocale()
  const lead = leadById(viewing.leadId)
  const unit = viewing.unitId ? unitById(viewing.unitId) : undefined
  const listing = viewing.listingId ? listingById(viewing.listingId) : undefined
  const project = unit
    ? PROJECTS.find((p) => p.id === unit.projectId)
    : undefined
  const propertyName = unit?.name ?? (listing ? t(listing.title) : '—')
  const done =
    viewing.status === 'completed' ||
    viewing.status === 'cancelled' ||
    viewing.status === 'noShow'

  return (
    <Card className='flex flex-wrap items-center gap-3'>
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
        <PillSelect
          value={viewing.status}
          onChange={(e) => onStatusChange(e.target.value as ViewingStatus)}
        >
          {(Object.keys(VIEWING_STATUS_META) as ViewingStatus[]).map((s) => (
            <option key={s} value={s}>
              {t(VIEWING_STATUS_META[s].label)}
            </option>
          ))}
        </PillSelect>
      )}
    </Card>
  )
}

export default function SellerViewings() {
  const { t, tt } = useLocale()
  const now = new Date()

  const [viewings, setViewings] = useState<Viewing[]>(() =>
    viewingsFor(CURRENT_SELLER_ID),
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [created, setCreated] = useState(false)

  /* ---------- KPI ---------- */
  const todayCount = viewings.filter(
    (v) =>
      new Date(v.scheduledAt).toDateString() === now.toDateString() &&
      v.status !== 'cancelled',
  ).length
  const weekCount = viewings.filter((v) => {
    const dt = Date.parse(v.scheduledAt)
    return dt >= now.getTime() - 86_400_000 && dt < now.getTime() + 7 * 86_400_000
  }).length
  const completed = viewings.filter((v) => v.status === 'completed').length
  const finished = viewings.filter((v) =>
    ['completed', 'noShow', 'cancelled'].includes(v.status),
  ).length
  const completionRate = finished
    ? Math.round((completed / finished) * 100)
    : 0

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
        v.id === id
          ? { ...v, status, updatedAt: new Date().toISOString() }
          : v,
      ),
    )

  /* ---------- תיאום סיור חדש ---------- */
  const myLeads = LEADS.filter(
    (l) =>
      l.assignedToId === CURRENT_SELLER_ID &&
      l.stage !== 'won' &&
      l.stage !== 'lost',
  )
  const availableUnits = PROJECTS.filter((p) => p.status === 'published')
    .flatMap((p) => p.units.map((u) => ({ project: p, unit: u })))
    .filter(({ unit }) => unit.status !== 'sold')
  const myListings = LISTINGS.filter((l) => l.agentId === CURRENT_SELLER_ID)

  const createViewing = (form: FormData) => {
    const property = String(form.get('property'))
    const [kind, refId] = property.split(':')
    const nowIso = new Date().toISOString()
    const viewing: Viewing = {
      id: `vw-${Date.now()}`,
      sellerId: CURRENT_SELLER_ID,
      leadId: String(form.get('lead')),
      unitId: kind === 'unit' ? refId : undefined,
      listingId: kind === 'listing' ? refId : undefined,
      scheduledAt: `${form.get('date')}T${form.get('time')}:00Z`,
      status: 'scheduled',
      note: String(form.get('note') || '') || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    }
    setViewings((prev) =>
      [...prev, viewing].sort((a, b) =>
        a.scheduledAt.localeCompare(b.scheduledAt),
      ),
    )
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
                    onStatusChange={(s) => setStatus(v.id, s)}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}

      {/* ---------- מודל תיאום סיור ---------- */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={tt('vwNew')}
      >
        <form
          className='space-y-4'
          onSubmit={(e) => {
            e.preventDefault()
            createViewing(new FormData(e.currentTarget))
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
              <optgroup label={tt('contractorInventory')}>
                {availableUnits.map(({ project, unit }) => (
                  <option key={unit.id} value={`unit:${unit.id}`}>
                    {unit.name} — {t(project.name)}
                  </option>
                ))}
              </optgroup>
              <optgroup label={tt('myMarketed')}>
                {myListings.map((l) => (
                  <option key={l.id} value={`listing:${l.id}`}>
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
            <Button variant='ghost' onClick={() => setModalOpen(false)}>
              {tt('cancel')}
            </Button>
            <Button type='submit'>{tt('vwNew')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
