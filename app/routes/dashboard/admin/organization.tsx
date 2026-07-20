import { useState } from 'react'
import { Link, data, useFetcher } from 'react-router'
import type { Route } from './+types/organization'
import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  Field,
  Heading,
  Input,
  Modal,
  PageHeader,
  Select,
  StatCard,
  Text,
} from '../../../components/ui'
import {
  ArrowRightIcon,
  Building2Icon,
  BuildingIcon,
  HandshakeIcon,
  PlusIcon,
  ShieldCheckIcon,
  UsersIcon,
} from 'lucide-react'
import type { Role, User, UserStatus } from '~/types'
import {
  addOrganizationMember,
  organizationAdminById,
  setOrganizationVerified,
  setUserRole,
  setUserStatus,
  updateOrganizationProfile,
} from '~/server/admin.server'
import { useLocale } from '~/i18n/locale'
import {
  ORG_TYPE_LABEL,
  ROLE_LABELS,
  USER_STATUS_META,
} from '~/components/admin/admin-shared'

export function meta({}: Route.MetaArgs) {
  return [{ title: 'ניהול ארגון | Admin' }]
}

export async function loader({ params }: Route.LoaderArgs) {
  const detail = await organizationAdminById(params.id)
  if (!detail) throw data('הארגון לא נמצא', { status: 404 })
  return { detail }
}

type ActionData = { ok: true; member?: User } | { error: 'emailTaken' }

export async function action({
  request,
  params,
}: Route.ActionArgs): Promise<ActionData> {
  const form = await request.formData()
  const intent = form.get('intent')

  if (intent === 'profile') {
    await updateOrganizationProfile(params.id, {
      name: String(form.get('name')),
      alias: String(form.get('alias') ?? '') || undefined,
      regions: String(form.get('regions') ?? '')
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean),
    })
    return { ok: true }
  }

  if (intent === 'verify') {
    await setOrganizationVerified(params.id, form.get('verified') === 'true')
    return { ok: true }
  }

  if (intent === 'memberStatus') {
    await setUserStatus(
      String(form.get('userId')),
      form.get('status') as UserStatus,
    )
    return { ok: true }
  }

  if (intent === 'memberRole') {
    await setUserRole(String(form.get('userId')), form.get('role') as Role)
    return { ok: true }
  }

  if (intent === 'addMember') {
    const result = await addOrganizationMember(params.id, {
      name: String(form.get('name')),
      email: String(form.get('email')),
      phone: String(form.get('phone') ?? '') || undefined,
      role: form.get('role') as Role,
    })
    return 'error' in result
      ? { error: 'emailTaken' }
      : { ok: true, member: result }
  }

  return { ok: true }
}

/** התפקידים שאפשר לשייך לחבר צוות בארגון (לא אדמין/לקוח). */
const MEMBER_ROLES: Role[] = ['contractor', 'seller']

export default function AdminOrganization({
  loaderData,
}: Route.ComponentProps) {
  const { t, tt, formatDate } = useLocale()
  const { detail } = loaderData

  const profileFetcher = useFetcher<ActionData>()
  const verifyFetcher = useFetcher()
  const memberFetcher = useFetcher()
  const addFetcher = useFetcher<ActionData>()

  const [org, setOrg] = useState(detail.org)
  const [members, setMembers] = useState(detail.members)
  const [addOpen, setAddOpen] = useState(false)
  const [savedBanner, setSavedBanner] = useState(false)

  /* חבר צוות חדש נוסף — ה-action מחזיר את המשתמש שנוצר ב-DB */
  const addedMember =
    addFetcher.data && 'member' in addFetcher.data
      ? addFetcher.data.member
      : undefined
  const emailTaken =
    addFetcher.data && 'error' in addFetcher.data
      ? addFetcher.data.error === 'emailTaken'
      : false
  if (addedMember && !members.some((m) => m.id === addedMember.id)) {
    setMembers((prev) => [...prev, addedMember])
    setAddOpen(false)
  }

  const saveProfile = (form: FormData) => {
    form.append('intent', 'profile')
    profileFetcher.submit(form, { method: 'post' })
    setOrg((prev) => ({
      ...prev,
      name: String(form.get('name')),
      alias: String(form.get('alias') ?? '') || undefined,
      regions:
        String(form.get('regions') ?? '')
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean) || undefined,
    }))
    setSavedBanner(true)
    setTimeout(() => setSavedBanner(false), 4000)
  }

  const toggleVerified = () => {
    verifyFetcher.submit(
      { intent: 'verify', verified: String(!org.verified) },
      { method: 'post' },
    )
    setOrg((prev) => ({ ...prev, verified: !prev.verified }))
  }

  const patchMember = (userId: string, patch: Partial<User>) =>
    setMembers((prev) =>
      prev.map((m) => (m.id === userId ? { ...m, ...patch } : m)),
    )

  const changeMemberStatus = (userId: string, status: UserStatus) => {
    memberFetcher.submit(
      { intent: 'memberStatus', userId, status },
      { method: 'post' },
    )
    patchMember(userId, { status })
  }

  const changeMemberRole = (userId: string, role: Role) => {
    memberFetcher.submit(
      { intent: 'memberRole', userId, role },
      { method: 'post' },
    )
    patchMember(userId, { role })
  }

  const totalUnits = detail.projects.reduce((s, p) => s + p.units.length, 0)

  return (
    <div className='space-y-5'>
      <Link
        to='/dashboard/admin/organizations'
        className='inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-primary-600'
      >
        <ArrowRightIcon className='h-4 w-4' />
        {tt('orgBackToList')}
      </Link>

      <PageHeader
        title={org.name}
        subtitle={`${tt(ORG_TYPE_LABEL[org.type])}${org.alias ? ` · ${org.alias}` : ''}`}
        icon={<Building2Icon className='h-5 w-5' />}
        actions={
          <Button
            variant={org.verified ? 'outline' : 'primary'}
            onClick={toggleVerified}
            className='flex items-center gap-2'
          >
            <ShieldCheckIcon className='h-4 w-4' />
            {org.verified ? tt('orgUnverifyAction') : tt('orgVerifyAction')}
          </Button>
        }
      />

      {savedBanner && <Banner variant='success'>{tt('orgSaved')}</Banner>}

      {/* KPIs */}
      <div className='grid grid-cols-2 gap-4 xl:grid-cols-4'>
        <StatCard
          label={tt('orgKpiMembers')}
          value={members.length}
          icon={<UsersIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('orgProjectsSection')}
          value={detail.projects.length}
          hint={`${totalUnits} ${tt('totalUnits')}`}
          icon={<BuildingIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('orgColDeals')}
          value={detail.deals}
          icon={<HandshakeIcon className='h-5 w-5' />}
        />
        <StatCard
          label={tt('orgColVerified')}
          value={
            <Badge variant={org.verified ? 'success' : 'warning'}>
              {org.verified ? tt('orgVerified') : tt('orgNotVerified')}
            </Badge>
          }
          icon={<ShieldCheckIcon className='h-5 w-5' />}
        />
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        {/* פרופיל הארגון */}
        <Card className='space-y-4'>
          <Heading level={2} size='md'>
            {tt('orgProfile')}
          </Heading>
          <form
            className='space-y-4'
            onSubmit={(e) => {
              e.preventDefault()
              saveProfile(new FormData(e.currentTarget))
            }}
          >
            <Field label={tt('orgNameLabel')}>
              <Input name='name' required defaultValue={org.name} />
            </Field>
            <Field label={tt('orgAliasLabel')}>
              <Input
                name='alias'
                defaultValue={org.alias ?? ''}
                placeholder='C-105'
                dir='ltr'
              />
            </Field>
            <Field label={tt('orgRegionsLabel')}>
              <Input
                name='regions'
                defaultValue={org.regions?.join(', ') ?? ''}
                placeholder={tt('orgRegionsPh')}
              />
              <Text as='p' variant='small' className='mt-1'>
                {tt('orgRegionsHint')}
              </Text>
            </Field>
            <div className='flex justify-end'>
              <Button type='submit'>{tt('orgSave')}</Button>
            </div>
          </form>
        </Card>

        {/* פרויקטים של הארגון */}
        <Card className='space-y-3 p-0'>
          <div className='border-b border-gray-100 p-4'>
            <Heading level={2} size='md'>
              {tt('orgProjectsSection')}
            </Heading>
          </div>
          {detail.projects.length === 0 ? (
            <div className='p-4'>
              <EmptyState
                size='sm'
                title={tt('orgNoProjects')}
                icon={<BuildingIcon className='h-5 w-5' />}
              />
            </div>
          ) : (
            <ul className='divide-y divide-gray-50 px-4 pb-2'>
              {detail.projects.map((p) => {
                const sold = p.units.filter((u) => u.status === 'sold').length
                return (
                  <li
                    key={p.id}
                    className='flex flex-wrap items-center gap-x-4 gap-y-1 py-3'
                  >
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-semibold text-gray-900'>
                        {t(p.name)}
                      </p>
                      <Text as='p' variant='small'>
                        {p.units.length} {tt('impUnitsCount')} · {sold}{' '}
                        {tt('soldOfUnits')}
                      </Text>
                    </div>
                    <Text as='span' variant='small'>
                      {formatDate(p.createdAt)}
                    </Text>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* חברי צוות */}
      <Card className='p-0'>
        <div className='flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 p-4'>
          <Heading level={2} size='md'>
            {tt('orgTeam')}{' '}
            <span className='text-sm font-normal text-gray-400'>
              ({members.length})
            </span>
          </Heading>
          <Button
            size='sm'
            onClick={() => setAddOpen(true)}
            className='flex items-center gap-1.5'
          >
            <PlusIcon className='h-3.5 w-3.5' />
            {tt('orgInviteMember')}
          </Button>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full min-w-160 text-sm'>
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
                  {tt('usrColStatus')}
                </th>
                <th className='px-3 py-2.5 text-start font-medium'>
                  {tt('usrColJoined')}
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className='border-b border-gray-50'>
                  <td className='px-4 py-2.5 font-semibold text-gray-900'>
                    {m.name}
                  </td>
                  <td className='px-3 py-2.5 text-xs text-gray-600' dir='ltr'>
                    {m.email}
                    {m.phone && <p className='text-gray-400'>{m.phone}</p>}
                  </td>
                  <td className='px-3 py-2.5'>
                    <Select
                      value={m.role}
                      onChange={(e) =>
                        changeMemberRole(m.id, e.target.value as Role)
                      }
                    >
                      {MEMBER_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {tt(ROLE_LABELS[r])}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className='px-3 py-2.5'>
                    <Select
                      value={m.status}
                      onChange={(e) =>
                        changeMemberStatus(m.id, e.target.value as UserStatus)
                      }
                    >
                      {(Object.keys(USER_STATUS_META) as UserStatus[]).map(
                        (s) => (
                          <option key={s} value={s}>
                            {tt(USER_STATUS_META[s].label)}
                          </option>
                        ),
                      )}
                    </Select>
                  </td>
                  <td className='px-3 py-2.5 text-xs text-gray-600'>
                    {formatDate(m.createdAt)}
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={5} className='p-4'>
                    <EmptyState
                      size='sm'
                      title={tt('orgNoMembers')}
                      icon={<UsersIcon className='h-5 w-5' />}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* מודל הוספת חבר צוות */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={tt('orgInviteMember')}
      >
        <form
          className='space-y-4'
          onSubmit={(e) => {
            e.preventDefault()
            const form = new FormData(e.currentTarget)
            form.append('intent', 'addMember')
            addFetcher.submit(form, { method: 'post' })
          }}
        >
          <Text variant='muted'>{tt('orgInviteHint')}</Text>
          {emailTaken && (
            <Banner variant='danger'>{tt('orgEmailTaken')}</Banner>
          )}
          <Field label={tt('fullName')}>
            <Input
              name='name'
              required
              placeholder={tt('fullNamePlaceholder')}
            />
          </Field>
          <Field label={tt('emailAddress')}>
            <Input
              name='email'
              type='email'
              required
              placeholder='name@example.com'
              dir='ltr'
            />
          </Field>
          <Field label={tt('phone')}>
            <Input name='phone' dir='ltr' placeholder='050-0000000' />
          </Field>
          <Field label={tt('usrColRole')}>
            <Select
              name='role'
              defaultValue={org.type === 'contractor' ? 'contractor' : 'seller'}
            >
              {MEMBER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {tt(ROLE_LABELS[r])}
                </option>
              ))}
            </Select>
          </Field>
          <div className='flex justify-end gap-2 pt-2'>
            <Button variant='ghost' onClick={() => setAddOpen(false)}>
              {tt('cancel')}
            </Button>
            <Button type='submit' disabled={addFetcher.state !== 'idle'}>
              {tt('orgAddMemberCta')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
