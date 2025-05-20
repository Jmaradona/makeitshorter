'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainNav from '@/components/MainNav'
import PersonaEditor from '@/components/PersonaEditor'
import Tutorial from '@/components/Tutorial'
import { useUserStore } from '@/store/userStore'
import { getUserProfile, onAuthStateChange } from '@/lib/supabase-client'
import { checkUsage } from '@/services/usageService'
import env from '@/env'
import toast from 'react-hot-toast'

// Default OpenAI Assistant ID for everyone
const DEFAULT_ASSISTANT_ID = 'asst_F4jvQcayYieO8oghTPxC7Qel'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isPersonaEditorOpen, setIsPersonaEditorOpen] = useState(false)
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  const [apiStatus, setApiStatus] = useState<'loading' | 'available' | 'error'>('loading')
  
  const { 
    user, 
    setUser, 
    preferences, 
    setPreferences, 
    assistantId,
    setAssistantId,
    setRemainingMessages,
    setIsPaid,
    setApiStatus: updateApiStatus
  } = useUserStore()
  
  const router = useRouter()

  // Check if OpenAI API is available
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        // Get API key from our centralized env file
        const apiKey = env.OPENAI_API_KEY
        const isProduction = process.env.NODE_ENV === 'production'
        
        if (!apiKey) {
          const errorMessage = isProduction
            ? 'OpenAI API key not configured. Please add it in Netlify under Site settings > Environment variables.'
            : 'OpenAI API key not configured. Add NEXT_PUBLIC_OPENAI_API_KEY to your .env file.'
          toast.error(errorMessage)
          setApiStatus('error')
          updateApiStatus('error')
          return
        }

        // Always set the default assistant ID if none exists
        if (!assistantId) {
          console.log("No assistantId found, using default:", DEFAULT_ASSISTANT_ID)
          setAssistantId(DEFAULT_ASSISTANT_ID)
        }

        setApiStatus('available')
        updateApiStatus('available')
      } catch (error) {
        console.error('Error checking API status:', error)
        setApiStatus('error')
        updateApiStatus('error')
      }
    }

    checkApiStatus()
  }, [assistantId, setAssistantId, updateApiStatus])

  // Handle auth state changes with Supabase
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (session) => {
      if (session?.user) {
        try {
          console.log("Auth state changed: User logged in", session.user.id)
          setUser(session.user)
          const profile = await getUserProfile(session.user.id)
          
          if (profile) {
            console.log("User profile found:", profile)
            // Set preferences from profile if available
            if (profile.preferences) {
              console.log("Setting preferences from profile:", profile.preferences)
              setPreferences(profile.preferences)
            }
            
            // Set usage data if available
            if (profile.daily_free_messages !== undefined) {
              setRemainingMessages(profile.daily_free_messages)
            }
            
            if (profile.paid !== undefined) {
              setIsPaid(profile.paid)
            }
            
            // Set assistant ID only if it's a valid format
            if (profile.assistantId && profile.assistantId.startsWith('asst_')) {
              console.log("Found valid assistantId in Supabase profile:", profile.assistantId)
              setAssistantId(profile.assistantId)
            } else {
              // Use default assistant ID
              console.log("Using default assistantId:", DEFAULT_ASSISTANT_ID)
              setAssistantId(DEFAULT_ASSISTANT_ID)
            }
          } else {
            // No profile found, use default assistant ID
            console.log("No profile found, using default assistantId:", DEFAULT_ASSISTANT_ID)
            setAssistantId(DEFAULT_ASSISTANT_ID)
          }
          
          // Check and update usage data
          const usageData = await checkUsage(session.user.id)
          setRemainingMessages(usageData.remainingMessages)
          setIsPaid(usageData.requiresPayment)
        } catch (error) {
          console.error("Error loading user profile:", error)
          // Fallback to default assistant ID on error
          setAssistantId(DEFAULT_ASSISTANT_ID)
        }
      } else {
        console.log("Auth state changed: No user")
        // No user, clear user state but keep default assistant ID
        setUser(null)
        setAssistantId(DEFAULT_ASSISTANT_ID)
      }
    })

    const checkSession = async () => {
      try {
        console.log("Checking for existing session")
        const { data } = await supabase.auth.getSession()
        
        if (data.session?.user) {
          console.log("Session found for user:", data.session.user.id)
          setUser(data.session.user)
          
          try {
            const profile = await getUserProfile(data.session.user.id)
            
            if (profile) {
              console.log("Profile found during session check:", profile)
              if (profile.preferences) {
                console.log("Setting preferences from session check:", profile.preferences)
                setPreferences(profile.preferences)
              }
              
              // Set usage data if available
              if (profile.daily_free_messages !== undefined) {
                setRemainingMessages(profile.daily_free_messages)
              }
              
              if (profile.paid !== undefined) {
                setIsPaid(profile.paid)
              }
              
              if (profile.assistantId && profile.assistantId.startsWith('asst_')) {
                console.log("Found valid assistantId in profile during session check:", profile.assistantId)
                setAssistantId(profile.assistantId)
              } else {
                // Use default assistant ID for invalid formats
                console.log("Using default assistantId during session check:", DEFAULT_ASSISTANT_ID)
                setAssistantId(DEFAULT_ASSISTANT_ID)
              }
            } else {
              // No profile found, use default assistant ID
              console.log("No profile found during session check, using default:", DEFAULT_ASSISTANT_ID)
              setAssistantId(DEFAULT_ASSISTANT_ID)
            }
            
            // Check and update usage data
            const usageData = await checkUsage(data.session.user.id)
            setRemainingMessages(usageData.remainingMessages)
            setIsPaid(usageData.requiresPayment)
          } catch (error) {
            console.error("Error loading user profile during session check:", error)
            // Fallback to default assistant ID on error
            setAssistantId(DEFAULT_ASSISTANT_ID)
          }
        } else {
          // No user session found
          console.log("No active session found")
          setUser(null)
          setAssistantId(DEFAULT_ASSISTANT_ID)
        }
      } catch (error) {
        console.error("Error checking session:", error)
        // On error, clear user but set default assistant ID
        setUser(null)
        setAssistantId(DEFAULT_ASSISTANT_ID)
      } 
    }
    
    checkSession()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setPreferences, setAssistantId, setRemainingMessages, setIsPaid])

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav 
        setIsPersonaEditorOpen={setIsPersonaEditorOpen} 
        setIsTutorialOpen={setIsTutorialOpen}
      />
      
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 w-full overflow-x-hidden overflow-y-auto">
        {children}
      </div>
      
      <PersonaEditor
        isOpen={isPersonaEditorOpen}
        onClose={() => setIsPersonaEditorOpen(false)}
        onSave={setPreferences}
      />
      
      <Tutorial
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </div>
  )
}