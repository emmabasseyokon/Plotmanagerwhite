'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'info', duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  }

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-md w-full
        transition-all duration-300 transform
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className={`${bgColors[type]} border-2 rounded-xl p-4 shadow-lg flex items-start gap-3`}>
        {icons[type]}
        <p className="flex-1 text-sm font-medium text-gray-900">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          className="p-1 hover:bg-white/50 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([])

  useEffect(() => {
    const handleToast = (e: CustomEvent) => {
      const id = Math.random().toString(36).substr(2, 9)
      setToasts((prev) => [...prev, { id, ...e.detail }])
    }

    window.addEventListener('show-toast', handleToast as EventListener)
    return () => window.removeEventListener('show-toast', handleToast as EventListener)
  }, [])

  return (
    <>
      {toasts.map((toast, index) => (
        <div key={toast.id} style={{ top: `${1 + index * 5}rem` }} className="fixed right-4 z-50">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          />
        </div>
      ))}
    </>
  )
}

export const showToast = (message: string, type: ToastType = 'info') => {
  window.dispatchEvent(
    new CustomEvent('show-toast', {
      detail: { message, type },
    })
  )
}
