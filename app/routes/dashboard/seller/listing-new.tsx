/*
 * עמוד ייעודי לפרסום נכס למרקטפלייס — פרק 6 (אחרי מיזוג Listing→Unit).
 * עם ?unit=<unitId> (מטבלת התיק): מעדכן את היחידה הקיימת בשדות השיווק
 * ומדליק publishedToMarketplace. בלי — נוצרת יחידה עצמאית חדשה ומפורסמת.
 */
import { useEffect } from 'react'
import { Link, useFetcher, useNavigate } from 'react-router'
import type { Route } from './+types/listing-new'
import {
  ArrowRightIcon,
  BuildingIcon,
  ImageIcon,
  LinkIcon,
  MapPinIcon,
  MegaphoneIcon,
  RulerIcon,
} from 'lucide-react'
import {
  Badge,
  Banner,
  Button,
  Card,
  Field,
  Heading,
  Input,
  PageHeader,
  Select,
  Text,
} from '../../../components/ui'
import { COUNTRIES, DEAL_TYPES, LISTING_CATEGORIES } from '~/data'
import { projectById, unitById } from '~/server/queries.server'
import { db } from '~/server/db.server'
import { useLocale } from '~/i18n/locale'
import type { ListingAvailability, ListingCategory } from '~/types'
import type { Prisma } from '../../../../generated/prisma/client'

/** המוכרת המחוברת (עד שיהיה auth אמיתי). */
const CURRENT_SELLER_ID = 'u-michal'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'מודעה חדשה | New listing' }]
}

export async function loader({ request }: Route.LoaderArgs) {
  /* קדם-מילוי מיחידת קבלן (הגעה מטבלת התיק). */
  const unitId = new URL(request.url).searchParams.get('unit')
  const unit = unitId ? await unitById(unitId) : undefined
  const project = unit?.projectId
    ? await projectById(unit.projectId)
    : undefined
  return { unit, project }
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData()

  /* יחידת קבלן קיימת (אם הגענו עם ?unit=) — הפרסום מעדכן אותה */
  const unitId = new URL(request.url).searchParams.get('unit')
  const unit = unitId ? await unitById(unitId) : undefined

  const str = (name: string) => String(form.get(name) ?? '').trim()
  const title = str('title')
  const description = str('description')

  /* השדות מהטופס — משותפים לעדכון יחידה קיימת וליצירת נכס עצמאי.
     דו-לשוני: עד שיהיה תרגום בטופס, אותו טקסט בשתי השפות. */
  const marketing = {
    title: { he: title, en: title } as Prisma.InputJsonValue,
    description: {
      he: description,
      en: description,
    } as Prisma.InputJsonValue,
    city: str('city'),
    neighborhood: str('neighborhood') || null,
    street: str('street') || null,
    dealType: str('dealType') as 'sale' | 'rent',
    category: str('category') as ListingCategory,
    availability: str('availability') as ListingAvailability,
    priceAmount: Number(form.get('price') ?? 0),
    rooms: Number(form.get('rooms') ?? 0),
    sqm: Number(form.get('sqm') ?? 0),
    floor: str('floor') || null,
    yearBuilt: form.get('yearBuilt') ? Number(form.get('yearBuilt')) : null,
    parking: form.get('parking') ? Number(form.get('parking')) : null,
    entry: str('entry') || null,
    features: (str('features')
      ? str('features')
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean)
          .map((f) => ({ he: f, en: f }))
      : []) as Prisma.InputJsonValue[],
    /* המפרסם הופך לאיש הקשר, והנכס יוצא למרקטפלייס */
    agentId: CURRENT_SELLER_ID,
    agentRole: 'seller' as const,
    publishedToMarketplace: true,
  }

  if (unit) {
    await db.unit.update({
      where: { id: unit.id },
      data: {
        ...marketing,
        priceCurrency: unit.price?.currency ?? 'ILS',
      },
    })
  } else {
    /* נכס עצמאי חדש — ללא פרויקט. אין עדיין העלאת קבצים — גלריה ריקה */
    await db.unit.create({
      data: {
        ...marketing,
        country: COUNTRIES.IL as unknown as Prisma.InputJsonValue,
        priceCurrency: 'ILS',
        status: 'available',
      },
    })
  }

  return { ok: true }
}

/** אפשרויות זמינות — תואמות ל-ListingAvailability. */
const AVAILABILITY_OPTIONS: { id: ListingAvailability; key: string }[] = [
  { id: 'immediate', key: 'nlAvailImmediate' },
  { id: 'new', key: 'nlAvailNew' },
  { id: 'underConstruction', key: 'nlAvailUnderConstruction' },
]

/** כותרת מקטע בטופס — אייקון + טקסט, בראש כל Card. */
function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className='mb-4 flex items-center gap-2 border-b border-gray-100 pb-3'>
      <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600'>
        {icon}
      </span>
      <Heading level={2} size='md'>
        {children}
      </Heading>
    </div>
  )
}

export default function SellerNewListing({
  loaderData,
}: Route.ComponentProps) {
  const { t, tt, locale } = useLocale()
  const navigate = useNavigate()
  const fetcher = useFetcher<typeof action>()

  /* קדם-מילוי מיחידת קבלן — נטען ב-loader. */
  const { unit, project } = loaderData

  const submitting = fetcher.state !== 'idle'

  /* אחרי יצירה מוצלחת — חזרה לפורטפוליו עם באנר הצלחה */
  useEffect(() => {
    if (fetcher.data?.ok)
      navigate('/dashboard/seller/portfolio', {
        state: { adPublished: true },
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data])

  return (
    <div className='mx-auto  space-y-6'>
      <div>
        <Link
          to='/dashboard/seller/portfolio'
          className='mb-2 inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-primary-600'
        >
          <ArrowRightIcon className='h-4 w-4 rtl:rotate-0 ltr:rotate-180' />
          {tt('nlBackToPortfolio')}
        </Link>
        <PageHeader title={tt('nlPageTitle')} subtitle={tt('nlPageSub')} />
      </div>

      {/* אינדיקציה שהמודעה מקושרת ליחידת קבלן מסונכרנת */}
      {unit && (
        <Banner variant='info' icon={<LinkIcon className='h-4 w-4' />}>
          <span className='flex flex-wrap items-center gap-2'>
            {tt('nlLinkedUnit')}
            <Badge variant='primary'>
              {t(unit.title)}
              {project && ` · ${t(project.name)}`}
            </Badge>
          </span>
        </Banner>
      )}

      <fetcher.Form method='post' className='space-y-6'>
        {/* ---------- פרטי המודעה ---------- */}
        <Card>
          <SectionTitle icon={<MegaphoneIcon className='h-4 w-4' />}>
            {tt('nlSecBasics')}
          </SectionTitle>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Field label={tt('adTitleLabel')} className='sm:col-span-2'>
              <Input
                name='title'
                required
                defaultValue={unit ? t(unit.title) : undefined}
                placeholder={tt('adTitlePlaceholder')}
              />
            </Field>

            <Field label={tt('nlDealType')}>
              <Select name='dealType' defaultValue='sale'>
                {DEAL_TYPES.filter((d) => d.id !== 'all').map((d) => (
                  <option key={d.id} value={d.id}>
                    {t(d.label)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={tt('nlCategory')}>
              <Select
                name='category'
                defaultValue={unit ? 'newFromContractor' : 'apartments'}
              >
                {LISTING_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {t(c.label)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label={`${tt('adPriceLabel')} (${unit?.price?.currency ?? 'ILS'})`}
            >
              <Input
                name='price'
                type='number'
                min={0}
                required
                defaultValue={unit?.price?.amount}
              />
            </Field>

            <Field label={tt('nlAvailability')}>
              <Select name='availability' defaultValue='immediate'>
                {AVAILABILITY_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {tt(o.key as Parameters<typeof tt>[0])}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>

        {/* ---------- מיקום ---------- */}
        <Card>
          <SectionTitle icon={<MapPinIcon className='h-4 w-4' />}>
            {tt('nlSecLocation')}
          </SectionTitle>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Field label={tt('nlCity')}>
              <Input name='city' required defaultValue={unit?.address.city} />
            </Field>
            <Field label={tt('nlNeighborhood')}>
              <Input
                name='neighborhood'
                defaultValue={unit?.address.neighborhood}
              />
            </Field>
            <Field label={tt('nlStreet')} className='sm:col-span-2'>
              <Input name='street' defaultValue={unit?.address.street} />
            </Field>
          </div>
        </Card>

        {/* ---------- מאפייני הנכס ---------- */}
        <Card>
          <SectionTitle icon={<RulerIcon className='h-4 w-4' />}>
            {tt('nlSecSpecs')}
          </SectionTitle>
          <div className='grid gap-4 sm:grid-cols-3'>
            <Field label={tt('colRooms')}>
              <Input
                name='rooms'
                type='number'
                min={1}
                step={0.5}
                required
                defaultValue={unit?.rooms}
              />
            </Field>
            <Field label={tt('colSqm')}>
              <Input
                name='sqm'
                type='number'
                min={1}
                required
                defaultValue={unit?.sqm}
              />
            </Field>
            <Field label={tt('nlFloor')}>
              <Input name='floor' defaultValue={unit?.floor} />
            </Field>
            <Field label={tt('nlYearBuilt')}>
              <Input name='yearBuilt' type='number' min={1900} max={2100} />
            </Field>
            <Field label={tt('nlParking')}>
              <Input name='parking' type='number' min={0} defaultValue={0} />
            </Field>
            <Field label={tt('nlEntry')}>
              <Input name='entry' type='date' />
            </Field>
            <Field label={tt('nlFeaturesLabel')} className='sm:col-span-3'>
              <Input
                name='features'
                placeholder={tt('nlFeaturesPlaceholder')}
              />
            </Field>
          </div>
        </Card>

        {/* ---------- תיאור ומדיה ---------- */}
        <Card>
          <SectionTitle icon={<ImageIcon className='h-4 w-4' />}>
            {tt('nlSecDescMedia')}
          </SectionTitle>
          <div className='space-y-4'>
            <Field label={tt('adDescLabel')}>
              <textarea
                name='description'
                rows={4}
                required
                placeholder={tt('adDescPlaceholder')}
                className='w-full resize-none rounded-xl border border-gray-200 bg-white px-2 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100'
              />
            </Field>

            {/* אזור העלאת תמונות — placeholder עד שיהיה storage */}
            <label className='flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/60 px-4 py-8 text-center transition hover:border-primary-300 hover:bg-primary-50/40'>
              <BuildingIcon className='h-6 w-6 text-gray-300' />
              <Text as='span' variant='small'>
                {tt('nlImagesHint')}
              </Text>
              <input
                type='file'
                name='images'
                accept='image/*'
                multiple
                className='hidden'
              />
            </label>
          </div>
        </Card>

        {/* ---------- פעולות ---------- */}
        <div className='flex items-center justify-end gap-2'>
          <Button
            variant='ghost'
            type='button'
            onClick={() => navigate('/dashboard/seller/portfolio')}
          >
            {tt('cancel')}
          </Button>
          <Button type='submit' disabled={submitting}>
            <MegaphoneIcon className='h-4 w-4' />
            {tt('adPublish')}
          </Button>
        </div>

        <Text as='p' variant='small' className='text-center'>
          {tt('adModalHint')}
        </Text>
      </fetcher.Form>
    </div>
  )
}
