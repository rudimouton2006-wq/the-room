'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/rooms')
      router.refresh()
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 relative overflow-hidden z-10 selection:bg-primary/30">
      {/* Subtle Ambient Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[150px] -z-10 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
      
      <div className="w-full max-w-md animate-in slide-in-from-bottom-8 fade-in duration-1000 fill-mode-both">
        
        {/* Simple, Familiar Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6 hover:scale-105 transition-transform">
             <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl mx-auto group">
                <LogIn className="w-8 h-8 text-zinc-300 group-hover:text-primary transition-colors stroke-[2]" />
             </div>
          </Link>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-3">
            Welcome <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-indigo-400">Back</span>
          </h1>
          <p className="text-zinc-400 text-sm font-medium">Sign in to connect with your campus.</p>
        </div>

        {/* Clean Login Form */}
        <div className="bg-card/10 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.3)] relative group/form">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="animate-in fade-in slide-in-from-top-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold text-center backdrop-blur-md">
                {error}
              </div>
            )}
            
            <div className="group/input space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-primary transition-colors">
                Email Address
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl focus:border-primary/50 focus:bg-white/5 outline-none text-sm transition-all placeholder:text-zinc-600 hover:border-white/20 shadow-inner" 
                placeholder="student@cput.ac.za"
              />
            </div>

            <div className="group/input space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] group-focus-within/input:text-primary transition-colors">
                  Password
                </label>
                <Link href="#" className="text-[10px] text-zinc-500 hover:text-primary transition-colors font-bold tracking-wider">
                  Forgot password?
                </Link>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl focus:border-primary/50 focus:bg-white/5 outline-none text-sm transition-all placeholder:text-zinc-600 hover:border-white/20 shadow-inner tracking-widest" 
                placeholder="••••••••"
              />
            </div>

            <button 
              disabled={loading}
              className="relative w-full py-4 mt-4 bg-primary text-white font-bold rounded-2xl hover:bg-blue-500 transition-all duration-300 shadow-xl shadow-primary/20 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 overflow-hidden group/btn flex justify-center items-center gap-2"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-zinc-500 font-medium">
            Don't have an account? <Link href="/signup" className="text-zinc-300 font-bold hover:text-primary transition-colors">Sign up here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}