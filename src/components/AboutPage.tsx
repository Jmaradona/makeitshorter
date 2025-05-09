import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex relative">
      <div className="absolute top-6 left-6">
        <Link
          to="/"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex items-center justify-end px-24 py-12"
      >
        <div className="max-w-[600px] space-y-6 text-justify">
          <p className="text-lg text-gray-800 dark:text-gray-200">
            We build simple tools that help you get things done—no distractions.
          </p>

          <p className="text-base text-gray-600 dark:text-gray-400">
            We focus on the task at hand, remove what you don’t need, and make every screen clear and straightforward.
          </p>

          <p className="text-base text-gray-600 dark:text-gray-400">
            From spacing to animations, we pay attention to the details so you can work smoothly.
          </p>

          <p className="text-base text-gray-600 dark:text-gray-400">
            Our goal is to give you reliable tools that simply work.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
