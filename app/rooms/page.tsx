'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
// Importing professional icons
import { Search, PackageOpen, Plus, X } from 'lucide-react'

const CATEGORIES = ["All", "Marketplace", "Study Groups", "Accommodation", "Social/Events"]

export default function RoomsPage() {
  const supabase = createClient()
  const [filter, setFilter] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;

    const fetchListings = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        
        if (isMounted) {
          setListings(data || [])
        }
      } catch (error) {
        console.error('Error fetching listings:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchListings()

    const channel = supabase
      .channel('realtime-discover')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'listings' }, (payload) => {
        if (isMounted) setListings((prev) => [payload.new, ...prev])
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'listings' }, (payload) => {
        if (isMounted) setListings((prev) => prev.filter(item => item.id !== payload.old.id))
      })
      .subscribe()

    return () => { 
      isMounted = false;
      supabase.removeChannel(channel) 
    }
  }, [supabase])

  const filteredListings = listings.filter(item => {
    const matchesCategory = filter === "All" || item.category === filter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  })

  return (
    <div className="min-h-screen text-foreground pb-24 selection:bg-primary/30 relative z-10">
      <header className="px-6 py-12 md:py-16 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
          <div className="max-w-2xl animate-in slide-in-from-left-8 fade-in duration-1000 fill-mode-both">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 leading-[1.1]">
              Discover <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-indigo-400 drop-shadow-lg">The Room</span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed font-medium">
              Live updates from the CPUT student community. Find gear, study partners, and campus life essentials instantly.
            </p>
          </div>
          
          <Link href="/marketplace/upload" className="shrink-0 hidden md:block animate-in slide-in-from-right-8 fade-in duration-1000 fill-mode-both delay-100">
            <button className="relative px-8 py-4 bg-primary text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-primary/20 hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 overflow-hidden group">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              <Plus className="w-5 h-5 stroke-[3]" /> Post to The Room
            </button>
          </Link>
        </div>

        <div className="animate-in slide-in-from-bottom-4 fade-in duration-1000 fill-mode-both delay-200 mb-8">
          <div className="relative group/search max-w-2xl">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-zinc-500 group-focus-within/search:text-primary transition-colors duration-300" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for textbooks, laptops, study groups..." 
              className="w-full bg-card/20 backdrop-blur-xl border border-white/10 rounded-2xl pl-14 pr-5 py-4 text-zinc-100 focus:outline-none focus:border-primary/50 focus:bg-card/40 transition-all placeholder:text-zinc-500 shadow-inner group-hover/search:border-white/20"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-5 flex items-center text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="animate-in slide-in-from-bottom-4 fade-in duration-1000 fill-mode-both delay-300 flex gap-3 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2.5 rounded-full border text-sm font-bold transition-all duration-300 whitespace-nowrap shadow-sm hover:-translate-y-0.5 backdrop-blur-md ${
                filter === cat 
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-105" 
                : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[420px] rounded-[2rem] bg-card/10 border border-white/5 overflow-hidden relative shadow-sm backdrop-blur-sm">
                <div className="w-full h-56 bg-white/5 animate-pulse" />
                <div className="p-6 space-y-4">
                  <div className="flex justify-between">
                    <div className="h-6 bg-white/10 rounded-md w-2/3 animate-pulse" />
                    <div className="h-6 bg-primary/20 rounded-md w-1/4 animate-pulse" />
                  </div>
                  <div className="h-4 bg-white/5 rounded-md w-full animate-pulse mt-4" />
                  <div className="h-10 bg-white/10 rounded-xl w-full animate-pulse mt-6" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="animate-in zoom-in-95 fade-in duration-500 flex flex-col items-center justify-center py-24 border border-white/5 rounded-[2.5rem] bg-card/10 backdrop-blur-xl text-center px-6 shadow-2xl">
            <Search className="w-16 h-16 text-zinc-600 mb-6" />
            <h3 className="text-2xl font-black mb-2 tracking-tight">No results found</h3>
            <p className="text-zinc-400 max-w-md mx-auto mb-8 font-medium">
              {searchQuery 
                ? `We couldn't find anything matching "${searchQuery}". Try a different keyword.` 
                : `There are currently no items available in the "${filter}" category.`}
            </p>
            {searchQuery ? (
               <button onClick={() => setSearchQuery("")} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10 active:scale-95 flex items-center gap-2">
                 <X className="w-4 h-4" /> Clear Search
               </button>
            ) : (
              <Link href="/marketplace/upload">
                <button className="px-6 py-3 bg-primary text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Be the first to post
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredListings.map((item, index) => (
              <div 
                key={item.id}
                className="animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-both group relative flex flex-col rounded-[2rem] bg-card/10 backdrop-blur-2xl border border-white/5 hover:border-primary/40 transition-all duration-500 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="h-56 w-full bg-[#0a0a0a] relative overflow-hidden border-b border-white/5">
                  {item.image_url ? (
                    <Image 
                      src={item.image_url} 
                      alt={item.title} 
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <PackageOpen className="w-12 h-12 text-zinc-700" />
                    </div>
                  )}
                  
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-xl rounded-lg text-[10px] font-bold text-white uppercase tracking-widest border border-white/10 shadow-2xl">
                    {item.category}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <h3 className="text-xl font-bold text-zinc-100 group-hover:text-primary transition-colors leading-tight line-clamp-2">
                      {item.title}
                    </h3>
                    <span className="text-primary font-mono font-black text-lg bg-primary/10 px-3 py-1 rounded-lg border border-primary/20 shrink-0 shadow-inner">
                      R{item.price}
                    </span>
                  </div>
                  
                  <p className="text-zinc-400 text-sm mb-6 line-clamp-2 leading-relaxed">
                    {item.description || 'No description provided.'}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between pt-5 border-t border-white/5">
                    <Link href={`/user/${item.user_id}`} className="flex items-center gap-3 group/avatar">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-zinc-300 border border-white/10 shadow-inner group-hover/avatar:border-primary/50 group-hover/avatar:text-primary transition-colors">
                        {item.student_number?.substring(0, 2) || 'ST'}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest group-hover/avatar:text-zinc-300 transition-colors">Verified</span>
                    </Link>
                    
                    <Link href={`/listings/${item.id}`} className="block">
                      <button className="px-5 py-2.5 bg-white/5 hover:bg-primary text-white text-xs font-bold rounded-xl border border-white/10 hover:border-primary transition-all duration-300 shadow-sm active:scale-95 group-hover:shadow-primary/20">
                        View Item
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}