import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { STRIPE_PRODUCTS } from '../stripe-config';
import { createCheckoutSession } from '../services/stripeService';
import { useUserStore } from '../store/userStore';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function PricingPlans() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { user } = useUserStore();
  const navigate = useNavigate();

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      // Use Google sign-in directly instead of redirecting to login page
      try {
        setIsLoading(priceId);
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
        
      } catch (error: any) {
        console.error('Error signing in:', error);
        toast.error('Failed to sign in. Please try again.');
      } finally {
        setIsLoading(null);
      }
      return;
    }

    try {
      setIsLoading(priceId);
      const { url } = await createCheckoutSession(priceId);
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to start subscription process');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
            Select the perfect plan for your email enhancement needs
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {STRIPE_PRODUCTS.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ scale: 1.02 }}
              className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 bg-white dark:bg-gray-800 flex flex-col"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{product.name}</h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">{product.description}</p>
              <p className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">{product.price}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">per month</p>
              
              <ul className="mt-6 space-y-3 flex-grow">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSubscribe(product.priceId)}
                disabled={isLoading !== null}
                className="mt-8 w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-3 px-4 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70"
              >
                {isLoading === product.priceId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {!user && (
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                        <path fill="none" d="M1 1h22v22H1z" />
                      </svg>
                    )}
                    <span>{user ? 'Subscribe Now' : 'Sign in with Google'}</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All plans include a 14-day money-back guarantee. Prices are in EUR and include VAT.
          </p>
        </div>
      </div>
    </div>
  );
}