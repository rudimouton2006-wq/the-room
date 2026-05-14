'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { MessageSquare, Search, ChevronRight, PackageOpen } from 'lucide-react'

export default function MessagesPage() {
  const supabase = createClient()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchConversations = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch conversations where the user is either the buyer or the seller
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            id,
            created_at,
            listing:listings (id, title, image_url, price),
            buyer:profiles!buyer_id (id, username, student_number),
            seller:profiles!seller_id (id, username, student_number)
          `)
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order('created_at', { ascending: false })

        if (error) throw error

        if (isMounted) {
          // Format the data to easily identify "the other person" in the chat
          const formattedChats = data.map((conv: any) => {
            const isBuyer = conv.buyer.id === user.id
            return {
              ...conv,
              otherPerson: isBuyer ? conv.seller : conv.buyer,
              role: isBuyer ? 'Buying' : 'Selling'
            }
          })
          setConversations(formattedChats)
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchConversations()

    return () => { isMounted = false }
  }, [supabase])

  // Simple search filter based on item title or the other person's name
  const filteredChats = conversations.filter(chat => 
    chat.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.otherPerson?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen text-foreground pb-24 pt-8 px-6 selection:bg-primary/30 relative z-10">
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-10 animate-in slide-in-from-bottom-4 fade-in duration-700">
          <h1 className="text-4xl font-black tracking-tighter mb-3">
            Your <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-indigo-400">Messages</span>
          </h1>
          <p className="text-zinc-400 font-medium">Chat with buyers and sellers on campus.</p>
        </header>

        {/* Simple Search Bar */}
        <div className="mb-8 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
          <div className="relative group/search">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-zinc-500 group-focus-within/search:text-primary transition-colors" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by item or student name..." 
              className="w-full bg-card/20 backdrop-blur-xl border border-white/10 rounded-2xl pl-14 pr-5 py-4 text-zinc-100 focus:outline-none focus:border-primary/50 focus:bg-card/40 transition-all placeholder:text-zinc-500 shadow-inner"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="bg-card/10 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-200">
          
          {loading ? (
            <div className="p-8 space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-3 py-2">
                    <div className="h-4 bg-white/10 rounded w-1/3" />
                    <div className="h-3 bg-white/5 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-16 text-center">
              <MessageSquare className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No messages found</h3>
              <p className="text-zinc-400 text-sm">
                {searchQuery ? "Try a different search term." : "When you message someone about an item, the chat will appear here."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredChats.map((chat) => (
                <Link 
                  href={`/messages/${chat.id}`} 
                  key={chat.id}
                  className="block p-4 sm:p-6 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-4 sm:gap-6">
                    
                    {/* Item Image */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black/40 rounded-2xl overflow-hidden relative shrink-0 border border-white/5">
                      {chat.listing?.image_url ? (
                        <Image src={chat.listing.image_url} alt="Item" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PackageOpen className="w-6 h-6 text-zinc-600" />
                        </div>
                      )}
                    </div>

                    {/* Chat Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-base sm:text-lg font-bold text-zinc-100 truncate group-hover:text-primary transition-colors">
                          {chat.listing?.title || 'Unknown Item'}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 shrink-0">
                          {new Date(chat.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${chat.role === 'Buying' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-green-500/10 text-green-400'}`}>
                          {chat.role}
                        </span>
                        <span className="truncate">
                          Chat with <span className="font-bold text-zinc-300">{chat.otherPerson?.username || 'Student'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Simple Action Arrow */}
                    <div className="shrink-0 pl-2">
                      <ChevronRight className="w-6 h-6 text-zinc-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>

                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}