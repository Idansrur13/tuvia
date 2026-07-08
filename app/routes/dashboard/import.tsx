import { useEffect, useRef, useState } from 'react'
import { Link, useFetcher } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import type { Route } from './+types/import'
import {
  Badge,
  Button,
  Card,
  Heading,
  Text,
  cn,
  fadeUp,
  formatPrice,
  stagger,
} from '../../components/ui'
import {
  CheckCircle2Icon,
  DownloadIcon,
  FileTextIcon,
  RotateCcwIcon,
  SparklesIcon,
  UploadCloudIcon,
  XIcon,
} from 'lucide-react'
import type {
  ImportResult,
  ImportSummary,
  ParsedUnit,
  UnitChange,
} from '../../dashboard/import-types'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'ייבוא חכם AI | תכלת נדל״ן' }]
}

/* ---------- Action: שלב הניתוח ושלב השמירה ---------- */

type ActionData =
  | { error: string; result?: never; saved?: never }
  | { result: ImportResult; error?: never; saved?: never }
  | { saved: ImportSummary; error?: never; result?: never }

export async function action({
  request,
}: Route.ActionArgs): Promise<ActionData> {
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'parse') {
    const file = formData.get('file')
    if (!(file instanceof File) || !file.name) return { error: 'לא נבחר קובץ' }
    const { parseFileWithAi } = await import('../../dashboard/ai.server')
    const outcome = await parseFileWithAi(file)
    return outcome.ok ? { result: outcome.result } : { error: outcome.error }
  }

  if (intent === 'save') {
    try {
      const result = JSON.parse(String(formData.get('result'))) as ImportResult
      const { applyImport } = await import('../../dashboard/store.server')
      return { saved: applyImport(result) }
    } catch {
      return { error: 'שמירת הנתונים נכשלה. נסו שוב.' }
    }
  }

  return { error: 'פעולה לא מוכרת' }
}

/* ---------- תצוגת שינויים ---------- */

const CHANGE_META: Record<
  UnitChange,
  { label: string; badge: 'primary' | 'success' | 'warning' | 'neutral' }
> = {
  new: { label: 'יחידה חדשה', badge: 'primary' },
  priceChanged: { label: 'עדכון מחיר', badge: 'warning' },
  sold: { label: 'נמכרה', badge: 'success' },
  unchanged: { label: 'ללא שינוי', badge: 'neutral' },
}

function computeSummary(result: ImportResult): ImportSummary {
  const units = result.projects.flatMap((p) => p.units)
  return {
    newProjects: result.projects.filter((p) => p.isNew).length,
    newUnits: units.filter((u) => u.change === 'new').length,
    priceChanges: units.filter((u) => u.change === 'priceChanged').length,
    sold: units.filter((u) => u.change === 'sold').length,
    unchanged: units.filter((u) => u.change === 'unchanged').length,
  }
}

function downloadCsv(result: ImportResult) {
  const rows: (string | number)[][] = [
    [
      'פרויקט',
      'עיר',
      'מדינה',
      'מטבע',
      'יחידה',
      'חדרים',
      'מ"ר',
      'מחיר',
      'סטטוס',
      'שינוי',
    ],
  ]
  for (const p of result.projects) {
    for (const u of p.units) {
      rows.push([
        p.name,
        p.city,
        p.country,
        p.currency,
        u.name,
        u.rooms ?? '',
        u.sqm ?? '',
        u.price ?? '',
        u.price === null ? 'נמכרה' : 'למכירה',
        CHANGE_META[u.change].label,
      ])
    }
  }
  const csv =
    '﻿' +
    rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')

  const url = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = 'import.csv'
  a.click()
  URL.revokeObjectURL(url)
}

/* ---------- קומפוננטות משנה ---------- */

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = ['העלאת קובץ', 'בדיקה ואישור', 'שמירה במערכת']
  return (
    <ol className='flex items-center gap-2 sm:gap-4'>
      {steps.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3
        const state = n < step ? 'done' : n === step ? 'active' : 'todo'
        return (
          <li key={label} className='flex flex-1 items-center gap-2 sm:gap-3'>
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition',
                state === 'done' && 'bg-success-500 text-white',
                state === 'active' && 'bg-primary-500 text-white shadow',
                state === 'todo' && 'bg-gray-100 text-gray-400',
              )}
            >
              {state === 'done' ? '✓' : n}
            </span>
            <span
              className={cn(
                'hidden text-sm font-medium sm:block',
                state === 'active' ? 'text-gray-900' : 'text-gray-400',
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <span className='h-px flex-1 bg-gray-200' aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function Dropzone({
  file,
  onFile,
  disabled,
}: {
  file: File | null
  onFile: (file: File | null) => void
  disabled: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (!disabled) onFile(e.dataTransfer.files[0] ?? null)
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition',
          dragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-200 bg-gray-50/50 hover:border-primary-300 hover:bg-primary-50/40',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        <span className='flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-600'>
          <UploadCloudIcon className='h-7 w-7' />
        </span>
        <div>
          <p className='font-semibold text-gray-900'>
            גררו לכאן קובץ או לחצו לבחירה
          </p>
          <Text variant='muted' className='mt-1'>
            PDF · Word · Excel/CSV · טקסט · תמונה של מחירון — הבוט יסתדר עם הכל
          </Text>
        </div>
      </div>

      <input
        ref={inputRef}
        type='file'
        accept='.pdf,.docx,.txt,.csv,.md,image/*'
        className='hidden'
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />

      {file && (
        <div className='mt-4 flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm'>
          <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600'>
            <FileTextIcon className='h-5 w-5' />
          </span>
          <div className='min-w-0 flex-1'>
            <p
              className='truncate text-sm font-semibold text-gray-900'
              dir='ltr'
            >
              {file.name}
            </p>
            <Text as='p' variant='small'>
              {(file.size / 1024).toFixed(0)} KB
            </Text>
          </div>
          {!disabled && (
            <button
              type='button'
              aria-label='הסרת הקובץ'
              onClick={() => onFile(null)}
              className='rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600'
            >
              <XIcon className='h-4 w-4' />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function UnitRow({
  unit,
  currency,
  onPriceChange,
}: {
  unit: ParsedUnit
  currency: string
  onPriceChange: (price: number | null) => void
}) {
  const meta = CHANGE_META[unit.change]
  return (
    <tr className='border-t border-gray-50'>
      <td className='px-4 py-2.5'>
        <p className='font-semibold text-gray-900'>{unit.name}</p>
        {unit.buyer && (
          <Text as='span' variant='small'>
            {unit.buyer}
          </Text>
        )}
      </td>
      <td className='px-4 py-2.5 text-gray-600'>{unit.rooms ?? '—'}</td>
      <td className='px-4 py-2.5 text-gray-600'>{unit.sqm ?? '—'}</td>
      <td className='px-4 py-2.5'>
        <input
          type='number'
          value={unit.price ?? ''}
          placeholder='נמכרה'
          onChange={(e) =>
            onPriceChange(e.target.value === '' ? null : Number(e.target.value))
          }
          className='w-32 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none transition placeholder:text-success-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-100'
        />
        {unit.change === 'priceChanged' && unit.oldPrice != null && (
          <Text as='p' variant='small' className='mt-0.5 line-through'>
            {formatPrice(unit.oldPrice, currency)}
          </Text>
        )}
      </td>
      <td className='px-4 py-2.5'>
        <Badge variant={meta.badge}>{meta.label}</Badge>
      </td>
    </tr>
  )
}

/* ---------- העמוד ---------- */

export default function SmartImport() {
  // bump ל-key של ה-fetchers מאפס את כל הזרימה ל"ייבוא נוסף"
  const [round, setRound] = useState(0)
  const parseFetcher = useFetcher<typeof action>({ key: `parse-${round}` })
  const saveFetcher = useFetcher<typeof action>({ key: `save-${round}` })

  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  const parsing = parseFetcher.state !== 'idle'
  const saving = saveFetcher.state !== 'idle'
  const saved =
    saveFetcher.data && 'saved' in saveFetcher.data
      ? saveFetcher.data.saved
      : null
  const error =
    (parseFetcher.data &&
      'error' in parseFetcher.data &&
      parseFetcher.data.error) ||
    (saveFetcher.data &&
      'error' in saveFetcher.data &&
      saveFetcher.data.error) ||
    null

  useEffect(() => {
    if (
      parseFetcher.data &&
      'result' in parseFetcher.data &&
      parseFetcher.data.result
    )
      setResult(structuredClone(parseFetcher.data.result))
  }, [parseFetcher.data])

  const step: 1 | 2 | 3 = saved ? 3 : result ? 2 : 1
  const summary = result ? computeSummary(result) : null

  const submitParse = () => {
    if (!file) return
    const fd = new FormData()
    fd.append('intent', 'parse')
    fd.append('file', file)
    parseFetcher.submit(fd, { method: 'post', encType: 'multipart/form-data' })
  }

  const submitSave = () => {
    if (!result) return
    const fd = new FormData()
    fd.append('intent', 'save')
    fd.append('result', JSON.stringify(result))
    saveFetcher.submit(fd, { method: 'post' })
  }

  const reset = () => {
    setRound((r) => r + 1)
    setFile(null)
    setResult(null)
  }

  const updatePrice = (pi: number, ui: number, price: number | null) =>
    setResult((prev) => {
      if (!prev) return prev
      const next = structuredClone(prev)
      next.projects[pi].units[ui].price = price
      return next
    })

  return (
    <div className='space-y-6'>
      {/* Page header */}
      <div>
        <div className='flex items-center gap-2'>
          <span className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-white'>
            <SparklesIcon className='h-5 w-5' />
          </span>
          <Heading level={1} size='lg'>
            ייבוא חכם AI
          </Heading>
        </div>
        <Text variant='muted' className='mt-2'>
          מעלים מחירון או רשימת מלאי בכל פורמט — הבוט ממיר לטבלה מסודרת, מזהה
          פרויקטים חדשים מול קיימים ומסמן מה השתנה. מחיר ריק פירושו שהיחידה
          נמכרה.
        </Text>
      </div>

      <Card>
        <Stepper step={step} />
      </Card>

      {error && (
        <div className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700'>
          {error}
        </div>
      )}

      <AnimatePresence mode='wait'>
        {/* ---------- שלב 1: העלאה ---------- */}
        {step === 1 && (
          <motion.div
            key='step1'
            variants={fadeUp}
            initial='hidden'
            animate='visible'
            exit={{ opacity: 0, y: -12 }}
          >
            <Card className='space-y-5'>
              <Dropzone file={file} onFile={setFile} disabled={parsing} />

              {parsing ? (
                <div className='flex items-center gap-3 rounded-xl bg-primary-50 px-4 py-3'>
                  <motion.span
                    animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    className='text-primary-600'
                  >
                    <SparklesIcon className='h-5 w-5' />
                  </motion.span>
                  <div>
                    <p className='text-sm font-semibold text-primary-700'>
                      ה-AI מנתח את הקובץ...
                    </p>
                    <Text as='p' variant='small'>
                      קורא את המסמך, מזהה פרויקטים ויחידות ומצליב מול הנתונים
                      הקיימים במערכת. זה יכול לקחת עד דקה.
                    </Text>
                  </div>
                </div>
              ) : (
                <div className='flex justify-end'>
                  <Button
                    disabled={!file}
                    onClick={submitParse}
                    className='flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    <SparklesIcon className='h-4 w-4' />
                    שליחה לניתוח AI
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* ---------- שלב 2: בדיקה ואישור ---------- */}
        {step === 2 && result && summary && (
          <motion.div
            key='step2'
            variants={stagger}
            initial='hidden'
            animate='visible'
            exit={{ opacity: 0, y: -12 }}
            className='space-y-4'
          >
            {/* Summary */}
            <motion.div variants={fadeUp} className='flex flex-wrap gap-2'>
              {summary.newProjects > 0 && (
                <Badge>{summary.newProjects} פרויקטים חדשים</Badge>
              )}
              {summary.newUnits > 0 && (
                <Badge>{summary.newUnits} יחידות חדשות</Badge>
              )}
              {summary.priceChanges > 0 && (
                <Badge variant='warning'>
                  {summary.priceChanges} עדכוני מחיר
                </Badge>
              )}
              {summary.sold > 0 && (
                <Badge variant='success'>{summary.sold} נמכרו</Badge>
              )}
              {summary.unchanged > 0 && (
                <Badge variant='neutral'>{summary.unchanged} ללא שינוי</Badge>
              )}
            </motion.div>

            {/* Projects */}
            {result.projects.map((project, pi) => (
              <motion.div key={`${project.name}-${pi}`} variants={fadeUp}>
                <Card className='p-0'>
                  <div className='flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 p-4'>
                    <div>
                      <div className='flex items-center gap-2'>
                        <Heading level={2} size='md'>
                          {project.name}
                        </Heading>
                        <Badge variant={project.isNew ? 'primary' : 'neutral'}>
                          {project.isNew ? 'פרויקט חדש' : 'פרויקט קיים'}
                        </Badge>
                      </div>
                      <Text variant='small' className='mt-0.5'>
                        {project.city}, {project.country} · מטבע:{' '}
                        {project.currency}
                      </Text>
                    </div>
                    <Text as='span' variant='muted'>
                      {project.units.length} יחידות
                    </Text>
                  </div>

                  <div className='overflow-x-auto'>
                    <table className='w-full min-w-140 text-sm'>
                      <thead>
                        <tr className='text-right text-xs text-gray-400'>
                          <th className='px-4 py-2.5 font-medium'>יחידה</th>
                          <th className='px-4 py-2.5 font-medium'>חדרים</th>
                          <th className='px-4 py-2.5 font-medium'>מ״ר</th>
                          <th className='px-4 py-2.5 font-medium'>
                            מחיר (ריק = נמכרה)
                          </th>
                          <th className='px-4 py-2.5 font-medium'>שינוי</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.units.map((unit, ui) => (
                          <UnitRow
                            key={`${unit.name}-${ui}`}
                            unit={unit}
                            currency={project.currency}
                            onPriceChange={(price) =>
                              updatePrice(pi, ui, price)
                            }
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            ))}

            {/* Actions */}
            <motion.div
              variants={fadeUp}
              className='flex flex-wrap items-center justify-between gap-3'
            >
              <Button
                variant='ghost'
                onClick={reset}
                className='flex items-center gap-2'
              >
                <RotateCcwIcon className='h-4 w-4' />
                התחלה מחדש
              </Button>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={() => downloadCsv(result)}
                  className='flex items-center gap-2'
                >
                  <DownloadIcon className='h-4 w-4' />
                  הורדת CSV
                </Button>
                <Button
                  onClick={submitSave}
                  disabled={saving}
                  className='flex items-center gap-2 disabled:opacity-60'
                >
                  <CheckCircle2Icon className='h-4 w-4' />
                  {saving ? 'שומר...' : 'אישור ושמירה במערכת'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ---------- שלב 3: הצלחה ---------- */}
        {step === 3 && saved && (
          <motion.div
            key='step3'
            variants={fadeUp}
            initial='hidden'
            animate='visible'
          >
            <Card className='flex flex-col items-center gap-4 py-12 text-center'>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                className='flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-success-500'
              >
                <CheckCircle2Icon className='h-9 w-9' />
              </motion.span>
              <div>
                <Heading level={2} size='md'>
                  הנתונים נשמרו בהצלחה!
                </Heading>
                <Text variant='muted' className='mt-1'>
                  {saved.newProjects} פרויקטים חדשים · {saved.newUnits} יחידות
                  חדשות · {saved.priceChanges} עדכוני מחיר · {saved.sold} סומנו
                  כנמכרו
                </Text>
              </div>
              <div className='flex flex-wrap justify-center gap-2'>
                <Link to='/dashboard'>
                  <Button>לצפייה בפרויקטים</Button>
                </Link>
                <Button variant='outline' onClick={reset}>
                  ייבוא קובץ נוסף
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
