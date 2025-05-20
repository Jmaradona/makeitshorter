'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import EmailEditor from '@/components/EmailEditor'
import { useUserStore } from '@/store/userStore'
import { checkUsage } from '@/services/usageService'
import PersonaSetup from '@/components/PersonaSetup'

// Default OpenAI Assistant ID for everyone
const DEFAULT_ASSISTANT_ID = 'asst_F4jvQcayYieO8oghTPxC7Qel'

export default function AppPage() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { 
    user, 
    preferences, 
    assistantId, 
    setAssistantId,
    setRemainingMessages,
    apiStatus
  } = useUserStore()

  // Fetch initial usage data
  useEffect(() => {
    const fetchUsage = async () => {
      if (user?.id) {
        const usageData = await checkUsage(user.id)
        setRemainingMessages(usageData.remainingMessages)
      }
      setIsLoading(false)
    }
    
    fetchUsage()
  }, [user, setRemainingMessages])

  // If API is not available, redirect to home
  useEffect(() => {
    if (apiStatus === 'error') {
      router.push('/')
    }
  }, [apiStatus, router])

  // Safety check - ensure we always have a valid assistant ID
  useEffect(() => {
    if (!assistantId || !assistantId.startsWith('asst_')) {
      console.log("No valid assistantId found, using default:", DEFAULT_ASSISTANT_ID)
      setAssistantId(DEFAULT_ASSISTANT_ID)
    }
  }, [assistantId, setAssistantId])

  // Handling the case where we're still loading or don't have a valid assistant ID
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-gray-300 dark:border-gray-600 border-t-transparent dark:border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // If we need setup, show the setup component
  if (!assistantId) {
    return (
      <PersonaSetup 
        onSetupComplete={(newAssistantId) => setAssistantId(newAssistantId)}
      />
    )
  }

  // Everything is ready, render the editor
  return (
    <EmailEditor 
      persona={preferences} 
      assistantId={assistantId || DEFAULT_ASSISTANT_ID} 
    />
  )
}