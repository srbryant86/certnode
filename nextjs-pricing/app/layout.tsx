import type { ReactNode } from 'react'
import { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CertNode Receipt Infrastructure',
  description: 'Enterprise-grade cryptographic receipt infrastructure with transparent pricing and developer-first experience.',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
