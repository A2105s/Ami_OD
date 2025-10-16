"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Hide splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-indigo-700 via-blue-600 to-indigo-800 animate-fadeOut"
      style={{
        animation: isVisible ? 'none' : 'fadeOut 0.5s ease-out forwards',
      }}
    >
      <style jsx>{`
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
            pointer-events: none;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
      
      <div 
        className="flex flex-col items-center justify-center"
        style={{
          animation: 'scaleIn 0.6s ease-out forwards',
        }}
      >
        <div className="relative w-64 h-64 md:w-80 md:h-80">
          <Image
            src="/icon-512.png"
            alt="Amity University"
            width={320}
            height={320}
            priority
            className="object-contain drop-shadow-2xl"
          />
        </div>
        
        {/* Optional: Add loading indicator */}
        <div className="mt-8 flex gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}
