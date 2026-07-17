import { LogInIcon, LogOutIcon, UserCircle2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Button } from '../ui'
import { useLocale } from '~/i18n/locale'

import { createClient } from '@supabase/supabase-js'
/**
 * Auth זמני — עד שתחובר מערכת אימות אמיתית.
 * מחזיר "לא מחובר" כך שמוצג כפתור התחברות. להחליף ב-hook אמיתי בהמשך.
 */
type AuthUser = { disName?: string; email?: string; imgUrl?: string }
function useAuth() {
  return {
    userD: null as AuthUser | null,
    loginWithGoogle: () => {},
    logout: () => {},
    loading: false,
  }
}

const LogInOld = () => {
  const { tt } = useLocale()
  const [open, setOpen] = useState(false)
  const { userD, loginWithGoogle, logout, loading } = useAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!userD) {
    return (
      <Button
        variant='outline'
        size='md'
        className='h-fit'
        onClick={() => setOpen(true)}
        // onClick={() => loginWithGoogle()}
      >
        {/* <span> {loading ? 'מתחבר...' : 'התחבר'}</span> */}
        <LogInIcon size={14} />
      </Button>
    )
  }

  return (
    <div className='relative' ref={dropdownRef}>
      <Button
        variant='outline'
        size='sm'
        // onClick={() => setOpen((v) => !v)}
      >
        {userD.imgUrl ? (
          <img
            src={userD.imgUrl}
            alt={userD.disName ?? 'User'}
            referrerPolicy='no-referrer'
            className='w-6 h-6 rounded-full object-cover ring ring-pri/40'
          />
        ) : (
          <UserCircle2 size={32} className='text-pri/60' />
        )}
        <span className='text-sm  text-pri max-w-30 truncate hidden sm:block'>
          {userD.disName}
        </span>
      </Button>

      {open && (
        <div
          className='absolute  right-0 mt-2 w-52 rounded-xl shadow-xl bg-white border border-gray-100 overflow-hidden z-50'
          onMouseLeave={() => setOpen(false)}
        >
          <div className='px-4 py-3 border-b border-gray-100 flex items-center gap-3'>
            {userD.imgUrl ? (
              <img
                src={userD.imgUrl}
                alt={userD.disName ?? 'User'}
                referrerPolicy='no-referrer'
                className='w-8 h-8 rounded-full object-cover'
              />
            ) : (
              <UserCircle2 size={40} className='text-gray-400' />
            )}
            <div className='overflow-hidden'>
              <p className='text-sm font-bold text-gray-800 truncate'>
                {userD.disName}
              </p>
              <p className='text-xs text-gray-400 truncate'>{userD.email}</p>
            </div>
          </div>
          <div className='p-2 text-pri'>
            <nav className='flex flex-col gap-2 py-1'>
              {/* {navAdminLinks.map((L) => (
                <div key={L.id}>
                  <Link to={L.href} className='hover:text-sec'>
                    {L.name}
                  </Link>
                </div>
              ))} */}
            </nav>
          </div>
          <button
            onClick={() => {
              logout()
              setOpen(false)
            }}
            className='w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors duration-150 font-medium cursor-pointer'
          >
            <LogOutIcon size={15} />
            <span>{tt('logout')}</span>
          </button>
        </div>
      )}
    </div>
  )
}

// export default LogIn
