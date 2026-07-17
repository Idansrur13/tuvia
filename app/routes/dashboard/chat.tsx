import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useFetcher } from 'react-router'
import type { Route } from './+types/chat'
import {
  ArrowRightIcon,
  BuildingIcon,
  CheckCheckIcon,
  CheckIcon,
  ClockIcon,
  FileTextIcon,
  FunnelIcon,
  MessageSquareIcon,
  MessagesSquareIcon,
  PaperclipIcon,
  PlusIcon,
  SendIcon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react'
import {
  Badge,
  Button,
  Heading,
  Modal,
  SearchInput,
  Text,
  cn,
} from '../../components/ui'
import type {
  ChatMessage,
  Conversation,
  ConversationContext,
  Lead,
  MediaAsset,
  Role,
  Unit,
  User,
} from '~/types'
import { LEAD_STAGE_META, formatMoney, unreadCount } from '~/data'
import {
  addParticipant,
  getChatData,
  markConversationRead,
  sendMessage,
  startLeadConversation,
} from '~/server/chat.server'
import {
  getLeads,
  getUsers,
  leadById as dbLeadById,
  unitById,
  userById as dbUserById,
} from '~/server/queries.server'
import { useLocale } from '~/i18n/locale'
import type { DictKey } from '~/i18n/dictionary'
import chatIcon from '~/assets/icons/undraw_chat_qmyo.svg'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'צ׳אט | Chat' }]
}

/* ---------- Loader ---------- */

export async function loader({}: Route.LoaderArgs) {
  const [users, chat, leads] = await Promise.all([
    getUsers(),
    getChatData(),
    getLeads(),
  ])

  /* שולפים רק את היחידות שהתצוגה צריכה:
     יחידת הליד של כל שיחה + יחידות שקושרו להודעות בודדות */
  const leadOf = new Map(leads.map((l) => [l.id, l]))
  const unitIds = new Set<string>()
  for (const c of chat.conversations) {
    const uid = leadOf.get(c.leadId)?.unitId
    if (uid) unitIds.add(uid)
  }
  for (const m of chat.messages)
    if (m.linkedEntity?.type === 'unit') unitIds.add(m.linkedEntity.unitId)

  const units = (
    await Promise.all([...unitIds].map((id) => unitById(id)))
  ).filter((u): u is Unit => Boolean(u))

  return { users, ...chat, leads, units }
}

/* ---------- Action ---------- */

export async function action({ request }: Route.ActionArgs) {
  const fd = await request.formData()
  const intent = fd.get('intent')

  switch (intent) {
    case 'send': {
      await sendMessage({
        conversationId: String(fd.get('conversationId')),
        senderId: String(fd.get('senderId')),
        body: String(fd.get('body') ?? ''),
        attachments: JSON.parse(String(fd.get('attachments') ?? '[]')),
      })
      return { ok: true }
    }
    case 'markRead': {
      await markConversationRead(
        String(fd.get('conversationId')),
        String(fd.get('userId')),
      )
      return { ok: true }
    }
    case 'start': {
      const [by, lead] = await Promise.all([
        dbUserById(String(fd.get('byUserId'))),
        dbLeadById(String(fd.get('leadId'))),
      ])
      if (!by || !lead) return { error: 'not found' }
      const conversationId = await startLeadConversation(by, lead.id)
      return { conversationId }
    }
    case 'addParticipant': {
      const user = await dbUserById(String(fd.get('userId')))
      if (!user) return { error: 'user not found' }
      await addParticipant({
        conversationId: String(fd.get('conversationId')),
        userId: user.id,
        role: user.role,
        addedById: String(fd.get('addedById')),
      })
      return { ok: true }
    }
  }
  return { error: 'unknown intent' }
}

/* ---------- תפקידים ---------- */

const ROLE_META: Record<
  Role,
  {
    labelKey: DictKey
    avatar: string
    badge: 'primary' | 'success' | 'warning' | 'neutral'
  }
> = {
  client: {
    labelKey: 'roleClient',
    avatar: 'bg-success-500',
    badge: 'success',
  },
  contractor: {
    labelKey: 'roleContractor',
    avatar: 'bg-primary-500',
    badge: 'primary',
  },
  seller: { labelKey: 'roleSeller', avatar: 'bg-violet-500', badge: 'warning' },
  admin: { labelKey: 'roleAdmin', avatar: 'bg-gray-800', badge: 'neutral' },
}

/** מטריצת ההרשאות של פרק 2: את מי כל תפקיד יכול לצרף לשיחה. */
const CHAT_MATRIX: Record<Role, Role[]> = {
  client: ['contractor', 'seller'],
  contractor: ['client', 'seller', 'admin'],
  seller: ['client', 'contractor', 'admin'],
  admin: ['client', 'contractor', 'seller', 'admin'],
}

/* ---------- צ'יפים ---------- */

type LinkedInfo = { label: string; Icon: typeof BuildingIcon } | null

function Chip({ label, Icon }: { label: string; Icon: typeof BuildingIcon }) {
  return (
    <span className='inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700'>
      <Icon className='h-3 w-3' />
      {label}
    </span>
  )
}

/* ---------- אבני בניין ---------- */

function Avatar({ user, size = 'md' }: { user?: User; size?: 'sm' | 'md' }) {
  const role = user?.role ?? 'client'
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        ROLE_META[role].avatar,
        size === 'md' ? 'h-10 w-10 text-sm' : 'h-7 w-7 text-xs',
      )}
    >
      {(user?.name ?? '?').slice(0, 1)}
    </span>
  )
}

function DeliveryTicks({ delivery }: { delivery: ChatMessage['delivery'] }) {
  if (delivery === 'sending')
    return <ClockIcon className='h-3.5 w-3.5 text-gray-400' />
  if (delivery === 'sent')
    return <CheckIcon className='h-3.5 w-3.5 text-gray-400' />
  if (delivery === 'delivered')
    return <CheckCheckIcon className='h-3.5 w-3.5 text-gray-400' />
  if (delivery === 'read')
    return <CheckCheckIcon className='h-3.5 w-3.5 text-primary-500' />
  return <XIcon className='h-3.5 w-3.5 text-red-500' />
}

function DateSeparator({ iso }: { iso: string }) {
  const { tt, formatDate } = useLocale()
  const day = new Date(iso)
  const now = new Date()
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  const label = sameDay(day, now)
    ? tt('chatToday')
    : sameDay(day, yesterday)
      ? tt('chatYesterday')
      : formatDate(iso)

  return (
    <div className='my-4 flex items-center gap-3'>
      <span className='h-px flex-1 bg-primary-200' />
      <span className='rounded-full bg-primary-200 px-3 py-0.5 text-xs font-medium text-primary-700'>
        {label}
      </span>
      <span className='h-px flex-1 bg-primary-200' />
    </div>
  )
}

function MessageBubble({
  msg,
  mine,
  showSender,
  sender,
  linkedInfo,
}: {
  msg: ChatMessage
  mine: boolean
  showSender: boolean
  sender?: User
  linkedInfo: (ctx: ConversationContext) => LinkedInfo
}) {
  const { formatTime } = useLocale()
  const linked = msg.linkedEntity ? linkedInfo(msg.linkedEntity) : null

  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[78%] rounded-2xl px-3.5 py-2 shadow-sm sm:max-w-[65%]',
          mine
            ? 'rounded-ee-sm bg-primary-500 text-white'
            : 'rounded-es-sm border border-gray-100 bg-white text-gray-900',
        )}
      >
        {showSender && !mine && sender && (
          <p className='mb-0.5 text-xs font-semibold text-primary-600'>
            {sender.name}
          </p>
        )}

        {msg.attachments?.map((a) =>
          a.kind === 'image' ? (
            <img
              key={a.id}
              src={a.url}
              alt={a.name}
              className='mb-1.5 max-h-48 rounded-xl object-cover'
            />
          ) : null,
        )}

        {msg.body && (
          <p className='whitespace-pre-wrap text-sm leading-relaxed'>
            {msg.body}
          </p>
        )}

        {linked && (
          <div className={cn('mt-1.5', mine && 'opacity-90')}>
            <Chip label={linked.label} Icon={linked.Icon} />
          </div>
        )}

        <div
          className={cn(
            'mt-1 flex items-end  gap-1',
            mine
              ? 'text-primary-50 justify-end'
              : 'text-gray-400 justify-start',
          )}
        >
          <span className='text-xs '>{formatTime(msg.createdAt)}</span>
          {mine && <DeliveryTicks delivery={msg.delivery} />}
        </div>
      </div>
    </div>
  )
}

/* ---------- העמוד ---------- */

export default function ChatPage({ loaderData }: Route.ComponentProps) {
  const { t, tt, formatTime } = useLocale()
  const { users, conversations, messages, leads, units } = loaderData

  const userById = (id: string) => users.find((u) => u.id === id)
  const leadById = (id: string) => leads.find((l) => l.id === id)
  const unitOf = (id?: string) => units.find((u) => u.id === id)

  /* "מחובר/ת בתור" — עד שיהיה auth אמיתי */
  const [currentUserId] = useState('u-yossi')
  const currentUser = userById(currentUserId) ?? users[0]

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const [newChatOpen, setNewChatOpen] = useState(false)
  const [leadQuery, setLeadQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const readFetcher = useFetcher()
  const startFetcher = useFetcher<{ conversationId?: string }>()
  const addFetcher = useFetcher()

  /* צ'יפ של ישות שקושרה להודעה בודדת (יחידה/עסקה/ליד) */
  const linkedInfo = (ctx: ConversationContext): LinkedInfo => {
    switch (ctx.type) {
      case 'unit': {
        const unit = unitOf(ctx.unitId)
        return {
          label: `${tt('chatCtxUnit')} · ${unit ? t(unit.title) : ctx.unitId}`,
          Icon: BuildingIcon,
        }
      }
      case 'deal':
        return {
          label: `${tt('chatCtxDeal')} · ${ctx.dealId}`,
          Icon: FileTextIcon,
        }
      case 'lead':
        return {
          label: `${tt('chatCtxLead')} · ${userById(ctx.leadId)?.name ?? ctx.leadId}`,
          Icon: FunnelIcon,
        }
      case 'direct':
        return null
    }
  }

  /* ---------- נראוּת לפי תפקיד: אדמין רואה הכל, השאר רק שיחות שלהם ---------- */
  const visible = useMemo(() => {
    const mine =
      currentUser.role === 'admin'
        ? conversations
        : conversations.filter((c) =>
            c.participants.some((p) => p.userId === currentUserId),
          )

    const q = query.trim().toLowerCase()
    return mine
      .filter((c) => {
        if (
          filter === 'unread' &&
          unreadCount(messages, c, currentUserId) === 0
        )
          return false
        if (!q) return true
        const names = [
          ...c.participants.map((p) => userById(p.userId)?.name ?? ''),
          leadById(c.leadId)?.name ?? '',
        ]
          .join(' ')
          .toLowerCase()
        const inMessages = messages.some(
          (m) => m.conversationId === c.id && m.body.toLowerCase().includes(q),
        )
        return names.includes(q) || inMessages
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [conversations, messages, currentUserId, currentUser.role, query, filter])

  const selected = conversations.find((c) => c.id === selectedId) ?? null
  const selectedLead = selected ? leadById(selected.leadId) : undefined

  /* משתתפים שאינם אני — לכותרת ולאווטארים */
  const others = (c: Conversation) =>
    c.participants.filter((p) => p.userId !== currentUserId)

  /* ---------- סימון כנקרא ---------- */
  const markRead = (convId: string) => {
    const conv = conversations.find((c) => c.id === convId)
    if (!conv || unreadCount(messages, conv, currentUserId) === 0) return
    readFetcher.submit(
      { intent: 'markRead', conversationId: convId, userId: currentUserId },
      { method: 'post' },
    )
  }

  const selectConversation = (id: string) => {
    setSelectedId(id)
    markRead(id)
  }

  /* בחירה אוטומטית של שיחה שנפתחה עכשיו */
  useEffect(() => {
    const id = startFetcher.data?.conversationId
    if (id) setSelectedId(id)
  }, [startFetcher.data])

  /* ---------- שיחה חדשה — תמיד מול ליד ---------- */
  const startableLeads = useMemo(() => {
    const mine =
      currentUser.role === 'admin'
        ? leads
        : leads.filter((l) => l.assignedToId === currentUserId)
    const q = leadQuery.trim().toLowerCase()
    const filtered = q
      ? mine.filter(
          (l) =>
            l.name.toLowerCase().includes(q) ||
            l.email.toLowerCase().includes(q),
        )
      : mine
    return filtered.slice(0, 30)
  }, [leads, currentUser.role, currentUserId, leadQuery])

  const startChat = (lead: Lead) => {
    setNewChatOpen(false)
    const existing = conversations.find(
      (c) =>
        c.leadId === lead.id &&
        c.participants.some((p) => p.userId === currentUserId),
    )
    if (existing) return selectConversation(existing.id)

    startFetcher.submit(
      { intent: 'start', byUserId: currentUserId, leadId: lead.id },
      { method: 'post' },
    )
  }

  /* ---------- צירוף משתתף לשיחה קיימת ---------- */
  const addableUsers = selected
    ? users.filter(
        (u) =>
          u.status === 'active' &&
          CHAT_MATRIX[currentUser.role].includes(u.role) &&
          !selected.participants.some((p) => p.userId === u.id),
      )
    : []

  const addToConversation = (user: User) => {
    if (!selected) return
    setAddOpen(false)
    addFetcher.submit(
      {
        intent: 'addParticipant',
        conversationId: selected.id,
        userId: user.id,
        addedById: currentUserId,
      },
      { method: 'post' },
    )
  }

  /* ---------- רינדור ---------- */

  return (
    <div className='flex  h-[calc(100dvh-10rem)] flex-col gap-4 lg:h-[calc(100dvh-4rem)] '>
      <div className='flex flex-1 overflow-hidden   rounded-2xl border border-gray-100 bg-white  shadow-sm'>
        {/* ═══ Sidebar ═══ */}
        <aside
          className={cn(
            'flex w-full flex-col border-e border-gray-100 md:w-80  p-2',
            selected && 'hidden md:flex',
          )}
        >
          <div className='space-y-2 border-b border-gray-100 p-2'>
            <div className='flex items-center gap-2'>
              <SearchInput
                className='flex-1'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tt('chatSearch')}
              />
              <Button
                size='sm'
                onClick={() => setNewChatOpen(true)}
                aria-label={tt('chatNewChat')}
                className='shrink-0'
              >
                <PlusIcon className='h-4 w-4' />
              </Button>
            </div>
            <div className='flex gap-1.5'>
              {(['all', 'unread'] as const).map((f) => (
                <button
                  key={f}
                  type='button'
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition',
                    filter === f
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {f === 'all' ? tt('chatAll') : tt('chatUnread')}
                </button>
              ))}
            </div>
          </div>

          <div className='min-h-0 flex-1 overflow-y-auto '>
            {visible.length === 0 ? (
              <div className='px-6 py-16 text-center'>
                <MessagesSquareIcon className='mx-auto h-8 w-8 text-gray-300' />
                <Text as='p' variant='muted' className='mt-2'>
                  {query || filter === 'unread'
                    ? tt('chatEmptyFiltered')
                    : tt('chatNoConversations')}
                </Text>
              </div>
            ) : (
              <ul className='divide-y divide-gray-50'>
                {visible.map((c) => {
                  const other = userById(others(c)[0]?.userId ?? '')
                  const unread = unreadCount(messages, c, currentUserId)
                  const lastMsg = c.lastMessage
                  const lastSenderMe = lastMsg?.senderId === currentUserId
                  const lead = leadById(c.leadId)
                  const leadUnit = unitOf(lead?.unitId)

                  return (
                    <li key={c.id}>
                      <button
                        type='button'
                        onClick={() => selectConversation(c.id)}
                        className={cn(
                          'flex w-full items-start gap-3 px-2 py-2 text-start transition hover:bg-gray-50 ',
                          selectedId === c.id && 'bg-primary-50/60',
                        )}
                      >
                        <Avatar user={other} />

                        <span className='min-w-0 flex-1'>
                          <span className='flex items-baseline justify-between gap-2'>
                            <span className='truncate text-sm font-semibold text-gray-900'>
                              {others(c)
                                .map((p) => userById(p.userId)?.name)
                                .filter(Boolean)
                                .join(', ')}
                            </span>
                            {lastMsg && (
                              <span
                                className='shrink-0 text-xs text-gray-400'
                                dir='ltr'
                              >
                                {formatTime(lastMsg.createdAt)}
                              </span>
                            )}
                          </span>

                          <span className='mt-0.5 flex items-center gap-2'>
                            <span className='truncate text-xs text-gray-500'>
                              {lastMsg
                                ? `${lastSenderMe ? `${tt('chatYou')}: ` : ''}${lastMsg.body}`
                                : tt('chatNoMessages')}
                            </span>
                            {unread > 0 && (
                              <span className='ms-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary-500 px-1.5 text-[11px] font-bold text-white'>
                                {unread}
                              </span>
                            )}
                          </span>

                          <span className='mt-1 flex flex-wrap items-center gap-1.5'>
                            <Chip
                              label={`${tt('chatCtxLead')} · ${lead?.name ?? c.leadId}`}
                              Icon={FunnelIcon}
                            />
                            {leadUnit && (
                              <Chip
                                label={t(leadUnit.title)}
                                Icon={BuildingIcon}
                              />
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* ═══ חלון השיחה ═══ */}
        <section
          className={cn(
            'min-w-0 flex-1 flex-col bg-primary-50',
            selected ? 'flex' : 'hidden md:flex',
          )}
        >
          {!selected ? (
            <div className='flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center'>
              <span className='flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-400'>
                <MessagesSquareIcon className='h-8 w-8' />
              </span>
              <Heading level={2} size='md'>
                {tt('chatSelectConversation')}
              </Heading>
              <Text variant='muted' className='max-w-xs'>
                {tt('chatSelectHint')}
              </Text>
            </div>
          ) : (
            <MainChat
              selected={selected}
              currentUser={currentUser}
              messages={messages}
              users={users}
              lead={selectedLead}
              unit={unitOf(selectedLead?.unitId)}
              linkedInfo={linkedInfo}
              onAddParticipant={() => setAddOpen(true)}
              closeChat={() => setSelectedId(null)}
            />
          )}
        </section>
      </div>

      {/* ═══ שיחה חדשה — בחירת ליד ═══ */}
      <Modal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        title={tt('chatNewChat')}
      >
        <Text variant='muted' className='mb-3'>
          {tt('chatStartWith')}
        </Text>
        <SearchInput
          className='mb-3 w-full'
          value={leadQuery}
          onChange={(e) => setLeadQuery(e.target.value)}
          placeholder={tt('chatSearch')}
        />
        <ul className='max-h-120 divide-y divide-gray-50 overflow-y-auto rounded-xl border border-gray-100'>
          {startableLeads.map((l) => (
            <li key={l.id}>
              <button
                type='button'
                onClick={() => startChat(l)}
                className='flex w-full items-center gap-3 px-3 py-2.5 text-start transition hover:bg-gray-50'
              >
                <Avatar user={l} size='sm' />
                <span className='min-w-0 flex-1'>
                  <span className='block truncate text-sm font-semibold text-gray-900'>
                    {l.name}
                  </span>
                  <span className='block truncate text-xs text-gray-500'>
                    {l.email}
                  </span>
                </span>
                <span className='inline-flex items-center gap-1.5 text-xs text-gray-600'>
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      LEAD_STAGE_META[l.stage].dot,
                    )}
                  />
                  {t(LEAD_STAGE_META[l.stage].label)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      {/* ═══ צירוף משתתף ═══ */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={tt('chatAddParticipant')}
      >
        <Text variant='muted' className='mb-3'>
          {tt('chatAddParticipantHint')}
        </Text>
        <ul className='divide-y max-h-120 divide-gray-50 overflow-auto rounded-xl border border-gray-100'>
          {addableUsers.map((u) => (
            <li key={u.id}>
              <button
                type='button'
                onClick={() => addToConversation(u)}
                className='flex w-full items-center gap-3 px-3 py-2.5 text-start transition hover:bg-gray-50'
              >
                <Avatar user={u} size='sm' />
                <span className='min-w-0 flex-1'>
                  <span className='block truncate text-sm font-semibold text-gray-900'>
                    {u.name}
                  </span>
                  <span className='block truncate text-xs text-gray-500'>
                    {u.email}
                  </span>
                </span>
                <Badge variant={ROLE_META[u.role].badge}>
                  {tt(ROLE_META[u.role].labelKey)}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  )
}

function MainChat({
  selected,
  currentUser,
  messages,
  users,
  lead,
  unit,
  linkedInfo,
  onAddParticipant,
  closeChat,
}: {
  selected: Conversation
  currentUser: User
  messages: ChatMessage[]
  users: User[]
  lead?: Lead
  unit?: Unit
  linkedInfo: (ctx: ConversationContext) => LinkedInfo
  onAddParticipant: () => void
  closeChat: () => void
}) {
  const { t, tt, locale } = useLocale()

  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState<MediaAsset | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const selectedId = selected.id
  const sendFetcher = useFetcher()
  const userById = (id: string) => users.find((u) => u.id === id)
  const others = selected.participants.filter(
    (p) => p.userId !== currentUser.id,
  )
  const isGroup = selected.participants.length > 2

  /* הודעה אופטימית בזמן שליחה */
  const pending =
    sendFetcher.state !== 'idle' &&
    sendFetcher.formData?.get('intent') === 'send' &&
    sendFetcher.formData.get('conversationId') === selectedId
      ? {
          body: String(sendFetcher.formData.get('body') ?? ''),
          attachments: JSON.parse(
            String(sendFetcher.formData.get('attachments') ?? '[]'),
          ) as MediaAsset[],
        }
      : null
  const selectedMessages = useMemo(
    () =>
      messages
        .filter((m) => m.conversationId === selectedId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages, selectedId],
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedMessages.length, pending])

  const headerTitle = isGroup
    ? others
        .map((p) => userById(p.userId)?.name)
        .filter(Boolean)
        .join(', ')
    : (userById(others[0]?.userId ?? '')?.name ?? '')

  /* ---------- שליחה ---------- */
  const send = () => {
    if (!draft.trim() && !attachment) return
    sendFetcher.submit(
      {
        intent: 'send',
        conversationId: selected.id,
        senderId: currentUser.id,
        body: draft.trim(),
        attachments: JSON.stringify(attachment ? [attachment] : []),
      },
      { method: 'post' },
    )
    setDraft('')
    setAttachment(null)
  }

  const attachFile = (file: File | undefined) => {
    if (!file) return
    setAttachment({
      id: `att-${Date.now()}`,
      url: URL.createObjectURL(file),
      kind: 'image',
      name: file.name,
    })
  }

  return (
    <div className='h-full  flex flex-col'>
      {/* כותרת השיחה */}
      <header className=' border-b border-gray-100 bg-white px-4 py-3'>
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={closeChat}
            className='text-gray-400 transition hover:text-gray-700 md:hidden'
          >
            <ArrowRightIcon className='h-5 w-5 rtl:rotate-0 ltr:rotate-180' />
          </button>

          {isGroup ? (
            <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600'>
              <UsersIcon className='h-5 w-5' />
            </span>
          ) : (
            <Avatar user={userById(others[0]?.userId ?? '')} />
          )}

          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-semibold text-gray-900'>
              {headerTitle}
            </p>
            <div className='mt-0.5 flex flex-wrap items-center gap-1.5'>
              {others.map((p) => {
                const u = userById(p.userId)
                if (!u) return null
                return (
                  <Badge key={p.userId} variant={ROLE_META[u.role].badge}>
                    {tt(ROLE_META[u.role].labelKey)}
                  </Badge>
                )
              })}
            </div>
          </div>

          <button
            type='button'
            onClick={onAddParticipant}
            aria-label={tt('chatAddParticipant')}
            className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-primary-600'
          >
            <UserPlusIcon className='h-5 w-5' />
          </button>
        </div>

        {/* הליד של השיחה — ודרכו היחידה, השלב והתקציב */}
        {lead && (
          <div className='mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-orange-200 bg-orange-50 p-4'>
            <Link
              to={`/dashboard/leads/${lead.id}`}
              className='inline-flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:underline'
            >
              <FunnelIcon className='h-3.5 w-3.5' />
              {lead.name}
            </Link>
            <span className='inline-flex items-center gap-1.5 text-xs text-gray-600'>
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  LEAD_STAGE_META[lead.stage].dot,
                )}
              />
              {t(LEAD_STAGE_META[lead.stage].label)}
            </span>
            {lead.budget && (
              <span className='text-xs text-gray-600'>
                {tt('budget')} · {formatMoney(lead.budget, locale)}
              </span>
            )}
            {unit && (
              <Link
                to={`/dashboard/property/${unit.id}`}
                className='inline-flex items-center gap-1.5 text-xs font-medium text-orange-500 hover:underline'
              >
                <BuildingIcon className='h-3.5 w-3.5' />
                {t(unit.title)}
              </Link>
            )}
          </div>
        )}
      </header>

      {/* ההודעות */}
      <div className='min-h-0  flex-1 space-y-2 overflow-y-auto px-4 py-4'>
        {selectedMessages.length === 0 && !pending && (
          <div className=' pt-20 flex flex-col items-center justify-center pointer-events-none'>
            <img src={chatIcon} height={400} width={400} />

            <Text as='p' variant='muted' className='mt-2'>
              {tt('chatNoMessages')}
            </Text>
          </div>
        )}

        {selectedMessages.map((m, i) => {
          const prev = selectedMessages[i - 1]
          const newDay =
            !prev ||
            new Date(prev.createdAt).toDateString() !==
              new Date(m.createdAt).toDateString()
          return (
            <div key={m.id}>
              {newDay && <DateSeparator iso={m.createdAt} />}
              <MessageBubble
                msg={m}
                mine={m.senderId === currentUser.id}
                showSender={isGroup}
                sender={userById(m.senderId)}
                linkedInfo={linkedInfo}
              />
            </div>
          )
        })}

        {pending && (
          <MessageBubble
            msg={{
              id: 'pending',
              conversationId: selected.id,
              senderId: currentUser.id,
              body: pending.body,
              attachments: pending.attachments.length
                ? pending.attachments
                : undefined,
              delivery: 'sending',
              createdAt: new Date().toISOString(),
            }}
            mine
            showSender={false}
            linkedInfo={linkedInfo}
          />
        )}
        <div ref={bottomRef} />
      </div>

      {/* קובץ מצורף ממתין */}
      {attachment && (
        <div className='flex items-center gap-3 border-t border-gray-100 bg-white px-4 py-2'>
          <img
            src={attachment.url}
            alt={attachment.name}
            className='h-12 w-12 rounded-lg object-cover'
          />
          <Text as='span' variant='small' className='min-w-0 truncate'>
            {attachment.name}
          </Text>
          <button
            type='button'
            onClick={() => setAttachment(null)}
            className='ms-auto rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600'
          >
            <XIcon className='h-4 w-4' />
          </button>
        </div>
      )}

      {/* שורת הקלט */}
      <footer className='flex items-center gap-2 border-t border-gray-100 bg-white p-2 mt-auto  '>
        <button
          type='button'
          aria-label={tt('chatAttach')}
          onClick={() => fileRef.current?.click()}
          className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-primary-600'
        >
          <PaperclipIcon className='h-5 w-5' />
        </button>
        <input
          ref={fileRef}
          type='file'
          accept='image/*'
          className='hidden'
          onChange={(e) => attachFile(e.target.files?.[0])}
        />

        <textarea
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder={tt('chatTypeMessage')}
          className='max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100'
        />

        <Button
          onClick={send}
          disabled={!draft.trim() && !attachment}
          aria-label={tt('chatSend')}
          className='  disabled:opacity-40'
        >
          <SendIcon className='h-4 w-4 rtl:-scale-x-100' />
        </Button>
      </footer>
    </div>
  )
}
