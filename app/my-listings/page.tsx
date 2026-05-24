'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, PackageOpen, ArrowRight } from 'lucide-react'
import { useToast } from '@/components/ToastProvider'

export default function MyListingsDashboard() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchMyInventory()
  }, [])

  const fetchMyInventory = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setListings(data || [])
    } catch (error) {
      console.error("Error fetching inventory:", error)
      toast("Could not load your inventory.", "error")
    } finally {
      setLoading(false)
    }
  }

  // UPDATED: Now accepts imageUrl and deletes it from the bucket
  const handleDelete = async (id: string, imageUrl: string | null) => {
    const isConfirmed = window.confirm("Are you sure you want to permanently delete this item?")
    if (!isConfirmed) return

    try {
      // 1. Delete the image from the bucket to save space
      if (imageUrl) {
        const urlParts = imageUrl.split('/listings/')
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

      // Instantly remove it from the screen
      setListings(listings.filter(item => item.id !== id))
      toast("Listing deleted successfully.", "success")
    } catch (error) {
      console.error("Delete error:", error)
      toast("Failed to delete item.", "error")
    }
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <PackageOpen className="w-12 h-12 text-zinc-600" />
          <p className="text-zinc-500 font-medium">Loading your inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 pt-12 pb-24">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">My Inventory</h1>
          <p className="text-zinc-400">Manage, view, and remove the items you have listed in The Room.</p>
        </div>
        <Link href="/marketplace/upload">
          <button className="px-5 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors">
            + Post New Item
          </button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/30 border border-zinc-800/50 rounded-[2rem] text-center">
          <PackageOpen className="w-16 h-16 text-zinc-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Your inventory is empty</h3>
          <p className="text-zinc-400 mb-6 max-w-md">You haven't posted any items to the marketplace yet. Get started by listing your first item.</p>
          <Link href="/marketplace/upload">
            <button className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20">
              Post an Item
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
            <div key={item.id} className="group bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden flex flex-col hover:border-white/10 transition-colors">
              <div className="relative aspect-video w-full bg-zinc-900 border-b border-white/5 overflow-hidden">
                {item.image_url ? (
                  <Image src={item.image_url} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-700">No Image</div>
                )}
                <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
                  {item.category}
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start gap-4 mb-4">
                  <h3 className="font-bold text-lg text-white leading-tight line-clamp-2">{item.title}</h3>
                  <span className="text-primary font-bold whitespace-nowrap">R{item.price}</span>
                </div>
                
                <div className="flex-grow"></div>
                
                <div className="flex gap-3 mt-6 pt-6 border-t border-white/5">
                  <Link href={`/listings/${item.id}`} className="flex-1">
                    <button className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                      View <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                  <button 
                    onClick={() => handleDelete(item.id, item.image_url)} // UPDATED to pass image URL
                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-colors flex items-center justify-center group/delete"
                    title="Delete Listing"
                  >
                    <Trash2 className="w-5 h-5 group-hover/delete:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}