import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/ToastProvider";

// Optimize font loading for zero layout shift
const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "The Room | CPUT Hub",
  description: "Everything Campus. All In One Room.",
};

// --- NEW: THE MOBILE NATIVE APP LOCK ---
export const viewport: Viewport = {
  themeColor: '#030303',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Prevents iOS from zooming in when tapping inputs
  userScalable: false,
  viewportFit: 'cover', // Makes the app bleed into the iPhone notch safely
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.className} bg-[#030303] text-zinc-100 antialiased selection:bg-primary/40 selection:text-white min-h-screen flex flex-col relative overflow-x-hidden`}>
        
        {/* --- PREMIUM AMBIENT BACKGROUND ENGINE --- */}
        <div className="fixed inset-0 z-[-3] bg-[#030303]" />
        
        <div className="fixed inset-0 z-[-2] overflow-hidden pointer-events-none opacity-60 mix-blend-screen flex justify-center items-center">
          <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
          <div className="absolute top-[20%] left-[40%] w-[30vw] h-[30vw] rounded-full bg-violet-600/5 blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />
        </div>

        <div className="fixed inset-0 z-[-1] opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        
        {/* Global Toast Provider Wrapping the App */}
        <ToastProvider>
          <Navbar />
          <main className="flex-1 flex flex-col w-full relative z-0 animate-in fade-in duration-1000 ease-in-out">
            {children}
          </main>
        </ToastProvider>
        
      </body>
    </html>
  );
}