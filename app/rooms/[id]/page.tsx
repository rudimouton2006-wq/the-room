'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SingleRoomPage() {
  const { id } = useParams()
  const supabase = createClient()
  const [message, setMessage] = useState('')
  const [chat, setChat] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 1. Get current user and initial messages
  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', id)
        .order('created_at', { ascending: true })
      
      if (data) setChat(data)
    }
    getData()

    // 2. LISTEN for new messages in Real-time
    const channel = supabase
      .channel(`room-${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `room_id=eq.${id}` 
      }, (payload) => {
        setChat((prev) => [...prev, payload.new])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  // 3. Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !user) return
    
    const textToSend = message
    setMessage('') // Clear input immediately for that "AtlasOS" speed

    const { error } = await supabase.from('messages').insert({
      text: textToSend,
      room_id: id,
      user_id: user.id,
      user_email: user.email
    })

    if (error) alert(error.message)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border hidden md:flex flex-col p-6 bg-card/30">
        <div className="mb-8">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Room Hub</h2>
          <p className="font-bold text-lg">Room: {id}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-green-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Connection
          </div>
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="p-4 border-b border-border bg-card/50 backdrop-blur-md">
          <h2 className="font-bold text-sm text-zinc-400"># {id === '1' ? 'EMA156S-Study' : 'General-Chat'}</h2>
        </header>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {chat.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.user_id === user?.id ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] font-bold text-zinc-500 mb-1 px-1">
                {msg.user_id === user?.id ? 'You' : msg.user_email.split('@')[0]}
              </span>
              <div className={`px-4 py-2 rounded-2xl max-w-md text-sm ${
                msg.user_id === user?.id 
                ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20' 
                : 'bg-secondary border border-border text-zinc-300 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <form onSubmit={sendMessage} className="relative max-w-4xl mx-auto">
            <input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-sm"
            />
          </form>
        </div>
      </main>
    </div>
  )
}