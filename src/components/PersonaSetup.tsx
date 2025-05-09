import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wand2 } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { toast } from 'react-hot-toast';
import { updateUserProfile } from '../lib/supabase';

// Default assistant ID - hardcoded for reliability
const DEFAULT_ASSISTANT_ID = 'asst_F4jvQcayYieO8oghTPxC7Qel';

interface PersonaSetupProps {
  onSetupComplete: (assistantId: string) => void;
}

export default function PersonaSetup({ onSetupComplete }: PersonaSetupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { user, setAssistantId } = useUserStore();

  // Skip creation and just use the default assistant
  const setupAssistant = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Use the default assistant ID
      console.log('Using default assistant ID:', DEFAULT_ASSISTANT_ID);
      setSuccess(true);
      
      // Store the assistant ID in the user store
      setAssistantId(DEFAULT_ASSISTANT_ID);
      
      // If user is logged in, also save to Supabase
      if (user) {
        try {
          await updateUserProfile({
            id: user.id,
            assistantId: DEFAULT_ASSISTANT_ID
          });
          console.log("Assistant ID saved to Supabase profile");
        } catch (error) {
          console.error("Failed to save assistant ID to Supabase:", error);
          toast.error("Setup complete but failed to save to your profile");
        }
      }
      
      // Notify parent component
      onSetupComplete(DEFAULT_ASSISTANT_ID);
      
    } catch (error: any) {
      console.error('Error in assistant setup:', error);
      setError('Failed to complete setup. Using default configuration.');
      
      // Even on error, still use the default assistant ID
      setAssistantId(DEFAULT_ASSISTANT_ID);
      onSetupComplete(DEFAULT_ASSISTANT_ID);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
          <Wand2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </div>
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">Setup Application</h2>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        We need to configure the app for your account. This is a one-time setup that will prepare everything you need to use the email enhancement features.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}
      
      {success ? (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 text-sm rounded-lg">
          Setup complete! You can now use the app.
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={setupAssistant}
          disabled={isLoading}
          className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-3 px-4 rounded-xl 
                    hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center 
                    space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white dark:border-gray-900 border-t-transparent dark:border-t-transparent rounded-full mr-2"></span>
              <span>Setting Up...</span>
            </>
          ) : (
            <>
              <span>Complete Setup</span>
            </>
          )}
        </motion.button>
      )}
      
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
        This setup will configure your account to use our email enhancement features.
      </p>
    </div>
  );
}