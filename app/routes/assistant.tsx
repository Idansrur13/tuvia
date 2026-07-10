import { useEffect, useRef, useState } from 'react'
import { Link, useFetcher } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import type { Route } from './+types/assistant'
import {
  ArrowLeftIcon,
  MapPinIcon,
  RotateCcwIcon,
  SendIcon,
  SparklesIcon,
} from 'lucide-react'
import { Button, Heading, Text, cn } from '../components/ui'
import { Header } from '~/components/premisions/header'
import { SiteFooter } from '../components/site-footer'
import { formatMoney, listingById } from '~/data'
import type { AiRecommendation, Locale } from '~/types'
import { useLocale } from '~/i18n/locale'
import type { DictKey } from '~/i18n/dictionary'
import type {
  AssistantError,
  AssistantTurn,
} from '../assistant/assistant.server'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'עוזר AI למציאת דירה | AI Home Assistant' },
    {
      name: 'description',
      content: 'שוחחו עם העוזר החכם — הוא ימצא נכסים מתאימים וימליץ על הסביבה.',
    },
  ]
}

/* ---------- Action ---------- */

type ActionData =
  | { reply: string; recommendations: AiRecommendation[]; error?: never }
  | { error: AssistantError; reply?: never; recommendations?: never }

export async function action({
  request,
}: Route.ActionArgs): Promise<ActionData> {
  const fd = await request.formData()

  let history: AssistantTurn[]
  try {
    history = JSON.parse(String(fd.get('history')))
    if (!Array.isArray(history)) throw new Error()
  } catch {
    return { error: 'generic' }
  }

  const locale: Locale = String(fd.get('locale')) === 'en' ? 'en' : 'he'
  const { askAssistant } = await import('../assistant/assistant.server')
  const outcome = await askAssistant(history, locale)
  return outcome.ok
    ? { reply: outcome.reply, recommendations: outcome.recommendations }
    : { error: outcome.error }
}

const ERROR_KEYS: Record<AssistantError, DictKey> = {
  noKey: 'aiErrNoKey',
  rateLimit: 'aiErrRate',
  connection: 'aiErrConn',
  generic: 'aiErrGeneric',
}

/* ---------- הודעות ---------- */

interface UiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  recommendations?: AiRecommendation[]
}

function BotAvatar() {
  return (
    <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-accent-400 text-white shadow-sm'>
      <SparklesIcon className='h-4.5 w-4.5' />
    </span>
  )
}

/** כרטיס המלצה — נכס מהמאגר עם ציון התאמה ונימוק. */
function RecommendationCard({ rec }: { rec: AiRecommendation }) {
  const { t, tt, locale } = useLocale()
  const listing = listingById(rec.listingId)
  if (!listing) return null

  return (
    <Link
      to={`/property/${listing.id}`}
      className='group flex gap-3 rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm transition hover:border-primary-200 hover:shadow-md'
    >
      <img
        src={listing.images[0]?.url}
        alt={t(listing.title)}
        className='h-20 w-24 shrink-0 rounded-xl object-cover'
      />
      <div className='min-w-0 flex-1'>
        <div className='flex items-start justify-between gap-2'>
          <p className='truncate text-sm font-semibold text-gray-900'>
            {t(listing.title)}
          </p>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold',
              rec.matchScore >= 80
                ? 'bg-success-50 text-success-700'
                : rec.matchScore >= 55
                  ? 'bg-warning-50 text-warning-700'
                  : 'bg-gray-100 text-gray-600',
            )}
          >
            {rec.matchScore}% {tt('aiMatch')}
          </span>
        </div>

        <p className='mt-0.5 flex items-center gap-1 text-xs text-gray-500'>
          <MapPinIcon className='h-3 w-3 shrink-0' />
          <span className='truncate'>
            {[listing.address.neighborhood, listing.address.city]
              .filter(Boolean)
              .join(', ')}
            {' · '}
            {listing.rooms} · {listing.sqm} {tt('colSqm')}
          </span>
        </p>

        <p className='mt-1 line-clamp-2 text-xs leading-relaxed text-gray-600'>
          {rec.reason}
        </p>

        <div className='mt-1 flex items-center justify-between gap-2'>
          <span className='text-sm font-bold text-gray-900'>
            {formatMoney(listing.price, locale)}
          </span>
          <span className='flex items-center gap-1 text-xs font-medium text-primary-600 opacity-0 transition group-hover:opacity-100'>
            {tt('aiViewListing')}
            <ArrowLeftIcon className='h-3 w-3 rtl:rotate-0 ltr:rotate-180' />
          </span>
        </div>
      </div>
    </Link>
  )
}

function Message({ msg }: { msg: UiMessage }) {
  const mine = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-2.5', mine ? 'justify-end' : 'justify-start')}
    >
      {!mine && <BotAvatar />}
      <div className={cn('min-w-0 max-w-[85%] sm:max-w-[75%]')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
            mine
              ? 'rounded-ee-sm bg-primary-500 text-white'
              : 'rounded-es-sm border border-gray-100 bg-white text-gray-800',
          )}
        >
          <p className='whitespace-pre-wrap'>{msg.content}</p>
        </div>

        {msg.recommendations && msg.recommendations.length > 0 && (
          <div className='mt-2 space-y-2'>
            {msg.recommendations.map((rec) => (
              <RecommendationCard key={rec.listingId} rec={rec} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function Thinking() {
  const { tt } = useLocale()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className='flex items-center gap-2.5'
    >
      <BotAvatar />
      <div className='flex items-center gap-2 rounded-2xl rounded-es-sm border border-gray-100 bg-white px-4 py-2.5 shadow-sm'>
        <span className='flex gap-1'>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className='h-1.5 w-1.5 animate-bounce rounded-full bg-primary-400'
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </span>
        <Text as='span' variant='small'>
          {tt('aiThinking')}
        </Text>
      </div>
    </motion.div>
  )
}

/* ---------- העמוד ---------- */

export default function AssistantPage() {
  const { tt, locale } = useLocale()
  const fetcher = useFetcher<typeof action>()
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [draft, setDraft] = useState('')
  const handled = useRef<unknown>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loading = fetcher.state !== 'idle'
  const error =
    fetcher.data && 'error' in fetcher.data && fetcher.data.error
      ? tt(ERROR_KEYS[fetcher.data.error])
      : null

  /* צירוף תשובת הבוט כשהיא מגיעה */
  useEffect(() => {
    if (!fetcher.data || fetcher.data === handled.current) return
    handled.current = fetcher.data
    if ('reply' in fetcher.data && fetcher.data.reply) {
      const { reply, recommendations } = fetcher.data
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: reply,
          recommendations,
        },
      ])
    }
  }, [fetcher.data])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, loading])

  const send = (text: string) => {
    const content = text.trim()
    if (!content || loading) return

    const userMsg: UiMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
    }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setDraft('')

    const history: AssistantTurn[] = nextMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }))
    const fd = new FormData()
    fd.append('history', JSON.stringify(history))
    fd.append('locale', locale)
    fetcher.submit(fd, { method: 'post' })
  }

  const reset = () => {
    setMessages([])
    setDraft('')
    handled.current = fetcher.data
  }

  const suggestions: DictKey[] = [
    'aiSuggest1',
    'aiSuggest2',
    'aiSuggest3',
    'aiSuggest4',
  ]

  return (
    <div className='flex min-h-dvh flex-col bg-linear-to-b from-primary-50/70 via-white to-white'>
      <Header />

      <main className='mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-6 pt-6 sm:px-6'>
        {/* כותרת העמוד */}
        <div className='text-center'>
          <motion.span
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className='inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary-500 to-accent-400 text-white shadow-lg shadow-primary-500/20'
          >
            <SparklesIcon className='h-7 w-7' />
          </motion.span>
          <Heading level={1} size='lg' className='mt-3'>
            {tt('aiTitle')}
          </Heading>
          <Text variant='muted' className='mx-auto mt-2 max-w-xl'>
            {tt('aiSubtitle')}
          </Text>
        </div>

        {/* אזור השיחה */}
        <div className='mt-6 flex min-h-0 flex-1 flex-col'>
          <div className='flex-1 space-y-4 overflow-y-auto pb-4'>
            {/* פתיח קבוע של הבוט */}
            <Message
              msg={{
                id: 'greeting',
                role: 'assistant',
                content: tt('aiGreeting'),
              }}
            />

            {messages.map((m) => (
              <Message key={m.id} msg={m} />
            ))}

            <AnimatePresence>{loading && <Thinking />}</AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* הצעות פתיחה */}
          {messages.length === 0 && !loading && (
            <div className='mb-3 flex flex-wrap justify-center gap-2'>
              {suggestions.map((key) => (
                <button
                  key={key}
                  type='button'
                  onClick={() => send(tt(key))}
                  className='rounded-full border border-primary-200 bg-white px-3.5 py-1.5 text-xs font-medium text-primary-700 shadow-sm transition hover:bg-primary-50'
                >
                  {tt(key)}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className='mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700'>
              {error}
            </div>
          )}

          {/* שורת הקלט */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(draft)
            }}
            className='flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg shadow-primary-500/5'
          >
            {messages.length > 0 && (
              <button
                type='button'
                onClick={reset}
                aria-label={tt('chatNewChat')}
                title={tt('chatNewChat')}
                className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700'
              >
                <RotateCcwIcon className='h-4.5 w-4.5' />
              </button>
            )}

            <textarea
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(draft)
                }
              }}
              placeholder={tt('aiInputPh')}
              className='max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-gray-400'
            />

            <Button
              type='submit'
              disabled={!draft.trim() || loading}
              aria-label={tt('chatSend')}
              className=' disabled:opacity-40 items-center justify-center'
            >
              <SendIcon className='h-4 w-4 ' />
            </Button>
          </form>

          <Text as='p' variant='small' className='mt-2 text-center'>
            {tt('aiDisclaimer')}
          </Text>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
