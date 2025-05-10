import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, CreditCard, Clock, Shield } from 'lucide-react';
import AccountSubscription from '../components/AccountSubscription';
import { useUserStore } from '../store/userStore';

export default function AccountPage() {
  const { user } = useUserStore();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to view your account
          </h1>
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            to="/app"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Back to App</span>
          </Link>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Account Settings
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-6">
                <nav className="space-y-2">
                  <a href="#profile" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                    <User className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                    Profile
                  </a>
                  <a href="#subscription" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white">
                    <CreditCard className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                    Subscription
                  </a>
                  <a href="#usage" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white">
                    <Clock className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                    Usage
                  </a>
                  <a href="#security" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white">
                    <Shield className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                    Security
                  </a>
                </nav>
              </div>
            </div>
            
            <div className="md:col-span-3 space-y-6">
              <section id="profile">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile</h2>
                  
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mr-4">
                      <img 
                        src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email?.charAt(0)}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.email?.charAt(0)}`;
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      Edit Profile
                    </button>
                  </div>
                </div>
              </section>
              
              <section id="subscription">
                <AccountSubscription />
              </section>
              
              <section id="usage">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Usage</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Enhancements</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">75%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">API Requests</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">45%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Storage</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">10%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                    Usage resets at the beginning of each billing cycle.
                  </div>
                </div>
              </section>
              
              <section id="security">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Security</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</h3>
                      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Change Password
                      </button>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Two-Factor Authentication</h3>
                      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Enable 2FA
                      </button>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sessions</h3>
                      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Manage Sessions
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}