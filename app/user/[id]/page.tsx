'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CheckCircle, PackageOpen, User as UserIcon } from 'lucide-react'

export default function PublicProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfileAndListings = async () => {
      try {
        setLoading(true)
        
        // 1. Fetch the user's public profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single()

        if (profileError) throw profileError
        setProfile(profileData)

        // 2. Fetch all active items this user is selling
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', id)
          .order('created_at', { ascending: false })

        if (!listingsError && listingsData) {
          setListings(listingsData)
        }

      } catch (error) {
        console.error("Error loading profile:", error)
        // If the profile doesn't exist, send them back to the feed
        router.push('/rooms')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchProfileAndListings()
  }, [id, router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-6 flex justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center animate-pulse">
          <div className="w-24 h-24 bg-zinc-800 rounded-full mb-4" />
          <div className="w-48 h-6 bg-zinc-800 rounded-md mb-2" />
          <div className="w-32 h-4 bg-zinc-800 rounded-md" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 pt-8 px-6 bg-[#0a0a0a] selection:bg-primary/30">
      <div className="max-w-6xl mx-auto">
        
        {/* Back Button */}
        <Link href="/rooms" className="inline-flex items-center gap-3 text-zinc-500 hover:text-primary transition-colors duration-300 mb-8 font-medium bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/5">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {/* Profile Header Card */}
        <div className="bg-zinc-900/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-12 mb-12 shadow-2xl flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-blue-500 to-transparent" />
          
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-zinc-800 flex items-center justify-center text-4xl md:text-5xl font-bold text-zinc-300 border-4 border-zinc-900 shadow-xl shrink-0">
            {profile?.username?.substring(0, 1).toUpperCase() || <UserIcon className="w-12 h-12 text-zinc-600" />}
          </div>
          
          <div className="flex-1 text-center md:text-left flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
              {profile?.username || 'Verified Student'}
            </h1>
            <p className="text-primary font-bold flex items-center justify-center md:justify-start gap-2 mb-4">
              Verified CPUT Student <CheckCircle className="w-5 h-5" />
            </p>
            <p className="text-zinc-400 font-medium">
              Member since {new Date(profile?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <div className="bg-black/40 px-6 py-4 rounded-2xl border border-white/5 text-center shrink-0">
            <div className="text-3xl font-black text-white mb-1">{listings.length}</div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active Listings</div>
          </div>
        </div>

        {/* Seller's Items Grid */}
        <h3 className="text-xl font-bold text-white mb-6">Items for sale by this student</h3>
        
        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 border border-white/5 rounded-3xl text-center">
            <PackageOpen className="w-16 h-16 text-zinc-600 mb-4" />
            <h3 className="text-xl font-bold text-zinc-300 mb-2">No active items</h3>
            <p className="text-zinc-500">This user isn't selling anything right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item) => (
              <Link href={`/listings/${item.id}`} key={item.id} className="group bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden flex flex-col hover:border-white/20 transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="relative aspect-video w-full bg-black overflow-hidden border-b border-white/5">
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PackageOpen className="w-10 h-10 text-zinc-700" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
                    {item.category}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-grow justify-between gap-4">
                  <h3 className="font-bold text-lg text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors">{item.title}</h3>
                  <span className="text-primary font-bold text-xl tracking-tight">R{item.price}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}