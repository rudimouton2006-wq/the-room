'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, ImagePlus, CheckCircle, AlertTriangle } from 'lucide-react'

const CATEGORIES = ["Marketplace", "Study Groups", "Accommodation", "Social/Events"]

export default function PostItemPage() {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Marketplace')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Create a fast local preview so the user sees the image instantly
      const objectUrl = URL.createObjectURL(selectedFile)
      setPreview(objectUrl)
    }
  }

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("You must be signed in to post an item.")
      }

      let imageUrl = null

      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('listings') 
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('listings')
          .getPublicUrl(filePath)
          
        imageUrl = publicUrl
      }

      // We are fetching the student_number from the profile to attach it to the listing
      const { data: profile } = await supabase
        .from('profiles')
        .select('student_number')
        .eq('id', user.id)
        .single()

      const { error: dbError } = await supabase.from('listings').insert({
        user_id: user.id,
        title,
        price: price ? parseFloat(price) : 0,
        category,
        description,
        image_url: imageUrl,
        student_number: profile?.student_number
      })

      if (dbError) throw dbError

      setSuccess(true)
      setTimeout(() => {
        router.push('/rooms')
        router.refresh()
      }, 2000)

    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 relative z-10">
        <div className="max-w-md w-full text-center bg-card/10 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl animate-in zoom-in-95 fade-in duration-500">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
          <h2 className="text-3xl font-black mb-3">Item Posted!</h2>
          <p className="text-zinc-400 font-medium mb-8">Your post is now live in The Room for everyone to see.</p>
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-foreground pb-24 pt-8 px-6 selection:bg-primary/30 relative z-10">
      <div className="max-w-3xl mx-auto">
        
        <div className="animate-in slide-in-from-left-4 fade-in duration-700 fill-mode-both">
          <Link href="/rooms" className="inline-flex items-center gap-3 text-zinc-500 hover:text-primary transition-colors duration-300 mb-8 group font-medium bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/5 hover:border-primary/30">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
          </Link>
        </div>

        <div className="animate-in slide-in-from-bottom-8 fade-in duration-1000 fill-mode-both">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">
            Post an <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-indigo-400">Item</span>
          </h1>
          <p className="text-zinc-400 font-medium mb-10">Fill out the details below to share your post with the campus.</p>

          <form onSubmit={handlePost} className="bg-card/10 backdrop-blur-2xl p-6 sm:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-8">
            
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-bold backdrop-blur-md">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {/* Photo Upload Section */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Add a Photo (Optional)</label>
              <div className="relative group/upload">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`w-full h-48 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-3 overflow-hidden ${preview ? 'border-primary/50 bg-black' : 'border-white/10 bg-black/20 group-hover/upload:border-primary/40 group-hover/upload:bg-white/5'}`}>
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Preview" className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <>
                      <ImagePlus className="w-8 h-8 text-zinc-500 group-hover/upload:text-primary transition-colors" />
                      <span className="text-sm font-bold text-zinc-400 group-hover/upload:text-zinc-200">Tap to browse photos</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Title Input */}
              <div className="group/input space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-primary transition-colors">What are you posting?</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl focus:border-primary/50 focus:bg-white/5 outline-none text-sm transition-all placeholder:text-zinc-600 hover:border-white/20 shadow-inner" 
                  placeholder="e.g. Engineering Textbook"
                />
              </div>

              {/* Price Input */}
              <div className="group/input space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-primary transition-colors">Price (Rands)</label>
                <input 
                  type="number" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl focus:border-primary/50 focus:bg-white/5 outline-none text-sm transition-all placeholder:text-zinc-600 hover:border-white/20 shadow-inner" 
                  placeholder="Leave blank if free"
                />
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="group/input space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-primary transition-colors">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl focus:border-primary/50 focus:bg-white/5 outline-none text-sm transition-all text-zinc-200 hover:border-white/20 shadow-inner appearance-none cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-[#0a0a0a]">{cat}</option>
                ))}
              </select>
            </div>

            {/* Description Textarea */}
            <div className="group/input space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 group-focus-within/input:text-primary transition-colors">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl focus:border-primary/50 focus:bg-white/5 outline-none text-sm transition-all placeholder:text-zinc-600 hover:border-white/20 shadow-inner resize-none" 
                placeholder="Describe your item, condition, and where you can meet up..."
              />
            </div>

            <button 
              disabled={loading}
              className="relative w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-blue-500 transition-all duration-300 shadow-xl shadow-primary/20 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 overflow-hidden group/btn flex justify-center items-center gap-2"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" /> Post Item
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}