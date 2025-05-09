import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, LogOut } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export default function LoggedInIndicator() {
  const { user, setUser } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen) {
        const target = e.target as HTMLElement;
        if (!target.closest('.user-dropdown')) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // If no user, don't render anything
  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
    setIsOpen(false);
  };

  const formatUserName = () => {
    const name = user.user_metadata?.name || user.email || 'User';
    // If name is an email, only show the part before @
    if (name.includes('@')) {
      return name.split('@')[0];
    }
    // If name has multiple parts, show only first name
    if (name.includes(' ')) {
      return name.split(' ')[0];
    }
    return name;
  };

  return (
    <div className="relative user-dropdown">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 py-1.5 px-2.5 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
      >
        <div className="relative">
          <img
            src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${formatUserName()}`}
            alt={formatUserName()}
            className="w-5 h-5 md:w-6 md:h-6 rounded-full border border-green-500 dark:border-green-400"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${formatUserName()}`;
            }}
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 md:w-3 md:h-3 bg-green-500 dark:bg-green-400 rounded-full flex items-center justify-center">
            <Check className="w-1.5 h-1.5 md:w-2 md:h-2 text-white" />
          </div>
        </div>
        <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">
          {formatUserName()}
        </span>
        <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 text-gray-600 dark:text-gray-300 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden z-50"
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                {user.user_metadata?.name || 'User'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </div>
            </div>
            <div className="p-1">
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-xs md:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}