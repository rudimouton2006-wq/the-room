'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/components/ToastProvider'
import { Ban, PackageOpen, ArrowLeft, CheckCircle, Trash2 } from 'lucide-react'

export default function ListingDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  
  const [listing, setListing] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isMessaging, setIsMessaging] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isNotFound, setIsNotFound] = useState(false)

  useEffect(() => {
    let isMounted = true;

    const fetchListingAndUser = async () => {
      try {
        setLoading(true)
        
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', id)
          .single()

        if (listingError && listingError.code === 'PGRST116') {
          if (isMounted) setIsNotFound(true)
          return
        }
        
        if (listingError) throw listingError
        
        const { data: { user } } = await supabase.auth.getUser()

        if (isMounted) {
          setListing(listingData)
          setCurrentUser(user)
        }
      } catch (error) {
        console.error('Fetch error:', error)
        if (isMounted) setIsNotFound(true)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (id) fetchListingAndUser()

    return () => {
      isMounted = false;
    }
  }, [id, supabase])

  // UPDATED: Now handles image deletion
  const handleDeleteListing = async () => {
    const isConfirmed = window.confirm("Are you sure you want to permanently delete this item from The Room?")
    if (!isConfirmed) return

    try {
      setIsDeleting(true)

      // 1. Delete the image from the bucket
      if (listing?.image_url) {
        const urlParts = listing.image_url.split('/listings/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          await supabase.storage.from('listings').remove([filePath])
        }
      }

      // 2. Delete the row from the database
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast("Listing successfully removed.", "success")
      router.push('/rooms')
      router.refresh()
    } catch (error) {
      console.error("Error deleting listing:", error)
      toast("Failed to delete the listing. Please try again.", "error")
      setIsDeleting(false)
    }
  }

  const handleStartChat = async () => {
    try {
      setIsMessaging(true)
      
      if (!currentUser) {
        toast("You must be signed in to message a seller.", "info")
        router.push('/login')
        return
      }
      
      if (currentUser.id === listing.user_id) {
        toast("This is your own listing! You cannot message yourself.", "error")
        setIsMessaging(false)
        return
      }

      const { data: conv, error } = await supabase
        .from('conversations')
        .insert({
          listing_id: id,
          buyer_id: currentUser.id,
          seller_id: listing.user_id
        })
        .select()
        .single()

      if (error && error.code === '23505') {
         const { data: existing, error: existingError } = await supabase
          .from('conversations')
          .select('id')
          .eq('listing_id', id)
          .eq('buyer_id', currentUser.id)
          .single()
          
         if (existingError) throw existingError;
         if (existing) {
           toast("Opening existing conversation...", "info")
           router.push(`/messages/${existing.id}`)
           return
         }
      } else if (error) {
        throw error;
      }

      if (conv) {
        toast("Secure connection established.", "success")
        router.push(`/messages/${conv.id}`)
      }

    } catch (error) {
      console.error("Error starting chat:", error)
      toast("Failed to start conversation. Please try again.", "error")
      setIsMessaging(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-24 pt-12 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="w-32 h-6 bg-white/5 rounded-md animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            <div className="w-full h-[400px] lg:h-[600px] bg-card/10 border border-white/5 rounded-[2.5rem] animate-pulse" />
            <div className="flex flex-col justify-center space-y-6">
              <div className="w-3/4 h-12 bg-white/10 rounded-xl animate-pulse" />
              <div className="w-1/3 h-10 bg-primary/20 rounded-xl animate-pulse mb-8" />
              <div className="w-full h-48 bg-card/10 rounded-3xl animate-pulse" />
              <div className="w-full h-16 bg-primary/20 rounded-2xl animate-pulse mt-8" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isNotFound || !listing) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 relative z-10">
        <div className="max-w-md text-center bg-card/10 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
          <Ban className="w-16 h-16 text-zinc-600 mb-6 mx-auto" />
          <h1 className="text-3xl font-black mb-3 tracking-tight">Item Unavailable</h1>
          <p className="text-zinc-400 font-medium leading-relaxed mb-8">
            This item has been marked as sold or removed by the seller. It is no longer available in The Room.
          </p>
          <Link href="/rooms" className="w-full block">
            <button className="w-full py-4 bg-primary text-white font-bold rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-primary/20">
              Return to Discover
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = currentUser?.id === listing.user_id

  return (
    <div className="min-h-screen text-foreground pb-24 pt-8 px-6 selection:bg-primary/30 relative z-10">
      <div className="max-w-6xl mx-auto">
        
        <div className="animate-in slide-in-from-left-4 fade-in duration-700 fill-mode-both">
          <Link href="/rooms" className="inline-flex items-center gap-3 text-zinc-500 hover:text-primary transition-colors duration-300 mb-8 group font-medium bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/5 hover:border-primary/30">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Discover Feed
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="animate-in slide-in-from-bottom-8 fade-in duration-1000 fill-mode-both w-full h-[400px] sm:h-[500px] lg:h-[600px] bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden relative shadow-2xl group">
            {listing.image_url ? (
              <Image 
                src={listing.image_url} 
                alt={listing.title} 
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/5">
                <PackageOpen className="w-20 h-20 text-zinc-700" />
              </div>
            )}
            
            <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-xl text-xs font-bold text-white uppercase tracking-widest border border-white/10 shadow-xl">
              {listing.category}
            </div>
          </div>

          <div className="flex flex-col justify-center py-6 animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-200 fill-mode-both">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 leading-[1.1] tracking-tight">
              {listing.title}
            </h1>
            
            <div className="inline-flex items-center px-6 py-3 bg-primary/10 border border-primary/20 rounded-2xl w-fit mb-10 shadow-inner">
              <span className="text-3xl sm:text-4xl text-primary font-mono font-bold tracking-tight">R{listing.price}</span>
            </div>
            
            <div className="bg-card/10 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 mb-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Item Details</h3>
              <p className="text-zinc-300 text-lg leading-relaxed whitespace-pre-wrap">
                {listing.description || 'No additional details provided by the seller.'}
              </p>
            </div>

            <Link href={`/user/${listing.user_id}`} className="block group/trust mb-10">
              <div className="flex items-center justify-between p-5 bg-black/20 border border-white/5 rounded-2xl backdrop-blur-sm group-hover/trust:border-primary/40 group-hover/trust:bg-card/20 transition-all duration-300">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-xl font-bold text-zinc-300 border border-white/10 shadow-inner group-hover/trust:border-primary/50 group-hover/trust:text-primary transition-colors">
                    {listing.student_number?.substring(0, 2) || 'ST'}
                  </div>
                  <div>
                    <p className="font-bold text-base text-zinc-100 flex items-center gap-2 group-hover/trust:text-primary transition-colors">
                      Verified CPUT Student
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </p>
                    <p className="text-xs text-zinc-500 font-mono mt-1 tracking-wider">ID: •••••••{listing.student_number?.slice(-3) || '•••'}</p>
                  </div>
                </div>
                <div className="hidden sm:block px-4 py-2 bg-white/5 text-zinc-400 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest group-hover/trust:bg-primary/10 group-hover/trust:text-primary group-hover/trust:border-primary/30 transition-all">
                  View Profile
                </div>
              </div>
            </Link>

            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              {isOwner ? (
                <button 
                  onClick={handleDeleteListing}
                  disabled={isDeleting}
                  className="relative w-full py-5 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-500 hover:text-red-400 text-lg font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-red-900/10 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 flex justify-center items-center gap-3"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Remove My Listing
                    </>
                  )}
                </button>
              ) : (
                <button 
                  onClick={handleStartChat}
                  disabled={isMessaging}
                  className="relative w-full py-5 bg-primary hover:bg-blue-500 text-white text-lg font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-primary/20 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 flex justify-center items-center gap-3 overflow-hidden group/btn"
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                  {isMessaging ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Message Seller'
                  )}
                </button>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}