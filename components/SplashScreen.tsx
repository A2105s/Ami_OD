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
        className="flex flex-col items-center justify-center gap-4 sm:gap-5 md:gap-6"
        style={{
          animation: 'scaleIn 0.6s ease-out forwards',
        }}
      >
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56">
          <Image
              src="/amity-coding-club-logo.png"
            alt="Amity University"
            width={320}
            height={320}
            priority
            className="object-contain"
          />
        </div>
        <div className="mt-4 sm:mt-6 md:mt-8 text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center tracking-wide">
          Amity OD Portal
        </div>
        {/* Optional: Add loading indicator */}
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}
