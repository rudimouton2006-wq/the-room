'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { UserX, Inbox, ArrowLeft, PackageOpen } from 'lucide-react'

export default function UserProfilePage() {
  const { id } = useParams()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      try {
        setLoading(true)
        
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('username, student_number, created_at')
          .eq('id', id)
          .single()

        if (profileError && profileError.code === 'PGRST116') {
          if (isMounted) setIsNotFound(true)
          return
        }
        
        if (isMounted) setProfile(userProfile)

        const { data: userListings, error: listingsError } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', id)
          .order('created_at', { ascending: false })

        if (!listingsError && isMounted) {
          setListings(userListings || [])
        }

      } catch (error) {
        console.error("Profile fetch error:", error)
        if (isMounted) setIsNotFound(true)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (id) fetchUserData()

    return () => {
      isMounted = false;
    }
  }, [id, supabase])

  if (loading) {
    return (
      <div className="min-h-screen pt-12 pb-24 px-6 max-w-6xl mx-auto">
        <div className="w-32 h-6 bg-white/5 rounded-md animate-pulse mb-8" />
        <div className="w-full h-48 bg-card/10 border border-white/5 rounded-[2.5rem] animate-pulse mb-12" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-card/10 rounded-[2rem] border border-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (isNotFound || !profile) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6">
        <div className="max-w-md text-center bg-card/10 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
          <UserX className="w-16 h-16 text-zinc-600 mb-6 mx-auto" />
          <h1 className="text-3xl font-black mb-3 tracking-tight">Profile Not Found</h1>
          <p className="text-zinc-400 font-medium leading-relaxed mb-8">
            This user either does not exist or has deleted their account from The Room.
          </p>
          <Link href="/rooms" className="w-full block">
            <button className="w-full py-4 bg-primary text-white font-bold rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-95">
              Return to Community
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-foreground pb-24 pt-8 px-6 selection:bg-primary/30 relative z-10">
      <div className="max-w-6xl mx-auto">
        
        <div className="animate-in slide-in-from-left-4 fade-in duration-700 fill-mode-both">
          <Link href="/rooms" className="inline-flex items-center gap-3 text-zinc-500 hover:text-primary transition-colors duration-300 mb-8 group font-medium bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/5 hover:border-primary/30">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Discover
          </Link>
        </div>

        <div className="animate-in slide-in-from-bottom-8 fade-in duration-1000 fill-mode-both bg-card/10 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 md:p-12 mb-16 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div className="relative">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary to-indigo-600 p-1 flex-shrink-0 shadow-[0_0_40px_rgba(37,99,235,0.3)] group-hover:shadow-[0_0_60px_rgba(37,99,235,0.5)] transition-all duration-500">
                <div className="w-full h-full bg-[#0a0a0a] rounded-full flex items-center justify-center text-4xl font-black text-white border-4 border-[#0a0a0a]">
                  {profile.username ? profile.username.substring(0, 1).toUpperCase() : 'ST'}
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500/10 backdrop-blur-md border border-green-500/30 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                Verified
              </div>
            </div>

            <div className="text-center md:text-left flex-1 mt-2">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-white">
                {profile.username || 'CPUT Student'}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium">
                <div className="flex items-center gap-2 text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                  <span className="opacity-70">ID:</span> 
                  <span className="font-mono tracking-wider">•••••••{profile.student_number?.slice(-3) || '•••'}</span>
                </div>
                {profile.created_at && (
                  <div className="text-zinc-500">
                    Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-6 mt-4 md:mt-0 px-6 py-4 bg-black/20 rounded-2xl border border-white/5 shrink-0">
              <div className="text-center">
                <div className="text-2xl font-black text-white">{listings.length}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">Active Listings</div>
              </div>
            </div>
          </div>
        </div>

        <div className="animate-in fade-in duration-1000 fill-mode-both delay-300">
          <h2 className="text-2xl font-black tracking-tight mb-8">Active in The Room</h2>

          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-white/5 rounded-[2.5rem] bg-card/10 backdrop-blur-xl text-center px-6">
               <Inbox className="w-12 h-12 text-zinc-600 mb-4 mx-auto" />
               <p className="text-zinc-400 font-medium">This student currently has no active listings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {listings.map((item, index) => (
                <div 
                  key={item.id}
                  className="animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-both group relative flex flex-col rounded-[2rem] bg-card/10 backdrop-blur-2xl border border-white/5 hover:border-primary/40 transition-all duration-500 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="h-48 w-full bg-[#0a0a0a] relative overflow-hidden border-b border-white/5">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <PackageOpen className="w-10 h-10 text-zinc-700" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-xl rounded-lg text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
                      {item.category}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3 gap-4">
                      <h3 className="text-lg font-bold text-zinc-100 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                        {item.title}
                      </h3>
                      <span className="text-primary font-mono font-black text-base bg-primary/10 px-2 py-1 rounded-lg border border-primary/20 shrink-0">
                        R{item.price}
                      </span>
                    </div>
                    
                    <div className="mt-auto pt-5">
                      <Link href={`/listings/${item.id}`} className="block w-full">
                        <button className="w-full px-5 py-3 bg-white/5 hover:bg-primary text-white text-xs font-bold rounded-xl border border-white/10 hover:border-primary transition-all duration-300 shadow-sm active:scale-95 group-hover:shadow-primary/20">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  )
}