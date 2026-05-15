'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Hexagon, Home, MessageSquare, Settings, LogIn, Plus, Package } from 'lucide-react'

export default function Navbar() {
  const [session, setSession] = useState<any>(null)
  const supabase = createClient()
  const pathname = usePathname()

  useEffect(() => {
    // High-performance session checking
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Hide Navbar on landing, login, and signup pages to keep them clean
  if (pathname === '/' || pathname === '/login' || pathname === '/signup') return null

  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* DESKTOP NAVBAR (PCs & Laptops)                                     */}
      {/* ------------------------------------------------------------------ */}
      <nav className="hidden md:flex border-b border-white/5 bg-[#030303]/80 backdrop-blur-2xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 w-full flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/rooms" className="text-xl font-black tracking-tighter hover:scale-105 transition-transform origin-left flex items-center gap-2 group">
            <Hexagon className="w-6 h-6 text-primary group-hover:text-indigo-400 transition-colors stroke-[2.5]" />
            THE <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-indigo-400">ROOM</span>
          </Link>
          
          {/* Main Links */}
          <div className="flex items-center gap-8 text-sm font-bold">
            <Link href="/rooms" className={`transition-colors pb-1 border-b-2 flex items-center gap-2 ${isActive('/rooms') ? "text-white border-primary" : "text-zinc-500 border-transparent hover:text-zinc-300"}`}>
              Home
            </Link>
            
            {session ? (
              <>
                <Link href="/messages" className={`transition-colors pb-1 border-b-2 flex items-center gap-2 ${isActive('/messages') ? "text-white border-primary" : "text-zinc-500 border-transparent hover:text-zinc-300"}`}>
                  Messages
                </Link>
                <Link href="/my-listings" className={`transition-colors pb-1 border-b-2 flex items-center gap-2 ${isActive('/my-listings') ? "text-white border-primary" : "text-zinc-500 border-transparent hover:text-zinc-300"}`}>
                  My Listings
                </Link>
                <Link href="/settings" className={`transition-colors pb-1 border-b-2 flex items-center gap-2 ${isActive('/settings') ? "text-white border-primary" : "text-zinc-500 border-transparent hover:text-zinc-300"}`}>
                  Settings
                </Link>
                <Link href="/marketplace/upload" className="ml-4 px-5 py-2.5 bg-white/5 hover:bg-primary text-white rounded-xl transition-all duration-300 border border-white/10 hover:border-primary shadow-sm hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Post Item
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="ml-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-blue-500 transition-all duration-300 shadow-lg shadow-primary/20 hover:-translate-y-0.5">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* MOBILE NAVBAR (Phones & Tablets)                                   */}
      {/* ------------------------------------------------------------------ */}
      <nav className="md:hidden border-b border-white/5 bg-[#030303]/80 backdrop-blur-2xl sticky top-0 z-50 px-6 h-14 flex items-center justify-center">
        <Link href="/rooms" className="text-lg font-black tracking-tighter flex items-center gap-2">
          <Hexagon className="w-5 h-5 text-primary stroke-[2.5]" />
          THE <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-indigo-400">ROOM</span>
        </Link>
      </nav>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-3xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-16 px-2">
          
          <Link href="/rooms" className={`flex flex-col items-center justify-center w-16 h-full transition-colors group ${isActive('/rooms') ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Home className="w-6 h-6 mb-1 transition-transform group-hover:scale-110" />
            <span className="text-[9px] font-bold tracking-widest uppercase">Home</span>
          </Link>

          <Link href="/messages" className={`flex flex-col items-center justify-center w-16 h-full transition-colors group ${isActive('/messages') ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <MessageSquare className="w-6 h-6 mb-1 transition-transform group-hover:scale-110" />
            <span className="text-[9px] font-bold tracking-widest uppercase">Messages</span>
          </Link>

          <Link href="/marketplace/upload" className="relative -top-5 flex flex-col items-center justify-center group">
            <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)] border-4 border-[#030303] group-hover:scale-105 group-active:scale-95 transition-all">
              <Plus className="w-7 h-7 stroke-[2.5]" />
            </div>
          </Link>

          {session ? (
            <>
              <Link href="/my-listings" className={`flex flex-col items-center justify-center w-16 h-full transition-colors group ${isActive('/my-listings') ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}>
                <Package className="w-6 h-6 mb-1 transition-transform group-hover:scale-110" />
                <span className="text-[9px] font-bold tracking-widest uppercase">Listings</span>
              </Link>
              <Link href="/settings" className={`flex flex-col items-center justify-center w-16 h-full transition-colors group ${isActive('/settings') ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'}`}>
                <Settings className="w-6 h-6 mb-1 transition-transform group-hover:scale-110" />
                <span className="text-[9px] font-bold tracking-widest uppercase">Settings</span>
              </Link>
            </>
          ) : (
            <Link href="/login" className="flex flex-col items-center justify-center w-16 h-full text-zinc-500 hover:text-white transition-colors group">
              <LogIn className="w-6 h-6 mb-1 transition-transform group-hover:scale-110" />
              <span className="text-[9px] font-bold tracking-widest uppercase">Sign In</span>
            </Link>
          )}

        </div>
      </div>
    </>
  )
}