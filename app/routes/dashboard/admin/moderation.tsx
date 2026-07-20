import { useState } from 'react'
import { Link, useFetcher } from 'react-router'
import type { Route } from './+types/moderation'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Heading,
  PageHeader,
  Select,
  StatCard,
  Text,
} from '../../../components/ui'
import {
  BuildingIcon,
  EyeOffIcon,
  GlobeIcon,
  ShieldCheckIcon,
} from 'lucide-react'
import type { ProjectStatus } from '~/types'
import {
  getModerationData,
  setProjectStatus,
  setUnitPublished,
} from '~/server/admin.server'
import { formatMoney } from '~/data'
import { useLocale } from '~/i18n/locale'
import { PROJECT_STATUS_META } from '~/components/admin/admin-shared'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'פיקוח תוכן | Admin' }]
}

export async function loader() {
  return { moderation: await getModerationData() }
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData()
  const intent = form.get('intent')
  if (intent === 'projectStatus') {
    await setProjectStatus(
      String(form.get('projectId')),
      form.get('status') as ProjectStatus,
    )
  }
  if (intent === 'unpublishUnit') {
    await setUnitPublished(String(form.get('unitId')), false)
  }
  return { ok: true }
}

const PROJECT_STATUSES = Object.keys(PROJECT_STATUS_META) as ProjectStatus[]

export default function AdminModeration({ loaderData }: Route.ComponentProps) {
  const { t, tt, locale, formatDate } = useLocale()
  const fetcher = useFetcher()

  const [projects, setProjects] = useState(loaderData.moderation.projects)
  const [standaloneUnits, setStandaloneUnits] = useState(
    loaderData.moderation.standaloneUnits,
  )

  const changeProjectStatus = (projectId: string, status: ProjectStatus) => {
    fetcher.submit(
      { intent: 'projectStatus', projectId, status },
      { method: 'post' },
    )
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status } : p)),
    )
  }

  const unpublishUnit = (unitId: string) => {
    fetcher.submit({ intent: 'unpublishUnit', unitId }, { method: 'post' })
    setStandaloneUnits((prev) => prev.filter((u) => u.id !== unitId))
  }

  const pendingProjects = projects.filter((p) => p.status === 'pending').length
  const publishedProjects = projects.filter(
    (p) => p.status === 'published',
  ).length
  const publishedUnits = projects
    .flatMap((p) => p.units)
    .filter((u) => u.publishedToMarketplace).length

  return (
    <div className='space-y-5'>
      <PageHeader
        title={tt('modTitle')}
        subtitle={tt('modSubtitle')}
        icon={<ShieldCheckIcon className='h-5 w-5' />}
      />

      {/* KPIs */}
      <div className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
        <StatCard
          label={tt('modKpiProjects')}
          value={projects.length}
          hint={`${publishedProjects} ${tt('projStatusPublished')}`}
          icon={<BuildingIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('modKpiPending')}
          value={pendingProjects}
          tone={pendingProjects > 0 ? 'warning' : 'primary'}
          icon={<ShieldCheckIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('modKpiPublishedUnits')}
          value={publishedUnits}
          icon={<GlobeIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('modKpiStandalone')}
          value={standaloneUnits.length}
          icon={<EyeOffIcon className='h-5 w-5' />}
        />
      </div>

      {/* פרויקטים של קבלנים */}
      <Card className='p-0'>
        <div className='border-b border-gray-100 p-4'>
          <Heading level={2} size='md'>
            {tt('modProjects')}
          </Heading>
          <Text variant='small' className='mt-0.5'>
            {tt('modProjectsHint')}
          </Text>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full min-w-160 text-sm'>
            <thead>
              <tr className='border-b border-gray-100 text-start text-xs text-gray-400'>
                <th className='px-4 py-2.5 text-start font-medium'>
                  {tt('modColProject')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('modColContractor')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('modColUnits')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('modColCreated')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('modColStatus')}
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className='border-b border-gray-50'>
                  <td className='px-4 py-2.5'>
                    <p className='font-semibold text-gray-900'>{t(p.name)}</p>
                    <Badge
                      variant={PROJECT_STATUS_META[p.status].badge}
                      className='mt-0.5'
                    >
                      {tt(PROJECT_STATUS_META[p.status].label)}
                    </Badge>
                  </td>
                  <td className='px-3 py-2.5 text-xs text-gray-600'>
                    {p.contractorName}
                  </td>
                  <td className='px-3 py-2.5 text-gray-600'>
                    {p.units.length}
                  </td>
                  <td className='px-3 py-2.5 text-xs text-gray-600'>
                    {formatDate(p.createdAt)}
                  </td>
                  <td className='px-3 py-2.5'>
                    <Select
                      value={p.status}
                      onChange={(e) =>
                        changeProjectStatus(
                          p.id,
                          e.target.value as ProjectStatus,
                        )
                      }
                    >
                      {PROJECT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {tt(PROJECT_STATUS_META[s].label)}
                        </option>
                      ))}
                    </Select>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={5} className='p-4'>
                    <EmptyState
                      title={tt('modNoProjects')}
                      icon={<BuildingIcon className='h-5 w-5' />}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* נכסים עצמאיים במרקטפלייס */}
      <Card className='p-0'>
        <div className='border-b border-gray-100 p-4'>
          <Heading level={2} size='md'>
            {tt('modListings')}
          </Heading>
          <Text variant='small' className='mt-0.5'>
            {tt('modListingsHint')}
          </Text>
        </div>
        {standaloneUnits.length === 0 ? (
          <div className='p-4'>
            <EmptyState
              size='sm'
              title={tt('modNoListings')}
              icon={<GlobeIcon className='h-5 w-5' />}
            />
          </div>
        ) : (
          <ul className='divide-y divide-gray-50'>
            {standaloneUnits.map((u) => (
              <li
                key={u.id}
                className='flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3'
              >
                {u.gallery?.[0]?.url && (
                  <img
                    src={u.gallery[0].url}
                    alt={t(u.title)}
                    className='h-12 w-16 rounded-lg object-cover'
                  />
                )}
                <div className='min-w-0 flex-1'>
                  <Link
                    to={`/property/${u.id}`}
                    className='truncate text-sm font-semibold text-gray-900 transition hover:text-primary-600'
                  >
                    {t(u.title)}
                  </Link>
                  <Text as='p' variant='small'>
                    {u.address.city} · {u.rooms} {tt('colRooms')} · {u.sqm}{' '}
                    {tt('colSqm')}
                  </Text>
                </div>
                <span className='text-sm font-bold text-gray-900'>
                  {u.price ? formatMoney(u.price, locale) : '—'}
                </span>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => unpublishUnit(u.id)}
                  className='flex items-center gap-1.5'
                >
                  <EyeOffIcon className='h-3.5 w-3.5' />
                  {tt('modUnpublish')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
