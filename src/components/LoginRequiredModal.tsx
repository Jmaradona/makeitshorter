import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { toast } from 'react-hot-toast';
import env from '../env';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginRequiredModal({ isOpen, onClose }: LoginRequiredModalProps) {
  const [loading, setLoading] = React.useState(false);

  // Check if we have valid Supabase credentials
  const hasValidCredentials = env.SUPABASE_URL && env.SUPABASE_ANON_KEY;

  const handleAuth = async () => {
    if (!hasValidCredentials) {
      toast.error('Supabase configuration is missing. Please check your environment variables.');
      return;
    }

    setLoading(true);
    try {
      // Sign in with Google using Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/',
          queryParams: {
            // Optional Google-specific parameters
            access_type: 'offline', // Get a refresh token
            prompt: 'select_account' // Always show account selector
          }
        }
      });
      
      if (error) throw error;
      toast.success('Redirecting to sign in...');
      onClose();
      
      // The user will be redirected to Google's auth page
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in. Please check your Supabase configuration.');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 p-2 rounded-lg">
                    <User className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Sign In Required</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </motion.button>
              </div>

              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Guest Trial Completed
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-xs mx-auto">
                  You've used all your guest requests. Sign in to continue with daily free messages and unlock the option to upgrade.
                </p>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAuth}
                  disabled={loading || !hasValidCredentials}
                  className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-3 px-4 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white dark:border-gray-900 border-t-transparent dark:border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-medium ml-2">Signing in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span className="text-sm font-medium">Sign In with Google</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}