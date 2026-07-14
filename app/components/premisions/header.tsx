import { SearchIcon, SparklesIcon } from 'lucide-react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { Logo } from '../logo'
import { fadeDown, IconButton, TextLink } from '../ui'
import LogIn from './logIn'
import { LanguageSwitcher } from '~/i18n/language-switcher'
import { useLocale } from '~/i18n/locale'

function SearchBar({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const { tt } = useLocale()

  return (
    <div
      className={`flex items-center rounded-full border border-gray-200 bg-white py-1.5 pr-5 pl-2 shadow-sm transition hover:shadow-md focus-within:shadow-md ${className ?? ''}`}
    >
      <input
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={tt('searchPlaceholder')}
        className='w-full bg-transparent text-sm outline-none placeholder:text-gray-400'
      ></input>
      <IconButton aria-label={tt('search')}>
        <SearchIcon className='h-4 w-4' />
      </IconButton>
    </div>
  )
}

export function Header({
  query = '',
  setQuery,
}: {
  query?: string
  setQuery?: (q: string) => void
}) {
  const { tt } = useLocale()
  return (
    <motion.header
      variants={fadeDown}
      initial='hidden'
      animate='visible'
      className='sticky top-0  z-30 border-b border-gray-100 bg-white/90 backdrop-blur-md '
    >
      <div className='mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8'>
        <Logo />
        <LanguageSwitcher />

        {setQuery && (
          <div className='hidden flex-1 justify-center md:flex'>
            <SearchBar
              value={query}
              onChange={setQuery}
              className='w-full max-w-xl'
            />
          </div>
        )}

        <nav className='flex items-center gap-2'>
          <Link
            to='/assistant'
            className='inline-flex items-center gap-1.5 rounded-full bg-linear-to-l from-primary-500 to-accent-400 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md'
          >
            <SparklesIcon className='h-4 w-4' />
            <span className='hidden sm:block'>{tt('navAssistant')}</span>
          </Link>
          <TextLink
            href='/dashboard'
            variant='nav'
            className='hidden lg:block'
          >
            {tt('contractorsArea')}
          </TextLink>
          <LogIn />
        </nav>
      </div>

      {/* Mobile search */}
      {setQuery && (
        <div className='px-4 pb-3 md:hidden'>
          <SearchBar value={query} onChange={setQuery} />
        </div>
      )}
    </motion.header>
  )
}
