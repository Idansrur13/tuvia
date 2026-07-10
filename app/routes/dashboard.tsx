import { NavLink, Outlet, useLocation } from 'react-router'
import { Badge, Text, cn, fadeUp } from '../components/ui'
import { motion } from 'motion/react'

import { Logo } from '../components/logo'
import { useLocale } from '~/i18n/locale'
import {
  BuildingIcon,
  ChartAreaIcon,
  FunnelIcon,
  MessageSquareIcon,
  SlidersIcon,
  SparklesIcon,
  UsersIcon,
} from 'lucide-react'

/*
 * פריסת הדשבורד משותפת לכל התפקידים (קבלן / לקוח / אדמין).
 * תפריט הצד נבנה לפי התפקיד; כרגע ממומש תפריט הקבלן.
 */

const CONTRACTOR_NAV = [
  {
    to: '/dashboard',
    labelKey: 'navMyProjects',
    icon: BuildingIcon,
    end: true,
  },
  {
    to: '/dashboard/leads',
    labelKey: 'navLeads',
    icon: FunnelIcon,
    end: false,
  },
  {
    to: '/dashboard/import',
    labelKey: 'navImport',
    icon: SparklesIcon,
    end: false,
  },
  {
    to: '/dashboard/chat',
    labelKey: 'navChat',
    icon: MessageSquareIcon,
    end: false,
  },
] as const

const COMING_SOON = [
  { labelKey: 'navMyClients', icon: UsersIcon },
  { labelKey: 'navReports', icon: ChartAreaIcon },
  { labelKey: 'navSettings', icon: SlidersIcon },
] as const

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { tt } = useLocale()
  return (
    <nav className='flex flex-col  gap-1'>
      {CONTRACTOR_NAV.map(({ to, labelKey, icon: Icon, end }) => (
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

function UserCard() {
  const { tt } = useLocale()
  return (
    <div className='flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3'>
      <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500 font-bold text-white'>
        יכ
      </span>
      <div className='min-w-0'>
        <p className='truncate text-sm font-semibold text-gray-900'>יוסי כהן</p>
        <Text as='p' variant='small' className='truncate'>
          י.כ. בנייה ופיתוח בע״מ
        </Text>
      </div>
      <Badge className='mr-auto shrink-0'>{tt('roleContractor')}</Badge>
    </div>
  )
}

export default function DashboardLayout() {
  const location = useLocation()
  const { tt } = useLocale()

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Sidebar — צד ימין (RTL), דסקטופ בלבד */}
      <aside className='fixed inset-y-0 right-0 z-40 hidden w-64 flex-col border-e border-gray-100 bg-white p-4 lg:flex'>
        <div className='px-2 py-2'>
          <Logo />
        </div>

        <div className='mt-6 flex-1 '>
          <NavItems />
        </div>

        <UserCard />
      </aside>

      {/* Mobile top bar */}
      <header className='sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md lg:hidden'>
        <div className='flex items-center justify-between px-4 py-3'>
          <Logo />
          <Badge>{tt('roleContractor')}</Badge>
        </div>
        <div className='flex gap-1 overflow-x-auto px-4 pb-3 scrollbar-none'>
          {CONTRACTOR_NAV.map(({ to, labelKey, end }) => (
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
        {/* key לפי הנתיב התוכן נכנס מחדש באנימציה בכל מעבר עמוד */}
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
