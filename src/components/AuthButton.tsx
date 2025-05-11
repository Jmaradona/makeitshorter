import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/userStore';
import { toast } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import env from '../env';

export default function AuthButton() {
  const [loading, setLoading] = useState(false);
  const { setUser, preferences, setPreferences } = useUserStore();
  const location = useLocation();

  // Check if we have valid Supabase credentials
  const hasValidCredentials = env.SUPABASE_URL && env.SUPABASE_ANON_KEY;

  const handleAuth = async () => {
    if (!hasValidCredentials) {
      toast.error('Supabase configuration is missing. Please check your environment variables.');
      return;
    }

    setLoading(true);
    try {
      // Get the current path to redirect back after authentication
      const returnTo = location.pathname === '/' ? '/app' : location.pathname;
      
      // Sign in with Google using Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + returnTo,
          queryParams: {
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
        <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12,5V9L16,5V9H17A2,2 0 0,1 19,11V19H5V11A2,2 0 0,1 7,9H8V5L12,9V5M12,3L8,7V8H7A3,3 0 0,0 4,11V20H20V11A3,3 0 0,0 17,8H16V7"
          />
        </svg>
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
          <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-600 dark:text-gray-300" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300">Sign In</span>
        </>
      )}
    </motion.button>
  );
}