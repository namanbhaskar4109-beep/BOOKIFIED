'use client'
import Image from 'next/image'
import Link from 'next/link'
import React, { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from 'cn'
import { SignInButton, SignUpButton, Show, UserButton , useUser} from '@clerk/nextjs'

const navItems = [
  { label: 'Library', href: '/' },
  { label: 'Add New', href: '/books/new' }
]

export const Navbar = () => {
  const pathname = usePathname();
  const { user } = useUser();
  return (
    <header className="w-full fixed z-50 bg-[var(--bg-primary)]">
      <div className="wrapper navbar-height py-4 flex justify-between items-center">
        <Link href="/" className="flex gap-2.5 items-center">
          <Image
            src="/assets/logo.png"
            alt="Bookified"
            width={36}
            height={32}
            className="w-auto h-8"
            priority
          />
          <span className="logo-text">Bookified</span>
        </Link>
        <nav className="flex w-fit gap-7.5 items-center">
          {navItems.map(({ label, href }) => {
            const isActive = pathname === href ||
              (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={label}
                href={href}
                className={cn(
                  'nav-link-base',
                  isActive ? 'nav-link-active' : 'text-black hover:opacity-70'
                )}
              >
                {label}
              </Link>
            );
          })}
          <div className="flex items-center gap-7.5">
            <Suspense fallback={null}>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="nav-btn">Sign In</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="nav-btn">Sign Up</button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
                {user?.firstName && (
                  <Link href="/subscriptions" className="nav-user-name">
                    {user.firstName}
                  </Link>
                )}
              </Show>
            </Suspense>
          </div>
        </nav>
      </div>
    </header>
  )
}
