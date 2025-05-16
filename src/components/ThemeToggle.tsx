import React from 'react';
import { motion } from 'framer-motion';

interface ThemeToggleProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function ThemeToggle({ isDarkMode, toggleDarkMode }: ThemeToggleProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleDarkMode}
      className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center"
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle dark mode"
    >
      <div className="w-10 h-14 bg-gray-200 dark:bg-gray-700 rounded-md flex flex-col items-center justify-center relative overflow-hidden">
        {/* Light switch plate background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-300 dark:from-gray-600 dark:to-gray-800"></div>
        
        {/* Screws */}
        <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
        
        {/* Switch lever */}
        <motion.div 
          className="absolute w-6 h-8 rounded-t-md"
          animate={{ 
            y: isDarkMode ? 2 : -2,
            backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6' 
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {/* Lever handle */}
          <div className={`w-full h-3 rounded-t-md ${isDarkMode ? 'bg-gray-500' : 'bg-white border border-gray-300'} shadow-md`}></div>
        </motion.div>
        
        {/* ON/OFF text */}
        <div className="absolute bottom-1 text-[7px] font-bold">
          <span className={`transition-opacity ${isDarkMode ? 'opacity-30' : 'opacity-100'}`}>ON</span>
          <span className="px-0.5 text-gray-400">|</span>
          <span className={`transition-opacity ${isDarkMode ? 'opacity-100' : 'opacity-30'}`}>OFF</span>
        </div>
      </div>
    </motion.button>
  );
}