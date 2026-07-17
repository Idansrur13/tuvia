import { AlarmClockIcon } from 'lucide-react'
import { Badge, cn } from '../ui'
import type { Lead, LeadHeat } from '~/types'
import { LEAD_HEAT_META, LEAD_STAGES, LEAD_STAGE_META, USERS } from '~/data'
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
