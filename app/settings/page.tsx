'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, LogOut, Save, AlertTriangle, CheckCircle, Settings as SettingsIcon } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const getProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }

        if (isMounted) setEmail(user.email || '')

        const { data, error } = await supabase
          .from('profiles')
          .select('username, student_number')
          .eq('id', user.id)
          .single()

        if (error) throw error

        if (data && isMounted) {
          setUsername(data.username || '')
          setStudentNumber(data.student_number || '')
        }
      } catch (error: any) {
        console.error('Error loading profile:', error.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    getProfile()

    return () => { isMounted = false }
  }, [supabase, router])

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          student_number: studentNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-12 px-6 max-w-3xl mx-auto">
        <div className="w-48 h-10 bg-white/5 rounded-xl animate-pulse mb-10" />
        <div className="w-full h-[400px] bg-card/10 border border-white/5 rounded-[2.5rem] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen text-foreground pb-24 pt-8 px-6 selection:bg-primary/30 relative z-10">
      <div className="max-w-3xl mx-auto">
        
        <header className="mb-10 animate-in slide-in-from-bottom-4 fade-in duration-700">
          <h1 className="text-4xl font-black tracking-tighter mb-3 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            Your <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-indigo-400">Settings</span>
          </h1>
          <p className="text-zinc-400 font-medium">Manage your personal profile and account details.</p>
        </header>

        <div className="bg-card/10 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-100">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <form onSubmit={updateProfile} className="space-y-6">
            
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/5">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 shrink-0">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Profile Details</h3>
                <p className="text-xs text-zinc-500">Other students will see this information.</p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-bold backdrop-blur-md">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-400 text-sm font-bold backdrop-blur-md animate-in fade-in">
                <CheckCircle className="w-5 h-5 shrink-0" />
                Settings saved successfully.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group/input space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-primary transition-colors">
                  Full Name
                </label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl focus:border-primary/50 focus:bg-white/5 outline-none text-sm transition-all placeholder:text-zinc-600 hover:border-white/20 shadow-inner" 
                />
              </div>

              <div className="group/input space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-primary transition-colors">
                  Student Number
                </label>
                <input 
                  type="text" 
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl focus:border-primary/50 focus:bg-white/5 outline-none text-sm transition-all placeholder:text-zinc-600 hover:border-white/20 shadow-inner" 
                />
              </div>
            </div>

            <div className="group/input space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">
                Email Address
              </label>
              <input 
                type="email" 
                value={email}
                disabled
                className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl text-zinc-500 text-sm shadow-inner cursor-not-allowed" 
              />
              <p className="text-[10px] text-zinc-600 ml-1">Your email address cannot be changed.</p>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-4">
              <button 
                type="submit"
                disabled={saving}
                className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-blue-500 transition-all duration-300 shadow-xl shadow-primary/20 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 flex justify-center items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Changes
                  </>
                )}
              </button>

              <button 
                type="button"
                onClick={handleSignOut}
                className="px-8 py-4 bg-red-500/10 text-red-400 font-bold rounded-2xl hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 border border-red-500/20 flex justify-center items-center gap-2 active:scale-95"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}