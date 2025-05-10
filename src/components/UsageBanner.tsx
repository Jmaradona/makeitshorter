import React from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertCircle } from 'lucide-react';

interface UsageBannerProps {
  remainingMessages: number;
  showUpgradeButton: boolean;
  onUpgradeClick: () => void;
}

export default function UsageBanner({ 
  remainingMessages, 
  showUpgradeButton, 
  onUpgradeClick 
}: UsageBannerProps) {
  if (remainingMessages > 3) {
    return null; // Don't show banner if plenty of messages left
  }

  const isOutOfMessages = remainingMessages <= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-4 p-3 rounded-lg border flex items-center justify-between ${
        isOutOfMessages 
          ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' 
          : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
      }`}
    >
      <div className="flex items-center gap-2">
        {isOutOfMessages ? (
          <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
        ) : (
          <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
        )}
        <span className={`text-xs font-medium ${
          isOutOfMessages 
            ? 'text-red-600 dark:text-red-400' 
            : 'text-amber-600 dark:text-amber-400'
        }`}>
          {isOutOfMessages
            ? 'You have reached your free message limit for today'
            : `You have ${remainingMessages} free message${remainingMessages === 1 ? '' : 's'} left today`}
        </span>
      </div>
      
      {showUpgradeButton && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onUpgradeClick}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 flex items-center gap-1"
        >
          <Zap className="w-3 h-3" />
          Upgrade
        </motion.button>
      )}
    </motion.div>
  );
}