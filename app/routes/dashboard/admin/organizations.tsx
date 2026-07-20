import { useMemo, useState } from 'react'
import { useFetcher, useNavigate } from 'react-router'
import type { Route } from './+types/organizations'
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  PageHeader,
  SearchInput,
  StatCard,
} from '../../../components/ui'
import {
  Building2Icon,
  BuildingIcon,
  HandshakeIcon,
  ShieldCheckIcon,
  UsersIcon,
} from 'lucide-react'
import type { OrganizationType } from '~/types'
import {
  getOrganizationsAdmin,
  setOrganizationVerified,
} from '~/server/admin.server'
import { useLocale } from '~/i18n/locale'
import { ORG_TYPE_LABEL } from '~/components/admin/admin-shared'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'ארגונים | Admin' }]
}

export async function loader() {
  return { rows: await getOrganizationsAdmin() }
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData()
  if (form.get('intent') === 'verify') {
    await setOrganizationVerified(
      String(form.get('orgId')),
      form.get('verified') === 'true',
    )
  }
  return { ok: true }
}

type TypeFilter = 'all' | OrganizationType

export default function AdminOrganizations({
  loaderData,
}: Route.ComponentProps) {
  const { tt } = useLocale()
  const navigate = useNavigate()
  const verifyFetcher = useFetcher()

  const [rows, setRows] = useState(loaderData.rows)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [query, setQuery] = useState('')

  const toggleVerified = (orgId: string, verified: boolean) => {
    verifyFetcher.submit(
      { intent: 'verify', orgId, verified: String(verified) },
      { method: 'post' },
    )
    setRows((prev) =>
      prev.map((r) =>
        r.org.id === orgId ? { ...r, org: { ...r.org, verified } } : r,
      ),
    )
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (typeFilter !== 'all' && r.org.type !== typeFilter) return false
      if (!q) return true
      return (
        r.org.name.toLowerCase().includes(q) ||
        (r.org.alias ?? '').toLowerCase().includes(q)
      )
    })
  }, [rows, typeFilter, query])

  const contractors = rows.filter((r) => r.org.type === 'contractor').length
  const verifiedCount = rows.filter((r) => r.org.verified).length
  const totalMembers = rows.reduce((sum, r) => sum + r.members, 0)
  const totalDeals = rows.reduce((sum, r) => sum + r.deals, 0)

  return (
    <div className='space-y-5'>
      <PageHeader
        title={tt('orgTitle')}
        subtitle={tt('orgSubtitle')}
        icon={<Building2Icon className='h-5 w-5' />}
      />

      {/* KPIs */}
      <div className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
        <StatCard
          label={tt('orgKpiTotal')}
          value={rows.length}
          hint={`${contractors} ${tt('orgKpiContractors')}`}
          icon={<Building2Icon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('orgKpiVerified')}
          value={verifiedCount}
          tone={verifiedCount < rows.length ? 'warning' : 'primary'}
          icon={<ShieldCheckIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('orgKpiMembers')}
          value={totalMembers}
          icon={<UsersIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('orgKpiDeals')}
          value={totalDeals}
          icon={<HandshakeIcon className='h-5 w-5' />}
        />
      </div>

      {/* סרגל סינון */}
      <Card className='flex flex-wrap items-center gap-2 p-3'>
        <SearchInput
          className='min-w-52 flex-1'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tt('orgSearchPh')}
        />
        {(['all', 'contractor', 'agency'] as const).map((f) => (
          <Chip
            key={f}
            size='sm'
            active={typeFilter === f}
            onClick={() => setTypeFilter(f)}
          >
            {f === 'all' ? tt('all') : tt(ORG_TYPE_LABEL[f])}
          </Chip>
        ))}
      </Card>

      {/* טבלת ארגונים */}
      <Card className='p-0'>
        <div className='overflow-x-auto'>
          <table className='w-full min-w-160 text-sm'>
            <thead>
              <tr className='border-b border-gray-100 text-start text-xs text-gray-400'>
                <th className='px-4 py-2.5 text-start font-medium'>
                  {tt('orgColName')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('orgColType')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('orgColRegions')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('orgColMembers')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('orgColUnits')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('orgColDeals')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('orgColVerified')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ org, members, projects, units, deals }) => (
                <tr
                  key={org.id}
                  onClick={() =>
                    navigate(`/dashboard/admin/organizations/${org.id}`)
                  }
                  className='cursor-pointer border-b border-gray-50 transition hover:bg-gray-50/70'
                >
                  <td className='px-4 py-2.5'>
                    <p className='font-semibold text-gray-900'>{org.name}</p>
                    {org.alias && (
                      <p className='text-xs text-gray-400' dir='ltr'>
                        {org.alias}
                      </p>
                    )}
                  </td>
                  <td className='px-3 py-2.5'>
                    <Badge variant='neutral'>
                      {tt(ORG_TYPE_LABEL[org.type])}
                    </Badge>
                  </td>
                  <td className='px-3 py-2.5 text-xs text-gray-600'>
                    {org.regions?.join(' · ') ?? '—'}
                  </td>
                  <td className='px-3 py-2.5 text-gray-600'>{members}</td>
                  <td className='px-3 py-2.5 text-gray-600'>
                    {projects > 0 ? `${units} (${projects})` : units || '—'}
                  </td>
                  <td className='px-3 py-2.5 text-gray-600'>{deals}</td>
                  <td className='px-3 py-2.5'>
                    <Button
                      size='sm'
                      variant={org.verified ? 'ghost' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleVerified(org.id, !org.verified)
                      }}
                    >
                      {org.verified ? (
                        <Badge variant='success'>{tt('orgVerified')}</Badge>
                      ) : (
                        tt('orgVerifyAction')
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className='p-4'>
                    <EmptyState
                      title={tt('orgEmpty')}
                      icon={<BuildingIcon className='h-5 w-5' />}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
