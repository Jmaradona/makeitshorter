import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Loader2 } from 'lucide-react';
import { supabase, getUserProfile, updateUserProfile } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { toast } from 'react-hot-toast';
import env from '../env';

export default function AuthButton() {
  const [loading, setLoading] = useState(false);
  const { setUser, preferences, setPreferences } = useUserStore();

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
      
      // The user will be redirected to Google's auth page, so we don't need to set user here
      // User data will be set after the redirect back
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in. Please check your Supabase configuration.');
      setLoading(false);
    }
  };

  if (!hasValidCredentials) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => toast.error('Supabase configuration is missing. Please check your environment variables.')}
        className="p-2 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 rounded-lg transition-colors flex items-center gap-2"
        title="Authentication unavailable"
      >
        <LogIn className="w-4 h-4 md:w-5 md:h-5" />
        <span className="text-xs md:text-sm font-medium">Auth Disabled</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleAuth}
      disabled={loading}
      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-gray-600 dark:text-gray-300" />
          <span className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300">
            Signing in...
          </span>
        </>
      ) : (
        <>
          <LogIn className="w-4 h-4 md:w-5 md:h-5 text-gray-600 dark:text-gray-300" />
          <span className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300">Sign In</span>
        </>
      )}
    </motion.button>
  );
}