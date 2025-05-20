'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LandingPage from '@/components/LandingPage'
import { useUserStore } from '@/store/userStore'

export default function Home() {
  const { user } = useUserStore()
  const router = useRouter()
  
  useEffect(() => {
    if (user) {
      router.push('/app')
    }
  }, [user, router])
  
  return <LandingPage />
}