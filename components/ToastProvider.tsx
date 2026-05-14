'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, AlertTriangle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-in slide-in-from-right-8 fade-in duration-500 min-w-[300px] max-w-sm p-4 rounded-2xl backdrop-blur-3xl border shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex items-center gap-4 transition-all ${
              t.type === 'success' 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' :
              t.type === 'error' 
                ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              'bg-primary/10 border-primary/20 text-zinc-100'
            }`}
          >
            <div className="shrink-0">
              {t.type === 'success' ? <CheckCircle className="w-6 h-6 text-green-400" /> : 
               t.type === 'error' ? <AlertTriangle className="w-6 h-6 text-red-400" /> : 
               <Info className="w-6 h-6 text-primary" />}
            </div>
            <p className="text-sm font-bold tracking-wide leading-tight">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within a ToastProvider")
  return context
}