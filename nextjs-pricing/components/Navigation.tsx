'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavLink = {
  href: string
  label: string
}

const NAV_LINKS: NavLink[] = [
  { href: '/platform', label: 'Platform' },
  { href: '/solutions', label: 'Solutions' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/support', label: 'Support' },
  { href: '/trust', label: 'Security' },
  { href: '/verify', label: 'Validator' },
]

const linkIsActive = (pathname: string, href: string) => {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function Navigation() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (containerRef.current.contains(event.target as Node)) return
      setMobileOpen(false)
    }

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false)
      }
    }

    if (mobileOpen) {
      document.addEventListener('click', handleClickOutside)
    } else {
      document.removeEventListener('click', handleClickOutside)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      document.removeEventListener('click', handleClickOutside)
      window.removeEventListener('resize', handleResize)
    }
  }, [mobileOpen])

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/95 backdrop-blur">
      <div
        ref={containerRef}
        className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 md:px-6"
      >
        <Link
          href="/"
          className="logo text-[1.75rem] font-bold leading-none tracking-[-0.025em] text-blue-600 transition hover:-translate-y-px hover:text-blue-700"
        >
          CertNode
        </Link>

        <button
          type="button"
          className="mobile-menu-toggle inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          aria-controls="primary-navigation"
          onClick={() => setMobileOpen((open) => !open)}
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <nav className="nav-links hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const active = linkIsActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href as any}
                className={`rounded-lg px-4 py-2 text-[15px] font-medium transition-all ${
                  active
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:bg-blue-50/60 hover:text-blue-600'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div
        className={`md:hidden ${
          mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden border-t border-slate-200/60 bg-white/95 backdrop-blur-sm transition-all duration-300 ease-in-out`}
      >
        <nav id="primary-navigation" className="flex flex-col space-y-2 px-4 py-4">
          {NAV_LINKS.map((link) => {
            const active = linkIsActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href as any}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm md:hidden" aria-hidden />
      ) : null}
    </header>
  )
}
