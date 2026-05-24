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
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true;

    const setupChat = async () => {
      try {
        setLoading(true)

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          router.push('/login')
          return
        }

        if (isMounted) setCurrentUser(user)

        const { data: conv, error: convError } = await supabase
          .from('conversations')
          .select(`*, listing:listing_id (title, price, image_url)`)
          .eq('id', id)
          .single()

        if (convError || !conv) throw new Error("Conversation not found")

        if (user.id !== conv.buyer_id && user.id !== conv.seller_id) {
          router.push('/rooms')
          return
        }

        if (isMounted) setConvDetails(conv)

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

    // Real-Time Engine with Optimistic UI Deduplication
    const channel = supabase
      .channel(`conv-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`
      }, (payload) => {
        if (isMounted) {
          setMessages((prev) => {
            // Remove the temporary optimistic message to prevent duplicates
            const filtered = prev.filter(m => !(m.isOptimistic && m.content === payload.new.content))
            // Ensure no exact ID duplicates
            if (filtered.some(m => m.id === payload.new.id)) return filtered
            return [...filtered, payload.new]
          })
        }
      })
      .subscribe()

    return () => {
      isMounted = false;
      supabase.removeChannel(channel)
    }
  }, [id, router, supabase])

  // Aggressive Auto-Scroll for Mobile Keyboards
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }, 100)
    }
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !currentUser) return

    const textToSend = message.trim()
    setMessage('') // Clear instantly

    // OPTIMISTIC UI: Snap message to screen instantly before DB responds
    const tempId = `temp-${Date.now()}`
    const optimisticMsg = {
      id: tempId,
      content: textToSend,
      conversation_id: id,
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      isOptimistic: true // Flag to style it slightly faded while sending
    }
    
    setMessages(prev => [...prev, optimisticMsg])

    try {
      const { error } = await supabase.from('messages').insert({
        content: textToSend,
        conversation_id: id,
        sender_id: currentUser.id
      })

      if (error) {
        // Revert on failure
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setMessage(textToSend) 
        throw error
      }
    } catch (error) {
      console.error("Message Send Error:", error)
      alert("Failed to send. Please check connection.")
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    )
  }

  const isDeleted = !convDetails?.listing
  const title = isDeleted ? 'Archived / Sold Item' : convDetails.listing.title
  const price = isDeleted ? null : convDetails.listing.price
  const imageUrl = isDeleted ? null : convDetails.listing.image_url

  return (
    // 'fixed inset-0' perfectly locks the layout on iOS/Android, preventing body scroll glitches
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0a] selection:bg-primary/30">

      {/* 1. Header Area */}
      <header className={`px-4 py-3 border-b shrink-0 flex items-center justify-between z-20 ${isDeleted ? 'bg-zinc-900/50 border-white/5' : 'bg-zinc-900/80 backdrop-blur-xl border-white/10'}`}>
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/messages" className="text-zinc-400 hover:text-white transition-colors p-2 -ml-2 rounded-xl active:bg-white/5">
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
            </div>
          </div>
        </div>
      </header>

      {/* 2. Chat Feed Area */}
      <div className="flex-1 overflow-y-auto overscroll-none p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 pb-10">
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
                <div className={`px-4 py-2.5 max-w-[85%] md:max-w-[70%] text-[15px] leading-relaxed break-words ${
                  isMe
                    ? 'bg-primary text-white rounded-2xl rounded-tr-sm shadow-md'
                    : 'bg-zinc-800 border border-white/5 text-zinc-100 rounded-2xl rounded-tl-sm'
                } ${msg.isOptimistic ? 'opacity-70' : 'opacity-100'}`}>
                  {msg.content}
                </div>
                {msg.isOptimistic && <span className="text-[9px] text-zinc-500 mt-1 pr-1 font-medium">Sending...</span>}
              </div>
            )
          })
        )}
        <div ref={scrollRef} className="h-4" /> {/* invisible anchor */}
      </div>

      {/* 3. Input Engine - Locked to bottom, respects safe areas */}
      <div className="shrink-0 bg-zinc-950/90 backdrop-blur-xl border-t border-white/10 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
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
            className="flex-1 bg-black border border-white/10 rounded-full pl-5 pr-14 py-3.5 text-[15px] text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
            autoComplete="off"
            enterKeyHint="send" // Tells mobile keyboard to show a "Send" button instead of "Return"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="absolute right-1 top-1 bottom-1 aspect-square bg-primary hover:bg-blue-600 active:scale-95 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 shadow-lg"
          >
            <Send className="w-4 h-4 -ml-0.5 mt-0.5" />
          </button>
        </form>
      </div>

    </div>
  )
}