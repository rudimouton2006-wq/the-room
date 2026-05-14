'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, MailCheck } from 'lucide-react'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: { full_name: fullName } }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 relative overflow-hidden z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 blur-[150px] -z-10 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
        
        <div className="max-w-md w-full text-center bg-card/10 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl animate-in zoom-in-95 fade-in duration-700">
          <div className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
            <MailCheck className="w-12 h-12 text-green-400 stroke-[2]" />
          </div>
          <h2 className="text-3xl font-black mb-3 tracking-tight">Check Your Email</h2>
          <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
            We sent a verification link to <span className="text-zinc-200 font-bold">{email}</span>. Please click the link in that email to finish signing up.
          </p>
          <Link href="/login" className="w-full block">
            <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all duration-300 border border-white/10 hover:border-white/20 active:scale-95">
              Go to Sign In
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 relative overflow-hidden z-10 selection:bg-primary/30">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] -z-10 rounded-full animate-pulse" style={{ animationDuration: '5s' }} />
      
      <div className="w-full max-w-md animate-in slide-in-from-bottom-8 fade-in duration-1000 fill-mode-both py-12">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6 hover:scale-105 transition-transform">
             <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl mx-auto group">
                <UserPlus className="w-8 h-8 text-zinc-300 group-hover:text-indigo-400 transition-colors stroke-[2]" />
             </div>
          </Link>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-3">
            Create an <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-indigo-400">Account</span>
          </h1>
          <p className="text-zinc-400 text-sm font-medium">Sign up using your student email address.</p>
        </div>

        <div className="bg-card/10 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.3)] relative group/form">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <div className="animate-in fade-in slide-in-from-top-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold text-center backdrop-blur-md">
                {error}
              </div>
            )}
            
            <div className="group/input space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-primary transition-colors">Full Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl focus:border-primary/50 focus:bg-white/5 outline-none text-sm transition-all placeholder:text-zinc-600 hover:border-white/20 shadow-inner" 
                placeholder="e.g. Rudi Mouton"
              />
            </div>

            <div className="group/input space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-primary transition-colors">Email Address</label>
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
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-primary transition-colors">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl focus:border-primary/50 focus:bg-white/5 outline-none text-sm transition-all placeholder:text-zinc-600 hover:border-white/20 shadow-inner tracking-widest" 
                placeholder="At least 6 characters"
              />
            </div>

            <button 
              disabled={loading}
              className="relative w-full py-4 mt-6 bg-primary text-white font-bold rounded-2xl hover:bg-blue-500 transition-all duration-300 shadow-xl shadow-primary/20 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 overflow-hidden group/btn flex justify-center items-center gap-2"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-zinc-500 font-medium">
            Already have an account? <Link href="/login" className="text-zinc-300 font-bold hover:text-primary transition-colors">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}