'use client'

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'

export default function AuthButtons() {
  const { isSignedIn } = useUser()

  if (isSignedIn) {
    return (
      <>
        <Link
          href="/dashboard"
          className="font-medium text-[15px] px-4 py-2 rounded-lg transition-all duration-200 no-underline text-gray-600 hover:text-blue-600 hover:bg-blue-50"
        >
          Dashboard
        </Link>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-9 h-9"
            }
          }}
        />
      </>
    )
  }

  return (
    <>
      <SignInButton mode="modal">
        <button className="font-medium text-[15px] px-4 py-2 rounded-lg transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50">
          Sign In
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="font-medium text-[15px] px-6 py-2 rounded-lg transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700">
          Sign Up
        </button>
      </SignUpButton>
    </>
  )
}
