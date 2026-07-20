import { useEffect, useMemo, useState } from 'react'
import { useFetcher } from 'react-router'
import type { Route } from './+types/users'
import {
  Badge,
  Card,
  Chip,
  EmptyState,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatCard,
} from '../../../components/ui'
import {
  ShieldAlertIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react'
import type { Role, UserStatus } from '~/types'
import { getUsersAdmin, setUserStatus } from '~/server/admin.server'
import { useLocale } from '~/i18n/locale'
import {
  ROLE_LABELS,
  USER_STATUS_META,
} from '~/components/admin/admin-shared'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'ניהול משתמשים | Admin' }]
}

export async function loader() {
  return { rows: await getUsersAdmin() }
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData()
  if (form.get('intent') === 'status') {
    await setUserStatus(
      String(form.get('userId')),
      form.get('status') as UserStatus,
    )
  }
  return { ok: true }
}

const ROLES = Object.keys(ROLE_LABELS) as Role[]
const STATUSES = Object.keys(USER_STATUS_META) as UserStatus[]

export default function AdminUsers({ loaderData }: Route.ComponentProps) {
  const { tt, formatDate } = useLocale()
  const statusFetcher = useFetcher()

  const [rows, setRows] = useState(loaderData.rows)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const changeStatus = (userId: string, status: UserStatus) => {
    statusFetcher.submit(
      { intent: 'status', userId, status },
      { method: 'post' },
    )
    setRows((prev) =>
      prev.map((r) =>
        r.user.id === userId ? { ...r, user: { ...r.user, status } } : r,
      ),
    )
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(({ user, orgName }) => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false
      if (statusFilter !== 'all' && user.status !== statusFilter) return false
      if (!q) return true
      return (
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.phone ?? '').includes(q) ||
        (orgName ?? '').toLowerCase().includes(q)
      )
    })
  }, [rows, query, roleFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setPage(1)
  }, [query, roleFilter, statusFilter, pageSize])

  const activeCount = rows.filter((r) => r.user.status === 'active').length
  const invitedCount = rows.filter((r) => r.user.status === 'invited').length
  const suspendedCount = rows.filter(
    (r) => r.user.status === 'suspended',
  ).length

  return (
    <div className='space-y-5'>
      <PageHeader
        title={tt('usrTitle')}
        subtitle={tt('usrSubtitle')}
        icon={<UsersIcon className='h-5 w-5' />}
      />

      {/* KPIs */}
      <div className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
        <StatCard
          label={tt('usrKpiTotal')}
          value={rows.length}
          icon={<UsersIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('usrStatusActive')}
          value={activeCount}
          tone='success'
          icon={<UserCheckIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('usrStatusInvited')}
          value={invitedCount}
          tone='warning'
          icon={<UserPlusIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('usrStatusSuspended')}
          value={suspendedCount}
          tone='danger'
          icon={<ShieldAlertIcon className='h-5 w-5' />}
        />
      </div>

      {/* סרגל סינון */}
      <Card className='flex flex-wrap items-center gap-2 p-3'>
        <SearchInput
          className='min-w-52 flex-1'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tt('usrSearchPh')}
        />
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as Role | 'all')}
        >
          <option value='all'>{tt('usrAllRoles')}</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {tt(ROLE_LABELS[r])}
            </option>
          ))}
        </Select>
        {STATUSES.map((s) => (
          <Chip
            key={s}
            size='sm'
            active={statusFilter === s}
            onClick={() =>
              setStatusFilter((prev) => (prev === s ? 'all' : s))
            }
          >
            {tt(USER_STATUS_META[s].label)}
          </Chip>
        ))}
      </Card>

      {/* טבלת משתמשים */}
      <Card className='p-0'>
        <div className='overflow-x-auto'>
          <table className='w-full min-w-180 text-sm'>
            <thead>
              <tr className='border-b border-gray-100 text-start text-xs text-gray-400'>
                <th className='px-4 py-2.5 text-start font-medium'>
                  {tt('usrColUser')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('usrColContact')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('usrColRole')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('usrColOrg')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('usrColJoined')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('usrColStatus')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.map(({ user, orgName }) => (
                <tr key={user.id} className='border-b border-gray-50'>
                  <td className='px-4 py-2.5 font-semibold text-gray-900'>
                    {user.name}
                  </td>
                  <td className='px-3 py-2.5 text-xs text-gray-600' dir='ltr'>
                    {user.email}
                    {user.phone && (
                      <p className='text-gray-400'>{user.phone}</p>
                    )}
                  </td>
                  <td className='px-3 py-2.5'>
                    <Badge variant='neutral'>
                      {tt(ROLE_LABELS[user.role])}
                    </Badge>
                  </td>
                  <td className='px-3 py-2.5 text-xs text-gray-600'>
                    {orgName ?? '—'}
                  </td>
                  <td className='px-3 py-2.5 text-xs text-gray-600'>
                    {formatDate(user.createdAt)}
                  </td>
                  <td className='px-3 py-2.5'>
                    {user.role === 'admin' ? (
                      <Badge variant='success'>{tt('usrStatusActive')}</Badge>
                    ) : (
                      <Select
                        value={user.status}
                        onChange={(e) =>
                          changeStatus(
                            user.id,
                            e.target.value as UserStatus,
                          )
                        }
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {tt(USER_STATUS_META[s].label)}
                          </option>
                        ))}
                      </Select>
                    )}
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className='p-4'>
                    <EmptyState
                      title={tt('usrEmpty')}
                      icon={<UsersIcon className='h-5 w-5' />}
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
              {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, filtered.length)} {tt('pagingOf')}{' '}
              {filtered.length}
            </>
          }
          className='border-t border-gray-100 px-4 py-2.5'
        />
      </Card>
    </div>
  )
}
