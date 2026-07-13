import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { Badge, Text, cn, fadeUp } from '../components/ui'
import { motion } from 'motion/react'

import { Logo } from '../components/logo'
import { useLocale } from '~/i18n/locale'
import type { DictKey } from '~/i18n/dictionary'
import {
  BriefcaseIcon,
  BuildingIcon,
  CalendarDaysIcon,
  FunnelIcon,
  HandshakeIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  SparklesIcon,
} from 'lucide-react'

/*
 * פריסת הדשבורד — תפריט הצד נבנה לפי התפקיד (פרק 2 באפיון).
 * ממומשים: קבלן + מוכר/מתווך. מתג התפקיד הוא דמו עד שיחובר auth.
 */

type DashRole = 'contractor' | 'seller'

interface NavItem {
  to: string
  labelKey: DictKey
  icon: typeof BuildingIcon
  end: boolean
}

const NAVS: Record<DashRole, NavItem[]> = {
  contractor: [
    { to: '/dashboard', labelKey: 'navMyProjects', icon: BuildingIcon, end: true },
    { to: '/dashboard/leads', labelKey: 'navLeads', icon: FunnelIcon, end: false },
    { to: '/dashboard/import', labelKey: 'navImport', icon: SparklesIcon, end: false },
    { to: '/dashboard/chat', labelKey: 'navChat', icon: MessageSquareIcon, end: false },
  ],
  seller: [
    {
      to: '/dashboard/seller',
      labelKey: 'navSellerOverview',
      icon: LayoutDashboardIcon,
      end: true,
    },
    {
      to: '/dashboard/seller/portfolio',
      labelKey: 'navPortfolio',
      icon: BriefcaseIcon,
      end: false,
    },
    {
      to: '/dashboard/seller/viewings',
      labelKey: 'navViewings',
      icon: CalendarDaysIcon,
      end: false,
    },
    {
      to: '/dashboard/seller/deals',
      labelKey: 'navDeals',
      icon: HandshakeIcon,
      end: false,
    },
    { to: '/dashboard/leads', labelKey: 'navLeads', icon: FunnelIcon, end: false },
    { to: '/dashboard/chat', labelKey: 'navChat', icon: MessageSquareIcon, end: false },
  ],
}

const ROLE_LABEL: Record<DashRole, DictKey> = {
  contractor: 'roleContractor',
  seller: 'roleSeller',
}

/** פרטי משתמש הדמו לכל תפקיד — עד שיחובר auth. */
const ROLE_USER: Record<DashRole, { initials: string; name: string; org: string }> = {
  contractor: { initials: 'יכ', name: 'יוסי כהן', org: 'י.כ. בנייה ופיתוח בע״מ' },
  seller: { initials: 'מל', name: 'מיכל לוי', org: 'רי/מקס תל אביב' },
}

function RoleSwitch({
  role,
  onChange,
}: {
  role: DashRole
  onChange: (r: DashRole) => void
}) {
  const { tt } = useLocale()
  return (
    <div className='flex rounded-xl bg-gray-100 p-0.5'>
      {(['contractor', 'seller'] as const).map((r) => (
        <button
          key={r}
          type='button'
          onClick={() => onChange(r)}
          className={cn(
            'flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition',
            role === r
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-800',
          )}
        >
          {tt(ROLE_LABEL[r])}
        </button>
      ))}
    </div>
  )
}

function NavItems({
  role,
  onNavigate,
}: {
  role: DashRole
  onNavigate?: () => void
}) {
  const { tt } = useLocale()
  return (
    <nav className='flex flex-col gap-1'>
      {NAVS[role].map(({ to, labelKey, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-2 border border-primary-50 py-2.5 text-sm font-medium transition ',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
            )
          }
        >
          <Icon className='h-5 w-5' />
          {tt(labelKey)}
        </NavLink>
      ))}
    </nav>
  )
}

function UserCard({ role }: { role: DashRole }) {
  const { tt } = useLocale()
  const user = ROLE_USER[role]
  return (
    <div className='flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3'>
      <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500 font-bold text-white'>
        {user.initials}
      </span>
      <div className='min-w-0'>
        <p className='truncate text-sm font-semibold text-gray-900'>
          {user.name}
        </p>
        <Text as='p' variant='small' className='truncate'>
          {user.org}
        </Text>
      </div>
      <Badge className='mr-auto shrink-0'>{tt(ROLE_LABEL[role])}</Badge>
    </div>
  )
}

export default function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { tt } = useLocale()
  const [role, setRole] = useState<DashRole>('contractor')

  /* שחזור התפקיד שנבחר + התאמה אוטומטית לפי הנתיב הנוכחי */
  useEffect(() => {
    const saved = localStorage.getItem('dashRole')
    if (location.pathname.startsWith('/dashboard/seller')) setRole('seller')
    else if (saved === 'seller' || saved === 'contractor') setRole(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const switchRole = (r: DashRole) => {
    setRole(r)
    localStorage.setItem('dashRole', r)
    navigate(r === 'seller' ? '/dashboard/seller' : '/dashboard')
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Sidebar — צד ימין (RTL), דסקטופ בלבד */}
      <aside className='fixed inset-y-0 right-0 z-40 hidden w-64 flex-col border-e border-gray-100 bg-white p-4 lg:flex'>
        <div className='px-2 py-2'>
          <Logo />
        </div>

        <div className='mt-4'>
          <Text as='p' variant='small' className='mb-1.5 px-1'>
            {tt('roleView')}
          </Text>
          <RoleSwitch role={role} onChange={switchRole} />
        </div>

        <div className='mt-5 flex-1'>
          <NavItems role={role} />
        </div>

        <UserCard role={role} />
      </aside>

      {/* Mobile top bar */}
      <header className='sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md lg:hidden'>
        <div className='flex items-center justify-between gap-3 px-4 py-3'>
          <Logo />
          <div className='flex items-center gap-2'>
            <RoleSwitch role={role} onChange={switchRole} />
          </div>
        </div>
        <div className='flex gap-1 overflow-x-auto px-4 pb-3 scrollbar-none'>
          {NAVS[role].map(({ to, labelKey, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600',
                )
              }
            >
              {tt(labelKey)}
            </NavLink>
          ))}
        </div>
      </header>

      <div className='lg:pr-64'>
        {/* key לפי הנתיב — התוכן נכנס מחדש באנימציה בכל מעבר עמוד */}
        <motion.main
          key={location.pathname}
          variants={fadeUp}
          initial='hidden'
          animate='visible'
          className='mx-auto max-w-6xl p-4 sm:p-6 lg:p-8'
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  )
}
