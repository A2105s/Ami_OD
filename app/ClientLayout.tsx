'use client';

import { useEffect, useState } from 'react';
import SplashScreen from '@/components/SplashScreen';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  useEffect(() => {
    setMounted(true);
    
    // Hide splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {showSplash ? <SplashScreen /> : children}
    </>
  );
}
