'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          CertNode
        </Link>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 md:hidden"
          aria-label="Toggle navigation"
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

        <nav className="hidden gap-6 md:flex">
          {NAV_LINKS.map((link) => {
            const active = linkIsActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href as any}
                className={`text-sm font-medium transition-colors ${
                  active
                    ? 'text-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
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
        <nav className="flex flex-col space-y-2 px-4 py-4">
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
    </header>
  )
}
