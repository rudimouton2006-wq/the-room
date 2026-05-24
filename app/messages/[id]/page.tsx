'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Send, PackageOpen, Loader2, ImagePlus, Check, CheckCheck, User } from 'lucide-react'

export default function PrivateChatPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [otherUserName, setOtherUserName] = useState<string>('Student')
  const [convDetails, setConvDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // V2 Unified State
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

        // Fetch Conversation Details
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

        // Securely fetch the other user's name
        const otherPersonId = user.id === conv.buyer_id ? conv.seller_id : conv.buyer_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', otherPersonId)
          .single()
        
        if (profile && isMounted) setOtherUserName(profile.username)

        // Fetch Historical Messages
        const { data: msgs, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', id)
          .order('created_at', { ascending: true })

        if (msgError) throw msgError
        
        // Mark unread messages as read on load
        const unreadMsgs = msgs?.filter(m => m.sender_id !== user.id && !m.is_read) || []
        if (unreadMsgs.length > 0) {
          const unreadIds = unreadMsgs.map(m => m.id)
          await supabase.from('messages').update({ is_read: true }).in('id', unreadIds)
          msgs?.forEach(m => { if (unreadIds.includes(m.id)) m.is_read = true })
        }

        if (isMounted) setMessages(msgs || [])

      } catch (error) {
        console.error("Chat Initialization Error:", error)
        if (isMounted) router.push('/rooms')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (id) setupChat()

    // Unified Real-Time Engine
    const channel = supabase.channel(`unified-room-${id}`, {
      config: { presence: { key: currentUser?.id || 'unknown' } }
    })

    channel
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`
      }, async (payload) => {
        if (!isMounted) return;

        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new
          if (newMsg.sender_id !== currentUser?.id) {
            await supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id)
            newMsg.is_read = true 
          }
          setMessages((prev) => {
            const filtered = prev.filter(m => !(m.isOptimistic && m.content === newMsg.content && m.image_url === newMsg.image_url))
            if (filtered.some(m => m.id === newMsg.id)) return filtered
            return [...filtered, newMsg]
          })
        } 
        else if (payload.eventType === 'UPDATE') {
          setMessages((prev) => prev.map(m => m.id === payload.new.id ? payload.new : m))
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const typingIds = Object.keys(state).filter(key => {
          // TypeScript Bypass: Cast to any to prevent Vercel build crashes
          const presenceData = state[key][0] as any;
          return key !== currentUser?.id && presenceData?.typing;
        })
        if (isMounted) setTypingUsers(typingIds)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && isMounted) {
          await channel.track({ typing: false })
        }
      })

    if (isMounted) setRealtimeChannel(channel)

    return () => {
      isMounted = false;
      supabase.removeChannel(channel)
    }
  }, [id, router, supabase, currentUser?.id])

  // Auto-Scroll Engine
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }, 100)
    }
  }, [messages, typingUsers])

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)

    if (realtimeChannel) {
      realtimeChannel.track({ typing: true })
      if (typingTimeout) clearTimeout(typingTimeout)
      const timeout = setTimeout(() => { realtimeChannel.track({ typing: false }) }, 2000)
      setTypingTimeout(timeout)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !currentUser) return

    const textToSend = message.trim()
    setMessage('') 
    if (realtimeChannel) realtimeChannel.track({ typing: false })

    const tempId = `temp-${Date.now()}`
    const optimisticMsg = {
      id: tempId,
      content: textToSend,
      conversation_id: id,
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      isOptimistic: true,
      is_read: false
    }
    
    setMessages(prev => [...prev, optimisticMsg])

    try {
      const { error } = await supabase.from('messages').insert({
        content: textToSend,
        conversation_id: id,
        sender_id: currentUser.id
      })

      if (error) {
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setMessage(textToSend) 
        throw error
      }
    } catch (error) {
      console.error("Message Send Error:", error)
      alert("Failed to send. Please check connection.")
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return

    if (file.size > 20 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 20MB.")
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsUploading(true)
    const tempId = `temp-img-${Date.now()}`
    const localUrl = URL.createObjectURL(file)
    
    const optimisticMsg = {
      id: tempId,
      content: '',
      image_url: localUrl,
      conversation_id: id,
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      isOptimistic: true,
      is_read: false
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('chat_images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('chat_images')
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase.from('messages').insert({
        content: '',
        image_url: publicUrl,
        conversation_id: id,
        sender_id: currentUser.id
      })

      if (dbError) throw dbError

    } catch (error) {
      console.error('Image Upload Error:', error)
      alert('Failed to send image. Ensure your storage bucket permissions are set.')
      setMessages(prev => prev.filter(m => m.id !== tempId)) 
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    )
  }

  const isDeleted = !convDetails?.listing
  const title = isDeleted ? 'Archived / Sold Item' : convDetails.listing.title
  const price = isDeleted ? null : convDetails.listing.price
  const imageUrl = isDeleted ? null : convDetails.listing.image_url
  const isBuyer = currentUser?.id === convDetails?.buyer_id

  return (
    <div 
      className="fixed top-0 left-0 w-full z-[999] flex flex-col bg-[#0a0a0a] selection:bg-primary/30 overflow-hidden"
      style={{ height: '100dvh', maxHeight: '-webkit-fill-available' }}
    >

      {/* 1. Ultra-Premium Header */}
      <header className={`shrink-0 px-4 py-3 flex items-center justify-between z-20 shadow-md ${isDeleted ? 'bg-zinc-950 border-b border-white/5' : 'bg-zinc-900/95 backdrop-blur-3xl border-b border-white/10'}`}>
        <div className="flex items-center min-w-0 w-full gap-3">
          
          <Link href="/messages" className="text-zinc-400 hover:text-white transition-colors p-2 -ml-2 rounded-2xl active:bg-white/5 shrink-0">
            <ArrowLeft className="w-6 h-6" />
          </Link>

          <div className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 relative shadow-inner ${isDeleted ? 'bg-black border border-dashed border-zinc-700' : 'bg-zinc-800 border border-white/10'}`}>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} className="w-full h-full object-cover" alt="Item" />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-50">
                {isDeleted ? <PackageOpen className="w-5 h-5 text-zinc-600" /> : <PackageOpen className="w-5 h-5 text-white" />}
              </div>
            )}
          </div>

          <div className="min-w-0 flex flex-col justify-center flex-1">
            <h2 className={`font-bold text-base leading-tight truncate ${isDeleted ? 'text-zinc-500 line-through' : 'text-white'}`}>
              {title}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <User className="w-3 h-3 text-zinc-400" />
              <span className="text-xs text-zinc-400 font-medium truncate">
                {isBuyer ? 'Buying from' : 'Selling to'} <span className="text-primary font-bold">{otherUserName}</span>
              </span>
              {price && !isDeleted && (
                <>
                  <span className="text-zinc-600 text-[10px]">•</span>
                  <span className="text-[12px] text-zinc-300 font-bold tracking-tight">R{price}</span>
                </>
              )}
            </div>
          </div>
          
        </div>
      </header>

      {/* 2. Chat Feed Area */}
      <div className="flex-1 overflow-y-auto overscroll-none p-4 space-y-4 flex flex-col relative">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 pb-10 flex-1">
            <PackageOpen className="w-12 h-12 mb-4 text-zinc-500" />
            <p className="text-sm font-bold text-white">Start the conversation</p>
            <p className="text-xs mt-2 max-w-[200px] text-zinc-400 font-medium">Messages are secure and update in real-time.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === currentUser?.id
            const isConsecutive = index > 0 && messages[index - 1].sender_id === msg.sender_id

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isConsecutive ? 'mt-1' : 'mt-4'}`}>
                <div className={`px-4 py-2.5 max-w-[85%] md:max-w-[70%] text-[15px] leading-relaxed break-words shadow-sm flex flex-col ${
                  isMe
                    ? 'bg-primary text-white rounded-2xl rounded-tr-sm'
                    : 'bg-zinc-800 border border-white/5 text-zinc-100 rounded-2xl rounded-tl-sm'
                } ${msg.isOptimistic ? 'opacity-80' : 'opacity-100'}`}>
                  
                  {msg.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={msg.image_url} alt="Attached" className="w-full max-w-sm rounded-xl mb-1.5 object-cover" />
                  )}
                  
                  {msg.content && <span>{msg.content}</span>}
                  
                  {isMe && (
                    <div className="flex justify-end mt-1 items-center gap-1">
                      {msg.isOptimistic ? (
                        <span className="text-[9px] text-white/70 uppercase tracking-widest font-bold">Sending</span>
                      ) : msg.is_read ? (
                        <CheckCheck className="w-4 h-4 text-blue-300" />
                      ) : (
                        <Check className="w-4 h-4 text-white/70" />
                      )}
                    </div>
                  )}

                </div>
              </div>
            )
          })
        )}
        
        {/* Unified Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-start mt-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-zinc-800 border border-white/5 text-zinc-400 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
               <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
               <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        
        <div ref={scrollRef} className="h-4 shrink-0" />
      </div>

      {/* 3. Input Engine - Fully Locked for Mobile Keyboards */}
      <div className="shrink-0 bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 p-3 pb-[calc(max(env(safe-area-inset-bottom),16px))]">
        {isDeleted && (
          <div className="mb-3 text-[10px] text-center text-zinc-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="w-4 h-px bg-white/10 flex-1"></span>
            Item is sold - Chat remains open
            <span className="w-4 h-px bg-white/10 flex-1"></span>
          </div>
        )}
        
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-2 relative items-center">
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload} 
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
            className="p-2.5 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 shrink-0"
          >
            {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImagePlus className="w-6 h-6" />}
          </button>

          <input
            value={message}
            onChange={handleTextChange}
            placeholder="Message..."
            className="flex-1 bg-black border border-white/10 rounded-full pl-5 pr-14 py-3.5 text-[15px] text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
            autoComplete="off"
            enterKeyHint="send" 
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-primary hover:bg-blue-600 active:scale-95 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 shadow-lg"
          >
            <Send className="w-4 h-4 -ml-0.5 mt-0.5" />
          </button>
        </form>
      </div>

    </div>
  )
}