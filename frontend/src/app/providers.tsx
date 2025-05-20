'use client'

import { useState, useEffect } from 'react'
import { useUserStore } from '@/store/userStore'

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const { isDarkMode } = useUserStore()

  // Ensure dark mode is applied after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder with the same structure to avoid layout shift
    return <>{children}</>
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      {children}
    </div>
  )
}