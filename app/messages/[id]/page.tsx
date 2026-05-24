'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Send, PackageOpen, Loader2 } from 'lucide-react'

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

        // 2. Fetch Conversation & Listing Context
        const { data: conv, error: convError } = await supabase
          .from('conversations')
          .select(`
            *,
            listing:listing_id (title, price, image_url, status)
          `)
          .eq('id', id)
          .single()

        if (convError || !conv) throw new Error("Conversation not found")

        // Security Check: Ensure user belongs in this chat
        if (user.id !== conv.buyer_id && user.id !== conv.seller_id) {
          router.push('/rooms')
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
        if (isMounted) router.push('/rooms')
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
          // Instantly add the new message to the screen when the database updates
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
      // Note: Using 'content' and 'sender_id' to match our secure database schema
      const { error } = await supabase.from('messages').insert({
        content: textToSend,
        conversation_id: id,
        sender_id: currentUser.id
      })

      if (error) {
        setMessage(textToSend) // Revert UI if send fails
        throw error
      }
    } catch (error) {
      console.error("Message Send Error:", error)
      alert("Failed to send message. Please check your connection.")
    } finally {
      setIsSending(false)
    }
  }

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
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

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0a0a0a] overflow-hidden selection:bg-primary/30">

      {/* 1. Glassmorphic Sticky Header */}
      <header className={`px-4 py-3 border-b shrink-0 flex items-center justify-between z-20 ${isDeleted ? 'bg-zinc-900/50 border-white/5' : 'bg-zinc-900/80 backdrop-blur-xl border-white/10'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/rooms" className="text-zinc-400 hover:text-white transition-colors p-2 -ml-2 rounded-xl">
            <ArrowLeft className="w-6 h-6" />
          </Link>

          <div className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 relative ${isDeleted ? 'bg-black border border-dashed border-zinc-700' : 'bg-zinc-800'}`}>
            {imageUrl ? (
              <img src={imageUrl} className="w-full h-full object-cover" alt="Item" />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-50">
                {isDeleted ? <PackageOpen className="w-5 h-5 text-zinc-600" /> : <PackageOpen className="w-5 h-5 text-white" />}
              </div>
            )}
          </div>

          <div className="min-w-0 flex flex-col justify-center">
            <h2 className={`font-bold text-sm leading-tight truncate ${isDeleted ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
              {title}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {price && !isDeleted && (
                <span className="text-xs text-primary font-bold">R{price}</span>
              )}
              {isDeleted && (
                <span className="text-[10px] text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Sold</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Message History Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <PackageOpen className="w-12 h-12 mb-4 text-zinc-500" />
            <p className="text-sm font-medium text-white">Start the conversation</p>
            <p className="text-xs mt-2 max-w-[200px] text-zinc-400">Messages are secure and update in real-time.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === currentUser?.id
            const isConsecutive = index > 0 && messages[index - 1].sender_id === msg.sender_id

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isConsecutive ? 'mt-1' : 'mt-4'}`}>
                <div className={`px-4 py-2.5 max-w-[85%] md:max-w-[70%] text-sm md:text-base break-words ${
                  isMe
                    ? 'bg-primary text-white rounded-2xl rounded-tr-sm shadow-md shadow-primary/10'
                    : 'bg-zinc-800 border border-white/5 text-zinc-100 rounded-2xl rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            )
          })
        )}
        <div ref={scrollRef} className="h-2" /> {/* Invisible anchor for auto-scroll */}
      </div>

      {/* 3. Input Engine */}
      <div className="p-4 bg-zinc-900/80 backdrop-blur-xl border-t border-white/10 shrink-0 pb-safe">
        {isDeleted && (
          <div className="mb-3 text-[10px] text-center text-zinc-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="w-4 h-px bg-white/10 flex-1"></span>
            Item is sold - Chat remains open
            <span className="w-4 h-px bg-white/10 flex-1"></span>
          </div>
        )}
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-2 relative">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 bg-black border border-white/10 rounded-full pl-5 pr-14 py-3.5 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className="absolute right-1 top-1 bottom-1 aspect-square bg-primary hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-primary shadow-lg shadow-primary/20"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 -ml-0.5 mt-0.5" />
            )}
          </button>
        </form>
      </div>

    </div>
  )
}