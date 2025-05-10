import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Zap, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { toast } from 'react-hot-toast';
import { STRIPE_PRODUCTS } from '../stripe-config';
import { createCheckoutSession } from '../services/stripeService';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const { user } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(STRIPE_PRODUCTS[0].priceId);
  const navigate = useNavigate();

  const handlePayment = async () => {
    if (!user) {
      try {
        // Sign in with Google using Supabase
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/pricing',
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account'
            }
          }
        });
        
        if (error) throw error;
        toast.success('Please sign in with Google to continue');
        onClose();
        
      } catch (error: any) {
        console.error('Error signing in:', error);
        toast.error('Failed to sign in. Please try again.');
      }
      return;
    }

    setIsLoading(true);
    try {
      const { url } = await createCheckoutSession(selectedPlan);
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsLoading(false);
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
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden my-8"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 p-2 rounded-lg">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Upgrade Your Plan</h2>
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

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">Daily Limit Reached</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      You've used all your free messages for today. Upgrade to get unlimited access.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {STRIPE_PRODUCTS.map((product) => (
                  <div 
                    key={product.priceId}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedPlan === product.priceId
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedPlan(product.priceId)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{product.name}</h3>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPlan === product.priceId
                          ? 'border-blue-500 dark:border-blue-400 bg-blue-500 dark:bg-blue-400'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {selectedPlan === product.priceId && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{product.description}</p>
                    <div className="flex items-baseline">
                      <span className="text-xl font-bold text-gray-900 dark:text-white">{product.price}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/month</span>
                    </div>
                  </div>
                ))}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-3 px-4 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-medium ml-2">Processing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-medium">{user ? 'Upgrade Now' : 'Sign in with Google'}</span>
                    </>
                  )}
                </motion.button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                Secure payment processing powered by Stripe
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}