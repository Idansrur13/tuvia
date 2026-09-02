/*
 * עמוד ליד (פרק 13) — מחליף את פאנל הצד הישן.
 * תצוגה מלאה של הליד עם דגש ויזואלי על השלב בצינור המכירה:
 * stepper אינטראקטיבי, המלצת פעולה לשלב, מדדים, פרטים מלאים ויומן פעילות.
 */
import { useState } from 'react'
import { Link, useFetcher, useNavigate } from 'react-router'
import type { Route } from './+types/lead'
import {
  AlarmClockIcon,
  ArrowLeftIcon,
  ArrowLeftRightIcon,
  CalendarDaysIcon,
  CheckIcon,
  ClipboardPlus,
  ClockIcon,
  GaugeIcon,
  HandshakeIcon,
  HistoryIcon,
  LightbulbIcon,
  MailIcon,
  MapPinIcon,
  MessageSquareIcon,
  PhoneIcon,
  PlusIcon,
  RotateCcwIcon,
  SparklesIcon,
  StickyNoteIcon,
  TrophyIcon,
  UserIcon,
  WalletIcon,
  XIcon,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Heading,
  Input,
  Select,
  StatCard,
  Text,
  TextLink,
  cn,
} from '../../components/ui'
import {
  HeatOptions,
  OverdueBadge,
  ScoreBar,
  isOpen,
  isOverdue,
  userName,
} from '../../components/leads/lead-shared'
import type {
  Deal,
  Lead,
  LeadActivity,
  LeadStage,
  PaymentStatus,
  Project,
  Unit,
  Viewing,
} from '~/types'
import {
  COUNTRIES,
  DEAL_STAGE_META,
  LEAD_ACTIVITY_META,
  LEAD_HEAT_META,
  LEAD_SOURCE_META,
  LEAD_STAGES,
  LEAD_STAGE_META,
  PAYMENT_STATUS_META,
  VIEWING_STATUS_META,
  formatMoney,
} from '~/data'
import {
  addLeadNote,
  changeLeadStage,
  createViewing,
  dealForLead,
  getUnitsAgent,
  leadById,
  markPaymentPaid,
  projectById,
  unitById,
  updateLeadFollowUp,
  updateLeadHeat,
  viewingsForClient,
} from '~/server/queries.server'
import { useLocale } from '~/i18n/locale'
import type { DictKey } from '~/i18n/dictionary'
import { ScheduleViewing } from './seller/viewings'
import { CURRENT_SELLER_ID } from './seller/deals'

/** המשתמש המחובר (עד שיהיה auth אמיתי). */
const CURRENT_USER_ID = 'u-yossi'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'פרטי ליד | Lead' }]
}

export async function loader({ params }: Route.LoaderArgs) {
  const lead = (await leadById(params.id)) ?? null
  const [project, unit, viewings, deal, myUnits] = await Promise.all([
    lead?.projectId ? projectById(lead.projectId) : undefined,
    lead?.unitId ? unitById(lead.unitId) : undefined,
    viewingsForClient(params.id),
    // תשלומים מוצגים רק כשהליד מקושר לפרויקט/יחידה שיש להם עסקה
    lead ? dealForLead(lead.projectId, lead.unitId) : undefined,
    getUnitsAgent(CURRENT_SELLER_ID),
  ])
  return {
    lead,
    project: project ?? null,
    unit: unit ?? null,
    viewings,
    deal: deal ?? null,
    myUnits,
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const form = await request.formData()
  const intent = form.get('intent')
  // אין עדיין סליקה ללקוח — המתווך מאשר ידנית שהתשלום התקבל
  if (intent === 'markPaid') {
    const payment = await markPaymentPaid(String(form.get('paymentId')))
    return { payment }
  }
  if (intent === 'stage') {
    await changeLeadStage({
      leadId: params.id,
      stage: form.get('stage') as Lead['stage'],
      byUserId: CURRENT_USER_ID,
      summary: String(form.get('summary') ?? ''),
    })
    return { ok: true }
  }
  if (intent === 'note') {
    await addLeadNote(
      params.id,
      String(form.get('text') ?? ''),
      CURRENT_USER_ID,
    )
    return { ok: true }
  }
  if (intent === 'followUp') {
    await updateLeadFollowUp(params.id, String(form.get('at') ?? '') || null)
    return { ok: true }
  }
  if (intent === 'heat') {
    await updateLeadHeat(params.id, form.get('heat') as Lead['heat'])
    return { ok: true }
  }
  const viewing = await createViewing(form)
  return { viewing }
}

/* ---------- מטא-נתונים ויזואליים לשלבים ולפעילויות ---------- */

/** שלבי העבודה הפעילים — עמודי ה-stepper (won/lost הם תוצאות, לא שלבים). */
const OPEN_STAGES: LeadStage[] = LEAD_STAGES.filter(
  (s) => s !== 'won' && s !== 'lost',
)

const STAGE_ICON: Record<LeadStage, typeof SparklesIcon> = {
  new: SparklesIcon,
  contacted: PhoneIcon,
  meeting: CalendarDaysIcon,
  negotiation: HandshakeIcon,
  won: TrophyIcon,
  lost: XIcon,
}

/** המלצת הפעולה הבאה לכל שלב. */
const STAGE_HINT: Record<LeadStage, DictKey> = {
  new: 'stageHintNew',
  contacted: 'stageHintContacted',
  meeting: 'stageHintMeeting',
  negotiation: 'stageHintNegotiation',
  won: 'stageHintWon',
  lost: 'stageHintLost',
}

const ACTIVITY_STYLE: Record<LeadActivity['kind'], string> = {
  call: 'bg-sky-50 text-sky-600',
  message: 'bg-violet-50 text-violet-600',
  meeting: 'bg-amber-50 text-amber-600',
  note: 'bg-gray-100 text-gray-500',
  stageChange: 'bg-primary-50 text-primary-600',
}

const ACTIVITY_ICON: Record<LeadActivity['kind'], typeof PhoneIcon> = {
  call: PhoneIcon,
  message: MessageSquareIcon,
  meeting: CalendarDaysIcon,
  note: StickyNoteIcon,
  stageChange: ArrowLeftRightIcon,
}

const PAYMENT_STYLE: Record<PaymentStatus, string> = {
  scheduled: 'bg-gray-100 text-gray-500',
  due: 'bg-amber-50 text-amber-600',
  paid: 'bg-success-50 text-success-600',
  overdue: 'bg-red-50 text-red-600',
}

const PAYMENT_ICON: Record<PaymentStatus, typeof PhoneIcon> = {
  scheduled: CalendarDaysIcon,
  due: ClockIcon,
  paid: CheckIcon,
  overdue: AlarmClockIcon,
}

const isOpenStage = (s?: LeadStage) => !!s && s !== 'won' && s !== 'lost'

/* ---------- העמוד ---------- */

export default function LeadPage({ loaderData }: Route.ComponentProps) {
  const { tt } = useLocale()
  const navigate = useNavigate()

  if (!loaderData.lead) {
    return (
      <EmptyState
        title={tt('leadNotFound')}
        icon={<UserIcon className='h-5 w-5' />}
        action={
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigate('/dashboard/leads')}
          >
            {tt('backToLeads')}
          </Button>
        }
      />
    )
  }

  return (
    <LeadView
      initial={loaderData.lead}
      project={loaderData.project}
      unit={loaderData.unit}
      myUnits={loaderData.myUnits}
      viewings={loaderData.viewings}
      deal={loaderData.deal}
    />
  )
}

function LeadView({
  initial,
  project,
  unit,
  myUnits,
  viewings,
  deal,
}: {
  initial: Lead
  project: Project | null
  unit: Unit | null
  myUnits: Unit[]
  viewings: Viewing[]
  deal: Deal | null
}) {
  const { t, tt, locale, formatDate, formatTime } = useLocale()
  const [lead, setLead] = useState(initial)
  const [note, setNote] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const fetcher = useFetcher()
  /* אישור תשלום — fetcher נפרד כדי שמצב השליחה לא יתערבב עם טופס הסיורים */
  const payFetcher = useFetcher()
  /* fetcher לכל סוג מוטציה — שליחות סמוכות לא מבטלות זו את זו */
  const stageFetcher = useFetcher()
  const noteFetcher = useFetcher()
  const followFetcher = useFetcher()
  const heatFetcher = useFetcher()
  const payingId =
    payFetcher.state !== 'idle' ? payFetcher.formData?.get('paymentId') : null
  const flag = lead.countryCode ? COUNTRIES[lead.countryCode]?.flag : undefined
  const country = lead.countryCode ? COUNTRIES[lead.countryCode] : undefined
  const initials = lead.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')

  const activities = [...lead.activities].sort((a, b) =>
    b.at.localeCompare(a.at),
  )

  /* ---------- מדדי זמן ---------- */
  const lastStageChangeAt =
    activities.find((a) => a.kind === 'stageChange')?.at ?? lead.createdAt
  const daysInStage = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(lastStageChangeAt)) / 86_400_000),
  )
  const daysSinceCreated = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(lead.createdAt)) / 86_400_000),
  )

  /* ---------- מוטציות (כל שינוי שלב נרשם ביומן) ---------- */
  const update = (patch: Partial<Lead>) =>
    setLead((prev) => ({ ...prev, ...patch }))

  const changeStage = (stage: LeadStage) => {
    if (lead.stage === stage) return
    const summary = `${t(LEAD_STAGE_META[lead.stage].label)} → ${t(LEAD_STAGE_META[stage].label)}`
    stageFetcher.submit({ intent: 'stage', stage, summary }, { method: 'post' })
    const now = new Date().toISOString()
    update({
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

  const addNote = (text: string) => {
    noteFetcher.submit({ intent: 'note', text }, { method: 'post' })
    const now = new Date().toISOString()
    update({
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

  /* בחזרה לצינור — לשלב שממנו הליד נסגר, או להתחלה */
  const reopenStage =
    activities.find((a) => a.kind === 'stageChange' && !isOpenStage(a.toStage))
      ?.fromStage ?? 'new'

  /* ---------- תשלומי העסקה ---------- */
  const paidSum =
    deal?.payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount.amount, 0) ?? 0
  const paidCount =
    deal?.payments.filter((p) => p.status === 'paid').length ?? 0
  const paidPct = deal?.price.amount
    ? Math.min(100, Math.round((paidSum / deal.price.amount) * 100))
    : 0

  /* ---------- התקדמות ב-stepper ---------- */
  const open = isOpen(lead)
  const won = lead.stage === 'won'
  const lost = lead.stage === 'lost'
  const currentIdx = won
    ? OPEN_STAGES.length
    : lost
      ? 0
      : OPEN_STAGES.indexOf(lead.stage)
  /* חלק המסלול שהושלם — לקו ההתקדמות שמאחורי העיגולים */
  const progress = Math.min(
    1,
    Math.max(0, currentIdx / (OPEN_STAGES.length - 1)),
  )
  const LeadStage = lead.stage
  return (
    <div className='space-y-5'>
      {/* ---------- כותרת: זהות הליד ---------- */}
      <div>
        <Link
          to='/dashboard/leads'
          className='inline-flex items-center gap-1 text-xs font-medium text-gray-400 transition hover:text-primary-600'
        >
          <ArrowLeftIcon className='h-3.5 w-3.5 rtl:rotate-180' />
          {tt('backToLeads')}
        </Link>

        <div className='mt-2 flex flex-wrap items-center gap-4'>
          <span className='flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-lg font-bold text-primary-700'>
            {initials}
          </span>
          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <Heading level={1} size='lg'>
                {lead.name}
              </Heading>
              {flag && <span className='text-xl leading-none'>{flag}</span>}
              <span
                className={cn(
                  'rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-semibold',
                  LEAD_HEAT_META[lead.heat].text,
                )}
              >
                {t(LEAD_HEAT_META[lead.heat].label)}
              </span>
              {isOverdue(lead) && <OverdueBadge />}
            </div>
            <Text as='p' variant='small' className='mt-0.5'>
              {t(LEAD_SOURCE_META[lead.source].label)}
              {project && ` · ${t(project.name)}`}
              {lead.assignedToId && ` · ${userName(lead.assignedToId)}`}
              {` · ${tt('createdOnLabel')} ${formatDate(lead.createdAt)}`}
            </Text>
          </div>

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
          </div>
        </div>
      </div>

      {/* ---------- מדדים ---------- */}
      <div className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
        <StatCard
          label={tt('colScore')}
          value={lead.score}
          tone='secondary'
          hint={tt('outOf100')}
          icon={<GaugeIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('daysInStage')}
          value={daysInStage}
          tone={isOverdue(lead) ? 'danger' : 'primary'}
          icon={<ClockIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('budget')}
          value={lead.budget ? formatMoney(lead.budget, locale) : '—'}
          tone='success'
          icon={<WalletIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('activitiesCount')}
          value={lead.activities.length}
          tone='warning'
          hint={`${tt('daysSinceCreated')}: ${daysSinceCreated}`}
          icon={<HistoryIcon className='h-5 w-5' />}
        />
      </div>

      <div className='grid gap-5 lg:grid-cols-3'>
        {/* ---------- עמודה ראשית: שלב + יומן ---------- */}
        <div className='space-y-5 lg:col-span-2'>
          {/* ---------- הפוקוס: שלב בתהליך המכירה ---------- */}
          <Card className='space-y-5'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <Heading level={2} size='md'>
                {tt('stagePipelineTitle')}
              </Heading>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
                  won
                    ? 'bg-success-50 text-success-700'
                    : lost
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-primary-50 text-primary-700',
                )}
              >
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    LEAD_STAGE_META[lead.stage].dot,
                  )}
                />
                {t(LEAD_STAGE_META[lead.stage].label)}
              </span>
            </div>

            {/* ה-stepper: לחיצה על שלב מעבירה אליו ונרשמת ביומן */}
            <div className='relative pt-1'>
              <div className='absolute inset-x-[12.5%] top-6 h-1 rounded-full bg-gray-100' />
              <div
                className='absolute inset-s-[12.5%] top-6 h-1 rounded-full bg-primary-500 transition-all'
                style={{ width: `calc(75% * ${lost ? 0 : progress})` }}
              />

              <ol className='relative flex'>
                {OPEN_STAGES.map((s, i) => {
                  const meta = LEAD_STAGE_META[s]
                  const done = i < currentIdx
                  const current = s === lead.stage
                  const Icon = STAGE_ICON[s]
                  return (
                    <li key={s} className='flex flex-1 flex-col items-center'>
                      <button
                        type='button'
                        onClick={() => changeStage(s)}
                        title={t(meta.label)}
                        className={cn(
                          'flex h-11 w-11 items-center justify-center rounded-full  transition',
                          current
                            ? 'border-primary-500 bg-primary-400 text-white shadow-lg shadow-primary-200 ring-3 ring-primary-200'
                            : done
                              ? 'border-primary-500 bg-primary-500 text-white hover:ring-4 hover:ring-primary-100'
                              : 'border-gray-200 bg-white text-gray-300 hover:border-primary-300 hover:text-primary-400',
                        )}
                      >
                        {done && !current ? (
                          <CheckIcon className='h-5 w-5' />
                        ) : (
                          <Icon className='h-5 w-5' />
                        )}
                      </button>
                      <span
                        className={cn(
                          'mt-2 text-center text-xs',
                          current
                            ? 'font-bold text-primary-700'
                            : done
                              ? 'font-medium text-gray-600'
                              : 'text-gray-400',
                        )}
                      >
                        {t(meta.label)}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </div>

            {/* המלצת הפעולה הבאה לשלב הנוכחי */}
            <div
              className={cn(
                'flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm',
                won
                  ? 'bg-success-50 text-success-800'
                  : lost
                    ? 'bg-gray-50 text-gray-600'
                    : 'bg-primary-50/70 text-primary-900',
              )}
            >
              {won ? (
                <TrophyIcon className='mt-0.5 h-4 w-4 shrink-0' />
              ) : (
                <LightbulbIcon className='mt-0.5 h-4 w-4 shrink-0' />
              )}
              <p>{tt(STAGE_HINT[lead.stage])}</p>
            </div>

            {/* תוצאה: סגירה כזכייה/אובדן, או החזרה לצינור */}
            <div className=' items-center gap-2 border-t border-gray-100 pt-4'>
              {/* ---------- סיורים ופגישות של הליד ---------- */}
              <div className='flex items-center justify-between gap-2 pb-2'>
                <div className='flex gap-1'>
                  <Heading level={2} size='md'>
                    {tt('vwTitle')}
                  </Heading>
                  <Text as='span' variant='small'>
                    {viewings.length}
                  </Text>
                </div>
                <Button
                  className='flex items-center gap-2'
                  onClick={() => setModalOpen(true)}
                >
                  <PlusIcon className='h-4 w-4' />
                  {tt('vwNew')}
                </Button>
              </div>

              {viewings.length > 0 && (
                <div className='space-y-3'>
                  <ul className='space-y-2'>
                    {viewings.map((v) => {
                      const meta = VIEWING_STATUS_META[v.status]
                      const past =
                        v.status === 'completed' ||
                        v.status === 'cancelled' ||
                        v.status === 'noShow'
                      return (
                        <li
                          key={v.id}
                          className={cn(
                            'flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 p-3',
                            past && 'opacity-60',
                          )}
                        >
                          {/* מועד */}
                          <span className='flex h-12 w-22   shrink-0 flex-col items-center justify-center rounded-xl border border-primary-100 bg-primary-50 text-primary-700'>
                            <span className='text-sm font-bold' dir='ltr'>
                              {formatTime(v.scheduledAt)}
                            </span>
                            <span className='text-[10px]'>
                              {formatDate(v.scheduledAt)}
                            </span>
                          </span>

                          {/* מי מוביל + הערה */}
                          <div className='min-w-0 flex-1'>
                            <p className='truncate text-sm font-semibold text-gray-900'>
                              {userName(v.sellerId) ?? '—'}
                              {v.durationMin && (
                                <Text
                                  as='span'
                                  variant='small'
                                  className='font-normal'
                                >
                                  {' '}
                                  · {v.durationMin}′
                                </Text>
                              )}
                            </p>
                            {v.note && (
                              <Text as='p' variant='small' className='truncate'>
                                {v.note}
                              </Text>
                            )}
                          </div>

                          <Badge variant={meta.badge}>{t(meta.label)}</Badge>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          </Card>
          <Card>
            {/* ---------- תשלומי העסקה (כשהליד מקושר לפרויקט/יחידה עם עסקה) ---------- */}
            {deal && (
              <div className='space-y-4'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <Heading level={2} size='md'>
                    {tt('colPayments')}
                  </Heading>
                  <span className='flex items-center gap-2 text-xs text-gray-400'>
                    {tt('dealStageLabel')}
                    <Badge variant='primary'>
                      {t(DEAL_STAGE_META[deal.stage].label)}
                    </Badge>
                  </span>
                </div>

                {/* התקדמות התשלומים מול מחיר העסקה */}
                <div className='rounded-xl bg-gray-50 px-4 py-3.5'>
                  <div className='flex flex-wrap items-baseline justify-between gap-2'>
                    <Text as='span' variant='small'>
                      {tt('paidSoFar')}
                    </Text>
                    <span className='text-sm font-bold text-gray-900'>
                      {formatMoney(
                        { amount: paidSum, currency: deal.price.currency },
                        locale,
                      )}{' '}
                      <Text as='span' variant='small' className='font-normal'>
                        / {formatMoney(deal.price, locale)}
                      </Text>
                    </span>
                  </div>
                  <div className='mt-2 h-2 overflow-hidden rounded-full bg-gray-200'>
                    <div
                      className='h-full rounded-full bg-success-500 transition-all'
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>
                  <Text as='p' variant='small' className='mt-1.5'>
                    {paidCount}/{deal.payments.length} {tt('paidOf')} ·{' '}
                    {paidPct}%
                  </Text>
                </div>

                {/* פירוט התשלומים */}
                {deal.payments.length > 0 ? (
                  <ul className='divide-y divide-gray-50'>
                    {deal.payments.map((p) => {
                      const meta = PAYMENT_STATUS_META[p.status]
                      const Icon = PAYMENT_ICON[p.status]
                      return (
                        <li
                          key={p.id}
                          className='flex flex-wrap items-center gap-3 py-2.5'
                        >
                          <span
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                              PAYMENT_STYLE[p.status],
                            )}
                          >
                            <Icon className='h-4 w-4' />
                          </span>
                          <div className='min-w-0 flex-1'>
                            <p className='truncate text-sm font-semibold text-gray-900'>
                              {p.label}
                            </p>
                            <Text as='p' variant='small'>
                              {p.status === 'paid' && p.paidAt
                                ? `${tt('paidOnLabel')} ${formatDate(p.paidAt)}`
                                : `${tt('dueOn')} ${formatDate(p.dueDate)}`}
                            </Text>
                          </div>
                          <span className='text-sm font-bold text-gray-900'>
                            {formatMoney(p.amount, locale)}
                          </span>
                          <Badge variant={meta.badge}>{t(meta.label)}</Badge>
                          {/* אין עדיין סליקה ללקוח — המתווך מאשר שהתשלום התקבל */}
                          {p.status !== 'paid' && (
                            <payFetcher.Form method='post'>
                              <input
                                type='hidden'
                                name='intent'
                                value='markPaid'
                              />
                              <input
                                type='hidden'
                                name='paymentId'
                                value={p.id}
                              />
                              <Button
                                type='submit'
                                size='sm'
                                variant='outline'
                                disabled={payingId === p.id}
                                title={tt('markPaidTitle')}
                                className='flex items-center gap-1.5 text-success-700 hover:bg-success-50'
                              >
                                <CheckIcon className='h-4 w-4' />
                                {payingId === p.id
                                  ? tt('markPaidBusy')
                                  : tt('markPaidBtn')}
                              </Button>
                            </payFetcher.Form>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <Text variant='small'>{tt('noPaymentsYet')}</Text>
                )}
              </div>
            )}
          </Card>
          {/* ---------- יומן פעילות ---------- */}
          <Card className='space-y-4'>
            <Heading level={2} size='md'>
              {tt('activityLog')}
            </Heading>

            <form
              className='flex gap-2'
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

            <ol className='space-y-4'>
              {activities.map((a, i) => {
                const Icon = ACTIVITY_ICON[a.kind]
                return (
                  <li key={a.id} className='relative flex gap-3'>
                    {/* קו מחבר בין הפעילויות */}
                    {i < activities.length - 1 && (
                      <span className='absolute inset-s-4.5 top-9 h-[calc(100%-1rem)] w-px bg-gray-100' />
                    )}
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                        ACTIVITY_STYLE[a.kind],
                      )}
                    >
                      <Icon className='h-4 w-4' />
                    </span>
                    <div className='min-w-0 flex-1 pb-1'>
                      <div className='flex items-baseline justify-between gap-2'>
                        <span className='text-xs font-semibold text-gray-700'>
                          {t(LEAD_ACTIVITY_META[a.kind].label)}
                          {a.kind === 'stageChange' && a.toStage && (
                            <> → {t(LEAD_STAGE_META[a.toStage].label)}</>
                          )}
                        </span>
                        <span
                          className='shrink-0 text-[11px] text-gray-400'
                          dir='ltr'
                        >
                          {formatDate(a.at)} {formatTime(a.at)}
                        </span>
                      </div>
                      <Text as='p' variant='small' className='mt-0.5'>
                        {a.summary}
                        {userName(a.byUserId) && ` — ${userName(a.byUserId)}`}
                      </Text>
                    </div>
                  </li>
                )
              })}
            </ol>
          </Card>
        </div>

        {/* ---------- עמודה צדדית: פרטים ומעקב ---------- */}
        <div className='space-y-5'>
          {/* פרטי התקשרות */}
          <Card className='space-y-3'>
            <Heading level={2} size='md'>
              {tt('contactDetails')}
            </Heading>
            {lead.phone || lead.email || country ? (
              <ul className='space-y-2.5 text-sm'>
                {lead.phone && (
                  <ContactRow icon={<PhoneIcon className='h-4 w-4' />}>
                    <a
                      href={`tel:${lead.phone}`}
                      dir='ltr'
                      className='font-medium text-gray-900 hover:text-primary-600'
                    >
                      {lead.phone}
                    </a>
                  </ContactRow>
                )}
                {lead.email && (
                  <ContactRow icon={<MailIcon className='h-4 w-4' />}>
                    <a
                      href={`mailto:${lead.email}`}
                      dir='ltr'
                      className='truncate font-medium text-gray-900 hover:text-primary-600'
                    >
                      {lead.email}
                    </a>
                  </ContactRow>
                )}
                {country && (
                  <ContactRow icon={<MapPinIcon className='h-4 w-4' />}>
                    <span className='font-medium text-gray-900'>
                      {country.flag} {t(country.name)}
                    </span>
                  </ContactRow>
                )}
              </ul>
            ) : (
              <Text variant='small'>{tt('noContactInfo')}</Text>
            )}
            {/* <div className='flex justify-evenly'>
              <Button variant='outline'>
                <ClipboardPlus />
              </Button>
              <Button variant='outline'>
                <ClipboardPlus />
              </Button>
              <Button variant='outline'>
                <ClipboardPlus />
              </Button>
              <Button variant='outline'>
                <ClipboardPlus />
              </Button>
            </div> */}
          </Card>

          {/* פרטי הליד */}
          <Card className='space-y-3'>
            <Heading level={2} size='md'>
              {tt('leadDetails')}
            </Heading>
            <dl className='space-y-2.5 text-sm'>
              <DetailRow label={tt('sourceLabel')}>
                {t(LEAD_SOURCE_META[lead.source].label)}
              </DetailRow>
              <DetailRow label={tt('colProject')}>
                {project ? t(project.name) : '—'}
              </DetailRow>
              <DetailRow label={tt('colUnit')}>
                {t(unit?.title) ?? '—'}
              </DetailRow>
              <DetailRow label={tt('budget')}>
                {lead.budget ? formatMoney(lead.budget, locale) : '—'}
              </DetailRow>
              <DetailRow label={tt('colAssignee')}>
                {userName(lead.assignedToId) ?? tt('unassigned')}
              </DetailRow>
              <DetailRow label={tt('colScore')}>
                <ScoreBar score={lead.score} />
              </DetailRow>
              <DetailRow label={tt('colLastActivity')}>
                {formatDate(lead.lastActivityAt)}
              </DetailRow>
            </dl>
            <div className='flex justify-between'>
              {open ? (
                <>
                  <Button
                    size='sm'
                    className='flex items-center gap-1.5 bg-success-600 hover:bg-success-700'
                    onClick={() => changeStage('won')}
                  >
                    <TrophyIcon className='h-4 w-4' />
                    {tt('markWon')}
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    className='flex items-center gap-1.5 text-gray-500'
                    onClick={() => changeStage('lost')}
                  >
                    <XIcon className='h-4 w-4' />
                    {tt('markLost')}
                  </Button>
                </>
              ) : (
                <>
                  <Text as='span' variant='small' className='font-medium'>
                    {won ? tt('leadWonBanner') : tt('leadLostBanner')}
                  </Text>
                  <Button
                    size='sm'
                    variant='outline'
                    className='ms-auto flex items-center gap-1.5'
                    onClick={() => changeStage(reopenStage)}
                  >
                    <RotateCcwIcon className='h-4 w-4' />
                    {tt('reopenLead')}
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* מעקב וחום */}
          <Card className='space-y-3'>
            <Heading level={2} size='md'>
              {tt('followUpTitle')}
            </Heading>
            <Field label={tt('followUpDate')}>
              <Input
                type='date'
                value={lead.nextFollowUpAt?.slice(0, 10) ?? ''}
                onChange={(e) => {
                  const at = e.target.value
                    ? `${e.target.value}T09:00:00Z`
                    : undefined
                  followFetcher.submit(
                    { intent: 'followUp', at: at ?? '' },
                    { method: 'post' },
                  )
                  update({ nextFollowUpAt: at })
                }}
              />
            </Field>
            {isOverdue(lead) && (
              <div className='flex items-center gap-2'>
                <OverdueBadge />
                <Text as='span' variant='small'>
                  {formatDate(lead.nextFollowUpAt!)}
                </Text>
              </div>
            )}
            <Field label={tt('colHeat')}>
              <Select
                value={lead.heat}
                onChange={(e) => {
                  const heat = e.target.value as Lead['heat']
                  heatFetcher.submit(
                    { intent: 'heat', heat },
                    { method: 'post' },
                  )
                  update({ heat })
                }}
              >
                <HeatOptions />
              </Select>
            </Field>
          </Card>
        </div>
      </div>
      <ScheduleViewing
        modalOpen={modalOpen}
        myLeads={[lead]}
        myUnits={myUnits}
        setModalClose={() => setModalOpen(false)}
        createViewing={(f) => {
          fetcher.submit(f, { method: 'post' })
        }}
      />
    </div>
  )
}

function ContactRow({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <li className='flex items-center gap-2.5'>
      <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600'>
        {icon}
      </span>
      {children}
    </li>
  )
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='flex items-center justify-between gap-3'>
      <dt className='shrink-0 text-gray-400'>{label}</dt>
      <dd className='text-end font-medium text-gray-900'>{children}</dd>
    </div>
  )
}
