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
  formatPrice,
} from '../../components/ui'

import {
  UNIT_STATUS,
  type Project,
  type UnitStatus,
} from '../../dashboard/data'
import { getProjects } from '../../dashboard/store.server'
import {
  BuildingIcon,
  CameraIcon,
  ChartArea,
  GlobeIcon,
  PlusIcon,
  UsersIcon,
} from 'lucide-react'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'הפרויקטים שלי | תכלת נדל״ן' }]
}

export async function loader() {
  // הנתונים מגיעים מהמאגר בצד השרת — כולל פרויקטים שנוספו בייבוא החכם
  return { projects: getProjects() }
}

const statusSelectClass: Record<UnitStatus, string> = {
  available: 'bg-primary-50 text-primary-700',
  reserved: 'bg-gray-100 text-gray-600',
  inProcess: 'bg-warning-50 text-warning-700',
  sold: 'bg-success-50 text-success-700',
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100)
  return (
    <div>
      <div className='mb-1 flex justify-between text-xs text-gray-500'>
        <span>
          נמכרו {value} מתוך {total} יחידות
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
  onAddImages: (urls: string[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <div className='mb-2 flex items-center justify-between'>
        <Text as='span' variant='muted' className='font-medium'>
          גלריית הפרויקט ({project.gallery.length})
        </Text>
      </div>
      <div className='flex gap-2 overflow-x-auto pb-1 scrollbar-none'>
        {project.gallery.map((src) => (
          <img
            key={src}
            src={src}
            alt={project.name}
            className='h-20 w-28 shrink-0 rounded-xl object-cover'
          />
        ))}
        <button
          type='button'
          onClick={() => inputRef.current?.click()}
          className='flex h-20 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 transition hover:border-primary-300 hover:text-primary-500'
        >
          <CameraIcon className='h-5 w-5' />
          <span className='text-xs font-medium'>הוספת תמונות</span>
        </button>
        <input
          ref={inputRef}
          type='file'
          accept='image/*'
          multiple
          className='hidden'
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (files.length) {
              onAddImages(files.map((f) => URL.createObjectURL(f)))
              e.target.value = ''
            }
          }}
        />
      </div>
    </div>
  )
}

export default function ContractorProjects({
  loaderData,
}: Route.ComponentProps) {
  const [projects, setProjects] = useState(loaderData.projects)
  const [selectedId, setSelectedId] = useState(loaderData.projects[0].id)
  const [statusFilter, setStatusFilter] = useState<UnitStatus | 'all'>('all')

  const project = projects.find((p) => p.id === selectedId) ?? projects[0]

  const allUnits = useMemo(() => projects.flatMap((p) => p.units), [projects])
  const soldCount = allUnits.filter((u) => u.status === 'sold').length
  const inProcessCount = allUnits.filter(
    (u) => u.status === 'inProcess' || u.status === 'reserved',
  ).length

  const projectSold = project.units.filter((u) => u.status === 'sold').length
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

  const addImages = (urls: string[]) =>
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== project.id ? p : { ...p, gallery: [...p.gallery, ...urls] },
      ),
    )

  return (
    <div className='space-y-6'>
      {/* Page header */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <Heading level={1} size='lg'>
            הפרויקטים שלי
          </Heading>
          <Text variant='muted' className='mt-1'>
            מעקב מכירות ותפוסה בכל הפרויקטים שלך ברחבי העולם
          </Text>
        </div>
        <Button className='flex items-center gap-2'>
          <PlusIcon className='h-4 w-4' />
          פרויקט חדש
        </Button>
      </div>

      {/* KPIs */}
      <div className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
        <StatCard
          label='פרויקטים פעילים'
          value={projects.length}
          hint={`ב-${new Set(projects.map((p) => p.country)).size} מדינות`}
          icon={<GlobeIcon className='h-5 w-5' />}
        />
        <StatCard
          label='סה״כ יחידות'
          value={allUnits.length}
          icon={<BuildingIcon className='h-5 w-5' />}
        />
        <StatCard
          label='יחידות שנמכרו'
          value={soldCount}
          hint={`${Math.round((soldCount / allUnits.length) * 100)}% מהמלאי`}
          icon={<ChartArea className='h-5 w-5' />}
        />
        <StatCard
          label='בתהליך / שוריינו'
          value={inProcessCount}
          icon={<UsersIcon className='h-5 w-5' />}
        />
      </div>

      {/* Project tabs */}
      <div className='flex gap-2 overflow-x-auto pb-1 scrollbar-none'>
        {projects.map((p) => (
          <Chip
            key={p.id}
            icon={p.flag}
            active={p.id === project.id}
            onClick={() => {
              setSelectedId(p.id)
              setStatusFilter('all')
            }}
          >
            {p.name}
          </Chip>
        ))}
      </div>

      {/* Selected project */}
      <Card className='p-0 overflow-hidden'>
        <div className='flex flex-col md:flex-row'>
          <img
            src={project.cover}
            alt={project.name}
            className='h-44 w-full object-cover md:h-auto md:w-64 rounded-2xl '
          />
          <div className='flex-1 space-y-4 p-5'>
            <div className='flex flex-wrap items-start justify-between gap-2'>
              <div>
                <Heading level={2} size='md'>
                  {project.name}
                </Heading>
                <Text variant='muted' className='mt-0.5'>
                  {project.flag} {project.city}, {project.country} · מטבע:
                  {project.currency}
                </Text>
              </div>
              <Badge variant='success'>
                {formatPrice(
                  project.units
                    .filter((u) => u.status === 'sold')
                    .reduce((sum, u) => sum + u.price, 0),
                  project.currency,
                )}{' '}
                במכירות
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
            יחידות בפרויקט
          </Heading>
          <div className='flex gap-1.5 overflow-x-auto scrollbar-none'>
            <Chip
              active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
              className='px-3 py-1.5 text-xs'
            >
              הכל ({project.units.length})
            </Chip>
            {(Object.keys(UNIT_STATUS) as UnitStatus[]).map((s) => (
              <Chip
                key={s}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
                className='px-3 py-1.5 text-xs'
              >
                {UNIT_STATUS[s].label} (
                {project.units.filter((u) => u.status === s).length})
              </Chip>
            ))}
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full min-w-160 text-sm'>
            <thead>
              <tr className='text-right text-xs text-gray-400'>
                <th className='px-4 py-3 font-medium'>יחידה</th>
                <th className='px-4 py-3 font-medium'>חדרים</th>
                <th className='px-4 py-3 font-medium'>מ״ר</th>
                <th className='px-4 py-3 font-medium'>מחיר</th>
                <th className='px-4 py-3 font-medium'>רוכש / מתעניין</th>
                <th className='px-4 py-3 font-medium'>סטטוס</th>
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
                    {formatPrice(unit.price, project.currency)}
                  </td>
                  <td className='px-4 py-3 text-gray-600'>
                    {unit.buyer ?? '—'}
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
                      {(Object.keys(UNIT_STATUS) as UnitStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {UNIT_STATUS[s].label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {filteredUnits.length === 0 && (
                <tr>
                  <td colSpan={6} className='px-4 py-10 text-center'>
                    <Text variant='muted'>אין יחידות בסטטוס הזה</Text>
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
