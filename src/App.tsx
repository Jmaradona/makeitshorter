import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import EmailEditor from './components/EmailEditor';
import LandingPage from './components/LandingPage';
import PersonaEditor from './components/PersonaEditor';
import PersonaSetup from './components/PersonaSetup';
import Tutorial from './components/Tutorial';
import AuthButton from './components/AuthButton';
import LoggedInIndicator from './components/LoggedInIndicator';
import AboutPage from './components/AboutPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PricingPage from './pages/PricingPage';
import AccountPage from './pages/AccountPage';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';
import { User2, Moon, Sun, Wifi, WifiOff, HelpCircle, Home, Menu, X } from 'lucide-react';
import { useUserStore } from './store/userStore';
import { supabase, getUserProfile, onAuthStateChange } from './lib/supabase';
import { checkUsage } from './services/usageService';
import env from './env';

// Default OpenAI Assistant ID for everyone
const DEFAULT_ASSISTANT_ID = 'asst_F4jvQcayYieO8oghTPxC7Qel';

export default function App() {
  const [isPersonaEditorOpen, setIsPersonaEditorOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<'loading' | 'available' | 'error'>('loading');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const { 
    user, 
    setUser, 
    preferences, 
    setPreferences, 
    isDarkMode, 
    toggleDarkMode,
    isOfflineMode,
    toggleOfflineMode,
    assistantId,
    setAssistantId,
    setRemainingMessages,
    setIsPaid
  } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isAppRoute = location.pathname === '/app';
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup';
  const isPricingRoute = location.pathname === '/pricing';
  const isAccountRoute = location.pathname === '/account';
  const isCheckoutRoute = location.pathname.startsWith('/checkout/');
  const isLandingRoute = location.pathname === '/';

  // Check if OpenAI API is available
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        // Get API key from our centralized env file
        const apiKey = env.OPENAI_API_KEY;
        const isProduction = import.meta.env.PROD;
        
        if (!apiKey) {
          const errorMessage = isProduction
            ? 'OpenAI API key not configured. Please add it in Netlify under Site settings > Environment variables.'
            : 'OpenAI API key not configured. Add VITE_OPENAI_API_KEY to your .env file.';
          toast.error(errorMessage);
          setApiStatus('error');
          return;
        }

        // Always set the default assistant ID if none exists
        if (!assistantId) {
          console.log("No assistantId found, using default:", DEFAULT_ASSISTANT_ID);
          setAssistantId(DEFAULT_ASSISTANT_ID);
        }

        setApiStatus('available');
      } catch (error) {
        console.error('Error checking API status:', error);
        setApiStatus('error');
      }
    };

    checkApiStatus();
  }, [assistantId, setAssistantId]);

  // Handle auth state changes with Supabase
  useEffect(() => {
    setIsLoadingUser(true);
    
    const { data: { subscription } } = onAuthStateChange(async (session) => {
      if (session?.user) {
        try {
          console.log("Auth state changed: User logged in", session.user.id);
          setUser(session.user);
          const profile = await getUserProfile(session.user.id);
          
          if (profile) {
            console.log("User profile found:", profile);
            // Set preferences from profile if available
            if (profile.preferences) {
              console.log("Setting preferences from profile:", profile.preferences);
              setPreferences(profile.preferences);
            }
            
            // Set usage data if available
            if (profile.daily_free_messages !== undefined) {
              setRemainingMessages(profile.daily_free_messages);
            }
            
            if (profile.paid !== undefined) {
              setIsPaid(profile.paid);
            }
            
            // Set assistant ID only if it's a valid format
            if (profile.assistantId && profile.assistantId.startsWith('asst_')) {
              console.log("Found valid assistantId in Supabase profile:", profile.assistantId);
              setAssistantId(profile.assistantId);
            } else {
              // Use default assistant ID
              console.log("Using default assistantId:", DEFAULT_ASSISTANT_ID);
              setAssistantId(DEFAULT_ASSISTANT_ID);
            }
          } else {
            // No profile found, use default assistant ID
            console.log("No profile found, using default assistantId:", DEFAULT_ASSISTANT_ID);
            setAssistantId(DEFAULT_ASSISTANT_ID);
          }
          
          // Check and update usage data
          const usageData = await checkUsage(session.user.id);
          setRemainingMessages(usageData.remainingMessages);
          setIsPaid(usageData.requiresPayment);
        } catch (error) {
          console.error("Error loading user profile:", error);
          // Fallback to default assistant ID on error
          setAssistantId(DEFAULT_ASSISTANT_ID);
        }
      } else {
        console.log("Auth state changed: No user");
        // No user, clear user state but keep default assistant ID
        setUser(null);
        setAssistantId(DEFAULT_ASSISTANT_ID);
      }
      setIsLoadingUser(false);
    });

    const checkSession = async () => {
      try {
        console.log("Checking for existing session");
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
          console.log("Session found for user:", data.session.user.id);
          setUser(data.session.user);
          
          try {
            const profile = await getUserProfile(data.session.user.id);
            
            if (profile) {
              console.log("Profile found during session check:", profile);
              if (profile.preferences) {
                console.log("Setting preferences from session check:", profile.preferences);
                setPreferences(profile.preferences);
              }
              
              // Set usage data if available
              if (profile.daily_free_messages !== undefined) {
                setRemainingMessages(profile.daily_free_messages);
              }
              
              if (profile.paid !== undefined) {
                setIsPaid(profile.paid);
              }
              
              if (profile.assistantId && profile.assistantId.startsWith('asst_')) {
                console.log("Found valid assistantId in profile during session check:", profile.assistantId);
                setAssistantId(profile.assistantId);
              } else {
                // Use default assistant ID for invalid formats
                console.log("Using default assistantId during session check:", DEFAULT_ASSISTANT_ID);
                setAssistantId(DEFAULT_ASSISTANT_ID);
              }
            } else {
              // No profile found, use default assistant ID
              console.log("No profile found during session check, using default:", DEFAULT_ASSISTANT_ID);
              setAssistantId(DEFAULT_ASSISTANT_ID);
            }
            
            // Check and update usage data
            const usageData = await checkUsage(data.session.user.id);
            setRemainingMessages(usageData.remainingMessages);
            setIsPaid(usageData.requiresPayment);
          } catch (error) {
            console.error("Error loading user profile during session check:", error);
            // Fallback to default assistant ID on error
            setAssistantId(DEFAULT_ASSISTANT_ID);
          }
        } else {
          // No user session found
          console.log("No active session found");
          setUser(null);
          setAssistantId(DEFAULT_ASSISTANT_ID);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        // On error, clear user but set default assistant ID
        setUser(null);
        setAssistantId(DEFAULT_ASSISTANT_ID);
      } finally {
        setIsLoadingUser(false);
      }
    };
    
    checkSession();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setPreferences, setAssistantId, setRemainingMessages, setIsPaid]);

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Safety check - ensure we always have a valid assistant ID
  useEffect(() => {
    if (!assistantId || !assistantId.startsWith('asst_')) {
      console.log("No valid assistantId found, using default:", DEFAULT_ASSISTANT_ID);
      setAssistantId(DEFAULT_ASSISTANT_ID);
    }
  }, [assistantId, setAssistantId]);

  const handleAssistantSetup = (newAssistantId: string) => {
    if (newAssistantId && newAssistantId.startsWith('asst_')) {
      console.log("Assistant setup completed with ID:", newAssistantId);
      setAssistantId(newAssistantId);
      toast.success("Assistant setup completed successfully!");
    } else {
      console.log("Invalid assistant ID from setup, using default:", DEFAULT_ASSISTANT_ID);
      setAssistantId(DEFAULT_ASSISTANT_ID);
      toast.success("Using default assistant configuration");
    }
  };

  // If user attempts to access /app without OpenAI API key, redirect to home
  useEffect(() => {
    if (isAppRoute && apiStatus === 'error') {
      navigate('/');
      toast.error('App requires OpenAI API key to function');
    }
  }, [isAppRoute, apiStatus, navigate]);

  // Don't show the navbar on auth pages or landing page
  const showNavbar = !isAuthRoute && !isCheckoutRoute && !isLandingRoute;

  return (
    <div className="min-h-screen flex flex-col pb-10 relative bg-[rgb(var(--bg-primary))] transition-colors w-full h-auto overflow-y-auto overflow-x-hidden">
      <div className={`${isDarkMode ? 'dark' : ''} w-full`}>
        {showNavbar && (
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
                onClick={() => navigate('/')}
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
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-gray-100" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </motion.button>
              
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
                onClick={() => navigate('/pricing')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Pricing</span>
              </motion.button>
              
              {user && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/account')}
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
                    onClick={() => navigate('/')}
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
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleDarkMode}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {isDarkMode ? (
                      <>
                        <Sun className="w-5 h-5 text-gray-100" />
                        <span className="text-gray-200">Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-700">Dark Mode</span>
                      </>
                    )}
                  </motion.button>
                  
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
                    onClick={() => navigate('/pricing')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span className="text-gray-700 dark:text-gray-300">Pricing</span>
                  </motion.button>
                  
                  {user && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/account')}
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
        )}

        <main className="flex-1 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 w-full overflow-x-hidden overflow-y-auto pb-10">
          {isLoadingUser && !isAuthRoute && !isCheckoutRoute ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-4 border-gray-300 dark:border-gray-600 border-t-transparent dark:border-t-transparent animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading...</p>
              </div>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/app" element={
                <EmailEditor 
                  persona={preferences} 
                  assistantId={assistantId || DEFAULT_ASSISTANT_ID} 
                />
              } />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/checkout/cancel" element={<CheckoutCancel />} />
            </Routes>
          )}
        </main>

        <PersonaEditor
          isOpen={isPersonaEditorOpen}
          onClose={() => setIsPersonaEditorOpen(false)}
          onSave={setPreferences}
        />
        
        <Tutorial
          isOpen={isTutorialOpen}
          onClose={() => setIsTutorialOpen(false)}
        />
        <Toaster position="top-right" />
      </div>
    </div>
  );
}