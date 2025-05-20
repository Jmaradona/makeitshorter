'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Home, HelpCircle, User2, Wifi, WifiOff, Menu, X } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import AuthButton from '@/components/AuthButton'
import LoggedInIndicator from '@/components/LoggedInIndicator'
import { useUserStore } from '@/store/userStore'

interface MainNavProps {
  setIsPersonaEditorOpen: (isOpen: boolean) => void
  setIsTutorialOpen: (isOpen: boolean) => void
}

export default function MainNav({ setIsPersonaEditorOpen, setIsTutorialOpen }: MainNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, isDarkMode, toggleDarkMode, isOfflineMode, toggleOfflineMode, isLoadingUser } = useUserStore()
  const router = useRouter()
  const pathname = usePathname()
  
  const isAppRoute = pathname === '/app'
  
  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])
  
  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 h-16 flex items-center justify-between flex-shrink-0 bg-[rgb(var(--bg-primary))] backdrop-blur-sm transition-colors sticky top-0 z-30">
      <div className="flex items-center space-x-2.5">
        <span className="font-semibold text-[rgb(var(--text-primary))]">
          <span className="font-serif italic">Make it </span>
          <span className="font-bold">SHORTER</span>
          <span className="font-serif italic">!!!</span>
        </span>
      </div>
      
      {/* Mobile menu button */}
      <button 
        className="p-2 md:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle mobile menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        ) : (
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        )}
      </button>
      
      {/* Desktop navigation */}
      <div className="hidden md:flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Home"
        >
          <Home className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </motion.button>

        {isAppRoute && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsTutorialOpen(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Show tutorial"
          >
            <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </motion.button>
        )}
        
        {/* Theme toggle button */}
        <ThemeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleOfflineMode}
          className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
            isOfflineMode 
              ? "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100" 
              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          }`}
          title={isOfflineMode ? "Switch to online mode" : "Switch to test mode (fallback)"}
        >
          {isOfflineMode ? (
            <WifiOff className="w-5 h-5" />
          ) : (
            <Wifi className="w-5 h-5" />
          )}
          <span className="text-sm font-medium hidden sm:inline">
            {isOfflineMode ? "Test Mode" : "Online Mode"}
          </span>
        </motion.button>
        
        {isAppRoute && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPersonaEditorOpen(true)}
            data-tutorial="persona"
            className="p-2 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-900/70 rounded-lg transition-colors flex items-center gap-2 relative z-[65] backdrop-filter-none"
          >
            <User2 className="w-5 h-5 text-amber-800 dark:text-amber-100" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-100">Persona</span>
          </motion.button>
        )}
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/pricing')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
        >
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Pricing</span>
        </motion.button>
        
        {user && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/account')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
          >
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Account</span>
          </motion.button>
        )}
        
        {isLoadingUser ? (
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-transparent dark:border-t-transparent animate-spin"></div>
          </div>
        ) : (
          user ? <LoggedInIndicator /> : <AuthButton />
        )}
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200/30 dark:border-gray-800/30 py-4 px-4 z-50 md:hidden"
        >
          <div className="flex flex-col gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
            >
              <Home className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="text-gray-700 dark:text-gray-300">Home</span>
            </motion.button>

            {isAppRoute && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsTutorialOpen(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <span className="text-gray-700 dark:text-gray-300">Tutorial</span>
              </motion.button>
            )}
            
            {/* Theme toggle */}
            <div className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ThemeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
              <span className="text-gray-700 dark:text-gray-300 ml-2">
                {isDarkMode ? "Light Mode" : "Dark Mode"}
              </span>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleOfflineMode}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
                isOfflineMode 
                  ? "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              }`}
            >
              {isOfflineMode ? (
                <>
                  <WifiOff className="w-5 h-5" />
                  <span className="text-amber-800 dark:text-amber-100">Test Mode</span>
                </>
              ) : (
                <>
                  <Wifi className="w-5 h-5" />
                  <span className="text-gray-700 dark:text-gray-300">Online Mode</span>
                </>
              )}
            </motion.button>
            
            {isAppRoute && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPersonaEditorOpen(true)}
                data-tutorial="persona"
                className="p-2 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-900/70 rounded-lg transition-colors flex items-center gap-2"
              >
                <User2 className="w-5 h-5 text-amber-800 dark:text-amber-100" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-100">Persona</span>
              </motion.button>
            )}
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/pricing')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="text-gray-700 dark:text-gray-300">Pricing</span>
            </motion.button>
            
            {user && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/account')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="text-gray-700 dark:text-gray-300">Account</span>
              </motion.button>
            )}
            
            <div className="py-2">
              {isLoadingUser ? (
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 flex justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-transparent dark:border-t-transparent animate-spin"></div>
                </div>
              ) : (
                user ? <LoggedInIndicator /> : <AuthButton />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  )
}