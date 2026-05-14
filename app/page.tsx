import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-6 relative z-10">
      
      <div className="max-w-5xl w-full text-center flex flex-col items-center">
        
        {/* Animated Slogan Badge */}
        <div className="animate-in slide-in-from-bottom-4 fade-in duration-1000 fill-mode-both delay-100 mb-8 inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-primary shadow-2xl shadow-primary/10">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Everything Campus. All In One Room.
        </div>
        
        {/* Main Hero Title with Gradient Text */}
        <h1 className="animate-in slide-in-from-bottom-8 fade-in duration-1000 fill-mode-both delay-300 text-6xl md:text-8xl lg:text-[7.5rem] font-black tracking-tighter mb-8 leading-[0.9]">
          THE <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-blue-400 to-indigo-600 drop-shadow-[0_0_40px_rgba(37,99,235,0.3)]">ROOM</span>
        </h1>
        
        {/* Core Value Proposition */}
        <p className="animate-in slide-in-from-bottom-8 fade-in duration-1000 fill-mode-both delay-500 text-zinc-400 text-lg md:text-2xl max-w-2xl mx-auto mb-14 leading-relaxed font-medium">
          The organized digital space for CPUT students. Join study groups, browse the local marketplace, and find accommodation without the WhatsApp chaos.
        </p>

        {/* Call to Action Buttons */}
        <div className="animate-in slide-in-from-bottom-8 fade-in duration-1000 fill-mode-both delay-700 flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto">
          <Link href="/rooms" className="w-full sm:w-auto group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-60 transition duration-500"></div>
            <button className="relative w-full sm:w-auto px-8 py-5 bg-primary hover:bg-blue-600 text-white text-lg font-bold rounded-2xl transition-all duration-300 shadow-xl hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3">
              Enter The Room <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </Link>
          <Link href="/signup" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-8 py-5 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/20 text-zinc-100 text-lg font-bold rounded-2xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 shadow-lg">
              Join the Community
            </button>
          </Link>
        </div>
      </div>

      {/* Feature Preview Grid */}
      <div className="animate-in fade-in duration-1000 fill-mode-both delay-1000 mt-28 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-6xl z-10 pb-12">
        
        {/* Card 1 */}
        <div className="group p-6 md:p-8 bg-card/20 backdrop-blur-xl rounded-3xl border border-white/5 hover:border-primary/40 hover:bg-card/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="text-3xl mb-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 transform origin-left">🛒</div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300 group-hover:text-white mb-2">Marketplace</h3>
          <p className="text-xs text-zinc-500">Buy & sell textbooks and gear.</p>
        </div>

        {/* Card 2 */}
        <div className="group p-6 md:p-8 bg-card/20 backdrop-blur-xl rounded-3xl border border-white/5 hover:border-indigo-500/40 hover:bg-card/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="text-3xl mb-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 transform origin-left">📚</div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300 group-hover:text-white mb-2">Study Groups</h3>
          <p className="text-xs text-zinc-500">Connect with classmates.</p>
        </div>

        {/* Card 3 */}
        <div className="group p-6 md:p-8 bg-card/20 backdrop-blur-xl rounded-3xl border border-white/5 hover:border-violet-500/40 hover:bg-card/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-violet-500/10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="text-3xl mb-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 transform origin-left">🏠</div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300 group-hover:text-white mb-2">Housing</h3>
          <p className="text-xs text-zinc-500">Find res and local digs.</p>
        </div>

        {/* Card 4 */}
        <div className="group p-6 md:p-8 bg-card/20 backdrop-blur-xl rounded-3xl border border-white/5 hover:border-blue-400/40 hover:bg-card/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-400/10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="text-3xl mb-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 transform origin-left">💬</div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300 group-hover:text-white mb-2">Private DMs</h3>
          <p className="text-xs text-zinc-500">Secure end-to-end chat.</p>
        </div>

      </div>
    </div>
  )
}