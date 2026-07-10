import { useMemo, useRef, useState } from 'react'
import type { Route } from './+types/projects'
import {
  Badge,
  Button,
  Card,
  Chip,
  Heading,
  StatCard,
  Text,
  cn,
} from '../../components/ui'

import {
  BuildingIcon,
  CameraIcon,
  ChartArea,
  GlobeIcon,
  PlusIcon,
  UsersIcon,
} from 'lucide-react'
import { PROJECTS, UNIT_STATUS_META, formatMoney } from '~/data'
import type { Currency, MediaAsset, Project, UnitStatus } from '~/types'
import { useLocale } from '~/i18n/locale'
import { Link } from 'react-router'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'הפרויקטים שלי | Projects' }]
}

export async function loader() {
  // הנתונים מגיעים מהמאגר בצד השרת — כולל פרויקטים שנוספו בייבוא החכם
  return { projects: PROJECTS }
}

const UNIT_STATUSES = Object.keys(UNIT_STATUS_META) as UnitStatus[]

const statusSelectClass: Record<UnitStatus, string> = {
  available: 'bg-primary-50 text-primary-700',
  reserved: 'bg-gray-100 text-gray-600',
  inProcess: 'bg-warning-50 text-warning-700',
  sold: 'bg-success-50 text-success-700',
}

/** מטבע הפרויקט נגזר מהיחידה הראשונה (ברירת מחדל USD). */
const projectCurrency = (project: Project): Currency =>
  project.units[0]?.price.currency ?? 'USD'

function ProgressBar({ value, total }: { value: number; total: number }) {
  const { tt } = useLocale()
  const percent = total === 0 ? 0 : Math.round((value / total) * 100)
  return (
    <div>
      <div className='mb-1 flex justify-between text-xs text-gray-500'>
        <span>
          {tt('soldOfUnits')} {value}/{total} {tt('ofUnits')}
        </span>
        <span className='font-semibold text-primary-600'>{percent}%</span>
      </div>
      <div className='h-2 overflow-hidden rounded-full bg-gray-100'>
        <div
          className='h-full rounded-full bg-linear-to-l from-primary-500 to-accent-400 transition-all'
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function Gallery({
  project,
  onAddImages,
}: {
  project: Project
  onAddImages: (imgs: MediaAsset[]) => void
}) {
  const { t, tt } = useLocale()
  const inputRef = useRef<HTMLInputElement>(null)
  const imgs = project.gallery?.filter((g) => g.kind === 'image') ?? []

  const addFiles = (files: File[]) => {
    if (!files.length) return
    onAddImages(
      files.map((f) => ({
        id: `img-${Date.now()}-${f.name}`,
        url: URL.createObjectURL(f),
        kind: 'image' as const,
        name: f.name,
      })),
    )
  }

  return (
    <div>
      <div className='p-2'>
        <div className='mb-2 flex items-center justify-between'>
          <Text as='span' variant='muted' className='font-medium'>
            {tt('projectGallery')} ({imgs.length})
          </Text>
        </div>
        <Text as='span' variant='muted' className='font-medium'>
          <div>{t(project.description)}</div>
        </Text>
      </div>
      <div className='flex gap-2 overflow-x-auto pb-1 scrollbar-none'>
        {imgs.map((src) => (
          <img
            key={src.id}
            src={src.url}
            alt={src.name}
            className='h-20 w-28 shrink-0 rounded-xl object-cover'
          />
        ))}
        <button
          type='button'
          onClick={() => inputRef.current?.click()}
          className='flex h-20 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 transition hover:border-primary-300 hover:text-primary-500'
        >
          <CameraIcon className='h-5 w-5' />
          <span className='text-xs font-medium'>{tt('addImages')}</span>
        </button>
        <input
          ref={inputRef}
          type='file'
          accept='image/*'
          multiple
          className='hidden'
          onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
        />
      </div>
    </div>
  )
}

export default function ContractorProjects({
  loaderData,
}: Route.ComponentProps) {
  const { t, tt, locale } = useLocale()

  const [projects, setProjects] = useState(loaderData.projects)
  const [selectedId, setSelectedId] = useState(loaderData.projects[0].id)
  const [statusFilter, setStatusFilter] = useState<UnitStatus | 'all'>('all')

  const project = projects.find((p) => p.id === selectedId) ?? projects[0]
  const currency = projectCurrency(project)

  const allUnits = useMemo(() => projects.flatMap((p) => p.units), [projects])
  const soldCount = allUnits.filter((u) => u.status === 'sold').length
  const inProcessCount = allUnits.filter(
    (u) => u.status === 'inProcess' || u.status === 'reserved',
  ).length
  const soldPercent = allUnits.length
    ? Math.round((soldCount / allUnits.length) * 100)
    : 0
  const countriesCount = new Set(projects.map((p) => p.address.country.code))
    .size

  const projectSold = project.units.filter((u) => u.status === 'sold').length
  const soldSum = project.units
    .filter((u) => u.status === 'sold')
    .reduce((sum, u) => sum + u.price.amount, 0)

  const filteredUnits =
    statusFilter === 'all'
      ? project.units
      : project.units.filter((u) => u.status === statusFilter)

  const updateUnitStatus = (unitId: string, status: UnitStatus) =>
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== project.id
          ? p
          : {
              ...p,
              units: p.units.map((u) =>
                u.id === unitId ? { ...u, status } : u,
              ),
            },
      ),
    )

  const addImages = (imgs: MediaAsset[]) =>
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== project.id ? p : { ...p, gallery: [...p.gallery, ...imgs] },
      ),
    )

  return (
    <div className='space-y-6'>
      {/* Page header */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <Heading level={1} size='lg'>
            {tt('projectsHeading')}
          </Heading>
          <Text variant='muted' className='mt-1'>
            {tt('projectsSubtitle')}
          </Text>
        </div>
        <Link to={'import'}>
          <Button className='flex items-center gap-2'>
            <PlusIcon className='h-4 w-4' />
            {tt('newProject')}
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
        <StatCard
          label={tt('activeProjects')}
          value={projects.length}
          hint={`${countriesCount} ${tt('inCountries')}`}
          icon={<GlobeIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('totalUnits')}
          value={allUnits.length}
          icon={<BuildingIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('soldUnits')}
          value={soldCount}
          hint={`${soldPercent}% ${tt('ofInventory')}`}
          icon={<ChartArea className='h-5 w-5' />}
        />
        <StatCard
          label={tt('inProcessReserved')}
          value={inProcessCount}
          icon={<UsersIcon className='h-5 w-5' />}
        />
      </div>

      {/* Project tabs */}
      <div className='flex gap-2 overflow-x-auto pb-1 scrollbar-none'>
        {projects.map((p) => (
          <Chip
            key={p.id}
            icon={
              <img src={p.cover.url} alt='' className='size-10 rounded-xl' />
            }
            active={p.id === project.id}
            onClick={() => {
              setSelectedId(p.id)
              setStatusFilter('all')
            }}
          >
            <div className='text-start'>
              {p.address.country.flag}
              <p>{t(p.name)}</p>
            </div>
          </Chip>
        ))}
      </div>

      {/* Selected project */}
      <Card className='p-0 overflow-hidden'>
        <div className='flex flex-col md:flex-row'>
          <img
            src={project.cover.url}
            alt={t(project.name)}
            className='h-44 w-full object-cover md:h-auto md:w-64 rounded-2xl '
          />
          <div className='flex-1 space-y-4 p-5'>
            <div className='flex flex-wrap items-start justify-between gap-2'>
              <div>
                <Heading level={2} size='md'>
                  {t(project.name)}
                </Heading>
                <Text variant='muted' className='mt-0.5'>
                  {project.address.country.flag} {project.address.city},{' '}
                  {t(project.address.country.name)} · {tt('currencyLabel')}:{' '}
                  {currency}
                </Text>
              </div>
              <Badge variant='success'>
                {formatMoney({ amount: soldSum, currency }, locale)}{' '}
                {tt('inSales')}
              </Badge>
            </div>

            <ProgressBar value={projectSold} total={project.units.length} />
            <Gallery project={project} onAddImages={addImages} />
          </div>
        </div>
      </Card>

      {/* Units table */}
      <Card className='p-0'>
        <div className='flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4'>
          <Heading level={3} size='md'>
            {tt('unitsInProject')}
          </Heading>
          <div className='flex gap-1.5 overflow-x-auto scrollbar-none'>
            <Chip
              active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
              className='px-3 py-1.5 text-xs'
            >
              {tt('all')} ({project.units.length})
            </Chip>
            {UNIT_STATUSES.map((s) => (
              <Chip
                key={s}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
                className='px-3 py-1.5 text-xs'
              >
                {t(UNIT_STATUS_META[s].label)} (
                {project.units.filter((u) => u.status === s).length})
              </Chip>
            ))}
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full min-w-160 text-sm'>
            <thead>
              <tr className='text-start text-xs text-gray-400'>
                <th className='px-4 py-3 font-medium'>{tt('colUnit')}</th>
                <th className='px-4 py-3 font-medium'>{tt('colRooms')}</th>
                <th className='px-4 py-3 font-medium'>{tt('colSqm')}</th>
                <th className='px-4 py-3 font-medium'>{tt('colPrice')}</th>
                <th className='px-4 py-3 font-medium'>{tt('colBuyer')}</th>
                <th className='px-4 py-3 font-medium'>{tt('colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((unit) => (
                <tr
                  key={unit.id}
                  className='border-t border-gray-50 transition hover:bg-gray-50/60'
                >
                  <td className='px-4 py-3'>
                    <p className='font-semibold text-gray-900'>{unit.name}</p>
                    <Text as='span' variant='small'>
                      {unit.id}
                    </Text>
                  </td>
                  <td className='px-4 py-3 text-gray-600'>{unit.rooms}</td>
                  <td className='px-4 py-3 text-gray-600'>{unit.sqm}</td>
                  <td className='px-4 py-3 font-semibold text-gray-900'>
                    {formatMoney(unit.price, locale)}
                  </td>
                  <td className='px-4 py-3 text-gray-600'>
                    {unit.buyerId ?? '—'}
                  </td>
                  <td className='px-4 py-3'>
                    <select
                      value={unit.status}
                      onChange={(e) =>
                        updateUnitStatus(unit.id, e.target.value as UnitStatus)
                      }
                      className={cn(
                        'cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-semibold outline-none',
                        statusSelectClass[unit.status],
                      )}
                    >
                      {UNIT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {t(UNIT_STATUS_META[s].label)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {filteredUnits.length === 0 && (
                <tr>
                  <td colSpan={6} className='px-4 py-10 text-center'>
                    <Text variant='muted'>{tt('noUnitsInStatus')}</Text>
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
