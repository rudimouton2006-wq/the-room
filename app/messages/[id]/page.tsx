'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function PrivateChatPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [convDetails, setConvDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true;

    const setupChat = async () => {
      try {
        setLoading(true)
        
        // 1. Authenticate
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          router.push('/login')
          return
        }
        
        if (isMounted) setCurrentUser(user)

        // 2. Fetch Conversation & Listing Context (with safe joins)
        const { data: conv, error: convError } = await supabase
          .from('conversations')
          .select(`
            *, 
            listing:listing_id (title, price, image_url, status),
            seller:seller_id (username),
            buyer:buyer_id (username)
          `)
          .eq('id', id)
          .single()
          
        if (convError || !conv) throw new Error("Conversation not found")
        
        // Security Check: Ensure user belongs in this chat
        if (user.id !== conv.buyer_id && user.id !== conv.seller_id) {
          router.push('/messages')
          return
        }

        if (isMounted) setConvDetails(conv)

        // 3. Fetch Historical Messages
        const { data: msgs, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', id)
          .order('created_at', { ascending: true })

        if (msgError) throw msgError
        if (isMounted) setMessages(msgs || [])

      } catch (error) {
        console.error("Chat Initialization Error:", error)
        if (isMounted) router.push('/messages')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (id) setupChat()

    // 4. Initialize Real-Time WebSocket Subscription
    const channel = supabase
      .channel(`conv-${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${id}` 
      }, (payload) => {
        if (isMounted) {
          setMessages((prev) => [...prev, payload.new])
        }
      })
      .subscribe()

    return () => { 
      isMounted = false;
      supabase.removeChannel(channel) 
    }
  }, [id, router, supabase])

  // Auto-scroll to latest message when messages array updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !currentUser || isSending) return
    
    const textToSend = message.trim()
    setMessage('') // Instant optimistic UI clear
    setIsSending(true)

    try {
      const { error } = await supabase.from('messages').insert({
        text: textToSend,
        conversation_id: id,
        user_id: currentUser.id,
        user_email: currentUser.email
      })

      if (error) {
        // Revert UI if send fails
        setMessage(textToSend)
        throw error
      }
    } catch (error) {
      console.error("Message Send Error:", error)
      alert("Failed to send message. Please check your connection.")
    } finally {
      setIsSending(false)
    }
  }

  // Helper to determine partner name
  const getPartnerName = () => {
    if (!currentUser || !convDetails) return 'Student'
    return currentUser.id === convDetails.buyer_id 
      ? convDetails.seller?.username 
      : convDetails.buyer?.username
  }

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-background">
        <header className="p-4 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary/50 rounded-xl animate-pulse" />
          <div className="space-y-2">
            <div className="w-32 h-4 bg-secondary/50 rounded animate-pulse" />
            <div className="w-16 h-3 bg-secondary/30 rounded animate-pulse" />
          </div>
        </header>
        <div className="flex-1 p-6 space-y-6">
          <div className="w-2/3 h-12 bg-secondary/30 rounded-2xl animate-pulse" />
          <div className="w-1/2 h-12 bg-secondary/30 rounded-2xl animate-pulse ml-auto" />
          <div className="w-3/4 h-16 bg-secondary/30 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // SAFE DATA HYDRATION (Protects against deleted items)
  // ---------------------------------------------------------------------------
  const isDeleted = !convDetails?.listing
  const title = isDeleted ? 'Archived / Sold Item' : convDetails.listing.title
  const price = isDeleted ? null : convDetails.listing.price
  const imageUrl = isDeleted ? null : convDetails.listing.image_url

  // ---------------------------------------------------------------------------
  // OPTIMIZED RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background selection:bg-primary/30">
      
      {/* Glassmorphic Sticky Header */}
      <header className={`px-4 md:px-6 py-4 border-b sticky top-0 z-20 flex items-center justify-between shadow-sm transition-colors ${isDeleted ? 'bg-secondary/20 border-border/50' : 'bg-background/80 backdrop-blur-md border-border'}`}>
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <Link href="/messages" className="text-zinc-500 hover:text-primary transition-colors p-2 -ml-2 rounded-lg hover:bg-secondary/50 shrink-0">
            ←
          </Link>
          
          {/* Dynamic Header Thumbnail */}
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden border shrink-0 shadow-sm ${isDeleted ? 'bg-background border-dashed border-zinc-600' : 'bg-secondary border-border'}`}>
            {imageUrl ? (
              <img src={imageUrl} className="w-full h-full object-cover" alt="Item" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg md:text-xl opacity-20">
                {isDeleted ? '🚫' : '📦'}
              </div>
            )}
          </div>
          
          <div className="min-w-0">
            <h2 className={`font-bold text-sm md:text-base leading-tight truncate ${isDeleted ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
              {title}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {price && !isDeleted && (
                <span className="text-[10px] md:text-xs text-primary font-mono font-bold tracking-widest bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                  R{price}
                </span>
              )}
              {isDeleted && (
                <span className="text-[10px] md:text-xs text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded shrink-0">
                  SOLD
                </span>
              )}
              <span className="text-[10px] text-zinc-500 hidden sm:inline truncate">
                • Chatting with {getPartnerName()}
              </span>
            </div>
          </div>
        </div>
        
        {/* Only show "View Item" if the item still exists in the database */}
        {!isDeleted && (
          <Link href={`/listings/${convDetails?.listing_id}`} className="hidden md:block shrink-0 ml-4">
            <button className="px-4 py-2 bg-secondary/50 hover:bg-secondary text-xs font-bold rounded-lg border border-border transition-colors">
              View Item
            </button>
          </Link>
        )}
      </header>

      {/* Message History Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <div className="text-4xl mb-4">👋</div>
            <p className="text-sm font-medium">Say hello to {getPartnerName()}!</p>
            <p className="text-xs mt-1 max-w-xs">Messages are end-to-end encrypted in The Room.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.user_id === currentUser?.id
            // Group consecutive messages visually
            const isConsecutive = index > 0 && messages[index - 1].user_id === msg.user_id

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isConsecutive ? 'mt-1' : 'mt-4'}`}>
                <div className={`px-5 py-3 max-w-[85%] md:max-w-[70%] text-sm md:text-base break-words shadow-sm ${
                  isMe 
                  ? 'bg-primary text-white rounded-2xl rounded-tr-sm shadow-primary/20' 
                  : 'bg-card border border-border text-zinc-200 rounded-2xl rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
                {!isConsecutive && (
                  <span className={`text-[9px] text-zinc-600 mt-1 px-1 font-mono uppercase tracking-wider ${isMe ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            )
          })
        )}
        <div ref={scrollRef} className="h-4" /> {/* Invisible anchor for auto-scroll */}
      </div>

      {/* Input Engine - Remains active to coordinate pickup/logistics even if item is sold */}
      <div className="p-4 bg-background/80 backdrop-blur-md border-t border-border sticky bottom-0 z-20">
        {isDeleted && (
          <div className="mb-2 text-[10px] text-center text-zinc-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="w-2 h-px bg-border flex-1"></span>
            Item is sold - Chat remains open for logistics
            <span className="w-2 h-px bg-border flex-1"></span>
          </div>
        )}
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-3 relative">
          <input 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isSending}
            className="flex-1 bg-secondary/50 border border-border rounded-2xl pl-5 pr-14 py-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-secondary transition-all disabled:opacity-50"
            autoComplete="off"
          />
          <button 
            type="submit"
            disabled={!message.trim() || isSending}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-primary text-white font-bold rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            ↑
          </button>
        </form>
      </div>
    </div>
  )
}