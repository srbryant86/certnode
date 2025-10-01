"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type NavLink = {
  href: string
  label: string
}

const NAV_LINKS: NavLink[] = [
  { href: "/platform", label: "Platform" },
  { href: "/solutions", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/support", label: "Support" },
  { href: "/security", label: "Security" },
]

const linkIsActive = (pathname: string, href: string) => {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function Navigation() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const containerRef = useRef<HTMLElement | null>(null)

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
      document.addEventListener("click", handleClickOutside)
    } else {
      document.removeEventListener("click", handleClickOutside)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      document.removeEventListener("click", handleClickOutside)
      window.removeEventListener("resize", handleResize)
    }
  }, [mobileOpen])

  return (
    <header
      ref={containerRef}
      className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-lg shadow-sm"
    >
      <div className="max-w-[1280px] mx-auto">
        <nav className="flex justify-between items-center h-[72px] px-6">
          <Link
            href="/"
            className="text-[1.75rem] font-bold text-blue-600 hover:text-blue-700 transition-all duration-200 no-underline tracking-tight transform hover:translate-y-[-1px]"
          >
            CertNode
          </Link>

          <button
            type="button"
            className="mobile-menu-toggle md:hidden bg-none border-none text-gray-600 cursor-pointer p-2 rounded-lg transition-all duration-200 hover:text-blue-600 hover:bg-blue-50"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12H21" />
              <path d="M3 6H21" />
              <path d="M3 18H21" />
            </svg>
          </button>

          <div className="nav-links hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => {
              const active = linkIsActive(pathname, link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href as any}
                  className={`font-medium text-[15px] px-4 py-2 rounded-lg transition-all duration-200 no-underline ${
                    active
                      ? "text-blue-600 bg-blue-50 font-semibold"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-white flex-col gap-0 py-4 border-t border-gray-200 shadow-lg transition-all duration-300 ease-in-out z-50 ${
          mobileOpen ? "translate-y-0 opacity-100 visible" : "translate-y-[-100%] opacity-0 invisible"
        }`}
      >
        <nav className="flex flex-col gap-0">
          {NAV_LINKS.map((link) => {
            const active = linkIsActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href as any}
                className={`block py-4 px-6 text-[15px] font-medium transition-all duration-200 no-underline border-b border-gray-100 last:border-b-0 ${
                  active
                    ? "text-blue-600 bg-blue-50 font-semibold"
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                }`}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
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
