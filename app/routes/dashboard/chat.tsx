import { useEffect, useMemo, useRef, useState } from 'react'
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
  SearchIcon,
  SendIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Heading,
  Modal,
  Text,
  cn,
} from '../../components/ui'
import type {
  ChatMessage,
  Conversation,
  ConversationContext,
  MediaAsset,
  Role,
  User,
} from '~/types'
import {
  CONVERSATIONS,
  MESSAGES,
  USERS,
  dealById,
  leadById,
  unitById,
  unreadCount,
} from '~/data'
import { useLocale } from '~/i18n/locale'
import type { DictKey } from '~/i18n/dictionary'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'צ׳אט | Chat' }]
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

/** מטריצת ההרשאות של פרק 2: עם מי כל תפקיד יכול לפתוח שיחה. */
const CHAT_MATRIX: Record<Role, Role[]> = {
  client: ['contractor', 'seller'],
  contractor: ['client', 'seller', 'admin'],
  seller: ['client', 'contractor', 'admin'],
  admin: ['client', 'contractor', 'seller', 'admin'],
}

/** המשתמשים הזמינים למתג "מחובר/ת בתור" — אחד מכל תפקיד + עוד. */
const VIEW_AS_IDS = ['u-yossi', 'u-michal', 'u-ron', 'u-admin']

const userById = (id: string) => USERS.find((u) => u.id === id)

/* ---------- הקשר השיחה ---------- */

function contextInfo(
  ctx: ConversationContext,
  tt: (k: DictKey) => string,
): { label: string; Icon: typeof BuildingIcon } | null {
  switch (ctx.type) {
    case 'unit': {
      const unit = unitById(ctx.unitId)
      return {
        label: `${tt('chatCtxUnit')} · ${unit?.name ?? ctx.unitId}`,
        Icon: BuildingIcon,
      }
    }
    case 'deal': {
      const deal = dealById(ctx.dealId)
      const unit = deal ? unitById(deal.unitId) : undefined
      return {
        label: `${tt('chatCtxDeal')} · ${unit?.name ?? ctx.dealId}`,
        Icon: FileTextIcon,
      }
    }
    case 'lead': {
      const lead = leadById(ctx.leadId)
      return {
        label: `${tt('chatCtxLead')} · ${lead?.name ?? ctx.leadId}`,
        Icon: FunnelIcon,
      }
    }
    case 'direct':
      return null
  }
}

function ContextChip({ ctx }: { ctx: ConversationContext }) {
  const { tt } = useLocale()
  const info = contextInfo(ctx, tt)
  if (!info) return null
  const { label, Icon } = info
  return (
    <span className='inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700'>
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
      <span className='h-px flex-1 bg-gray-100' />
      <span className='rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-500'>
        {label}
      </span>
      <span className='h-px flex-1 bg-gray-100' />
    </div>
  )
}

function MessageBubble({
  msg,
  mine,
  showSender,
}: {
  msg: ChatMessage
  mine: boolean
  showSender: boolean
}) {
  const { formatTime } = useLocale()
  const sender = userById(msg.senderId)

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

        {msg.linkedEntity && msg.linkedEntity.type !== 'direct' && (
          <div className={cn('mt-1.5', mine && 'opacity-90')}>
            <ContextChip ctx={msg.linkedEntity} />
          </div>
        )}

        <div
          className={cn(
            'mt-1 flex items-center justify-end gap-1',
            mine ? 'text-primary-100' : 'text-gray-400',
          )}
        >
          <span className='text-[11px]' dir='ltr'>
            {formatTime(msg.createdAt)}
          </span>
          {mine && <DeliveryTicks delivery={msg.delivery} />}
        </div>
      </div>
    </div>
  )
}

function TypingBubble({ name }: { name: string }) {
  const { tt } = useLocale()
  return (
    <div className='flex justify-start'>
      <div className='flex items-center gap-2 rounded-2xl rounded-es-sm border border-gray-100 bg-white px-3.5 py-2.5 shadow-sm'>
        <span className='flex gap-1'>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className='h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400'
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </span>
        <Text as='span' variant='small'>
          {name} {tt('chatTyping')}
        </Text>
      </div>
    </div>
  )
}

/* ---------- העמוד ---------- */

export default function ChatPage() {
  const { t, tt, formatTime } = useLocale()

  /* "מחובר/ת בתור" — עד שיהיה auth אמיתי */
  const [currentUserId, setCurrentUserId] = useState('u-yossi')
  const currentUser = userById(currentUserId)!

  const [conversations, setConversations] = useState<Conversation[]>(() =>
    structuredClone(CONVERSATIONS),
  )
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    structuredClone(MESSAGES),
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedRef = useRef<string | null>(null)

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState<MediaAsset | null>(null)
  const [typingUserId, setTypingUserId] = useState<string | null>(null)
  const [newChatOpen, setNewChatOpen] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

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
        const names = c.participants
          .map((p) => userById(p.userId)?.name ?? '')
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
  const selectedMessages = useMemo(
    () =>
      messages
        .filter((m) => m.conversationId === selectedId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages, selectedId],
  )

  /* משתתפים שאינם אני — לכותרת ולאווטארים */
  const others = (c: Conversation) =>
    c.participants.filter((p) => p.userId !== currentUserId)

  /* ---------- סימון כנקרא ---------- */
  const markRead = (convId: string) =>
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const last = messages
          .filter((m) => m.conversationId === convId)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          .at(-1)
        if (!last) return c
        return {
          ...c,
          participants: c.participants.map((p) =>
            p.userId === currentUserId
              ? { ...p, lastReadMessageId: last.id }
              : p,
          ),
        }
      }),
    )

  const selectConversation = (id: string) => {
    setSelectedId(id)
    selectedRef.current = id
    markRead(id)
  }

  /* החלפת "מחובר/ת בתור" מאפסת בחירה */
  const switchUser = (id: string) => {
    setCurrentUserId(id)
    setSelectedId(null)
    selectedRef.current = null
    setTypingUserId(null)
  }

  /* גלילה לתחתית עם כל הודעה חדשה */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedMessages.length, typingUserId])

  /* ---------- שליחה + סימולציית מסירה ותגובה (עד שיהיה שרת אמיתי) ---------- */
  const patchMessage = (id: string, patch: Partial<ChatMessage>) =>
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    )

  const touchConversation = (convId: string, last: ChatMessage) =>
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, lastMessage: last, updatedAt: last.createdAt }
          : c,
      ),
    )

  const send = () => {
    if (!selected || (!draft.trim() && !attachment)) return
    const now = new Date().toISOString()
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: selected.id,
      senderId: currentUserId,
      body: draft.trim(),
      attachments: attachment ? [attachment] : undefined,
      delivery: 'sending',
      createdAt: now,
    }
    setMessages((prev) => [...prev, msg])
    touchConversation(selected.id, msg)
    setDraft('')
    setAttachment(null)

    const convId = selected.id
    const replier = userById(others(selected)[0]?.userId ?? '')

    setTimeout(() => patchMessage(msg.id, { delivery: 'sent' }), 350)
    setTimeout(() => patchMessage(msg.id, { delivery: 'delivered' }), 1000)

    if (!replier) return
    setTimeout(() => setTypingUserId(replier.id), 1500)
    setTimeout(() => {
      setTypingUserId(null)
      const replyBody = tt(
        Math.random() > 0.5 ? 'chatDemoReply1' : 'chatDemoReply2',
      )
      const reply: ChatMessage = {
        id: `msg-${Date.now()}-r`,
        conversationId: convId,
        senderId: replier.id,
        body: replyBody,
        delivery: 'sent',
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [
        // התגובה "קוראת" את ההודעות שלי
        ...prev.map((m) =>
          m.conversationId === convId && m.senderId === currentUserId
            ? { ...m, delivery: 'read' as const }
            : m,
        ),
        reply,
      ])
      touchConversation(convId, reply)
      if (selectedRef.current === convId) markRead(convId)
    }, 3300)
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

  /* ---------- שיחה חדשה לפי מטריצת ההרשאות ---------- */
  const allowedCounterparts = USERS.filter(
    (u) =>
      u.id !== currentUserId &&
      CHAT_MATRIX[currentUser.role].includes(u.role) &&
      u.status === 'active',
  )

  const startChat = (withUser: User) => {
    setNewChatOpen(false)
    const existing = conversations.find(
      (c) =>
        !c.isGroup &&
        c.context.type === 'direct' &&
        c.participants.some((p) => p.userId === withUser.id) &&
        c.participants.some((p) => p.userId === currentUserId),
    )
    if (existing) return selectConversation(existing.id)

    const now = new Date().toISOString()
    const conv: Conversation = {
      id: `conv-${Date.now()}`,
      context: { type: 'direct' },
      isGroup: false,
      participants: [
        { userId: currentUserId, role: currentUser.role },
        { userId: withUser.id, role: withUser.role },
      ],
      createdAt: now,
      updatedAt: now,
    }
    setConversations((prev) => [conv, ...prev])
    selectConversation(conv.id)
  }

  /* ---------- רינדור ---------- */

  const headerTitle = selected
    ? selected.isGroup
      ? others(selected)
          .map((p) => userById(p.userId)?.name)
          .filter(Boolean)
          .join(', ')
      : (userById(others(selected)[0]?.userId ?? '')?.name ?? '')
    : ''

  return (
    <div className='flex  h-[calc(100dvh-10rem)] flex-col gap-4 lg:h-[calc(100dvh-4rem)] '>
      {/* Page header */}

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
              <div className='flex flex-1 items-center gap-2 rounded-xl bg-gray-100 px-3 py-2'>
                <SearchIcon className='h-4 w-4 shrink-0 text-gray-400' />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={tt('chatSearch')}
                  className='w-full bg-transparent text-sm outline-none placeholder:text-gray-400'
                />
              </div>
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
                        {c.isGroup ? (
                          <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600'>
                            <UsersIcon className='h-5 w-5' />
                          </span>
                        ) : (
                          <Avatar user={other} />
                        )}

                        <span className='min-w-0 flex-1'>
                          <span className='flex items-baseline justify-between gap-2'>
                            <span className='truncate text-sm font-semibold text-gray-900'>
                              {c.isGroup
                                ? others(c)
                                    .map((p) => userById(p.userId)?.name)
                                    .filter(Boolean)
                                    .join(', ')
                                : (other?.name ?? '')}
                            </span>
                            {lastMsg && (
                              <span
                                className='shrink-0 text-[11px] text-gray-400'
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
                            <ContextChip ctx={c.context} />
                            {c.isGroup && (
                              <Badge variant='neutral'>{tt('chatGroup')}</Badge>
                            )}
                            {!c.isGroup && other && (
                              <Badge variant={ROLE_META[other.role].badge}>
                                {tt(ROLE_META[other.role].labelKey)}
                              </Badge>
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
            'min-w-0 flex-1 flex-col bg-gray-50/60',
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
            <>
              {/* כותרת השיחה */}
              <header className='flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3'>
                <button
                  type='button'
                  onClick={() => {
                    setSelectedId(null)
                    selectedRef.current = null
                  }}
                  className='text-gray-400 transition hover:text-gray-700 md:hidden'
                >
                  <ArrowRightIcon className='h-5 w-5 rtl:rotate-0 ltr:rotate-180' />
                </button>

                {selected.isGroup ? (
                  <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600'>
                    <UsersIcon className='h-5 w-5' />
                  </span>
                ) : (
                  <Avatar user={userById(others(selected)[0]?.userId ?? '')} />
                )}

                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-semibold text-gray-900'>
                    {headerTitle}
                  </p>
                  <div className='mt-0.5 flex flex-wrap items-center gap-1.5'>
                    <ContextChip ctx={selected.context} />
                    {others(selected).map((p) => {
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
              </header>

              {/* ההודעות */}
              <div className='min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4'>
                {selectedMessages.length === 0 && (
                  <div className='py-14 text-center'>
                    <MessageSquareIcon className='mx-auto h-8 w-8 text-gray-300' />
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
                        mine={m.senderId === currentUserId}
                        showSender={selected.isGroup}
                      />
                    </div>
                  )
                })}

                {typingUserId && (
                  <TypingBubble name={userById(typingUserId)?.name ?? ''} />
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
              <footer className='flex items-center gap-2 border-t border-gray-100 bg-white p-3'>
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
            </>
          )}
        </section>
      </div>

      {/* ═══ שיחה חדשה ═══ */}
      <Modal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        title={tt('chatNewChat')}
      >
        <Text variant='muted' className='mb-3'>
          {tt('chatStartWith')}
        </Text>
        <ul className='divide-y divide-gray-50 overflow-hidden rounded-xl border border-gray-100'>
          {allowedCounterparts.map((u) => (
            <li key={u.id}>
              <button
                type='button'
                onClick={() => startChat(u)}
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
